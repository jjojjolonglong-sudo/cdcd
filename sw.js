/* =========================================================
 * CDCD 서비스 워커
 *  - 앱 껍데기(index.html, 아이콘 등)만 캐시해서 설치/오프라인 실행을 지원
 *  - 같은 사이트의 파일은 "네트워크 우선, 실패하면 캐시" → GitHub 에 새 버전을 올리면 바로 반영됨
 *  - Supabase / YouTube / CDN 같은 외부 요청은 건드리지 않고 그대로 통과 (음악/데이터는 항상 최신)
 * ========================================================= */
const CACHE = "cdcd-v1";   // 캐시 목록(SHELL)을 바꿨을 때만 숫자를 올리세요
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;   // 외부 요청은 통과

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
