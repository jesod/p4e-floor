/* P4E Floor — service worker
   Objetivo concreto: RIM Park con 3000 personas adentro tiene señal pésima.
   La app tiene que abrir igual. */
const VERSION = "p4e-v1";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-rt`;

// Pantallas que tienen que estar sí o sí, aunque el teléfono esté sin datos.
const PRECACHE = ["/", "/ruta", "/plano", "/perfil", "/fuentes", "/manifest.webmanifest",
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

  // Los assets de Next llevan hash: si están en caché, no vuelven a pedirse nunca.
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

  // Todo lo demás: red primero (para que una lista actualizada llegue),
  // con la copia en caché como red de contención cuando no hay señal.
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
