function initAd(){
  if ( window.plugins && window.plugins.AdMob ) {
    var ad_units = {
      ios : {
        banner: '',
        interstitial: ''
      },
      android : {
        banner: 'ca-app-pub-4666176728320985/7166244558',
      }
    };
    var admobid = ( /(android)/i.test(navigator.userAgent) ) ? ad_units.android : ad_units.ios;

    window.plugins.AdMob.setOptions( {
      publisherId: admobid.banner,
      interstitialAdId: admobid.interstitial,
      bannerAtTop: true, // set to true, to put banner at top
      overlap: true, // set to true, to allow banner overlap webview
      offsetTopBar: false, // set to true to avoid ios7 status bar overlap
      isTesting: false, // receiving test ad
      autoShow: true // auto show interstitial ad when loaded
    });

    registerAdEvents();

  } else {
    alert( 'admob plugin not ready' );
  }
}

function registerAdEvents() {
  document.addEventListener('onReceiveAd', function(){});
  document.addEventListener('onFailedToReceiveAd', function(data){});
  document.addEventListener('onPresentAd', function(){});
  document.addEventListener('onDismissAd', function(){ });
  document.addEventListener('onLeaveToAd', function(){ });
  document.addEventListener('onReceiveInterstitialAd', function(){ });
  document.addEventListener('onPresentInterstitialAd', function(){ });
  document.addEventListener('onDismissInterstitialAd', function(){ });
}
