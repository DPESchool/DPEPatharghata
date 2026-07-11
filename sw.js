// পাথরঘাটা উপজেলা প্রাথমিক শিক্ষা ডিরেক্টরি — সার্ভিস ওয়ার্কার
// শুধু অ্যাপ শেল (HTML/আইকন) ক্যাশ করে, যাতে অফলাইনেও অ্যাপ খোলা যায়
// এবং অ্যান্ড্রয়েডে "ইনস্টল" প্রম্পট আসে। Firestore ডেটা সবসময় লাইভ (নেটওয়ার্ক) থেকেই আসে।

const CACHE_NAME = 'patharghata-shell-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// নেটওয়ার্ক-ফার্স্ট: ইন্টারনেট থাকলে সবসময় সর্বশেষ ভার্সন/ডেটা আনবে,
// নেটওয়ার্ক না থাকলে ক্যাশ থেকে অ্যাপ শেল দেখাবে (Firebase/Firestore নিজের অফলাইন
// পার্সিস্টেন্স আলাদাভাবে সামলায়, তাই এখানে শুধু স্ট্যাটিক ফাইলগুলোই ক্যাশ করা হয়)।
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // বহিরাগত (Firebase/imgbb/CDN) রিকোয়েস্টে হাত দেওয়া হয় না

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
