addEventListener('fetch', function (event) {
  const err = new Error("hello error")
  event.respondWith(new Response(err.stack))
})