/**
 * src/config/medical.js
 * ─────────────────────
 * Konstanta medis terpusat untuk HyPrevent.
 * Semua ambang, klasifikasi, dan klaim angka HARUS berasal dari file ini.
 *
 * STATUS: TODO_VERIFIKASI — pemilik harus mencocokkan dengan dokumen sumber
 * sebelum diterbitkan sebagai fakta ke pengguna.
 */

// ─── Ambang Tekanan Darah ───
// Acuan utama: Kemenkes RI / PERHI / WHO
// Acuan tambahan: AHA/ACC 2017 (untuk ambang kewaspadaan)

export const BP_THRESHOLDS = {
    normal: {
        label: 'Normal',
        sistolik: '< 120',
        diastolik: '< 80',
        description: 'Tekanan darah dalam batas normal.',
    },
    elevated: {
        label: 'Peningkatan (Kewaspadaan)',
        sistolik: '120–139',
        diastolik: '< 90',
        description: 'Tekanan darah mulai meningkat. Perlu perhatian gaya hidup.',
        // TODO_VERIFIKASI: rentang ini menggabungkan "elevated" AHA (120-129)
        // dan awal Stage 1 AHA (130-139). Sesuaikan dengan pedoman yang dipilih.
    },
    hypertension: {
        label: 'Hipertensi',
        sistolik: '≥ 140',
        diastolik: '≥ 90',
        description: 'Tekanan darah tinggi. Disarankan berkonsultasi dengan dokter.',
        refId: 'kemenkes-hipertensi',
        // TODO_VERIFIKASI: pastikan angka ini cocok dengan pedoman Kemenkes/PERHI terbaru.
    },
    crisis: {
        label: 'Krisis Hipertensi',
        sistolik: '> 180',
        diastolik: '> 120',
        description: 'Kondisi darurat. Segera ke fasilitas kesehatan.',
    },
};

// Ambang diagnosis utama yang dipakai di seluruh situs
export const BP_DIAGNOSIS_THRESHOLD = {
    sistolik: 140,
    diastolik: 90,
    label: '≥ 140/90 mmHg',
    source: 'Kemenkes RI / PERHI / WHO',
    note: 'Beberapa pedoman internasional (AHA/ACC 2017) memakai ambang ≥ 130/80 mmHg. HyPrevent memakai ≥ 140/90 mmHg sesuai acuan Kemenkes/PERHI/WHO.',
    // TODO_VERIFIKASI: konfirmasi edisi terbaru pedoman PERHI.
};

// ─── Asupan Garam ───
export const SALT_LIMIT = {
    maxGramPerDay: 5,
    maxSodiumMgPerDay: 2000,
    source: 'WHO',
    label: '< 5 gram garam per hari (± 2.000 mg natrium)',
    // TODO_VERIFIKASI: pastikan angka sesuai WHO guideline terbaru.
};

// ─── Aktivitas Fisik ───
export const EXERCISE_RECOMMENDATION = {
    minutesPerWeek: 150,
    label: 'Minimal 150 menit aktivitas fisik intensitas sedang per minggu',
    source: 'WHO',
    // TODO_VERIFIKASI: pastikan sesuai WHO guidelines on physical activity 2020.
};

// ─── Disclaimer Medis ───
export const MEDICAL_DISCLAIMER =
    'Informasi ini untuk edukasi, bukan pengganti pemeriksaan atau saran dokter. ' +
    'Jika Anda sedang sakit, memiliki penyakit jantung/ginjal, sedang hamil, atau ragu, ' +
    'konsultasikan dulu ke tenaga kesehatan.';

export const EMERGENCY_DISCLAIMER =
    'Jika Anda mengalami nyeri dada, sesak napas, kelemahan/kebas sebelah badan, ' +
    'bicara pelo, sakit kepala hebat mendadak, atau pingsan — segera hubungi 119 ' +
    'atau ke IGD terdekat. Jangan menunggu.';

// ─── Kata Kunci Darurat (untuk deteksi di chat dan skrining) ───
export const EMERGENCY_KEYWORDS = [
    'nyeri dada',
    'sesak napas',
    'sesak nafas',
    'lemah sebelah',
    'kebas sebelah',
    'lumpuh',
    'bicara pelo',
    'cadel mendadak',
    'sakit kepala hebat',
    'pingsan',
    'tidak sadarkan diri',
    'pandangan kabur mendadak',
];

// ─── Label Intensitas Gerakan ───
export const EXERCISE_INTENSITY = {
    ringan: {
        label: 'Ringan',
        color: '#16a34a', // green
        description: 'Cocok untuk pemula dan semua usia.',
    },
    sedang: {
        label: 'Sedang',
        color: '#d97706', // amber
        description: 'Perlu pemanasan terlebih dahulu.',
    },
    berat: {
        label: 'Berat',
        color: '#dc2626', // red
        description: 'Intensitas tinggi. Tidak disarankan bagi yang belum terbiasa atau memiliki tekanan darah tinggi tanpa persetujuan dokter.',
    },
};

// Mapping intensitas per gerakan
export const EXERCISE_INTENSITY_MAP = {
    'push-up': 'sedang',
    'squat': 'sedang',
    'lunge': 'sedang',
    'plank': 'sedang',
    'jumping-jack': 'berat',
    'sit-up': 'sedang',
    'burpee': 'berat',
    'jalan-cepat': 'ringan',
};
