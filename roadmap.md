# Roadmap

- [x] Skema content_performance + view: sudah ada di database eksternal, tidak diubah
- [x] Sidebar: menu "Performa Konten" sudah ada di MARKETING setelah Content Planner
- [x] Halaman /content-performance: Tab Dashboard Pola (insight otomatis, 4 grafik recharts, konten terbaik, filter tanggal+platform)
- [x] Tab Catatan: kartu kuning menunggu dicatat, tabel + search/filter, menu titik-tiga Edit/Arsipkan, modal input 4 langkah
- [x] Dashboard utama: kartu "Konten belum dicatat: N" (PerformanceReminderCard, tersembunyi jika 0)
- [x] Verifikasi: typecheck bersih, build OK, route aktif (redirect login sesuai auth gate)

## Catatan terbuka (menunggu user)
- Jika data tidak muncul setelah login: kemungkinan GRANT ke role `authenticated` belum ada di database eksternal — user perlu menjalankan SQL GRANT di SQL editor Supabase mereka.
