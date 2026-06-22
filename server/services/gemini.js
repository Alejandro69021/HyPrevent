/**
 * server/services/gemini.js
 * ─────────────────────────
 * Gemini AI SDK wrapper — function calling + chat untuk HyPrevent Assistant.
 *
 * Pakai @google/genai (SDK terbaru, bukan legacy @google/generative-ai).
 */

import { GoogleGenAI } from '@google/genai';

// ─── Init SDK ───

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── System Instruction (dari AI Studio user) ───

const SYSTEM_INSTRUCTION = `Peran: Kamu adalah HyPrevent Assistant, seorang ahli promosi kesehatan digital yang berfokus pada pencegahan hipertensi menggunakan metode aktivitas fisik dan latihan beban (resistance training).

Tujuan: Membantu pengguna memahami hipertensi, memberikan tips pencegahan, menyusun rencana olahraga beban ringan hingga sedang yang aman bagi tensi, dan memotivasi mereka untuk konsisten bergerak.

Batasan (Guardrails):

Gunakan istilah yang mudah dipahami orang awam (hindari jargon medis yang terlalu rumit tanpa penjelasan).

Jika pengguna mengeluhkan gejala darurat (pusing hebat, nyeri dada, pandangan kabur), segera instruksikan mereka untuk pergi ke fasilitas kesehatan terdekat.

Tetap konsisten pada topik kesehatan; jika ditanyakan soal politik, coding, atau hal lain, belokkan kembali pembicaraan ke arah gaya hidup sehat secara halus.

Gaya Komunikasi:
- Panggil diri kamu "Aku" dan pengguna dengan "Kamu" atau "Kak" (sesuaikan secara alami).
- Gunakan bahasa Indonesia yang santai, modern, dan suportif (boleh pakai kata seperti "Yuk", "Wah", "Keren banget!", "Tenang aja").
- Jangan kaku seperti robot. Gunakan analogi sederhana kalau menjelaskan istilah medis (misal: "pembuluh darah itu ibarat selang air...").

Aturan Main:
1. Selalu berikan semangat dan validasi setiap kali pengguna berhasil olahraga atau menjaga tensinya.
2. Fokus pada pencegahan lewat aktivitas fisik dan gaya hidup sehat.
3. JANGAN memberikan resep obat. Kalau ditanya soal obat-obatan keras, bilang dengan halus: "Kalau soal obat penurun tensi, mending langsung diobrolin sama dokter ya, Kak. Aku di sini siap bantu jaga pola olahraga kamu aja!"`;

// ─── Function Declaration ───

const TOOLS = [
    {
        functionDeclarations: [
            {
                name: 'buatJadwalOlahraga',
                description:
                    'Gunakan fungsi ini jika pengguna secara eksplisit atau implisit meminta untuk mencatat, menjadwalkan, atau mengingatkan rencana olahraga beban/aktivitas fisik mereka. Jenis latihan yang mau dilakukan pengguna. Contoh: Latihan Bisep, Upper Body, Jalan Kaki.  Tanggal dan jam latihan dalam format ISO. Jika pengguna cuma bilang "besok sore", konversikan ke waktu yang logis.',
                parameters: {
                    type: 'object',
                    properties: {
                        nama_aktivitas: {
                            type: 'string',
                            description: 'Nama aktivitas/latihan yang akan dilakukan',
                        },
                        waktu_pelaksanaan: {
                            type: 'string',
                            description: 'Tanggal dan jam latihan dalam format "YYYY-MM-DD HH:mm:ss"',
                        },
                    },
                    required: ['nama_aktivitas', 'waktu_pelaksanaan'],
                },
            },
        ],
    },
];

// ─── Config ───

const MODEL = 'gemini-3-flash-preview';

/**
 * sendMessage — Kirim pesan ke Gemini, handle function calling loop.
 *
 * @param {string} userMessage - Pesan teks dari user
 * @param {Array} chatHistory - Array of { role, parts } sebelumnya
 * @returns {object} { text, functionCall, args, updatedHistory }
 */
export async function sendMessage(userMessage, chatHistory = []) {
    // Build contents array: history + new user message
    const contents = [
        ...chatHistory,
        {
            role: 'user',
            parts: [{ text: userMessage }],
        },
    ];

    // First call to Gemini
    const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
            tools: TOOLS,
            systemInstruction: SYSTEM_INSTRUCTION,
            thinkingConfig: {
                thinkingLevel: 'HIGH',
            },
        },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
        return {
            text: 'Maaf, aku tidak bisa merespons saat ini. Coba lagi ya, Kak!',
            functionCall: null,
            args: null,
            updatedHistory: contents,
        };
    }

    const parts = candidate.content.parts;

    // Check for function call in response
    const fcPart = parts.find((p) => p.functionCall);

    if (fcPart) {
        const { name, args } = fcPart.functionCall;

        if (name === 'buatJadwalOlahraga') {
            // Add model response (with function call) to history
            const historyWithModelFC = [
                ...contents,
                {
                    role: 'model',
                    parts: candidate.content.parts,
                },
            ];

            // Send function result back to Gemini to get final text
            const functionResultContents = [
                ...historyWithModelFC,
                {
                    role: 'user',
                    parts: [
                        {
                            functionResponse: {
                                name: 'buatJadwalOlahraga',
                                response: {
                                    status: 'success',
                                    message: `Jadwal "${args.nama_aktivitas}" pada ${args.waktu_pelaksanaan} berhasil dibuat.`,
                                },
                            },
                        },
                    ],
                },
            ];

            const followUp = await ai.models.generateContent({
                model: MODEL,
                contents: functionResultContents,
                config: {
                    tools: TOOLS,
                    systemInstruction: SYSTEM_INSTRUCTION,
                    thinkingConfig: {
                        thinkingLevel: 'HIGH',
                    },
                },
            });

            const followUpText =
                followUp.candidates?.[0]?.content?.parts
                    ?.filter((p) => p.text)
                    .map((p) => p.text)
                    .join('') || 'Jadwal berhasil dibuat! 💪';

            // Build final history
            const finalHistory = [
                ...functionResultContents,
                {
                    role: 'model',
                    parts: [{ text: followUpText }],
                },
            ];

            return {
                text: followUpText,
                functionCall: name,
                args,
                updatedHistory: finalHistory,
            };
        }
    }

    // No function call — plain text response
    const textParts = parts.filter((p) => p.text).map((p) => p.text);
    const responseText = textParts.join('') || 'Hmm, aku tidak yakin bagaimana menjawabnya. Coba tanya lagi, Kak!';

    const updatedHistory = [
        ...contents,
        {
            role: 'model',
            parts: [{ text: responseText }],
        },
    ];

    return {
        text: responseText,
        functionCall: null,
        args: null,
        updatedHistory,
    };
}
