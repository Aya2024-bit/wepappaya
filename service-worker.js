// SERVICE WORKER - AYA ACESSÓRIOS PWA v1.0.3 (COM PUSH NOTIFICATIONS)

// ===================================
// IMPORTAR FIREBASE
// ===================================
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configurar Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAeiTYTfS4a0Wh4yOrXET-2dAbcT8ZLbj4",
    authDomain: "ayajoias-455fe.firebaseapp.com",
    projectId: "ayajoias-455fe",
    storageBucket: "ayajoias-455fe.firebasestorage.app",
    messagingSenderId: "793600668160",
    appId: "1:793600668160:web:945db49cccd4cc2ff99ee5"
});

const messaging = firebase.messaging();

// ===================================
// CONFIGURAÇÕES DE CACHE (SEU CÓDIGO)
// ===================================
const CACHE_NAME = 'aya-acessorios-v1.0.3';
const OFFLINE_URL = './offline.html';

const urlsToCache = [
    './',
    './index.html',
    './produtos.html',
    './produto-detalhes.html',
    './carrinho.html',
    './sobre.html',
    './contato.html',
    './offline.html',
    './css/loja-styles-premium.css',
    './manifest.json'
];

// ===================================
// INSTALL (SEU CÓDIGO)
// ===================================
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando arquivos');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch((error) => console.error('[SW] Erro:', error))
    );
});

// ===================================
// ACTIVATE (SEU CÓDIGO)
// ===================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ===================================
// FETCH (SEU CÓDIGO)
// ===================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    if (request.method !== 'GET') return;
    
    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (!response || response.status !== 200) {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, responseToCache));

                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;

                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }

                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// ===================================
// PUSH NOTIFICATIONS (FIREBASE)
// ===================================
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📩 Notificação recebida:', payload);

    const notificationTitle = payload.notification?.title || 'Nova Promoção Aya!';
    const notificationOptions = {
        body: payload.notification?.body || 'Confira agora!',
        icon: './icon-192x192.png',
        badge: './icon-96x96.png',
        vibrate: [200, 100, 200],
        tag: 'promocao-aya',
        requireInteraction: true,
        actions: [
            {
                action: 'abrir',
                title: 'Ver Promoção'
            },
            {
                action: 'fechar',
                title: 'Fechar'
            }
        ],
        data: {
            url: payload.data?.url || './produtos.html'
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ===================================
// CLICK NA NOTIFICAÇÃO
// ===================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 👆 Clique na notificação');
    
    event.notification.close();

    if (event.action === 'fechar') {
        return;
    }

    const urlToOpen = event.notification.data?.url || './produtos.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Se já tem uma janela aberta, foca nela
                for (let client of windowClients) {
                    if ('focus' in client) {
                        return client.focus().then(() => {
                            return client.navigate(urlToOpen);
                        });
                    }
                }
                // Se não, abre nova janela
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

console.log('[SW] Service Worker v1.0.3 carregado com Firebase Cloud Messaging');