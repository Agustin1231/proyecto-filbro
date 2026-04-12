// Service Worker de Pulso — maneja push notifications y caché básico

const CACHE_NAME = "pulso-v1";

// ─── Caché básico ──────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Pulso", body: "Tienes un recordatorio", url: "/dashboard" };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url ?? "/dashboard" },
    actions: [
      { action: "abrir", title: "Ver Pulso" },
      { action: "cerrar", title: "Cerrar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Click en notificación ────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "cerrar") return;

  const url = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
