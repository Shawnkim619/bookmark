// 책갈피 service worker
// 앱 파일은 "인터넷 먼저, 안 되면 저장본" 방식이라 새 버전을 올리면 다음에 열 때 바로 반영됩니다.
const CACHE = "bookmark-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Firebase 라이브러리: 버전이 주소에 들어 있어서 한 번 받으면 계속 재사용
  if (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // 앱 파일: 인터넷 먼저, 실패하면 저장본
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
  }
  // 카카오 검색, 로그인, 데이터베이스 요청은 건드리지 않음
});
