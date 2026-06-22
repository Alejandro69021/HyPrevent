import { useState, useRef, useEffect } from 'react';

/**
 * JadwalSection — Asisten Jadwal Latihan (Chatbot-style).
 * Uses HyPrevent design system (CSS classes, CSS variables).
 * Connects to backend /api/chat → Gemini AI with function calling.
 */

const SESSION_ID = `hyprevent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ─── Helpers ─── */

function formatWaktu(waktuStr) {
    try {
        const d = new Date(waktuStr.replace(' ', 'T'));
        if (isNaN(d.getTime())) return waktuStr;
        const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const pad = (n) => String(n).padStart(2, '0');
        return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()} — ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
    } catch {
        return waktuStr;
    }
}

function buildICS(nama, waktu) {
    const start = new Date(waktu.replace(' ', 'T'));
    const end = new Date(start.getTime() + 3600000);
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HyPrevent//AI//ID',
        'BEGIN:VEVENT', `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
        `SUMMARY:${nama}`, 'DESCRIPTION:Jadwal latihan dari HyPrevent AI', 'STATUS:CONFIRMED',
        'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Waktunya latihan!', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
}

function buildGCalUrl(nama, waktu) {
    const start = new Date(waktu.replace(' ', 'T'));
    const end = new Date(start.getTime() + 3600000);
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const params = new URLSearchParams({
        action: 'TEMPLATE', text: nama,
        dates: `${fmt(start)}/${fmt(end)}`,
        details: `Jadwal latihan dari HyPrevent AI.\nAktivitas: ${nama}`,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
}

export default function JadwalSection() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [calConnected, setCalConnected] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Listen for Calendar OAuth callback
    useEffect(() => {
        const handler = (e) => {
            if (e.data?.type === 'CALENDAR_CONNECTED') setCalConnected(true);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // Check calendar status on mount
    useEffect(() => {
        fetch(`/api/calendar/status?sessionId=${SESSION_ID}`)
            .then(r => r.json())
            .then(d => setCalConnected(d.connected))
            .catch(() => {});
    }, []);

    /* ─── Send message ─── */
    const handleSend = async () => {
        const msg = input.trim();
        if (!msg || loading) return;

        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history, sessionId: SESSION_ID }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');

            const aiMsg = { role: 'ai', text: data.text };
            if (data.scheduledEvent) {
                aiMsg.schedule = data.scheduledEvent;
                aiMsg.calendarSaved = data.calendarSaved;
                aiMsg.calendarEvent = data.calendarEvent;
                aiMsg.calendarAuthRequired = data.calendarAuthRequired;
                aiMsg.authUrl = data.authUrl;
            }
            setMessages(prev => [...prev, aiMsg]);
            setHistory(data.updatedHistory || []);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadICS = (nama, waktu) => {
        const blob = new Blob([buildICS(nama, waktu)], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${nama.replace(/\s+/g, '_')}_HyPrevent.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGoogleCal = (schedule, authUrl) => {
        if (calConnected) {
            fetch('/api/calendar/create-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: SESSION_ID, nama_aktivitas: schedule.nama_aktivitas, waktu_pelaksanaan: schedule.waktu_pelaksanaan }),
            }).then(r => r.json()).then(d => {
                if (d.success) alert('✅ Event berhasil disimpan ke Google Calendar!');
                else window.open(buildGCalUrl(schedule.nama_aktivitas, schedule.waktu_pelaksanaan), '_blank');
            }).catch(() => window.open(buildGCalUrl(schedule.nama_aktivitas, schedule.waktu_pelaksanaan), '_blank'));
        } else if (authUrl) {
            window.open(authUrl, 'GoogleCalendarAuth', 'width=500,height=600,scrollbars=yes');
        } else {
            window.open(buildGCalUrl(schedule.nama_aktivitas, schedule.waktu_pelaksanaan), '_blank');
        }
    };

    const examples = [
        'Jadwalin latihan punggung besok jam 5 sore',
        'Apa manfaat resistance training untuk tensi?',
        'Push day hari sabtu jam 4 sore',
    ];

    return (
        <div className="chat-page">
            <div className="content-section animate-fade-in chat-container">

                {/* ─── Header ─── */}
                <div className="intro-section">
                    <div className="chat-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        HyPrevent AI
                    </div>
                    <h1>Asisten Jadwal Latihan</h1>
                    <p>Chat dengan asisten AI untuk menjadwalkan latihan dan simpan otomatis ke kalender</p>
                </div>

                {/* ─── Example Chips ─── */}
                {messages.length === 0 && (
                    <div className="chat-chips">
                        {examples.map(ex => (
                            <button key={ex} className="chat-chip" onClick={() => { setInput(ex); inputRef.current?.focus(); }}>
                                💬 {ex}
                            </button>
                        ))}
                    </div>
                )}

                {/* ─── Chat Area ─── */}
                <div className="chat-messages">

                    {/* Welcome */}
                    {messages.length === 0 && (
                        <div className="chat-bubble-row chat-bubble-row--ai">
                            <div className="chat-avatar">AI</div>
                            <div className="chat-bubble chat-bubble--ai">
                                Hai Kak! 👋 Aku HyPrevent Assistant. Aku bisa bantu kamu:{'\n\n'}
                                • Menjadwalkan latihan olahraga{'\n'}
                                • Memberikan tips pencegahan hipertensi{'\n'}
                                • Menyusun rencana resistance training{'\n\n'}
                                Coba ketik pesan atau pilih contoh di atas! 💪
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        if (msg.role === 'user') {
                            return (
                                <div key={i} className="chat-bubble-row chat-bubble-row--user">
                                    <div className="chat-bubble chat-bubble--user">{msg.text}</div>
                                </div>
                            );
                        }
                        return (
                            <div key={i} className="chat-bubble-row chat-bubble-row--ai">
                                <div className="chat-avatar">AI</div>
                                <div className="chat-bubble-content">
                                    <div className="chat-bubble chat-bubble--ai">{msg.text}</div>

                                    {/* Schedule Card */}
                                    {msg.schedule && (
                                        <div className="schedule-card animate-fade-in">
                                            <div className="schedule-card__header">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                <div>
                                                    <div className="schedule-card__title">Jadwal Latihan Dibuat</div>
                                                    <div className="schedule-card__subtitle">by HyPrevent AI</div>
                                                </div>
                                            </div>
                                            <div className="schedule-card__body">
                                                <div className="schedule-detail">
                                                    <span className="schedule-detail__icon schedule-detail__icon--activity">🏋️</span>
                                                    <div>
                                                        <div className="schedule-detail__label">Aktivitas</div>
                                                        <div className="schedule-detail__value">{msg.schedule.nama_aktivitas}</div>
                                                    </div>
                                                </div>
                                                <div className="schedule-detail__divider" />
                                                <div className="schedule-detail">
                                                    <span className="schedule-detail__icon schedule-detail__icon--time">⏰</span>
                                                    <div>
                                                        <div className="schedule-detail__label">Waktu</div>
                                                        <div className="schedule-detail__value">{formatWaktu(msg.schedule.waktu_pelaksanaan)}</div>
                                                    </div>
                                                </div>

                                                {msg.calendarSaved && (
                                                    <div className="schedule-saved-badge">
                                                        ✅ Tersimpan di Google Calendar
                                                        {msg.calendarEvent?.htmlLink && (
                                                            <a href={msg.calendarEvent.htmlLink} target="_blank" rel="noopener noreferrer"> (Lihat →)</a>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="schedule-actions">
                                                    <button className="schedule-btn schedule-btn--primary" onClick={() => handleGoogleCal(msg.schedule, msg.authUrl)}>
                                                        📅 {msg.calendarSaved ? 'Buka Google Calendar' : calConnected ? 'Simpan ke Google Calendar' : 'Hubungkan Google Calendar'}
                                                    </button>
                                                    <button className="schedule-btn schedule-btn--secondary" onClick={() => handleDownloadICS(msg.schedule.nama_aktivitas, msg.schedule.waktu_pelaksanaan)}>
                                                        📱 Download .ics (Kalender HP)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="chat-bubble-row chat-bubble-row--ai">
                            <div className="chat-avatar">AI</div>
                            <div className="chat-typing">
                                <span className="chat-typing__dot" />
                                <span className="chat-typing__dot" />
                                <span className="chat-typing__dot" />
                            </div>
                            <span className="chat-typing__label">AI sedang menganalisis...</span>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* ─── Input Area ─── */}
                <div className="chat-input-area">
                    <div className="chat-input-row">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            rows={2}
                            placeholder="Ketik pesan... (Enter kirim, Shift+Enter baris baru)"
                            disabled={loading}
                        />
                        <button
                            className={`chat-send-btn ${loading || !input.trim() ? 'chat-send-btn--disabled' : ''}`}
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? (
                                <svg className="chat-send-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
                                </svg>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                    Kirim
                                </>
                            )}
                        </button>
                    </div>
                    <div className="chat-status-bar">
                        <span>Powered by Gemini AI · HyPrevent</span>
                        <span className="chat-cal-status">
                            <span className={`chat-cal-dot ${calConnected ? 'chat-cal-dot--on' : ''}`} />
                            {calConnected ? 'Calendar Connected' : 'Calendar Not Connected'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
