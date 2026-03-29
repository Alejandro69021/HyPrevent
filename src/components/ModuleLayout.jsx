import { useState } from 'react';
import StepIllustration from './StepIllustration';

export default function ModuleLayout({ module }) {
    const [activeStep, setActiveStep] = useState(0);
    const totalSteps = module.steps.length;
    const currentStep = module.steps[activeStep];
    const progress = ((activeStep + 1) / totalSteps) * 100;

    return (
        <div className="animate-fade-in-up" key={module.id}>
            {/* Module Header */}
            <section className="text-center pt-4 pb-6">
                <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 mb-3">
                    <span className="text-sm">{module.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide">{module.title}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{module.subtitle}</h1>
                <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">{module.description}</p>
            </section>

            {/* Video Section */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-base">🎥</span> Video Tutorial
                </h2>
                <div className="rounded-2xl overflow-hidden shadow-lg shadow-gray-200/60 border border-gray-100">
                    <div className="aspect-video bg-gray-100">
                        <iframe
                            className="w-full h-full"
                            src={module.videoUrl}
                            title={`${module.title} — ${module.subtitle}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </div>
                <p className="text-gray-400 text-xs mt-3 text-center">
                    Tonton video di atas, lalu ikuti panduan langkah demi langkah di bawah
                </p>
            </section>

            {/* Step-by-Step Guide */}
            <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-base">📋</span> Panduan Langkah demi Langkah
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Progress bar */}
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">
                                Langkah {activeStep + 1} dari {totalSteps}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Step dots */}
                        <div className="flex items-center gap-1.5 mt-3">
                            {module.steps.map((_, i) => (
                                <button
                                    key={i}
                                    id={`step-dot-${i}`}
                                    onClick={() => setActiveStep(i)}
                                    className={`flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-bold transition-all duration-300
                                        ${i === activeStep
                                            ? 'bg-primary-500 text-white shadow-sm'
                                            : i < activeStep
                                                ? 'bg-primary-100 text-primary-600'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                    aria-label={`Langkah ${i + 1}`}
                                >
                                    {i < activeStep ? '✓' : i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="p-5 md:p-7" key={activeStep}>
                        <div className="animate-fade-in-up">
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                {/* Illustration */}
                                <div className="w-full lg:w-2/5 shrink-0">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <StepIllustration type={currentStep.illustrationType} />
                                    </div>
                                </div>

                                {/* Text content */}
                                <div className="flex-1">
                                    <span className="inline-block text-[11px] font-bold text-primary-600 uppercase tracking-wider mb-2">
                                        Langkah {activeStep + 1}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                                        {currentStep.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        {currentStep.description}
                                    </p>

                                    {/* Tip box */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-base mt-0.5">💡</span>
                                            <div>
                                                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Tips</p>
                                                <p className="text-xs text-amber-800 leading-relaxed">{currentStep.tip}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                                <button
                                    id="step-prev"
                                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                    disabled={activeStep === 0}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200
                                        ${activeStep === 0
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 bg-gray-50 hover:bg-gray-100 active:scale-95'
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                    Sebelumnya
                                </button>

                                <button
                                    id="step-next"
                                    onClick={() => setActiveStep(Math.min(totalSteps - 1, activeStep + 1))}
                                    disabled={activeStep === totalSteps - 1}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200
                                        ${activeStep === totalSteps - 1
                                            ? 'bg-green-500 text-white cursor-default'
                                            : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-sm'
                                        }`}
                                >
                                    {activeStep === totalSteps - 1 ? (
                                        <>Selesai! 🎉</>
                                    ) : (
                                        <>
                                            Selanjutnya
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
