/**
 * server/index.js
 * ───────────────
 * Express server untuk HyPrevent backend.
 * Port 3001 (Vite dev di 5173 dengan proxy /api → 3001).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import calendarRoutes from './routes/calendar.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ─── Routes ───

app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);

// ─── Health check ───

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here',
        calendarConfigured: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_oauth_client_id',
    });
});

// ─── Start ───

if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
    app.listen(PORT, () => {
        console.log(`\n🚀 HyPrevent API server running on http://localhost:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health`);

        // Validate env
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.warn('   ⚠️  GEMINI_API_KEY belum di-set! Chat tidak akan berfungsi.');
        }
        if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_oauth_client_id') {
            console.warn('   ⚠️  GOOGLE_CLIENT_ID belum di-set! Calendar OAuth tidak akan berfungsi.');
        }

        console.log('');
    });
}

export default app;
