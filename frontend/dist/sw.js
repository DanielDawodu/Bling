// Service Worker for Bling Push Notifications

self.addEventListener('push', function (event) {
    if (!event.data) {
        return;
    }

    try {
        const data = event.data.json();

        const options = {
            body: data.body || 'You have a new notification',
            icon: data.icon || '/logo.png',
            badge: '/logo.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/',
                timestamp: data.timestamp || Date.now()
            },
            actions: [
                {
                    action: 'open',
                    title: 'Open'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ],
            tag: 'bling-notification',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Bling', options)
        );
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle service worker activation
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', function (event) {
    self.skipWaiting();
});
