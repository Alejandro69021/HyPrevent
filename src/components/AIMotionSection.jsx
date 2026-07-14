import { useState, useEffect, useRef, useCallback } from "react";

/**
 * AIMotionSection — Live pose detection via MediaPipe Tasks-Vision CDN.
 * Camera mirrored, skeleton overlay drawn on canvas.
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

const MP_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";
const MP_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export default function AIMotionSection() {
    const [selectedExercise, setSelectedExercise] = useState("");
    const [camStatus, setCamStatus] = useState("loading"); // loading | active | error
    const [statusMsg, setStatusMsg] = useState("Memuat model AI…");
    const [poseDetected, setPoseDetected] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const landmarkerRef = useRef(null);
    const animRef = useRef(null);
    const streamRef = useRef(null);
    const lastTimeRef = useRef(-1);

    const startCamera = useCallback(async () => {
        try {
            setStatusMsg("Memuat model AI…");

            // Load MediaPipe via CDN — @vite-ignore prevents Vite bundling the URL
            const { PoseLandmarker, FilesetResolver, DrawingUtils } =
                await import(/* @vite-ignore */ MP_CDN);

            setStatusMsg("Menginisialisasi detektor…");
            const vision = await FilesetResolver.forVisionTasks(MP_WASM);

            landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: MODEL_URL,
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numPoses: 1,
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

            // Sync canvas to actual video dimensions
            video.addEventListener("loadedmetadata", () => {
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
            });

            setCamStatus("active");
            setStatusMsg("Mendeteksi pose…");

            const ctx = canvasRef.current.getContext("2d");
            const drawingUtils = new DrawingUtils(ctx);

            const detect = () => {
                if (video.readyState >= 2 && video.currentTime !== lastTimeRef.current) {
                    lastTimeRef.current = video.currentTime;
                    const results = landmarkerRef.current.detectForVideo(
                        video,
                        performance.now()
                    );

                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    const hasPose = results.landmarks.length > 0;
                    setPoseDetected(hasPose);

                    for (const lm of results.landmarks) {
                        // Skeleton connectors
                        drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
                            color: "#5eead4",
                            lineWidth: 2.5,
                        });
                        // Joint dots
                        drawingUtils.drawLandmarks(lm, {
                            color: "#0d9488",
                            fillColor: "#ffffff",
                            lineWidth: 1.5,
                            radius: 5,
                        });
                    }
                }
                animRef.current = requestAnimationFrame(detect);
            };

            detect();
        } catch (err) {
            console.error("MediaPipe init error:", err);
            setCamStatus("error");
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setStatusMsg("Izin kamera ditolak. Aktifkan kamera di pengaturan browser.");
            } else if (err.name === "NotFoundError") {
                setStatusMsg("Tidak ada kamera ditemukan di perangkat ini.");
            } else {
                setStatusMsg("Gagal memuat AI. Pastikan koneksi internet aktif.");
            }
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            cancelAnimationFrame(animRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            landmarkerRef.current?.close();
        };
    }, [startCamera]);

    const exerciseLabel =
        selectedExercise
            ? EXERCISE_OPTIONS.find((o) => o.value === selectedExercise)?.label
            : "—";

    return (
        <section className="ai-motion-section">
            {/* Header */}
            <div className="ai-motion-header">
                <div className="ai-motion-badge">
                    <img
                        src="/HyPrevent.png"
                        alt="HyPrevent Logo"
                        style={{ width: "18px", height: "18px", objectFit: "contain" }}
                    />
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
                    <select
                        id="exercise-select"
                        className="ai-motion-select"
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                    >
                        {EXERCISE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <svg className="ai-motion-select-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            {/* Main: Camera + Panel */}
            <div className="ai-motion-main">
                {/* Camera */}
                <div className="ai-motion-camera">
                    <div className="ai-motion-camera-inner">
                        {/* Corner brackets always visible */}
                        <span className="cam-corner cam-corner--tl" />
                        <span className="cam-corner cam-corner--tr" />
                        <span className="cam-corner cam-corner--bl" />
                        <span className="cam-corner cam-corner--br" />

                        {/* Live video + canvas — mirrored */}
                        <div className="ai-motion-video-wrapper">
                            <video
                                ref={videoRef}
                                className="ai-motion-video"
                                playsInline
                                muted
                            />
                            <canvas
                                ref={canvasRef}
                                className="ai-motion-canvas"
                            />
                        </div>

                        {/* Overlay: loading / error state */}
                        {camStatus !== "active" && (
                            <div className="ai-motion-camera-placeholder">
                                <div className="ai-motion-cam-icon">
                                    {camStatus === "error" ? (
                                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 7l-7 5 7 5V7z" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    )}
                                </div>
                                <p className="ai-motion-cam-label">
                                    {camStatus === "error" ? "Kamera Error" : "Mempersiapkan…"}
                                </p>
                                <div className="ai-motion-cam-status">
                                    {camStatus !== "error" && <span className="cam-dot" />}
                                    <span>{statusMsg}</span>
                                </div>
                            </div>
                        )}

                        {/* Live badge */}
                        {camStatus === "active" && (
                            <div className="ai-motion-live-badge">
                                <span className="cam-dot cam-dot--live" />
                                LIVE
                            </div>
                        )}

                        {/* Pose detected indicator */}
                        {camStatus === "active" && (
                            <div className={`ai-motion-pose-indicator ${poseDetected ? "detected" : "not-detected"}`}>
                                {poseDetected ? "✓ Pose Terdeteksi" : "Arahkan tubuh ke kamera"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Panel */}
                <div className="ai-motion-panel">
                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--reps">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="17 1 21 5 17 9" />
                                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                <polyline points="7 23 3 19 7 15" />
                                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Jumlah Repetisi</span>
                            <span className="stat-value" id="rep-count">0</span>
                            <span className="stat-unit">reps</span>
                        </div>
                    </div>

                    <div className="ai-motion-divider" />

                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--posture">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Status Postur</span>
                            <span
                                className="stat-value stat-value--posture"
                                style={{ color: poseDetected ? "var(--success-color)" : "var(--text-light)" }}
                            >
                                {poseDetected ? "Terdeteksi ✓" : "—"}
                            </span>
                            <span className="stat-unit">real-time</span>
                        </div>
                    </div>

                    <div className="ai-motion-divider" />

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

                    <div className="ai-motion-stat">
                        <div className="stat-icon stat-icon--reps">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4l3 3" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Kamera</span>
                            <span
                                className="stat-value stat-value--posture"
                                style={{
                                    color:
                                        camStatus === "active"
                                            ? "var(--success-color)"
                                            : camStatus === "error"
                                            ? "#ef4444"
                                            : "var(--text-light)",
                                }}
                            >
                                {camStatus === "active"
                                    ? "Aktif ✓"
                                    : camStatus === "error"
                                    ? "Error"
                                    : "Memuat…"}
                            </span>
                        </div>
                    </div>
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
                    Deteksi pose menggunakan Google MediaPipe berjalan 100% lokal.
                </span>
            </div>
        </section>
    );
}
