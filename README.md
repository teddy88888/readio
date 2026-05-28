# Readio

Platform audiobook berbahasa Indonesia dengan katalog, membership kredit, perpustakaan, pemutar cuplikan, dan pembayaran QRIS demo.

## Jalankan lokal

```bash
npm.cmd start
```

Buka:

```text
http://127.0.0.1:4173
```

## Cek proyek

```bash
npm.cmd run check
```

## Deploy Vercel

Project ini siap untuk Vercel:

- Frontend statis ada di root project.
- Route `/api/*` diarahkan ke `api/index.js` melalui `vercel.json`.
- `server.js` hanya untuk menjalankan lokal, bukan production command di Vercel.

QRIS pada project ini masih demo. Untuk pembayaran nyata, sambungkan endpoint pembayaran ke payment gateway/acquirer QRIS Indonesia.
