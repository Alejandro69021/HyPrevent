/**
 * IntroSection — Home page content.
 * Uses original content-section structure with restored font sizes.
 */
export default function IntroSection() {
    return (
        <div className="content-section animate-fade-in">
            {/* Intro header */}
            <div className="intro-section">
                <h1>Selamat Datang di HyPrevent</h1>
                <p>
                    Platform edukasi komprehensif untuk pencegahan hipertensi dan penyakit metabolik.
                    Temukan panduan praktis yang mudah diikuti untuk hidup lebih sehat.
                </p>
            </div>

            {/* Video embed */}
            <div className="video-container">
                <iframe
                    src="https://www.youtube.com/embed/0CvPzjJ9w0Q"
                    title="Pengenalan HyPrevent"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            {/* About section */}
            <div className="about-section">
                <h2>Tentang Platform Ini</h2>
                <p>
                    HyPrevent adalah platform edukasi kesehatan yang dirancang khusus untuk membantu
                    Anda memahami dan mencegah hipertensi. Kami menyediakan konten edukatif dalam bentuk
                    video dan panduan langkah demi langkah yang mudah dipahami oleh semua kalangan usia.
                </p>
                <p>
                    Setiap modul dirancang dengan cermat untuk memberikan informasi yang akurat, praktis,
                    dan mudah diterapkan dalam kehidupan sehari-hari. Dengan mengikuti panduan kami,
                    Anda akan mendapatkan pemahaman yang lebih baik tentang pencegahan hipertensi dan
                    dapat menjalani gaya hidup yang lebih sehat dan dipahami.
                </p>
            </div>

            {/* Feature cards */}
            <div className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">📚</div>
                    <h3>Modul Komprehensif</h3>
                    <p>Materi pembelajaran yang terstruktur dan mudah dipahami tentang pencegahan hipertensi</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🎥</div>
                    <h3>Video Edukatif</h3>
                    <p>Konten video berkualitas tinggi yang menjelaskan setiap topik dengan detail</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">✅</div>
                    <h3>Panduan Praktis</h3>
                    <p>Langkah-langkah praktis yang dapat langsung diterapkan dalam kehidupan sehari-hari</p>
                </div>
            </div>
        </div>
    );
}
