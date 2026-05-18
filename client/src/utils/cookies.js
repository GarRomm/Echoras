import tarteaucitron from 'tarteaucitronjs/tarteaucitron.js';

export function initCookies() {
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
  // Les cookies JWT HttpOnly sont des cookies techniques strictement nécessaires
  // au fonctionnement du service. Ils sont exemptés de consentement (art. 82 LIL).
  tarteaucitron.job = tarteaucitron.job || [];

  // Préparer Stripe (paiement — sera activé en v2)
  // tarteaucitron.job.push('stripe');
}
