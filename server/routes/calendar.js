/**
 * server/routes/calendar.js
 * ─────────────────────────
 * Google Calendar OAuth2 routes.
 *
 * GET  /api/calendar/auth      → Redirect ke Google OAuth consent
 * GET  /api/calendar/callback   → Handle OAuth callback
 * GET  /api/calendar/status     → Cek apakah user sudah connected
 * POST /api/calendar/create-event → Manual create event (fallback)
 */

import { Router } from 'express';
import { getAuthUrl, handleCallback, isConnected, createEvent } from '../services/calendar.js';

const router = Router();

/**
 * GET /api/calendar/auth
 * Redirect user ke Google OAuth consent page.
 */
router.get('/auth', (req, res) => {
    const sessionId = req.query.sessionId || 'default';
    const authUrl = getAuthUrl(sessionId);
    res.redirect(authUrl);
});

/**
 * GET /api/calendar/callback
 * Handle OAuth callback dari Google.
 * Setelah berhasil, redirect ke halaman sukses di frontend.
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state: sessionId = 'default' } = req.query;

        if (!code) {
            return res.status(400).send('Authorization code tidak ditemukan.');
        }

        await handleCallback(code, sessionId);

        // Redirect ke frontend dengan status sukses
        // Vite dev = port 5173, production = same origin
        const frontendUrl = process.env.NODE_ENV === 'production'
            ? '/'
            : 'http://localhost:5173';

        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Google Calendar Terhubung!</title>
                <style>
                    body {
                        font-family: 'Inter', system-ui, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f0fdfa;
                        color: #134e4a;
                    }
                    .card {
                        text-align: center;
                        padding: 2rem;
                        border-radius: 1rem;
                        background: white;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                        max-width: 400px;
                    }
                    .check { font-size: 3rem; margin-bottom: 1rem; }
                    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
                    p { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
                    .btn {
                        display: inline-block;
                        padding: 0.625rem 1.5rem;
                        border-radius: 0.75rem;
                        background: #0d9488;
                        color: white;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 0.875rem;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="check">✅</div>
                    <h1>Google Calendar Terhubung!</h1>
                    <p>Sekarang jadwal latihan dari AI assistant akan otomatis tersimpan di kalender kamu.</p>
                    <p style="font-size: 0.75rem; color: #94a3b8;">Tab ini akan tertutup otomatis dalam 3 detik...</p>
                </div>
                <script>
                    // Notify opener window and close
                    if (window.opener) {
                        window.opener.postMessage({ type: 'CALENDAR_CONNECTED', sessionId: '${sessionId}' }, '*');
                    }
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        console.error('[Calendar Callback] Error:', err);
        res.status(500).send(`
            <!DOCTYPE html>
            <html><body style="font-family: sans-serif; text-align: center; padding: 2rem;">
                <h2>❌ Gagal menghubungkan Google Calendar</h2>
                <p>${err.message}</p>
                <p>Silakan coba lagi.</p>
            </body></html>
        `);
    }
});

/**
 * GET /api/calendar/status
 * Cek apakah user sudah connect Google Calendar.
 */
router.get('/status', (req, res) => {
    const sessionId = req.query.sessionId || 'default';
    res.json({
        connected: isConnected(sessionId),
    });
});

/**
 * POST /api/calendar/create-event
 * Manual create event (fallback jika auto-create gagal).
 */
router.post('/create-event', async (req, res) => {
    try {
        const { sessionId = 'default', nama_aktivitas, waktu_pelaksanaan } = req.body;

        if (!isConnected(sessionId)) {
            return res.status(401).json({
                error: 'Belum terhubung ke Google Calendar',
                authUrl: getAuthUrl(sessionId),
            });
        }

        const event = await createEvent(sessionId, nama_aktivitas, waktu_pelaksanaan);
        res.json({ success: true, event });
    } catch (err) {
        console.error('[Calendar Create] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
