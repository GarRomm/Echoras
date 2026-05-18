export function initCookies() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}

function run() {
  const tarteaucitron = window.tarteaucitron;
  if (!tarteaucitron || typeof tarteaucitron.init !== 'function') {
    console.warn('tarteaucitron not loaded');
    return;
  }

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

  // Cookies de session (nécessaires — aucun consentement requis)
  // Les cookies JWT HttpOnly sont exemptés de consentement (art. 82 LIL).
  tarteaucitron.job = tarteaucitron.job || [];

  // Stripe (paiement — sera activé en v2)
  // tarteaucitron.job.push('stripe');
}
