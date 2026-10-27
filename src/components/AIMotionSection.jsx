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
    // MediaPipe Hand landmarks — y: 0=top, 1=bottom.
    // Compare tip to PIP (proximal knuckle) — stronger signal than tip-vs-DIP.
    // Landmark index: Index tip=8 PIP=6 | Middle tip=12 PIP=10 | Ring tip=16 PIP=14 | Pinky tip=20 PIP=18

    // Guard: require all key landmarks have reasonable visibility
    const keyPts = [6, 8, 10, 12, 14, 16, 18, 20];
    if (keyPts.some((i) => (lm[i]?.visibility ?? 1) < 0.3)) return null;

    const idxOpen = lm[8].y  < lm[6].y;
    const midOpen = lm[12].y < lm[10].y;
    const rngOpen = lm[16].y < lm[14].y;
    const pnkOpen = lm[20].y < lm[18].y;
    // open_hand: all 4 fingers clearly extended
    if (idxOpen && midOpen && rngOpen && pnkOpen) return "open_hand";

    const idxCurl = lm[8].y  > lm[6].y;
    const midCurl = lm[12].y > lm[10].y;
    const rngCurl = lm[16].y > lm[14].y;
    const pnkCurl = lm[20].y > lm[18].y;
    // fist: all 4 fingers clearly curled
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

function ptDist(p1, p2) {
    if (!p1 || !p2) return 0;
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Validates that detected pose landmarks represent a genuine human body
 * rather than a hand or background object hallucination.
 *
 * Checks:
 * 1. Both shoulders or at least one shoulder + hip are present with high confidence.
 * 2. Minimum shoulder width (distance between shoulders).
 * 3. Minimum torso length (shoulder midpoint to hip midpoint).
 *    A hand waving near the camera produces a tiny "torso" (< 0.11 of frame).
 */
function validateBodyPose(landmarks) {
    if (!landmarks || landmarks.length < 33) return null;

    const get = (idx, minVis = 0.55) => {
        const pt = landmarks[idx];
        if (!pt) return null;
        const vis = pt.visibility !== undefined ? pt.visibility : 1;
        return vis >= minVis ? pt : null;
    };

    const lShoulder = get(11, 0.6);
    const rShoulder = get(12, 0.6);
    const lHip = get(23, 0.55);
    const rHip = get(24, 0.55);

    // Torso presence: must have at least one shoulder AND at least one hip
    if (!lShoulder && !rShoulder) return null;
    if (!lHip && !rHip) return null;

    // Torso midpoint calculations
    const sX = lShoulder && rShoulder ? (lShoulder.x + rShoulder.x) / 2 : (lShoulder || rShoulder).x;
    const sY = lShoulder && rShoulder ? (lShoulder.y + rShoulder.y) / 2 : (lShoulder || rShoulder).y;
    const hX = lHip && rHip ? (lHip.x + rHip.x) / 2 : (lHip || rHip).x;
    const hY = lHip && rHip ? (lHip.y + rHip.y) / 2 : (lHip || rHip).y;

    // Shoulder width check if both shoulders are visible
    if (lShoulder && rShoulder) {
        const shoulderWidth = ptDist(lShoulder, rShoulder);
        // Hands waving near camera have shoulders clustered tightly (< 0.075)
        if (shoulderWidth < 0.075) return null;
    }

    // Torso length check (distance from shoulder midpoint to hip midpoint)
    const torsoLength = Math.hypot(hX - sX, hY - sY);
    // Real person at workout distance has torso >= 0.12 in normalized coordinates (0..1)
    // A hand or finger hallucination has torsoLength < 0.09
    if (torsoLength < 0.12) return null;

    return {
        lShoulder,
        rShoulder,
        lHip,
        rHip,
        sMid: { x: sX, y: sY },
        hMid: { x: hX, y: hY },
        torsoLength,
        getPt: get,
    };
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
    const repCountRef          = useRef(0);
    const stageRef             = useRef("up"); // up | down
    const countdownFinishedRef = useRef(false);
    const countdownIntervalRef = useRef(null);
    const lastRepTimeRef       = useRef(0);
    const downStartTimeRef     = useRef(0);
    const missingPoseCountRef  = useRef(0);

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

        // Reset reps & debounce timing
        setRepCount(0);
        repCountRef.current = 0;
        stageRef.current = "up";
        lastRepTimeRef.current = 0;
        downStartTimeRef.current = 0;
        missingPoseCountRef.current = 0;
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
        const MIN_DOWN_HOLD_MS = 200;
        const MIN_REP_INTERVAL_MS = 800;

        const detect = () => {
            if (video.readyState >= 2 && video.currentTime !== lastTimeRef.current) {
                lastTimeRef.current = video.currentTime;
                const now = performance.now();

                // Pose skeleton
                if (landmarkerRef.current) {
                    const pr = landmarkerRef.current.detectForVideo(video, now);
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    const rawLandmarks = pr.landmarks?.[0];
                    const body = validateBodyPose(rawLandmarks);

                    if (body) {
                        missingPoseCountRef.current = 0;
                        setPoseDetected(true);

                        // Draw full skeleton brightly only when real human body is confirmed
                        for (const lm of pr.landmarks) {
                            du.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#5eead4", lineWidth: 2.5 });
                            du.drawLandmarks(lm, { color: "#0d9488", fillColor: "#ffffff", lineWidth: 1.5, radius: 5 });
                        }

                        // Repetition counting (only works after countdown is complete)
                        const exercise = selectedExRef.current;
                        if (exercise && exercise !== "plank" && countdownFinishedRef.current) {
                            const handleRepState = (isDown, isUp, downLabel = "Turun", upLabel = "Naik") => {
                                const curNow = performance.now();
                                if (isDown) {
                                    if (stageRef.current === "up") {
                                        stageRef.current = "down";
                                        downStartTimeRef.current = curNow;
                                        setPostureStatus(downLabel);
                                    }
                                } else if (isUp) {
                                    if (stageRef.current === "down") {
                                        const downDuration = curNow - (downStartTimeRef.current || 0);
                                        const timeSinceLastRep = curNow - (lastRepTimeRef.current || 0);

                                        if (downDuration >= MIN_DOWN_HOLD_MS && timeSinceLastRep >= MIN_REP_INTERVAL_MS) {
                                            stageRef.current = "up";
                                            lastRepTimeRef.current = curNow;
                                            repCountRef.current += 1;
                                            setRepCount(repCountRef.current);
                                            setPostureStatus(upLabel);
                                        }
                                    }
                                }
                            };

                            if (exercise === "squat") {
                                const lH = body.getPt(23, 0.6);
                                const lK = body.getPt(25, 0.6);
                                const lA = body.getPt(27, 0.55);
                                const leftLegValid = lH && lK && lA && ptDist(lH, lK) > 0.06 && ptDist(lK, lA) > 0.06;

                                const rH = body.getPt(24, 0.6);
                                const rK = body.getPt(26, 0.6);
                                const rA = body.getPt(28, 0.55);
                                const rightLegValid = rH && rK && rA && ptDist(rH, rK) > 0.06 && ptDist(rK, rA) > 0.06;

                                if (!leftLegValid && !rightLegValid) {
                                    setPostureStatus("Arahkan kaki ke kamera");
                                } else {
                                    let kneeAngle = 180;
                                    if (leftLegValid && rightLegValid) {
                                        kneeAngle = (calculateAngle(lH, lK, lA) + calculateAngle(rH, rK, rA)) / 2;
                                    } else if (leftLegValid) {
                                        kneeAngle = calculateAngle(lH, lK, lA);
                                    } else {
                                        kneeAngle = calculateAngle(rH, rK, rA);
                                    }

                                    const isDown = kneeAngle < 100;
                                    const isUp = kneeAngle > 160;
                                    handleRepState(isDown, isUp, "Turun", "Naik");
                                }
                            } else if (exercise === "push-up") {
                                const lS = body.getPt(11, 0.65);
                                const lE = body.getPt(13, 0.6);
                                const lW = body.getPt(15, 0.55);
                                const leftArmValid = lS && lE && lW && ptDist(lS, lE) > 0.05 && ptDist(lE, lW) > 0.05;

                                const rS = body.getPt(12, 0.65);
                                const rE = body.getPt(14, 0.6);
                                const rW = body.getPt(16, 0.55);
                                const rightArmValid = rS && rE && rW && ptDist(rS, rE) > 0.05 && ptDist(rE, rW) > 0.05;

                                if (!leftArmValid && !rightArmValid) {
                                    setPostureStatus("Arahkan lengan ke kamera");
                                } else {
                                    let armAngle = 180;
                                    if (leftArmValid && rightArmValid) {
                                        armAngle = (calculateAngle(lS, lE, lW) + calculateAngle(rS, rE, rW)) / 2;
                                    } else if (leftArmValid) {
                                        armAngle = calculateAngle(lS, lE, lW);
                                    } else {
                                        armAngle = calculateAngle(rS, rE, rW);
                                    }

                                    const isDown = armAngle < 95;
                                    const isUp = armAngle > 150;
                                    handleRepState(isDown, isUp, "Turun", "Naik");
                                }
                            } else if (exercise === "lunge") {
                                const lH = body.getPt(23, 0.6);
                                const lK = body.getPt(25, 0.6);
                                const lA = body.getPt(27, 0.55);
                                const leftLegValid = lH && lK && lA && ptDist(lH, lK) > 0.06 && ptDist(lK, lA) > 0.06;

                                const rH = body.getPt(24, 0.6);
                                const rK = body.getPt(26, 0.6);
                                const rA = body.getPt(28, 0.55);
                                const rightLegValid = rH && rK && rA && ptDist(rH, rK) > 0.06 && ptDist(rK, rA) > 0.06;

                                if (!leftLegValid && !rightLegValid) {
                                    setPostureStatus("Arahkan kaki ke kamera");
                                } else {
                                    let minKneeAngle = 180;
                                    if (leftLegValid) minKneeAngle = Math.min(minKneeAngle, calculateAngle(lH, lK, lA));
                                    if (rightLegValid) minKneeAngle = Math.min(minKneeAngle, calculateAngle(rH, rK, rA));

                                    const isDown = minKneeAngle < 100;
                                    const isUp = minKneeAngle > 155;
                                    handleRepState(isDown, isUp, "Turun", "Naik");
                                }
                            } else if (exercise === "jumping-jack") {
                                const lH = body.getPt(23, 0.55);
                                const lS = body.getPt(11, 0.65);
                                const lE = body.getPt(13, 0.6);
                                const lW = body.getPt(15, 0.55);

                                const rH = body.getPt(24, 0.55);
                                const rS = body.getPt(12, 0.65);
                                const rE = body.getPt(14, 0.6);
                                const rW = body.getPt(16, 0.55);

                                const lA = body.getPt(27, 0.5);
                                const rA = body.getPt(28, 0.5);

                                if (!lH || !lS || !lE || !rH || !rS || !rE || (!lA && !rA)) {
                                    setPostureStatus("Arahkan seluruh tubuh ke kamera");
                                } else {
                                    const lArmAngle = calculateAngle(lH, lS, lE);
                                    const rArmAngle = calculateAngle(rH, rS, rE);
                                    const handsAboveShoulders = (lW && lW.y < lS.y) && (rW && rW.y < rS.y);

                                    const isUp = (lArmAngle > 135 && rArmAngle > 135) || handsAboveShoulders;
                                    const isDown = lArmAngle < 45 && rArmAngle < 45;
                                    handleRepState(isDown, isUp, "Tutup", "Buka");
                                }
                            } else if (exercise === "sit-up") {
                                const lS = body.getPt(11, 0.6);
                                const lH = body.getPt(23, 0.6);
                                const lK = body.getPt(25, 0.6);
                                const leftSideValid = lS && lH && lK && ptDist(lS, lH) > 0.08 && ptDist(lH, lK) > 0.06;

                                const rS = body.getPt(12, 0.6);
                                const rH = body.getPt(24, 0.6);
                                const rK = body.getPt(26, 0.6);
                                const rightSideValid = rS && rH && rK && ptDist(rS, rH) > 0.08 && ptDist(rH, rK) > 0.06;

                                if (!leftSideValid && !rightSideValid) {
                                    setPostureStatus("Posisikan tubuh di lantai");
                                } else {
                                    const torsoAngle = leftSideValid ? calculateAngle(lS, lH, lK) : calculateAngle(rS, rH, rK);
                                    const isDown = torsoAngle > 135;
                                    const isUp = torsoAngle < 80;
                                    handleRepState(isDown, isUp, "Turun", "Naik");
                                }
                            } else if (exercise === "burpee") {
                                const lH = body.getPt(23, 0.55); const rH = body.getPt(24, 0.55);
                                const lK = body.getPt(25, 0.55); const rK = body.getPt(26, 0.55);
                                const lA = body.getPt(27, 0.5); const rA = body.getPt(28, 0.5);
                                const lS = body.getPt(11, 0.6); const rS = body.getPt(12, 0.6);
                                const lW = body.getPt(15, 0.55); const rW = body.getPt(16, 0.55);

                                const hip = lH || rH;
                                const knee = lK || rK;
                                const ankle = lA || rA;
                                const shoulder = lS || rS;
                                const wrist = lW || rW;

                                if (!hip || !knee || !ankle || !shoulder || !wrist) {
                                    setPostureStatus("Arahkan seluruh tubuh ke kamera");
                                } else {
                                    const kneeAngle = calculateAngle(hip, knee, ankle);
                                    const handsAboveHead = wrist.y < shoulder.y - 0.05;

                                    const isDown = kneeAngle < 100;
                                    const isUp = handsAboveHead && kneeAngle > 155;
                                    handleRepState(isDown, isUp, "Turun", "Lompat");
                                }
                            }
                        }
                    } else {
                        // Pose invalid / hand waving / partial object
                        setPoseDetected(false);
                        missingPoseCountRef.current = (missingPoseCountRef.current || 0) + 1;
                        if (missingPoseCountRef.current > 45) {
                            countdownFinishedRef.current = false;
                        }
                        if (rawLandmarks) {
                            setPostureStatus("Mundur agar tubuh terlihat");
                        } else {
                            setPostureStatus("Siap");
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
                                plankPhaseRef.current = "stopped";
                                plankStartRef.current = null;
                                setPlankPhase("stopped");
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
        <div className="content-section animate-fade-in ai-motion-section">
            {/* Header */}
            <div className="ai-motion-header">
                <div className="ai-motion-badge">
                    <img src="/HyPrevent.png" alt="HyPrevent" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                    <span>Powered by HyPrevent</span>
                </div>
                <h1 className="ai-motion-title">Modul 4: Praktik Gerakan HyPrevent</h1>
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
                    Kamera dan analisis gerakan berjalan sepenuhnya di browser Anda — tidak ada video yang dikirim ke server.
                    Model AI diunduh dari CDN pihak ketiga (jsDelivr/Google) saat pertama kali digunakan.
                    {isPlank && " Mode Plank: Buka 5 jari untuk mulai timer, kepalkan tangan untuk menghentikan dan mereset timer."}
                </span>
            </div>
        </div>
    );
}
