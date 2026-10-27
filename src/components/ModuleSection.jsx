import { useState } from 'react';
import { MEDICAL_DISCLAIMER } from '../config/medical.js';

/**
 * ModuleSection — Matches the reference HTML structure exactly.
 * Uses .content-section, .step-navigation, .step-button, .step-content classes.
 */
export default function ModuleSection({ module }) {
    const [activeStep, setActiveStep] = useState(0);
    const current = module.steps[activeStep];
    const total = module.steps.length;

    const goNext = () => setActiveStep((s) => Math.min(s + 1, total - 1));
    const goPrev = () => setActiveStep((s) => Math.max(s - 1, 0));

    return (
        <div className="content-section animate-fade-in">
            {/* Module title */}
            <div className="intro-section">
                <h1>{module.title}</h1>
                <p>{module.subtitle}</p>
            </div>

            {/* Video embed — only render when URL exists */}
            {module.videoUrl ? (
                <div className="video-container">
                    <iframe
                        src={module.videoUrl}
                        title={module.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            ) : null}

            {/* Step guide section */}
            <div className="step-guide-section">
                <h2 className="step-guide-title">
                    Panduan Langkah demi Langkah
                </h2>
                <p className="step-guide-subtitle">
                    Ikuti panduan di bawah ini untuk memahami materi dengan lebih baik. Klik tombol langkah untuk melihat detailnya.
                </p>

                {/* Step navigation buttons */}
                <div className="step-navigation">
                    {module.steps.map((_, i) => (
                        <button
                            key={i}
                            className={`step-button ${i === activeStep ? 'active' : ''}`}
                            onClick={() => setActiveStep(i)}
                        >
                            Langkah {i + 1}
                        </button>
                    ))}
                </div>

                {/* Step content — aria-live announces step changes to screen readers */}
                <div className="step-content" key={activeStep} aria-live="polite" aria-atomic="true">
                    <h3>{current.title}</h3>
                    <p className="step-content-desc">
                        {current.description}
                    </p>

                    <img
                        alt={`${current.title} — ${current.description}`}
                        className="step-image"
                        src={current.image}
                        loading="lazy"
                    />

                    <div className="step-details-container">
                        <h4 className="step-details-heading">
                            Detail Langkah:
                        </h4>
                        <ul className="step-details-list">
                            {current.details.map((item, idx) => (
                                <li key={idx} className="step-details-item">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Prev / Next buttons */}
                <div className="step-nav-buttons">
                    <button
                        onClick={goPrev}
                        disabled={activeStep === 0}
                    >
                        ← Langkah Sebelumnya
                    </button>
                    {activeStep < total - 1 ? (
                        <button onClick={goNext}>
                            Langkah Selanjutnya →
                        </button>
                    ) : (
                        <button disabled style={{ color: 'var(--success-color)', fontWeight: 600, opacity: 0.85, cursor: 'default' }}>
                            ✓ Selesai
                        </button>
                    )}
                </div>
            </div>

            {/* Disclaimer medis */}
            <div className="medical-disclaimer">
                <p>⚕️ {MEDICAL_DISCLAIMER}</p>
            </div>
        </div>
    );
}
