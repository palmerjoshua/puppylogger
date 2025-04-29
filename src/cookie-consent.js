(function() {
  const banner     = document.getElementById('cookie-banner');
  const btnAccept  = document.getElementById('cookie-accept');
  const btnDecline = document.getElementById('cookie-decline');
  const storageKey = 'cookieConsent';

  // Check stored decision on load
  function initConsent() {
    const consent = localStorage.getItem(storageKey);
    if (consent === 'accepted') {
      enableNonEssential();
    } else if (consent === 'declined') {
      // do nothing (non-essential stay off)
    } else {
      // no decision yet → show banner
      banner.style.display = 'flex';
    }
  }

  // User clicks "Accept"
  btnAccept.addEventListener('click', () => {
    localStorage.setItem(storageKey, 'accepted');
    banner.style.display = 'none';
    enableNonEssential();
  });

  // User clicks "Decline"
  btnDecline.addEventListener('click', () => {
    localStorage.setItem(storageKey, 'declined');
    banner.style.display = 'none';
    offerOptIn();
  });

  // Only after consent do we load analytics (or other scripts)
  function enableNonEssential() {
    // Example: load Google Analytics
    const id = 'G-WRLC5VDR43';
    if (!window.gaLoaded) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', id);

      window.gaLoaded = true;
    }
    // …you can also initialize AdSense or other non-essential libs here…
  }

  // Kick things off
  initConsent();
})();
