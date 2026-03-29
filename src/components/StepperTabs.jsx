import { useState } from 'react';

/**
 * StepperTabs — Dynamic tab/stepper using vanilla CSS classes.
 */
export default function StepperTabs({ steps }) {
    const [activeStep, setActiveStep] = useState(0);
    const current = steps[activeStep];
    const total = steps.length;

    const goNext = () => setActiveStep((s) => Math.min(s + 1, total - 1));
    const goPrev = () => setActiveStep((s) => Math.max(s - 1, 0));

    return (
        <div className="stepper-container">
            {/* Tab headers */}
            <div className="stepper-tabs">
                {steps.map((step, i) => (
                    <button
                        key={i}
                        className={`stepper-tab ${i === activeStep ? 'active' : ''}`}
                        onClick={() => setActiveStep(i)}
                    >
                        Langkah {i + 1}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="stepper-content" key={activeStep}>
                <h4>{current.title}</h4>

                <img
                    className="step-image"
                    src={current.image}
                    alt={current.title}
                    loading="lazy"
                />

                <div className="step-details">
                    <h5>Detail Langkah:</h5>
                    <ul>
                        {current.details.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Bottom navigation */}
            <div className="stepper-nav">
                {activeStep > 0 ? (
                    <button className="stepper-btn prev" onClick={goPrev}>
                        ← Langkah Sebelumnya
                    </button>
                ) : (
                    <div />
                )}

                {activeStep < total - 1 ? (
                    <button className="stepper-btn next" onClick={goNext}>
                        Langkah Selanjutnya →
                    </button>
                ) : (
                    <span className="stepper-btn done">Selesai ✓</span>
                )}
            </div>
        </div>
    );
}
