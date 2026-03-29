/**
 * ReferensiSection — Halaman kumpulan referensi artikel & jurnal ilmiah.
 * Uses .content-section wrapper with original structure and font sizes.
 */

const references = [
    // Tambahkan referensi jurnal di sini nanti
];

export default function ReferensiSection() {
    return (
        <div className="content-section animate-fade-in">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.375rem' }}>
                Referensi Ilmiah
            </h1>
            <p style={{ fontSize: '1.125rem', marginBottom: '2.5rem', color: 'var(--text-light)' }}>
                Kumpulan artikel dan jurnal penelitian yang menjadi dasar ilmiah seluruh konten pencegahan hipertensi di platform HyPrevent.
            </p>

            {references.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'var(--bg-white)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</p>
                    <p style={{ fontSize: '1rem', color: 'var(--text-light)' }}>
                        Referensi jurnal akan segera ditambahkan.
                    </p>
                </div>
            ) : (
                references.map((group, gIdx) => (
                    <div key={gIdx} style={{ marginBottom: '2.5rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1.25rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '2px solid var(--primary-color)',
                        }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                {group.category}
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {group.items.map((ref, rIdx) => (
                                <div
                                    key={rIdx}
                                    style={{
                                        background: 'var(--bg-white)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '1.25rem 1.5rem',
                                        transition: 'box-shadow 0.2s ease',
                                    }}
                                >
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.375rem', lineHeight: 1.5 }}>
                                        {ref.title}
                                    </h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                                        {ref.authors} — <em>{ref.journal}</em> ({ref.year})
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                                        {ref.summary}
                                    </p>
                                    <a
                                        href={ref.doi}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            color: 'var(--primary-color)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        🔗 Baca Jurnal (DOI)
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            <div style={{
                marginTop: '1rem',
                padding: '1rem 1.25rem',
                background: 'var(--hover-bg)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--primary-color)',
            }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--text-dark)' }}>Catatan:</strong> Seluruh referensi berasal dari jurnal ilmiah internasional yang telah melalui proses <em>peer-review</em>. Untuk informasi medis pribadi, silakan konsultasikan dengan dokter atau tenaga kesehatan profesional.
                </p>
            </div>
        </div>
    );
}
