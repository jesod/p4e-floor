/* P4E Floor — service worker
   The point: RIM Park with 3000 people inside has terrible signal.
   The app still has to open. */
const VERSION = "p4e-v2";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-rt`;

// Screens that must be there even with no data connection.
const PRECACHE = ["/", "/route", "/floor", "/profile", "/sources", "/manifest.webmanifest",
                  "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(SHELL)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Next assets are hashed: once cached, never fetched again.
  if (url.pathname.startsWith("/_next/static/")) {
    ev.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Everything else: network first (so an updated list arrives), with the
  // cached copy as the safety net when there is no signal.
  ev.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === "navigate" ? caches.match("/") : undefined)
        )
      )
  );
});
