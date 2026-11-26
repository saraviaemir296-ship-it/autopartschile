// Service worker del Centro de Mando: recibe las notificaciones push y abre la cola de aprobación.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Equipo IA', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Equipo IA Saravia', {
    body: d.body || '', tag: d.tag, renotify: true, icon: '/img/favicon.png', badge: '/img/favicon.png',
    data: { url: d.url || '/admin/equipo-ia.html' }, vibrate: [120, 60, 120],
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/admin/equipo-ia.html', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.location.origin + '/admin/')) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
