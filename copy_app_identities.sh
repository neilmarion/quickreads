APP="humansofnewyork"

mkdir platforms/android/src/com/neilmarion/$APP
cp -r app_identities/$APP/res platforms/android/
cp app_identities/$APP/config.xml www/
cp app_identities/$APP/AndroidManifest.xml platforms/android/
cp app_identities/$APP/build.xml platforms/android/
cp app_identities/$APP/HumansOfNewYork.java platforms/android/src/com/neilmarion/$APP
cp app_identities/$APP/config.js www/js/
cp app_identities/$APP/messages.js www/js/
cp app_identities/$APP/icon.png www/
cp app_identities/$APP/strings.xml platforms/android/res/values/strings.xml
cp app_identities/$APP/admobconfig.js www/js/
cp app_identities/$APP/preferences.js plugins/org.pushandplay.cordova.apprate/www/preferences.js
