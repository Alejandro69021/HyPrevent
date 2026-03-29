export default function Home() {
    return (
        <div className="animate-fade-in-up">
            {/* Title Section */}
            <section className="text-center pt-4 pb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Selamat Datang di HyPrevent
                </h1>
                <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    Platform edukasi komprehensif untuk pencegahan hipertensi dan penyakit metabolik.
                    <br />
                    Temukan panduan praktis yang mudah diikuti untuk hidup lebih sehat.
                </p>
            </section>

            {/* Video Introduction */}
            <section className="mb-10">
                <div className="rounded-2xl overflow-hidden shadow-lg shadow-gray-200/60 border border-gray-100">
                    <div className="aspect-video bg-gray-100">
                        <iframe
                            className="w-full h-full"
                            src="https://youtu.be/0CvPzjJ9w0Q?si=14INLUdGIb0yy-ns"
                            title="HyPrevent — Video Perkenalan"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="mb-10 animate-fade-in-up delay-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Tentang Website Ini
                </h2>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        <strong className="text-primary-700">HyPrevent</strong> adalah platform edukasi digital yang dirancang
                        khusus untuk membantu masyarakat Indonesia memahami dan mencegah penyakit hipertensi (tekanan darah tinggi).
                        Website ini menyediakan panduan komprehensif melalui video tutorial dan panduan langkah demi langkah.
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Dibuat untuk semua usia — mulai dari remaja hingga lansia — dengan
                        antarmuka yang sederhana, ramah, dan mudah digunakan. Setiap modul dilengkapi dengan video penjelasan
                        dan panduan visual yang interaktif.
                    </p>
                </div>
            </section>

            {/* Module Overview */}
            <section className="animate-fade-in-up delay-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Materi Pembelajaran
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-300">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">🛡️</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Modul 1</h3>
                        <p className="text-xs text-gray-500">Pencegahan Hipertensi</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-300">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">⚠️</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Modul 2</h3>
                        <p className="text-xs text-gray-500">Pantangan & Tantangan</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-300">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">🏃</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Modul 3</h3>
                        <p className="text-xs text-gray-500">Olahraga Pencegah Hipertensi</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
