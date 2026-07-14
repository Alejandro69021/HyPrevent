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

function calculateAngle(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return 0;
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
        angle = 360.0 - angle;
    }
    return angle;
}

const OpenHandIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
        <path d="M10 10.5V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8.5" />
        <path d="M6 14v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7a7 7 0 0 0 14 0v-3" />
    </svg>
);

const FistIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
        {/* Palm base and wrist side */}
        <path d="M6 18c0 3 2.5 4 6 4s6-1 6-4V11" />
        {/* Four curled fingers */}
        <path d="M6 11V8a1.5 1.5 0 0 1 3 0v3" />
        <path d="M9 11V7.5A1.5 1.5 0 0 1 10.5 6h0A1.5 1.5 0 0 1 12 7.5V11" />
        <path d="M12 11V7.5A1.5 1.5 0 0 1 13.5 6h0A1.5 1.5 0 0 1 15 7.5V11" />
        <path d="M15 11V8.5A1.5 1.5 0 0 1 16.5 7h0A1.5 1.5 0 0 1 18 8.5V11" />
        {/* Thumb wrapped across standard fist front */}
        <path d="M5 14h6.5a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" />
    </svg>
);

const formatDur = (s) =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

// ─────────────────────────────────────────────────────────
export default function AIMotionSection() {
    const [selectedExercise, setSelectedExercise] = useState("");
    const [camStatus, setCamStatus]               = useState("stopped"); // loading|active|stopped|error
    const [statusMsg, setStatusMsg]               = useState("Kamera nonaktif.");
    const [poseDetected, setPoseDetected]         = useState(false);
    const [isCamOn, setIsCamOn]                   = useState(false);
    const [currentGesture, setCurrentGesture]     = useState(null);
    const [plankPhase, setPlankPhase]             = useState("idle"); // idle|running|stopped
    const [plankDuration, setPlankDuration]       = useState(0);
    const [facingMode, setFacingMode]             = useState("user"); // user | environment
    const [repCount, setRepCount]                 = useState(0);
    const [postureStatus, setPostureStatus]       = useState("Siap");
    const [countdownVal, setCountdownVal]         = useState(null); // null | 3 | 2 | 1 | "Mulai!"

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
    const repCountRef       = useRef(0);
    const stageRef          = useRef("up"); // up | down
    const countdownFinishedRef = useRef(false);
    const countdownIntervalRef = useRef(null);

    // Keep ref in sync; reset plank when exercise changes
    useEffect(() => {
        selectedExRef.current = selectedExercise;
        setPlankPhase("idle");
        setPlankDuration(0);
        plankPhaseRef.current = "idle";
        plankStartRef.current = null;
        gestureRef.current    = { last: null, count: 0 };
        setCurrentGesture(null);

        // Cleanup hand landmarker if exercise changes from plank to something else
        if (selectedExercise !== "plank" && handLandmarkerRef.current) {
            try {
                handLandmarkerRef.current.close();
            } catch (e) {
                console.error("Error closing hand landmarker:", e);
            }
            handLandmarkerRef.current = null;
        }

        // Dynamically load HandLandmarker if exercise changed to plank and camera is active
        if (selectedExercise === "plank" && camStatus === "active" && !handLandmarkerRef.current) {
            (async () => {
                try {
                    const { HandLandmarker, FilesetResolver } = await import(/* @vite-ignore */ MP_CDN);
                    const vision = await FilesetResolver.forVisionTasks(MP_WASM);
                    handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
                        runningMode: "VIDEO",
                        numHands: 1,
                        minHandDetectionConfidence: 0.5,
                        minHandPresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5,
                    });
                } catch (e) {
                    console.error("Error loading hand landmarker dynamically:", e);
                }
            })();
        }

        // Reset reps
        setRepCount(0);
        repCountRef.current = 0;
        stageRef.current = "up";
        setPostureStatus("Siap");

        // Cancel countdown if running
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdownVal(null);
        countdownFinishedRef.current = false;
    }, [selectedExercise, camStatus]);

    // Handle countdown timer trigger when pose is first detected
    useEffect(() => {
        if (
            poseDetected &&
            selectedExercise !== "" &&
            selectedExercise !== "plank" &&
            !countdownFinishedRef.current &&
            !countdownIntervalRef.current
        ) {
            let count = 3;
            setCountdownVal(3);
            countdownIntervalRef.current = setInterval(() => {
                count--;
                if (count === 2) {
                    setCountdownVal(2);
                } else if (count === 1) {
                    setCountdownVal(1);
                } else if (count === 0) {
                    setCountdownVal("Mulai!");
                } else {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                    setCountdownVal(null);
                    countdownFinishedRef.current = true;
                }
            }, 1000);
        }

        // If pose is lost before countdown is complete, reset it so it starts again on return
        if (!poseDetected && !countdownFinishedRef.current && countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setCountdownVal(null);
        }
    }, [poseDetected, selectedExercise]);

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
                    
                    const landmarks = pr.landmarks[0];
                    if (landmarks) {
                        for (const lm of pr.landmarks) {
                            du.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#5eead4", lineWidth: 2.5 });
                            du.drawLandmarks(lm, { color: "#0d9488", fillColor: "#ffffff", lineWidth: 1.5, radius: 5 });
                        }

                        // Repetition counting (only works after countdown is complete)
                        const exercise = selectedExRef.current;
                        if (exercise && exercise !== "plank" && countdownFinishedRef.current) {
                            const getPt = (idx) => {
                                const pt = landmarks[idx];
                                return pt && pt.visibility > 0.5 ? pt : null;
                            };

                            if (exercise === "squat") {
                                const hip = getPt(23);
                                const knee = getPt(25);
                                const ankle = getPt(27);
                                const rHip = getPt(24);
                                const rKnee = getPt(26);
                                const rAnkle = getPt(28);

                                // Use left side or right side depending on visibility
                                const actHip = hip || rHip;
                                const actKnee = knee || rKnee;
                                const actAnkle = ankle || rAnkle;

                                if (actHip && actKnee && actAnkle) {
                                    const angle = calculateAngle(actHip, actKnee, actAnkle);
                                    console.log(`[AI Debug] Squat Knee Angle: ${angle.toFixed(1)}°, Stage: ${stageRef.current}`);
                                    
                                    if (angle < 90) {
                                        if (stageRef.current === "up") {
                                            stageRef.current = "down";
                                            setPostureStatus("Turun");
                                        }
                                    }
                                    if (angle > 160 && stageRef.current === "down") {
                                        stageRef.current = "up";
                                        repCountRef.current += 1;
                                        setRepCount(repCountRef.current);
                                        setPostureStatus("Naik");
                                    }
                                }
                            } else if (exercise === "push-up") {
                                const shoulder = getPt(11);
                                const elbow = getPt(13);
                                const wrist = getPt(15);
                                const rShoulder = getPt(12);
                                const rElbow = getPt(14);
                                const rWrist = getPt(16);

                                const actShoulder = shoulder || rShoulder;
                                const actElbow = elbow || rElbow;
                                const actWrist = wrist || rWrist;

                                if (actShoulder && actElbow && actWrist) {
                                    const angle = calculateAngle(actShoulder, actElbow, actWrist);
                                    console.log(`[AI Debug] Push-Up Elbow Angle: ${angle.toFixed(1)}°, Stage: ${stageRef.current}`);

                                    if (angle < 90) {
                                        if (stageRef.current === "up") {
                                            stageRef.current = "down";
                                            setPostureStatus("Turun");
                                        }
                                    }
                                    if (angle > 160 && stageRef.current === "down") {
                                        stageRef.current = "up";
                                        repCountRef.current += 1;
                                        setRepCount(repCountRef.current);
                                        setPostureStatus("Naik");
                                    }
                                }
                            } else if (exercise === "lunge") {
                                const lHip = getPt(23); const lKnee = getPt(25); const lAnkle = getPt(27);
                                const rHip = getPt(24); const rKnee = getPt(26); const rAnkle = getPt(28);

                                let lAngle = lHip && lKnee && lAnkle ? calculateAngle(lHip, lKnee, lAnkle) : 180;
                                let rAngle = rHip && rKnee && rAnkle ? calculateAngle(rHip, rKnee, rAnkle) : 180;
                                
                                const minAngle = Math.min(lAngle, rAngle);
                                console.log(`[AI Debug] Lunge Knee Angle: ${minAngle.toFixed(1)}°, Stage: ${stageRef.current}`);

                                if (minAngle < 90) {
                                    if (stageRef.current === "up") {
                                        stageRef.current = "down";
                                        setPostureStatus("Turun");
                                    }
                                }
                                if (minAngle > 160 && stageRef.current === "down") {
                                    stageRef.current = "up";
                                    repCountRef.current += 1;
                                    setRepCount(repCountRef.current);
                                    setPostureStatus("Naik");
                                }
                            } else if (exercise === "jumping-jack") {
                                const lHip = getPt(23); const lShoulder = getPt(11); const lElbow = getPt(13);
                                const rHip = getPt(24); const rShoulder = getPt(12); const rElbow = getPt(14);

                                if (lHip && lShoulder && lElbow && rHip && rShoulder && rElbow) {
                                    const lAngle = calculateAngle(lHip, lShoulder, lElbow);
                                    const rAngle = calculateAngle(rHip, rShoulder, rElbow);
                                    console.log(`[AI Debug] Jumping Jack Shoulder Angles - L: ${lAngle.toFixed(1)}°, R: ${rAngle.toFixed(1)}°, Stage: ${stageRef.current}`);

                                    if (lAngle > 150 && rAngle > 150) {
                                        if (stageRef.current === "down") {
                                            stageRef.current = "up";
                                            repCountRef.current += 1;
                                            setRepCount(repCountRef.current);
                                            setPostureStatus("Buka");
                                        }
                                    } else if (lAngle < 30 && rAngle < 30) {
                                        stageRef.current = "down";
                                        setPostureStatus("Tutup");
                                    }
                                }
                            } else if (exercise === "sit-up") {
                                const shoulder = getPt(11); const hip = getPt(23); const knee = getPt(25);
                                const rShoulder = getPt(12); const rHip = getPt(24); const rKnee = getPt(26);

                                const actShoulder = shoulder || rShoulder;
                                const actHip = hip || rHip;
                                const actKnee = knee || rKnee;

                                if (actShoulder && actHip && actKnee) {
                                    const angle = calculateAngle(actShoulder, actHip, actKnee);
                                    console.log(`[AI Debug] Sit-Up Hip Angle: ${angle.toFixed(1)}°, Stage: ${stageRef.current}`);

                                    if (angle < 80) {
                                        if (stageRef.current === "down") {
                                            stageRef.current = "up";
                                            repCountRef.current += 1;
                                            setRepCount(repCountRef.current);
                                            setPostureStatus("Naik");
                                        }
                                    } else if (angle > 160) {
                                        stageRef.current = "down";
                                        setPostureStatus("Turun");
                                    }
                                }
                            } else if (exercise === "burpee") {
                                const lKnee = getPt(25); const lAnkle = getPt(27); const lHip = getPt(23);
                                const lShoulder = getPt(11); const lElbow = getPt(13); const lWrist = getPt(15);
                                const rKnee = getPt(26); const rAnkle = getPt(28); const rHip = getPt(24);
                                const rShoulder = getPt(12); const rElbow = getPt(14); const rWrist = getPt(16);

                                const knee = lKnee || rKnee;
                                const ankle = lAnkle || rAnkle;
                                const hip = lHip || rHip;
                                const shoulder = lShoulder || rShoulder;
                                const elbow = lElbow || rElbow;
                                const wrist = lWrist || rWrist;

                                if (knee && ankle && hip && shoulder && elbow && wrist) {
                                    const kneeAngle = calculateAngle(hip, knee, ankle);
                                    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
                                    const handsRaised = wrist.y < shoulder.y;
                                    console.log(`[AI Debug] Burpee Knee Angle: ${kneeAngle.toFixed(1)}°, Elbow: ${elbowAngle.toFixed(1)}°, Stage: ${stageRef.current}`);

                                    if (kneeAngle < 90) {
                                        if (stageRef.current === "up") {
                                            stageRef.current = "down";
                                            setPostureStatus("Turun");
                                        }
                                    }
                                    if (handsRaised && kneeAngle > 160 && stageRef.current === "down") {
                                        stageRef.current = "up";
                                        repCountRef.current += 1;
                                        setRepCount(repCountRef.current);
                                        setPostureStatus("Lompat");
                                    }
                                }
                            }
                        }
                    }
                }

                // Hand gesture (only active when Plank is selected)
                if (handLandmarkerRef.current && selectedExRef.current === "plank") {
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
                } else {
                    setCurrentGesture(null);
                    gestureRef.current.count = 0;
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

    // Unified function to request stream and start detection
    const startCamera = useCallback(async () => {
        try {
            setCamStatus("loading");
            setStatusMsg("Mempersiapkan model AI…");

            // Load vision CDN imports and tasks resolver only if needed
            const needsPose = !landmarkerRef.current;
            const needsHand = selectedExRef.current === "plank" && !handLandmarkerRef.current;

            if (needsPose || needsHand) {
                const { PoseLandmarker, HandLandmarker, FilesetResolver } =
                    await import(/* @vite-ignore */ MP_CDN);

                const vision = await FilesetResolver.forVisionTasks(MP_WASM);

                if (needsPose) {
                    setStatusMsg("Memuat model pose…");
                    landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
                        runningMode: "VIDEO",
                        numPoses: 1,
                    });
                }

                if (needsHand) {
                    setStatusMsg("Memuat model gesture tangan…");
                    handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
                        runningMode: "VIDEO",
                        numHands: 1,
                        minHandDetectionConfidence: 0.5,
                        minHandPresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5,
                    });
                }
            }

            setStatusMsg("Membuka kamera…");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: facingMode },
                audio: false,
            });
            streamRef.current = stream;

            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                await video.play();

                canvasRef.current.width  = video.videoWidth || 640;
                canvasRef.current.height = video.videoHeight || 480;

                setCamStatus("active");
                setStatusMsg("Mendeteksi pose…");

                const { PoseLandmarker, DrawingUtils } = await import(/* @vite-ignore */ MP_CDN);
                const ctx = canvasRef.current.getContext("2d");
                const detect = buildDetectLoop(video, ctx, PoseLandmarker, DrawingUtils);
                detect();
            }
        } catch (err) {
            console.error("Camera init error:", err);
            setCamStatus("error");
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
                setStatusMsg("Izin kamera ditolak. Aktifkan di pengaturan browser.");
            else if (err.name === "NotFoundError")
                setStatusMsg("Tidak ada kamera ditemukan.");
            else
                setStatusMsg("Gagal membuka kamera. Coba lagi.");
        }
    }, [buildDetectLoop, facingMode]);

    // Function to release camera tracks
    const stopCamera = useCallback(() => {
        cancelAnimationFrame(animRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setPoseDetected(false);
        setCurrentGesture(null);
        setCamStatus("stopped");
    }, []);

    const handleToggleCam = useCallback(() => {
        setIsCamOn((prev) => !prev);
    }, []);

    const handleSwitchCamera = useCallback(() => {
        // Toggle facingMode directly; stream lifecycle is driven by useEffect
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    }, []);

    // Effect to start/stop stream lifecycle based on isCamOn / facingMode
    useEffect(() => {
        if (isCamOn) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            cancelAnimationFrame(animRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [startCamera, stopCamera, isCamOn]);

    // Unmount cleanup: close models and stop all streams
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            if (landmarkerRef.current) {
                try { landmarkerRef.current.close(); } catch(e){}
                landmarkerRef.current = null;
            }
            if (handLandmarkerRef.current) {
                try { handLandmarkerRef.current.close(); } catch(e){}
                handLandmarkerRef.current = null;
            }
        };
    }, []);

    // ── Derived ──
    const isPlank = selectedExercise === "plank";
    const exerciseLabel = selectedExercise
        ? EXERCISE_OPTIONS.find((o) => o.value === selectedExercise)?.label
        : "—";

    const plankHint =
        plankPhase === "idle"
            ? "Buka 5 jari (telapak tangan terbuka) untuk memulai timer"
            : "Kepalkan tangan untuk menghentikan dan mereset timer";

    const gestureLabel = isPlank && currentGesture ? (
        currentGesture === "open_hand" ? "Mulai (Telapak Terbuka)" :
        currentGesture === "fist"      ? "Reset (Kepalan Tangan)" : null
    ) : null;

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

                        {/* Video + canvas (mirrored conditionally via CSS) */}
                        <div className={`ai-motion-video-wrapper ${facingMode === "user" ? "mirrored" : ""}`}>
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
                                <p className="ai-motion-cam-label">Kamera Belum Aktif</p>
                                <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem", marginBottom: "1rem" }}>
                                    Aktifkan kamera untuk memulai deteksi AI
                                </p>
                                <button className="ai-motion-start-cta" onClick={handleToggleCam}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                                        <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    </svg>
                                    Nyalakan Kamera
                                </button>
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

                        {/* Countdown Overlay */}
                        {camStatus === "active" && countdownVal !== null && (
                            <div className="ai-motion-countdown-overlay">
                                <span className="countdown-number">{countdownVal}</span>
                            </div>
                        )}

                        {/* Camera Controls Overlay Container */}
                        <div className="ai-motion-cam-controls-overlay">
                            {/* Switch Camera Button */}
                            {camStatus === "active" && (
                                <button
                                    className="ai-motion-cam-btn ai-motion-cam-switch"
                                    onClick={handleSwitchCamera}
                                    title="Ganti Kamera"
                                >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
                                        <path d="M23 4v6h-6" />
                                        <path d="M1 20v-6h6" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    <span>Kamera {facingMode === "user" ? "Belakang" : "Depan"}</span>
                                </button>
                            )}

                            {/* Toggle Camera Button */}
                            <button
                                className={`ai-motion-cam-btn ai-motion-cam-toggle ${isCamOn ? "cam-toggle--on" : "cam-toggle--off"}`}
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
                                {isPlank ? formatDur(plankDuration) : repCount}
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
                                    : (poseDetected ? postureStatus : "—")}
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
