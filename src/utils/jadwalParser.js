/**
 * jadwalParser.js
 * ───────────────
 * NLP parser ringan untuk memahami teks jadwal olahraga dalam Bahasa Indonesia.
 *
 * Didukung:
 *   - Hari relatif:  "hari ini", "besok", "lusa"
 *   - Relatif lain:  "3 hari lagi", "minggu depan", "bulan depan"
 *   - Nama hari:     "hari senin", "selasa"
 *   - Hari + bulan:  "hari selasa bulan desember", "senin januari"
 *   - Tanggal:       "tanggal 5", "tanggal 5 april", "5 april 2026"
 *   - Waktu:         "jam 6", "jam 6 pagi", "jam 20.00", "jam 5 sore", "pukul 17:30"
 *   - Durasi:        "selama 30 menit", "1 jam", "1 jam 30 menit"
 *   - 50+ aktivitas: "jalan santai", "gym", "yoga", "lari", dll.
 *
 * Contoh edge-case yang sekarang ditangani:
 *   "gym jam 20.00 pada hari selasa bulan desember"
 *   "lari senin januari jam 5 sore"
 *   "yoga 3 hari lagi jam 7 pagi"
 *   "senam minggu depan hari rabu"
 */

// ─── Konstanta ───

const HARI_MAP = {
    minggu: 0, ahad: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5, "jum'at": 5, jumaat: 5,
    sabtu: 6,
};

const BULAN_MAP = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agu: 7, ags: 7,
    september: 8, sep: 8, sept: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10, nop: 10,
    desember: 11, des: 11,
};

// Aktivitas olahraga umum (diurutkan dari frase terpanjang agar greedy match benar)
const AKTIVITAS_LIST = [
    'jalan santai', 'jalan pagi', 'jalan sore', 'jalan kaki', 'jalan cepat',
    'lari santai', 'lari pagi', 'lari sore',
    'lari', 'jogging', 'joging',
    'senam aerobik', 'senam pagi', 'senam lantai', 'senam yoga', 'senam',
    'yoga', 'pilates', 'meditasi',
    'bersepeda', 'sepeda', 'gowes', 'cycling',
    'renang', 'berenang', 'swimming',
    'push up', 'push-up', 'pushup',
    'sit up', 'sit-up', 'situp',
    'pull up', 'pull-up', 'pullup',
    'plank', 'stretching', 'peregangan',
    'angkat beban', 'gym', 'fitnes', 'fitness',
    'badminton', 'bulu tangkis', 'bulutangkis',
    'basket', 'basketball',
    'futsal', 'sepak bola', 'sepakbola',
    'voli', 'volley', 'voly',
    'tenis', 'tennis', 'tenis meja',
    'skipping', 'lompat tali',
    'zumba', 'aerobik',
    'tai chi', 'taichi',
    'olahraga', 'latihan', 'workout', 'exercise',
    'kardio', 'cardio',
];

// ─── Helper: Cari nama bulan di teks ───

function detectBulan(text) {
    const lower = text.toLowerCase();
    // Cari pola "bulan [nama]" atau standalone nama bulan
    for (const [nama, idx] of Object.entries(BULAN_MAP)) {
        // Prioritas: "bulan desember" > standalone "desember"
        const regexWithPrefix = new RegExp(`(?:bulan|bln|bl)\\s+${nama}\\b`, 'i');
        if (regexWithPrefix.test(lower)) {
            return idx;
        }
    }
    // Fallback: standalone bulan name (hanya bulan panjang untuk menghindari false positive)
    const longMonths = [
        'januari', 'februari', 'maret', 'april', 'juni', 'juli',
        'agustus', 'september', 'oktober', 'november', 'desember',
    ];
    for (const nama of longMonths) {
        const regex = new RegExp(`\\b${nama}\\b`, 'i');
        if (regex.test(lower)) {
            return BULAN_MAP[nama];
        }
    }
    return null;
}

// ─── Helper: Cari nama hari di teks ───

function detectHari(text) {
    const lower = text.toLowerCase();
    for (const [nama, dayIndex] of Object.entries(HARI_MAP)) {
        const regex = new RegExp(`(?:hari\\s+)?\\b${nama}\\b`, 'i');
        if (regex.test(lower)) {
            return dayIndex;
        }
    }
    return null;
}

// ─── Cari hari pertama dengan nama hari tertentu di bulan tertentu ───

function findDayInMonth(dayOfWeek, monthIndex, refDate) {
    const today = refDate || new Date();
    let year = today.getFullYear();

    // Jika bulan sudah lewat tahun ini, pakai tahun depan
    if (monthIndex < today.getMonth()) {
        year += 1;
    }

    // Cari hari pertama yang cocok di bulan tersebut
    const firstOfMonth = new Date(year, monthIndex, 1);
    let diff = dayOfWeek - firstOfMonth.getDay();
    if (diff < 0) diff += 7;
    const target = new Date(year, monthIndex, 1 + diff);

    // Jika bulan sama dengan bulan sekarang tapi tanggal sudah lewat,
    // cari yang berikutnya di bulan yang sama
    if (monthIndex === today.getMonth() && year === today.getFullYear() && target < today) {
        target.setDate(target.getDate() + 7);
        // Jika keluar dari bulan, pindah ke tahun depan
        if (target.getMonth() !== monthIndex) {
            return findDayInMonth(dayOfWeek, monthIndex, new Date(year + 1, 0, 1));
        }
    }

    return target;
}

// ─── Parser Functions ───

/**
 * Cari hari relatif: hari ini, besok, lusa, X hari lagi
 */
function parseHariRelatif(text) {
    const today = new Date();

    if (/\bhari\s*ini\b/i.test(text) || /\bsore\s+ini\b/i.test(text) || /\bmalam\s+ini\b/i.test(text)) {
        return new Date(today);
    }
    if (/\bbesok\b/i.test(text) || /\bbesuk\b/i.test(text)) {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return d;
    }
    if (/\blusa\b/i.test(text)) {
        const d = new Date(today);
        d.setDate(d.getDate() + 2);
        return d;
    }

    // "3 hari lagi", "5 hari kedepan"
    const daysAheadMatch = text.match(/(\d+)\s*hari\s*(?:lagi|kedepan|ke\s*depan)/i);
    if (daysAheadMatch) {
        const d = new Date(today);
        d.setDate(d.getDate() + parseInt(daysAheadMatch[1], 10));
        return d;
    }

    // "minggu depan" (tanpa nama hari spesifik = senin depan)
    if (/\bminggu\s+depan\b/i.test(text) && !detectHari(text.replace(/minggu\s+depan/i, ''))) {
        const d = new Date(today);
        const daysUntilMonday = (1 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + daysUntilMonday);
        return d;
    }

    return null;
}

/**
 * Cari tanggal eksplisit: "tanggal 5", "tanggal 5 april", "5 april 2026"
 */
function parseTanggalEksplisit(text) {
    const lower = text.toLowerCase();
    const today = new Date();

    const patterns = [
        // tanggal 5 april 2026
        /(?:tanggal\s+)?(\d{1,2})\s+([a-z]+)\s+(\d{4})/i,
        // tanggal 5 april | 5 april
        /(?:tanggal\s+)?(\d{1,2})\s+([a-z]+)/i,
        // tanggal 5
        /tanggal\s+(\d{1,2})/i,
    ];

    for (const pattern of patterns) {
        const match = lower.match(pattern);
        if (match) {
            const day = parseInt(match[1], 10);
            if (day < 1 || day > 31) continue;

            let month = today.getMonth();
            let year = today.getFullYear();

            if (match[2]) {
                const bulanStr = match[2].toLowerCase();
                if (BULAN_MAP[bulanStr] !== undefined) {
                    month = BULAN_MAP[bulanStr];
                } else {
                    continue; // bukan nama bulan valid
                }
            }

            if (match[3]) {
                year = parseInt(match[3], 10);
            }

            const d = new Date(year, month, day);

            // Jika tanggal sudah lewat dan tidak ada tahun eksplisit, maju ke bulan/tahun depan
            if (!match[3] && d < today) {
                if (match[2]) {
                    d.setFullYear(d.getFullYear() + 1);
                } else {
                    d.setMonth(d.getMonth() + 1);
                }
            }

            return d;
        }
    }
    return null;
}

/**
 * Cari nama hari saja (tanpa bulan): senin, selasa, dst. → tanggal berikutnya
 */
function parseNamaHariSaja(text) {
    const today = new Date();
    const todayDay = today.getDay();
    const hariIdx = detectHari(text);

    if (hariIdx === null) return null;

    let diff = hariIdx - todayDay;
    if (diff <= 0) diff += 7;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return d;
}

/**
 * SMART: Cari kombinasi nama hari + bulan
 *   "hari selasa bulan desember" → Selasa pertama di Desember (yang belum lewat)
 *   "senin januari" → Senin pertama di Januari
 */
function parseHariDanBulan(text) {
    const hariIdx = detectHari(text);
    const bulanIdx = detectBulan(text);

    if (hariIdx !== null && bulanIdx !== null) {
        return findDayInMonth(hariIdx, bulanIdx);
    }

    return null;
}

/**
 * SMART: Cari bulan saja (tanpa nama hari, tanpa tanggal) → tanggal 1 bulan itu
 *   "bulan desember" → 1 Desember (jika tidak ada info hari/tanggal lain)
 */
function parseBulanSaja(text) {
    const bulanIdx = detectBulan(text);
    if (bulanIdx === null) return null;

    // Jangan pakai ini jika ada nama hari atau tanggal eksplisit
    if (detectHari(text) !== null) return null;
    if (/tanggal\s+\d/i.test(text)) return null;
    if (/\d{1,2}\s+[a-z]+/i.test(text)) return null;

    const today = new Date();
    let year = today.getFullYear();
    if (bulanIdx < today.getMonth() || (bulanIdx === today.getMonth() && today.getDate() > 1)) {
        year += 1;
    }
    return new Date(year, bulanIdx, 1);
}

/**
 * Parse tanggal dari teks — SMART strategy dengan prioritas:
 * 1. Hari relatif  (besok, lusa, 3 hari lagi)
 * 2. Tanggal eksplisit (tanggal 5 april)
 * 3. Hari + Bulan   (selasa desember) ← BARU
 * 4. Hari saja      (hari selasa → selasa terdekat)
 * 5. Bulan saja     (bulan desember → 1 Des)
 */
function parseTanggal(text) {
    return (
        parseHariRelatif(text) ||
        parseTanggalEksplisit(text) ||
        parseHariDanBulan(text) ||     // ← prioritas lebih tinggi dari hari saja
        parseNamaHariSaja(text) ||
        parseBulanSaja(text)
    );
}

/**
 * Parse waktu/jam: "jam 6", "jam 6 pagi", "jam 17", "jam 5 sore",
 *                  "jam 05:30", "jam 6.30 pagi", "pukul 06:00", "20.00"
 */
function parseWaktu(text) {
    const lower = text.toLowerCase();

    // Pattern: jam/pukul HH:MM atau HH.MM (dengan opsional pagi/siang/sore/malam)
    const patternFull = /(?:jam|pukul)\s+(\d{1,2})[:\.](\d{2})\s*(pagi|siang|sore|malam)?/i;
    const matchFull = lower.match(patternFull);
    if (matchFull) {
        let hour = parseInt(matchFull[1], 10);
        const minute = parseInt(matchFull[2], 10);
        hour = adjustMeridiem(hour, matchFull[3]);
        if (isValidTime(hour, minute)) return { hour, minute };
    }

    // Pattern: jam/pukul HH (tanpa menit) + opsional pagi/sore
    const patternSimple = /(?:jam|pukul)\s+(\d{1,2})\s*(pagi|siang|sore|malam)?/i;
    const matchSimple = lower.match(patternSimple);
    if (matchSimple) {
        let hour = parseInt(matchSimple[1], 10);
        hour = adjustMeridiem(hour, matchSimple[2]);
        if (isValidTime(hour, 0)) return { hour, minute: 0 };
    }

    // Fallback: standalone HH:MM atau HH.MM
    const patternStandalone = /\b(\d{1,2})[:\.](\d{2})\s*(pagi|siang|sore|malam)?/i;
    const matchStandalone = lower.match(patternStandalone);
    if (matchStandalone) {
        let hour = parseInt(matchStandalone[1], 10);
        const minute = parseInt(matchStandalone[2], 10);
        hour = adjustMeridiem(hour, matchStandalone[3]);
        if (isValidTime(hour, minute)) return { hour, minute };
    }

    return null;
}

function isValidTime(h, m) {
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/**
 * Sesuaikan jam dengan pagi/siang/sore/malam
 */
function adjustMeridiem(hour, period) {
    if (!period) return hour;
    const p = period.toLowerCase();
    if (p === 'pagi') {
        return hour === 12 ? 0 : hour;
    }
    if (p === 'siang') {
        return hour === 12 ? 12 : (hour < 12 ? hour + 12 : hour);
    }
    if (p === 'sore') {
        return hour === 12 ? 12 : (hour < 12 ? hour + 12 : hour);
    }
    if (p === 'malam') {
        return hour === 12 ? 0 : (hour < 12 ? hour + 12 : hour);
    }
    return hour;
}

/**
 * Parse durasi: "selama 30 menit", "selama 1 jam", "selama 1.5 jam",
 *               "30 menit", "1 jam 30 menit"
 */
function parseDurasi(text) {
    const lower = text.toLowerCase();

    // X jam Y menit
    const patternJamMenit = /(\d+(?:[.,]\d+)?)\s*jam\s+(\d+)\s*menit/i;
    const matchJM = lower.match(patternJamMenit);
    if (matchJM) {
        const hours = parseFloat(matchJM[1].replace(',', '.'));
        const mins = parseInt(matchJM[2], 10);
        return Math.round(hours * 60 + mins);
    }

    // X jam (tapi jangan match "jam 20" yang merupakan waktu)
    const patternJam = /(?:selama\s+)(\d+(?:[.,]\d+)?)\s*jam/i;
    const matchJ = lower.match(patternJam);
    if (matchJ) {
        const hours = parseFloat(matchJ[1].replace(',', '.'));
        return Math.round(hours * 60);
    }

    // Standalone "X jam" tanpa "selama" — hanya jika ada angka desimal atau > 0
    const patternJamAlt = /\b(\d+(?:[.,]\d+))\s*jam\b/i; // requires decimal → durasi
    const matchJAlt = lower.match(patternJamAlt);
    if (matchJAlt) {
        const hours = parseFloat(matchJAlt[1].replace(',', '.'));
        return Math.round(hours * 60);
    }

    // "1 jam" standalone tanpa "selama" — hanya jika diawali angka >0 dan bukan waktu
    const patternJamSimple = /(?<!\bpukul\s)(?<!\bjam\s)\b(\d+)\s*jam\b/i;
    const matchJS = lower.match(patternJamSimple);
    if (matchJS) {
        const val = parseInt(matchJS[1], 10);
        if (val > 0 && val <= 12) return val * 60; // masuk akal sebagai durasi
    }

    // X menit
    const patternMenit = /(?:selama\s+)?(\d+)\s*menit/i;
    const matchM = lower.match(patternMenit);
    if (matchM) {
        return parseInt(matchM[1], 10);
    }

    return null;
}

/**
 * Deteksi jenis aktivitas dari teks
 */
function parseAktivitas(text) {
    const lower = text.toLowerCase();

    for (const aktivitas of AKTIVITAS_LIST) {
        if (lower.includes(aktivitas)) {
            return aktivitas
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
    }

    // Fallback: coba ambil kata setelah "untuk" / "mau" / "ingin"
    const fallbackMatch = lower.match(
        /(?:untuk|mau|ingin|rencana|jadwal)\s+(.+?)(?:\s+(?:besok|lusa|hari|tanggal|jam|pukul|selama|pada|bulan))/i
    );
    if (fallbackMatch) {
        const raw = fallbackMatch[1].trim();
        if (raw.length > 1 && raw.length < 40) {
            return raw.charAt(0).toUpperCase() + raw.slice(1);
        }
    }

    return null;
}

// ─── Format Helpers ───

function toICSDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function toDisplayDate(date) {
    const hariNama = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const bulanNama = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${hariNama[date.getDay()]}, ${date.getDate()} ${bulanNama[date.getMonth()]} ${date.getFullYear()}`;
}

function toDisplayTime(hour, minute) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hour)}:${pad(minute)}`;
}

// ─── Main Parser ───

/**
 * parseJadwal — Entry point utama.
 *
 * @param {string} text - Teks input user dalam Bahasa Indonesia
 * @returns {object} Parsed schedule result
 */
export function parseJadwal(text) {
    const errors = [];

    // 1. Parse aktivitas
    let aktivitas = parseAktivitas(text);
    if (!aktivitas) {
        aktivitas = 'Olahraga';
        errors.push('aktivitas');
    }

    // 2. Parse tanggal (SMART: gabungkan hari + bulan jika keduanya ada)
    let tanggal = parseTanggal(text);
    if (!tanggal) {
        tanggal = new Date();
        tanggal.setDate(tanggal.getDate() + 1);
        errors.push('tanggal');
    }

    // 3. Parse waktu
    let waktu = parseWaktu(text);
    if (!waktu) {
        waktu = { hour: 6, minute: 0 };
        errors.push('waktu');
    }

    // 4. Parse durasi
    let durasiMenit = parseDurasi(text);
    if (!durasiMenit) {
        durasiMenit = 30;
        errors.push('durasi');
    }

    // 5. Build Date objects
    const startDate = new Date(tanggal);
    startDate.setHours(waktu.hour, waktu.minute, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durasiMenit);

    // 6. Format display & ICS
    const durasiDisplay = durasiMenit >= 60
        ? `${Math.floor(durasiMenit / 60)} jam${durasiMenit % 60 > 0 ? ` ${durasiMenit % 60} menit` : ''}`
        : `${durasiMenit} menit`;

    return {
        success: errors.length <= 1,
        aktivitas,
        tanggal,
        waktu,
        durasiMenit,
        startDate,
        endDate,
        display: {
            tanggal: toDisplayDate(startDate),
            waktu: `${toDisplayTime(waktu.hour, waktu.minute)} — ${toDisplayTime(endDate.getHours(), endDate.getMinutes())} WIB`,
            durasi: durasiDisplay,
            aktivitas,
        },
        ics: {
            start: toICSDate(startDate),
            end: toICSDate(endDate),
        },
        errors,
    };
}
