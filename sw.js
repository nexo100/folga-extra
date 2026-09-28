/**
 * sw.js - Service Worker Oficial • Folga Extra (UFBA)
 * Versão 3.4.0 - Suporte Completo a Funcionamento 100% Offline (Cache-First)
 */

const CACHE_NAME = 'folga-extra-v3.4.0';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './js/app.js',
  './js/holidays.js',
  './js/optimizer.js',
  './js/ribbon.js',
  './js/mini-calendar.js',
  './js/tags.js',
  './js/render.js'
];

// Instalação do Service Worker e pré-cache de ativos fundamentais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de versões anteriores de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de interceptação:
// 1. Ativos locais da aplicação: Cache-First com fallback de rede
// 2. CDNs externas (Tailwind, Lucide, Confetti, Google Fonts): Stale-While-Revalidate com cache dinâmico
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora requisições que não sejam GET
  if (req.method !== 'GET') return;

  // Intercepta e aplica cache inteligente
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Se já está no cache, retorna imediatamente.
        // Se for recurso externo, tenta atualizar o cache em segundo plano (Stale-While-Revalidate)
        if (url.origin !== self.location.origin) {
          fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, networkResponse);
              });
            }
          }).catch(() => {
            // Em modo offline, falha de rede silenciosa é esperada e segura
          });
        }
        return cachedResponse;
      }

      // Se não está no cache, busca na rede e salva no cache dinâmico
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se a rede falhar e a requisição for de página HTML, entrega index.html do cache
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
