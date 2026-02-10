const CACHE = "frc-scout-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./db.js",
  "./render.js",
  "./qr.js",
  "./export.js",
  "./manifest.json",
  "./config/2026.json",
  "./libs/idb.min.js",
  "./libs/qrcode.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
