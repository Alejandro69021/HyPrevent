import { useState } from 'react';

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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.375rem' }}>
                {module.title}
            </h1>
            <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'var(--text-light)' }}>
                {module.subtitle}
            </p>

            {/* Video embed */}
            <div className="video-container">
                <iframe
                    src={module.videoUrl}
                    title={module.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            {/* Step guide section */}
            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    Panduan Langkah demi Langkah
                </h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
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

                {/* Step content */}
                <div className="step-content" key={activeStep}>
                    <h3>{current.title}</h3>
                    <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--text-light)' }}>
                        {current.description}
                    </p>

                    <img
                        alt={current.title}
                        className="step-image"
                        src={current.image}
                        loading="lazy"
                    />

                    <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ color: 'var(--secondary-color)', marginBottom: '1rem', fontWeight: 600 }}>
                            Detail Langkah:
                        </h4>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: 2 }}>
                            {current.details.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5rem', color: 'var(--text-light)' }}>
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
                        <button style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                            ✓ Selesai
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
