export function initCookies() {
  // Chargement différé — ne bloque pas le rendu initial
  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 });
  } else {
    setTimeout(load, 1000);
  }
}

function load() {
  const script = document.createElement('script');
  script.src = '/tarteaucitron.min.js';
  script.async = true;
  script.onload = init;
  document.head.appendChild(script);
}

function init() {
  const tarteaucitron = window.tarteaucitron;
  if (!tarteaucitron || typeof tarteaucitron.init !== 'function') return;

  tarteaucitron.init({
    privacyUrl:              '/confidentialite',
    bodyPosition:            'bottom',
    hashtag:                 '#tarteaucitron',
    cookieName:              'tarteaucitron',
    orientation:             'bottom',
    groupServices:           false,
    showAlertSmall:          false,
    cookieslist:             true,
    showIcon:                true,
    iconPosition:            'BottomRight',
    adblocker:               false,
    DenyAllCta:              true,
    AcceptAllCta:            true,
    highPrivacy:             true,
    handleBrowserDNTRequest: false,
    removeCredit:            false,
    moreInfoLink:            true,
    useExternalCss:          false,
    useExternalJs:           false,
    locale:                  'fr',
    mandatory:               true,
    mandatoryCta:            true,
  });

  // JWT HttpOnly — cookies techniques nécessaires, exemptés de consentement (art. 82 LIL)
  tarteaucitron.job = tarteaucitron.job || [];

  // Stripe activé en v2 :
  // tarteaucitron.job.push('stripe');
}
