import { useState } from 'react';
import { parseJadwal } from '../utils/jadwalParser';

/**
 * JadwalSection — Smart Workout Scheduler with NLP parsing,
 *                 Google Calendar link & ICS export.
 */

// Shared inline-style factory for calendar buttons
const calBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-white)',
    color: 'var(--text-dark)',
    fontWeight: 500,
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export default function JadwalSection() {
    const [inputVal, setInputVal] = useState('');
    const [parsed, setParsed] = useState(null);

    // ─── Submit: parse the input text ───
    const handleSubmit = () => {
        if (inputVal.trim() === '') {
            alert('Silakan ketik jadwalmu terlebih dahulu!');
            return;
        }
        const result = parseJadwal(inputVal);
        setParsed(result);
    };

    // ─── Google Calendar ───
    const bukaGoogleCalendar = () => {
        if (!parsed) return;
        const desc = `Jadwal latihan ${parsed.aktivitas} dari platform Hyprevent.`;
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(parsed.aktivitas)}&dates=${parsed.ics.start}/${parsed.ics.end}&details=${encodeURIComponent(desc)}`;
        window.open(url, '_blank');
    };

    // ─── ICS Download ───
    const downloadICS = () => {
        if (!parsed) return;
        const desc = `Jadwal latihan ${parsed.aktivitas} dari platform Hyprevent.`;
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Hyprevent//Jadwal Latihan//ID',
            'BEGIN:VEVENT',
            `DTSTART:${parsed.ics.start}`,
            `DTEND:${parsed.ics.end}`,
            `SUMMARY:${parsed.aktivitas}`,
            `DESCRIPTION:${desc}`,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT15M',
            'ACTION:DISPLAY',
            'DESCRIPTION:Waktunya latihan!',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${parsed.aktivitas.replace(/\s+/g, '_')}_Hyprevent.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Detail Row Component ───
    const DetailRow = ({ emoji, label, value }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0',
        }}>
            <span style={{ fontSize: '1.1rem', width: '1.5rem', textAlign: 'center' }}>{emoji}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, minWidth: '55px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 600 }}>{value}</span>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 5rem)',
            padding: '2rem 1rem',
        }}>
            <div className="content-section animate-fade-in" style={{ width: '100%', maxWidth: '900px' }}>
                {/* Header */}
                <div className="intro-section">
                    <h1>Asisten Jadwal Latihan</h1>
                    <p>
                        Ketik jadwal olahraga yang ingin kamu lakukan, dan asisten kami akan menyiapkannya untuk kalendermu.
                    </p>
                </div>

                {/* Example chips */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                }}>
                    {[
                        'Jalan santai besok jam 6 pagi',
                        'Yoga hari sabtu jam 7 pagi 1 jam',
                        'Lari sore ini jam 5 selama 45 menit',
                    ].map((example) => (
                        <button
                            key={example}
                            onClick={() => { setInputVal(example); setParsed(null); }}
                            style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '9999px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-white)',
                                color: 'var(--text-light)',
                                fontSize: '0.75rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = 'var(--secondary-color)';
                                e.target.style.color = 'var(--primary-color)';
                                e.target.style.background = 'var(--hover-bg)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = 'var(--border-color)';
                                e.target.style.color = 'var(--text-light)';
                                e.target.style.background = 'var(--bg-white)';
                            }}
                        >
                            💬 {example}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    alignItems: 'stretch',
                }}>
                    <input
                        type="text"
                        id="jadwal-input"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                        placeholder="Contoh: Ingatkan saya jalan santai besok jam 6 pagi..."
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-light)',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            color: 'var(--text-dark)',
                            outline: 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary-color)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        id="jadwal-submit"
                        onClick={handleSubmit}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--primary-color)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            transition: 'background 0.2s, transform 0.1s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#0f766e'}
                        onMouseLeave={(e) => e.target.style.background = 'var(--primary-color)'}
                        onMouseDown={(e) => e.target.style.transform = 'scale(0.97)'}
                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        Buat Jadwal
                    </button>
                </div>

                {/* ─── Parsed Result Card ─── */}
                {parsed && (
                    <div
                        className="animate-fade-in"
                        style={{
                            background: 'var(--hover-bg)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid #ccfbf1',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            {/* AI Avatar */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#99f6e4',
                                color: 'var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                flexShrink: 0,
                            }}>
                                AI
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    color: 'var(--text-dark)',
                                    fontSize: '0.9375rem',
                                    marginBottom: '0.75rem',
                                    lineHeight: 1.6,
                                }}>
                                    Jadwal berhasil dianalisa! Berikut detailnya:
                                </p>

                                {/* Parsed Details */}
                                <div style={{
                                    background: 'var(--bg-white)',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid var(--border-color)',
                                    marginBottom: '1rem',
                                }}>
                                    <DetailRow emoji="🏃" label="Aktivitas" value={parsed.display.aktivitas} />
                                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                                    <DetailRow emoji="📅" label="Tanggal" value={parsed.display.tanggal} />
                                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                                    <DetailRow emoji="⏰" label="Waktu" value={parsed.display.waktu} />
                                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                                    <DetailRow emoji="⏱️" label="Durasi" value={parsed.display.durasi} />
                                </div>

                                {/* Info about defaults if any fields were guessed */}
                                {parsed.errors.length > 0 && (
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-light)',
                                        marginBottom: '0.75rem',
                                        lineHeight: 1.5,
                                        fontStyle: 'italic',
                                    }}>
                                        💡 Beberapa detail ({parsed.errors.join(', ')}) tidak terdeteksi dari teks Anda, sehingga menggunakan nilai default.
                                    </p>
                                )}

                                {/* Action Buttons */}
                                <p style={{
                                    fontSize: '0.8125rem',
                                    color: 'var(--text-dark)',
                                    marginBottom: '0.75rem',
                                    fontWeight: 500,
                                }}>
                                    Simpan ke kalendermu:
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <button
                                        id="btn-google-cal"
                                        onClick={bukaGoogleCalendar}
                                        style={calBtnStyle}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--bg-light)';
                                            e.target.style.borderColor = 'var(--secondary-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'var(--bg-white)';
                                            e.target.style.borderColor = 'var(--border-color)';
                                        }}
                                    >
                                        📅 Simpan ke Google Calendar
                                    </button>

                                    <button
                                        id="btn-ics-download"
                                        onClick={downloadICS}
                                        style={calBtnStyle}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--bg-light)';
                                            e.target.style.borderColor = 'var(--secondary-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'var(--bg-white)';
                                            e.target.style.borderColor = 'var(--border-color)';
                                        }}
                                    >
                                        📱 Simpan ke Kalender HP (.ics)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
