import { useState } from "react";

/**
 * AIMotionSection — Placeholder page for AI Motion Detector feature.
 * Shows: camera view area, exercise dropdown, and reps/posture panel.
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

export default function AIMotionSection() {
    const [selectedExercise, setSelectedExercise] = useState("");

    return (
        <section className="ai-motion-section">
            {/* Header */}
            <div className="ai-motion-header">
                <div className="ai-motion-badge">
                    <img src="/HyPrevent.png" alt="HyPrevent Logo" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span>Powered by HyPrevent</span>
                </div>
                <h2 className="ai-motion-title">Praktik Gerakan HyPrevent</h2>
                <p className="ai-motion-subtitle">
                    Deteksi gerakan olahraga secara real-time menggunakan teknologi HyPrevent.
                </p>
            </div>

            {/* Dropdown gerakan */}
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

            {/* Main area: Camera + Panel */}
            <div className="ai-motion-main">
                {/* Camera placeholder */}
                <div className="ai-motion-camera">
                    <div className="ai-motion-camera-inner">
                        <span className="cam-corner cam-corner--tl" />
                        <span className="cam-corner cam-corner--tr" />
                        <span className="cam-corner cam-corner--bl" />
                        <span className="cam-corner cam-corner--br" />

                        <div className="ai-motion-camera-placeholder">
                            <div className="ai-motion-cam-icon">
                                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 7l-7 5 7 5V7z" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                            </div>
                            <p className="ai-motion-cam-label">Tampilan Kamera</p>
                            <p className="ai-motion-cam-sub">Webcam / Kamera HP akan tampil di sini</p>
                            <div className="ai-motion-cam-status">
                                <span className="cam-dot" />
                                <span>Menunggu koneksi kamera…</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats panel */}
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
                            <span className="stat-value stat-value--posture" id="posture-status">—</span>
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
                            <span className="stat-value stat-value--exercise" id="exercise-display">
                                {selectedExercise
                                    ? EXERCISE_OPTIONS.find((o) => o.value === selectedExercise)?.label
                                    : "—"}
                            </span>
                        </div>
                    </div>

                    <button className="ai-motion-start-btn" disabled>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Mulai Deteksi
                        <span className="ai-motion-coming-badge">Segera Hadir</span>
                    </button>
                </div>
            </div>

            {/* Info note */}
            <div className="ai-motion-note">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Fitur ini akan menggunakan kamera perangkat Anda untuk mendeteksi gerakan secara real-time. Tidak ada data yang dikirim ke server.</span>
            </div>
        </section>
    );
}
