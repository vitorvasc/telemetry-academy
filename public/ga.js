(function() {
  var el = document.currentScript;
  var id = el && el.getAttribute('data-id');
  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;

  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  try {
    if (localStorage.getItem('ta-cookie-consent') === 'accepted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  } catch(e) { /* localStorage unavailable */ }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', id);
})();
