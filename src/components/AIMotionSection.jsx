import { useState, useEffect, useRef, useCallback } from "react";

/**
 * AIMotionSection — Pose + Hand gesture detection via MediaPipe CDN.
 * Plank mode: thumbs-up starts timer, open-hand stops timer.
 */

const EXERCISE_OPTIONS = [
    { value: "", label: "— Pilih Gerakan —" },
    { value: "push-up", label: "Push-Up" },
    { value: "squat", label: "Squat" },
    { value: "lunge", label: "Lunge" },
    { value: "plank", label: "Plank" },
    { value: "jumping-jack", label: "Jumping Jack" },
    { value: "sit-up", label: "Sit-Up" },
    { value: "burpee", label: "Burpee" },
];

const MP_CDN     = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";
const MP_WASM    = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const POSE_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const GESTURE_HOLD = 25; // consecutive frames to confirm gesture (~0.8s)

/** Detect 'open_hand' (5 jari terbuka) or 'fist' (kepalan) */
function detectGesture(lm) {
    // y: 0=top, 1=bottom.
    const idxOpen = lm[8].y  < lm[7].y;
    const midOpen = lm[12].y < lm[11].y;
    const rngOpen = lm[16].y < lm[15].y;
    const pnkOpen = lm[20].y < lm[19].y;
    // open_hand: at least 4 fingers clearly extended
    if (idxOpen && midOpen && rngOpen && pnkOpen) return "open_hand";

    const idxCurl = lm[8].y  > lm[7].y;
    const midCurl = lm[12].y > lm[11].y;
    const rngCurl = lm[16].y > lm[15].y;
    const pnkCurl = lm[20].y > lm[19].y;
    // fist: all 4 fingers curled (kepalan)
    if (idxCurl && midCurl && rngCurl && pnkCurl) return "fist";
    return null;
}

const OpenHandIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
        <path d="M18 10V5a1.5 1.5 0 0 0-3 0v4M15 9V4a1.5 1.5 0 0 0-3 0v5M12 9V3a1.5 1.5 0 0 0-3 0v6M9 9.5V5.5a1.5 1.5 0 0 0-3 0v8.5" />
        <path d="M6 14v-4a1.5 1.5 0 0 0-3 0v6c0 3.87 3.13 7 7 7s7-3.13 7-7v-2a1.5 1.5 0 0 0-3 0" />
    </svg>
);

const FistIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
        <path d="M6 10h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9z" />
        <path d="M6 10V7.5A1.5 1.5 0 0 1 7.5 6h0A1.5 1.5 0 0 1 9 7.5V10" />
        <path d="M9 10V6.5A1.5 1.5 0 0 1 10.5 5h0A1.5 1.5 0 0 1 12 6.5V10" />
        <path d="M12 10V7.5A1.5 1.5 0 0 1 13.5 6h0A1.5 1.5 0 0 1 15 7.5V10" />
        <path d="M15 10V8.5A1.5 1.5 0 0 1 16.5 7h0A1.5 1.5 0 0 1 18 8.5V10" />
    </svg>
);

const formatDur = (s) =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

// ─────────────────────────────────────────────────────────
export default function AIMotionSection() {
    const [selectedExercise, setSelectedExercise] = useState("");
    const [camStatus, setCamStatus]               = useState("loading"); // loading|active|stopped|error
    const [statusMsg, setStatusMsg]               = useState("Memuat model AI…");
    const [poseDetected, setPoseDetected]         = useState(false);
    const [isCamOn, setIsCamOn]                   = useState(true);
    const [currentGesture, setCurrentGesture]     = useState(null);
    const [plankPhase, setPlankPhase]             = useState("idle"); // idle|running|stopped
    const [plankDuration, setPlankDuration]       = useState(0);

    const videoRef          = useRef(null);
    const canvasRef         = useRef(null);
    const landmarkerRef     = useRef(null);
    const handLandmarkerRef = useRef(null);
    const animRef           = useRef(null);
    const streamRef         = useRef(null);
    const lastTimeRef       = useRef(-1);
    const selectedExRef     = useRef("");
    const plankPhaseRef     = useRef("idle");
    const plankStartRef     = useRef(null);
    const gestureRef        = useRef({ last: null, count: 0 });

    // Keep ref in sync; reset plank when exercise changes
    useEffect(() => {
        selectedExRef.current = selectedExercise;
        setPlankPhase("idle");
        setPlankDuration(0);
        plankPhaseRef.current = "idle";
        plankStartRef.current = null;
        gestureRef.current    = { last: null, count: 0 };
        setCurrentGesture(null);
    }, [selectedExercise]);

    const resetPlank = useCallback(() => {
        plankPhaseRef.current = "idle";
        plankStartRef.current = null;
        setPlankPhase("idle");
        setPlankDuration(0);
        gestureRef.current = { last: null, count: 0 };
        setCurrentGesture(null);
    }, []);

    // Build the rAF detect loop — shared by start & restart
    const buildDetectLoop = useCallback((video, ctx, PoseLandmarker, DrawingUtils) => {
        const du = new DrawingUtils(ctx);
        const detect = () => {
            if (video.readyState >= 2 && video.currentTime !== lastTimeRef.current) {
                lastTimeRef.current = video.currentTime;
                const now = performance.now();

                // Pose skeleton
                if (landmarkerRef.current) {
                    const pr = landmarkerRef.current.detectForVideo(video, now);
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    setPoseDetected(pr.landmarks.length > 0);
                    for (const lm of pr.landmarks) {
                        du.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#5eead4", lineWidth: 2.5 });
                        du.drawLandmarks(lm, { color: "#0d9488", fillColor: "#ffffff", lineWidth: 1.5, radius: 5 });
                    }
                }

                // Hand gesture
                if (handLandmarkerRef.current) {
                    const hr = handLandmarkerRef.current.detectForVideo(video, now + 1);
                    if (hr.landmarks.length > 0) {
                        const gesture = detectGesture(hr.landmarks[0]);
                        setCurrentGesture(gesture);

                        // Debounce
                        if (gesture === gestureRef.current.last) gestureRef.current.count++;
                        else { gestureRef.current.last = gesture; gestureRef.current.count = 1; }

                        if (selectedExRef.current === "plank" && gestureRef.current.count === GESTURE_HOLD) {
                            gestureRef.current.count = 0;
                            if (gesture === "open_hand" && plankPhaseRef.current === "idle") {
                                plankPhaseRef.current = "running";
                                plankStartRef.current = Date.now();
                                setPlankPhase("running");
                            } else if (gesture === "fist" && plankPhaseRef.current === "running") {
                                plankPhaseRef.current = "idle";
                                plankStartRef.current = null;
                                setPlankDuration(0);
                                setPlankPhase("idle");
                            }
                        }
                    } else {
                        setCurrentGesture(null);
                        gestureRef.current.count = 0;
                    }
                }

                // Live timer update
                if (plankPhaseRef.current === "running" && plankStartRef.current) {
                    setPlankDuration(Math.floor((Date.now() - plankStartRef.current) / 1000));
                }
            }
            animRef.current = requestAnimationFrame(detect);
        };
        return detect;
    }, []);

    // Full startup: load both models + camera
    const startCamera = useCallback(async () => {
        try {
            setCamStatus("loading");
            setStatusMsg("Memuat model AI…");

            const { PoseLandmarker, HandLandmarker, FilesetResolver, DrawingUtils } =
                await import(/* @vite-ignore */ MP_CDN);

            const vision = await FilesetResolver.forVisionTasks(MP_WASM);

            setStatusMsg("Memuat model pose…");
            landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
                runningMode: "VIDEO",
                numPoses: 1,
            });

            setStatusMsg("Memuat model gesture tangan…");
            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
                runningMode: "VIDEO",
                numHands: 1,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            setStatusMsg("Meminta akses kamera…");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;

            const video = videoRef.current;
            video.srcObject = stream;
            await video.play();

            video.addEventListener("loadedmetadata", () => {
                canvasRef.current.width  = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
            });

            setCamStatus("active");
            setStatusMsg("Mendeteksi pose…");

            const ctx = canvasRef.current.getContext("2d");
            const detect = buildDetectLoop(video, ctx, PoseLandmarker, DrawingUtils);
            detect();
        } catch (err) {
            console.error("MediaPipe init error:", err);
            setCamStatus("error");
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
                setStatusMsg("Izin kamera ditolak. Aktifkan di pengaturan browser.");
            else if (err.name === "NotFoundError")
                setStatusMsg("Tidak ada kamera ditemukan.");
            else
                setStatusMsg("Gagal memuat AI. Periksa koneksi internet.");
        }
    }, [buildDetectLoop]);

    // Stop camera (release tracks)
    const stopCamera = useCallback(() => {
        cancelAnimationFrame(animRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setPoseDetected(false);
        setCurrentGesture(null);
        setCamStatus("stopped");
        setIsCamOn(false);
    }, []);

    // Restart camera (model already loaded)
    const restartCamera = useCallback(async () => {
        if (!landmarkerRef.current) { setIsCamOn(true); startCamera(); return; }
        try {
            setIsCamOn(true);
            setCamStatus("loading");
            setStatusMsg("Membuka kamera…");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;

            const video = videoRef.current;
            video.srcObject = stream;
            await video.play();

            canvasRef.current.width  = video.videoWidth  || 640;
            canvasRef.current.height = video.videoHeight || 480;

            setCamStatus("active");
            setStatusMsg("Mendeteksi pose…");

            const { PoseLandmarker, DrawingUtils } = await import(/* @vite-ignore */ MP_CDN);
            const ctx = canvasRef.current.getContext("2d");
            const detect = buildDetectLoop(video, ctx, PoseLandmarker, DrawingUtils);
            detect();
        } catch (err) {
            setCamStatus("error");
            setStatusMsg("Gagal membuka kamera. Coba lagi.");
        }
    }, [startCamera, buildDetectLoop]);

    const handleToggleCam = useCallback(() => {
        if (isCamOn) stopCamera(); else restartCamera();
    }, [isCamOn, stopCamera, restartCamera]);

    useEffect(() => {
        startCamera();
        return () => {
            cancelAnimationFrame(animRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            landmarkerRef.current?.close();
            handLandmarkerRef.current?.close();
        };
    }, [startCamera]);

    // ── Derived ──
    const isPlank = selectedExercise === "plank";
    const exerciseLabel = selectedExercise
        ? EXERCISE_OPTIONS.find((o) => o.value === selectedExercise)?.label
        : "—";

    const plankHint =
        plankPhase === "idle"
            ? "Buka 5 jari (telapak tangan terbuka) untuk memulai timer"
            : "Kepalkan tangan untuk menghentikan dan mereset timer";

    const gestureLabel =
        currentGesture === "open_hand" ? "Mulai (Telapak Terbuka)" :
        currentGesture === "fist"      ? "Reset (Kepalan Tangan)" : null;

    // ─────────────────────────────────────────────────────────
    return (
        <section className="ai-motion-section">
            {/* Header */}
            <div className="ai-motion-header">
                <div className="ai-motion-badge">
                    <img src="/HyPrevent.png" alt="HyPrevent" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                    <span>Powered by HyPrevent</span>
                </div>
                <h2 className="ai-motion-title">Praktik Gerakan HyPrevent</h2>
                <p className="ai-motion-subtitle">
                    Deteksi gerakan olahraga secara real-time menggunakan teknologi HyPrevent.
                </p>
            </div>

            {/* Dropdown */}
            <div className="ai-motion-controls">
                <label htmlFor="exercise-select" className="ai-motion-label">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Pilih Gerakan Olahraga
                </label>
                <div className="ai-motion-select-wrapper">
                    <select id="exercise-select" className="ai-motion-select" value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
                        {EXERCISE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <svg className="ai-motion-select-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            {/* Plank gesture hint bar */}
            {isPlank && camStatus === "active" && (
                <div className={`ai-motion-plank-hint plank-hint--${plankPhase}`}>
                    <span className="plank-hint-icon">
                        {plankPhase === "idle" ? <OpenHandIcon /> : <FistIcon />}
                    </span>
                    <span>{plankHint}</span>
                    {plankPhase === "stopped" && (
                        <button className="plank-reset-btn" onClick={resetPlank}>Reset</button>
                    )}
                </div>
            )}

            {/* Main grid */}
            <div className="ai-motion-main">
                {/* Camera box */}
                <div className="ai-motion-camera">
                    <div className="ai-motion-camera-inner">
                        <span className="cam-corner cam-corner--tl" />
                        <span className="cam-corner cam-corner--tr" />
                        <span className="cam-corner cam-corner--bl" />
                        <span className="cam-corner cam-corner--br" />

                        {/* Video + canvas (mirrored via CSS) */}
                        <div className="ai-motion-video-wrapper">
                            <video ref={videoRef} className="ai-motion-video" playsInline muted />
                            <canvas ref={canvasRef} className="ai-motion-canvas" />
                        </div>

                        {/* Privacy overlay */}
                        {camStatus === "stopped" && (
                            <div className="ai-motion-camera-placeholder ai-motion-privacy-overlay">
                                <div className="ai-motion-cam-icon">
                                    <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                </div>
                                <p className="ai-motion-cam-label">Kamera Dimatikan</p>
                                <p style={{ fontSize: "0.8rem", color: "#4b5563", marginTop: "0.25rem" }}>Privasi Anda terlindungi</p>
                            </div>
                        )}

                        {/* Loading / error overlay */}
                        {(camStatus === "loading" || camStatus === "error") && (
                            <div className="ai-motion-camera-placeholder">
                                <div className="ai-motion-cam-icon">
                                    {camStatus === "error" ? (
                                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    )}
                                </div>
                                <p className="ai-motion-cam-label">{camStatus === "error" ? "Kamera Error" : "Mempersiapkan…"}</p>
                                <div className="ai-motion-cam-status">
                                    {camStatus !== "error" && <span className="cam-dot" />}
                                    <span>{statusMsg}</span>
                                </div>
                            </div>
                        )}

                        {/* LIVE badge */}
                        {camStatus === "active" && (
                            <div className="ai-motion-live-badge">
                                <span className="cam-dot cam-dot--live" />LIVE
                            </div>
                        )}

                        {/* Plank running timer badge (top-right) */}
                        {camStatus === "active" && isPlank && plankPhase !== "idle" && (
                            <div className={`ai-motion-plank-phase-badge plank-badge--${plankPhase}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "inline-block", verticalAlign: "middle" }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{formatDur(plankDuration)}</span>
                            </div>
                        )}

                        {/* Gesture detected badge */}
                        {camStatus === "active" && gestureLabel && (
                            <div className="ai-motion-gesture-badge">{gestureLabel}</div>
                        )}

                        {/* Pose indicator */}
                        {camStatus === "active" && (
                            <div className={`ai-motion-pose-indicator ${poseDetected ? "detected" : "not-detected"}`}>
                                {poseDetected ? "✓ Pose Terdeteksi" : "Arahkan tubuh ke kamera"}
                            </div>
                        )}

                        {/* Toggle camera button */}
                        <button
                            className={`ai-motion-cam-toggle ${isCamOn ? "cam-toggle--on" : "cam-toggle--off"}`}
                            onClick={handleToggleCam}
                            title={isCamOn ? "Matikan Kamera" : "Aktifkan Kamera"}
                            disabled={camStatus === "loading"}
                        >
                            {isCamOn ? (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                            )}
                            <span>{isCamOn ? "Matikan Kamera" : "Aktifkan Kamera"}</span>
                        </button>
                    </div>
                </div>

                {/* Stats Panel */}
                <div className="ai-motion-panel">

                    {/* Stat 1: Duration (plank) or Reps (others) */}
                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--reps">
                            {isPlank ? (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                            )}
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{isPlank ? "Durasi Plank" : "Jumlah Repetisi"}</span>
                            <span
                                className="stat-value"
                                style={isPlank && plankPhase === "running" ? { color: "var(--primary-color)" } : {}}
                            >
                                {isPlank ? formatDur(plankDuration) : "0"}
                            </span>
                            <span className="stat-unit">{isPlank ? "mm:ss" : "reps"}</span>
                        </div>
                    </div>

                    <div className="ai-motion-divider" />

                    {/* Stat 2: Status Postur / Plank */}
                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--posture">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{isPlank ? "Status Plank" : "Status Postur"}</span>
                            <span
                                className="stat-value stat-value--posture"
                                style={{
                                    color: isPlank
                                        ? (plankPhase === "running" ? "var(--primary-color)"
                                            : plankPhase === "stopped" ? "var(--success-color)"
                                            : "var(--text-light)")
                                        : (poseDetected ? "var(--success-color)" : "var(--text-light)"),
                                }}
                            >
                                {isPlank
                                    ? (plankPhase === "idle" ? "Siap" : plankPhase === "running" ? "Berjalan" : "Selesai")
                                    : (poseDetected ? "Terdeteksi ✓" : "—")}
                            </span>
                            <span className="stat-unit">{isPlank ? "gesture control" : "real-time"}</span>
                        </div>
                    </div>

                    <div className="ai-motion-divider" />

                    {/* Stat 3: Gerakan */}
                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--exercise">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Gerakan Dipilih</span>
                            <span className="stat-value stat-value--exercise">{exerciseLabel}</span>
                        </div>
                    </div>

                    <div className="ai-motion-divider" />

                    {/* Stat 4: Kamera */}
                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--reps">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Kamera</span>
                            <span
                                className="stat-value stat-value--posture"
                                style={{
                                    color: camStatus === "active" ? "var(--success-color)"
                                        : camStatus === "error" ? "#ef4444"
                                        : "var(--text-light)",
                                }}
                            >
                                {camStatus === "active" ? "Aktif ✓"
                                    : camStatus === "error" ? "Error"
                                    : camStatus === "stopped" ? "Mati"
                                    : "Memuat…"}
                            </span>
                        </div>
                    </div>

                    {/* Reset button inside panel */}
                    {isPlank && plankPhase === "stopped" && (
                        <button className="plank-panel-reset-btn" onClick={resetPlank}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                            </svg>
                            Reset Plank
                        </button>
                    )}
                </div>
            </div>

            {/* Info note */}
            <div className="ai-motion-note">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                    Kamera hanya berjalan di browser Anda — tidak ada video yang dikirim ke server.
                    {isPlank && " Mode Plank: Buka 5 jari untuk mulai timer, kepalkan tangan untuk menghentikan dan mereset timer."}
                </span>
            </div>
        </section>
    );
}
