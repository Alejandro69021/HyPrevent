/**
 * server/routes/chat.js
 * ─────────────────────
 * POST /api/chat — Endpoint utama untuk chat dengan Gemini AI.
 *
 * Flow:
 * 1. Terima { message, history, sessionId } dari frontend
 * 2. Kirim ke Gemini via sendMessage()
 * 3. Jika Gemini trigger buatJadwalOlahraga:
 *    - Cek apakah user sudah OAuth connected
 *    - Jika ya → auto create Calendar event
 *    - Jika belum → return authUrl
 * 4. Return response ke frontend
 */

import { Router } from 'express';
import { sendMessage } from '../services/gemini.js';
import { isConnected, createEvent, getAuthUrl } from '../services/calendar.js';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const { message, history = [], sessionId = 'default' } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
        }

        // Call Gemini
        const result = await sendMessage(message, history);

        // Build response payload
        const payload = {
            text: result.text,
            updatedHistory: result.updatedHistory,
        };

        // Handle function call: buatJadwalOlahraga
        if (result.functionCall === 'buatJadwalOlahraga' && result.args) {
            const { nama_aktivitas, waktu_pelaksanaan } = result.args;

            payload.scheduledEvent = {
                nama_aktivitas,
                waktu_pelaksanaan,
            };

            // Try auto-create Calendar event if OAuth connected
            if (isConnected(sessionId)) {
                try {
                    const calEvent = await createEvent(sessionId, nama_aktivitas, waktu_pelaksanaan);
                    payload.calendarSaved = true;
                    payload.calendarEvent = calEvent;
                } catch (calErr) {
                    console.error('[Calendar] Error creating event:', calErr.message);
                    payload.calendarSaved = false;
                    payload.calendarError = calErr.message;
                }
            } else {
                // User belum connect Google Calendar
                payload.calendarSaved = false;
                payload.calendarAuthRequired = true;
                payload.authUrl = getAuthUrl(sessionId);
            }
        }

        res.json(payload);
    } catch (err) {
        console.error('[Chat] Error:', err);

        // Specific error for missing API key
        if (err.message?.includes('API key')) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY belum di-set. Cek file .env',
            });
        }

        res.status(500).json({
            error: 'Terjadi kesalahan pada server. Coba lagi nanti.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

export default router;
