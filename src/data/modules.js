/**
 * Module data for HyPrevent.
 * Each module has 4 steps with title, description, image, and bullet-point details.
 *
 * Referensi ambang tekanan darah: lihat src/config/medical.js
 * Gambar: Pexels (lisensi bebas, kredit di halaman Referensi)
 */
import { BP_DIAGNOSIS_THRESHOLD } from '../config/medical.js';

export const modules = [
    {
        id: 'modul-1',
        title: 'Modul 1: Penjelasan Pencegahan Hipertensi',
        subtitle: 'Pelajari dasar-dasar pencegahan hipertensi dan mengapa penting untuk kesehatan jangka panjang Anda.',
        // TODO: ganti dengan video hipertensi dari kanal tepercaya (misal Kemenkes)
        // Video sebelumnya adalah placeholder. Kosongkan sampai ada video relevan.
        videoUrl: '',
        steps: [
            {
                title: 'Memahami Hipertensi',
                description: `Hipertensi atau tekanan darah tinggi adalah kondisi ketika tekanan darah berada pada angka ${BP_DIAGNOSIS_THRESHOLD.label} secara konsisten. ${BP_DIAGNOSIS_THRESHOLD.note}`,
                image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    `Tekanan darah normal: kurang dari 120/80 mmHg`,
                    `Peningkatan (kewaspadaan): 120–139 / kurang dari 90 mmHg — perlu perhatian gaya hidup`,
                    `Hipertensi: ${BP_DIAGNOSIS_THRESHOLD.label} (acuan ${BP_DIAGNOSIS_THRESHOLD.source})`,
                    'Krisis hipertensi: lebih dari 180/120 mmHg — segera ke fasilitas kesehatan',
                ],
            },
            {
                title: 'Pentingnya Pemeriksaan Rutin',
                description: 'Pemeriksaan tekanan darah secara rutin adalah kunci utama dalam deteksi dini hipertensi.',
                image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Periksa tekanan darah minimal setiap 6 bulan sekali.',
                    'Gunakan alat tensi digital di rumah untuk pemantauan harian.',
                    'Catat hasil pengukuran untuk mendeteksi tren perubahan.',
                    `Kunjungi dokter jika tekanan darah konsisten di atas ${BP_DIAGNOSIS_THRESHOLD.label}.`,
                ],
            },
            {
                title: 'Pola Makan Sehat untuk Jantung',
                description: 'Pola makan yang tepat dapat membantu menurunkan dan mengontrol tekanan darah secara alami.',
                image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Kurangi garam — batasi maksimal 5 gram (1 sendok teh) per hari.',
                    'Perbanyak buah, sayur, dan biji-bijian utuh.',
                    'Pilih protein tanpa lemak seperti ikan dan kacang-kacangan.',
                    'Hindari makanan olahan, cepat saji, dan minuman manis.',
                ],
            },
            {
                title: 'Mengelola Stres & Istirahat',
                description: 'Stres kronis dapat meningkatkan tekanan darah. Pelajari cara mengelola stres secara efektif.',
                image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Praktikkan meditasi atau pernapasan dalam selama 10 menit per hari.',
                    'Tidur cukup 7–8 jam setiap malam untuk pemulihan tubuh.',
                    'Luangkan waktu untuk hobi dan aktivitas yang menyenangkan.',
                    'Hindari penggunaan gadget berlebihan sebelum tidur.',
                ],
            },
        ],
    },
    {
        id: 'modul-2',
        title: 'Modul 2: Pantangan dan Tantangan dalam Mencegah Hipertensi',
        subtitle: 'Ketahui hal-hal yang perlu dihindari dan tantangan yang mungkin dihadapi dalam perjalanan pencegahan hipertensi.',
        videoUrl: '',
        steps: [
            {
                title: 'Pantangan Makanan',
                description: 'Hindari makanan-makanan yang dapat meningkatkan tekanan darah.',
                image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Makanan tinggi garam (lebih dari 5 gram per hari)',
                    'Makanan cepat saji dan makanan olahan',
                    'Daging merah dan daging olahan',
                    'Makanan tinggi lemak jenuh dan trans',
                    'Minuman bersoda dan minuman manis',
                    'Kafein berlebihan (lebih dari 3–4 cangkir per hari)',
                ],
            },
            {
                title: 'Kafein, Rokok, dan Alkohol',
                description: 'Kebiasaan merokok dan konsumsi alkohol berlebihan berbahaya bagi pembuluh darah dan tekanan darah.',
                // Sebelumnya: foto pizza + anggur (pexels-1537635) — menormalkan alkohol.
                // Diganti dengan foto yang lebih relevan.
                image: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Batasi kafein maksimal 2 cangkir kopi per hari.',
                    'Merokok merusak dinding pembuluh darah dan mempersempit arteri.',
                    'Alkohol berlebih meningkatkan tekanan darah secara signifikan.',
                    'Ganti kopi dengan teh herbal seperti chamomile atau jahe.',
                ],
            },
            {
                title: 'Makanan Berlemak Jenuh',
                description: 'Lemak jenuh dapat meningkatkan kolesterol dan memengaruhi kesehatan jantung.',
                image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Gorengan, daging berlemak, dan mentega meningkatkan kolesterol.',
                    'Pilih metode masak kukus, rebus, atau panggang.',
                    'Gunakan minyak zaitun atau minyak kelapa sebagai pengganti.',
                    'Konsumsi ikan berlemak (salmon, tuna) untuk asam lemak omega-3.',
                ],
            },
            {
                title: 'Menjaga Konsistensi',
                description: 'Konsistensi adalah kunci keberhasilan dalam mencegah hipertensi jangka panjang.',
                image: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Tantangan terbesar adalah mempertahankan gaya hidup sehat.',
                    'Mulai dari perubahan kecil — satu kebiasaan baru per minggu.',
                    'Catat progres Anda dan rayakan pencapaian kecil.',
                    'Cari partner atau komunitas untuk saling mendukung.',
                ],
            },
        ],
    },
    {
        id: 'modul-3',
        title: 'Modul 3: Olahraga untuk Mencegah Hipertensi',
        subtitle: 'Jenis olahraga efektif dan panduan aman untuk menjaga tekanan darah normal.',
        videoUrl: '',
        steps: [
            {
                title: 'Manfaat Olahraga Teratur',
                description: 'Olahraga teratur terbukti efektif membantu menurunkan tekanan darah.',
                image: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Olahraga teratur dapat membantu menurunkan tekanan sistolik 5–8 mmHg.',
                    'Memperkuat jantung sehingga memompa darah lebih efisien.',
                    'Target: minimal 150 menit aktivitas sedang per minggu.',
                    'Contoh: 30 menit × 5 hari — jalan kaki, bersepeda, berenang.',
                ],
            },
            {
                title: 'Jalan Kaki & Jogging Ringan',
                description: 'Jalan kaki adalah olahraga paling mudah dan aman untuk memulai gaya hidup aktif.',
                image: 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Mulai dengan 10–15 menit, tingkatkan bertahap hingga 30 menit.',
                    'Jalan kaki di pagi atau sore hari untuk suasana yang menyenangkan.',
                    'Gunakan sepatu yang nyaman dan sesuai untuk aktivitas jalan.',
                    'Ajak keluarga atau teman untuk motivasi dan kebersamaan.',
                ],
            },
            {
                title: 'Yoga & Latihan Pernapasan',
                description: 'Yoga menggabungkan gerakan fisik dengan teknik relaksasi yang baik untuk jantung.',
                image: 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Yoga membantu menurunkan tekanan darah melalui relaksasi.',
                    'Teknik pernapasan 4-7-8: tarik 4 detik, tahan 7 detik, buang 8 detik.',
                    'Pose yang direkomendasikan: child pose, cat-cow, shavasana.',
                    'Lakukan 15–20 menit setiap hari untuk hasil optimal.',
                ],
            },
            {
                title: 'Membuat Jadwal Olahraga',
                description: 'Jadwal olahraga yang terstruktur membantu menjadikan aktivitas fisik sebagai kebiasaan.',
                image: 'https://images.pexels.com/photos/4498220/pexels-photo-4498220.jpeg?auto=compress&cs=tinysrgb&w=800',
                imageCredit: 'Pexels',
                details: [
                    'Pilih waktu yang sama setiap hari agar menjadi kebiasaan.',
                    'Variasikan jenis olahraga agar tidak bosan.',
                    'Catat aktivitas fisik harian dalam jurnal atau aplikasi.',
                    'Lebih baik sedikit tapi rutin daripada banyak tapi jarang.',
                ],
            },
        ],
    },
];
