/**
 * server/services/calendar.js
 * ───────────────────────────
 * Google Calendar API — OAuth2 flow + event creation.
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, '../.token-store.json');

// ─── OAuth2 Client ───

function createOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

// ─── Token store: in-memory Map backed by file ───
// Map is the source of truth (sync reads). File persists across server restarts.
let tokenStore = new Map();

async function _loadTokens() {
    try {
        const raw = await readFile(TOKEN_FILE, 'utf8');
        const obj = JSON.parse(raw);
        tokenStore = new Map(Object.entries(obj));
    } catch {
        // File missing or corrupt — start fresh
        tokenStore = new Map();
    }
}

async function _saveTokens() {
    try {
        const obj = Object.fromEntries(tokenStore);
        await writeFile(TOKEN_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
        console.warn('[TokenStore] Failed to persist tokens:', e.message);
    }
}

// Load on startup (non-blocking; if it fails, Map starts empty)
_loadTokens();

/**
 * getAuthUrl — Generate Google OAuth2 consent URL.
 * @param {string} sessionId - User session identifier
 * @returns {string} OAuth consent URL
 */
export function getAuthUrl(sessionId) {
    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar'],
        state: sessionId, // pass session back via state param
    });
}

/**
 * handleCallback — Exchange auth code for tokens, store them.
 * @param {string} code - Authorization code from Google
 * @param {string} sessionId - User session identifier
 * @returns {object} Token info
 */
export async function handleCallback(code, sessionId) {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    tokenStore.set(sessionId, tokens);
    await _saveTokens(); // persist to file
    return tokens;
}

/**
 * isConnected — Check if user has stored tokens.
 * @param {string} sessionId
 * @returns {boolean}
 */
export function isConnected(sessionId) {
    return tokenStore.has(sessionId);
}


/**
 * createEvent — Create Google Calendar event.
 * @param {string} sessionId - User session identifier
 * @param {string} namaAktivitas - Activity name
 * @param {string} waktuPelaksanaan - ISO-ish datetime string "YYYY-MM-DD HH:mm:ss"
 * @returns {object} Created event data
 */
export async function createEvent(sessionId, namaAktivitas, waktuPelaksanaan) {
    const tokens = tokenStore.get(sessionId);
    if (!tokens) {
        throw new Error('User not authenticated with Google Calendar');
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Refresh token jika expired
    oauth2Client.on('tokens', (newTokens) => {
        const existing = tokenStore.get(sessionId);
        tokenStore.set(sessionId, { ...existing, ...newTokens });
        _saveTokens(); // persist refreshed token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse waktu — format: "YYYY-MM-DD HH:mm:ss" atau ISO
    const startDate = new Date(waktuPelaksanaan.replace(' ', 'T'));
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // default 1 jam

    const event = {
        summary: namaAktivitas,
        description: `Jadwal latihan dari HyPrevent AI Assistant.\nAktivitas: ${namaAktivitas}`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Asia/Jakarta',
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Asia/Jakarta',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 30 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
    });

    return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        summary: response.data.summary,
        start: response.data.start,
        end: response.data.end,
    };
}
