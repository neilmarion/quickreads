// Generated by CoffeeScript 1.8.0
/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/;
var AppRate, exec, locales;

locales = require('./locales');

exec = require('cordova/exec');

AppRate = (function() {
  var getLocaleObject, navigateToAppStore, promptForRatingWindowButtonClickHandler, rate_reset, rate_stop, rate_try, thisObj;

  thisObj = AppRate;

  AppRate.preferences = {
    autoDetectLanguage: true,
    useLanguage: "en",
    displayAppName: void 0,
    promptAgainForEachNewVersion: true,
    daysUntilPrompt: 1,
    usesUntilPrompt: 3,
    appStoreAppURL: {
      ios: void 0,
      android: void 0,
      blackberry: void 0
    }
  };

  function AppRate() {
    this.getAppVersion((function(_this) {
      return function(success) {
        AppRate.preferences.curentVersion = success;
        if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent.toLowerCase() && (window.localStorage.getItem("appVersion")) !== success)) {
          AppRate.preferences.curentVersion = success;
          rate_stop();
          rate_reset();
          window.localStorage.setItem('appVersion', success);
          window.localStorage.removeItem('rate_app');
        }
        AppRate.rate_app = parseInt(window.localStorage.getItem("rate_app") || 1);
        return AppRate.usesUntilPromptCounter = parseInt(window.localStorage.getItem("usesUntilPromptCounter") || 0);
      };
    })(this));
    this.getAppTitle(function(success) {
      return AppRate.preferences.displayAppName = success;
    });
    this;
  }

  navigateToAppStore = function() {
    if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(AppRate.preferences.appStoreAppURL.ios, '_system');
    } else if (/(Android)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(AppRate.preferences.appStoreAppURL.android, '_system');
    } else if (/(BlackBerry)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(AppRate.preferences.appStoreAppURL.blackberry);
    }
    return this;
  };

  promptForRatingWindowButtonClickHandler = function(buttonIndex) {
    switch (buttonIndex) {
      case 3:
        rate_stop();
        setTimeout(navigateToAppStore, 100);
        break;
      case 2:
        rate_reset();
        break;
      case 1:
        rate_stop();
    }
    return this;
  };

  rate_stop = function() {
    window.localStorage.setItem("rate_app", 0);
    window.localStorage.removeItem("usesUntilPromptCounter");
    return this;
  };

  rate_reset = function() {
    window.localStorage.setItem("usesUntilPromptCounter", 0);
    return this;
  };

  rate_try = function() {
    var localeObj;
    localeObj = getLocaleObject();
    if (thisObj.usesUntilPromptCounter === AppRate.preferences.usesUntilPrompt && thisObj.rate_app !== 0) {
      navigator.notification.confirm(localeObj.message, promptForRatingWindowButtonClickHandler, localeObj.title, [localeObj.cancelButtonLabel, localeObj.laterButtonLabel, localeObj.rateButtonLabel]);
    } else if (thisObj.usesUntilPromptCounter < AppRate.preferences.usesUntilPrompt) {
      thisObj.usesUntilPromptCounter++;
      window.localStorage.setItem("usesUntilPromptCounter", thisObj.usesUntilPromptCounter);
    }
    return this;
  };

  getLocaleObject = function() {
    var displayAppName, key, localeObj, value;
    localeObj = AppRate.preferences.customLocale || locales[AppRate.preferences.useLanguage] || locales["en"];
    displayAppName = localeObj.displayAppName || AppRate.preferences.displayAppName;
    for (key in localeObj) {
      value = localeObj[key];
      if (typeof value === 'string' || value instanceof String) {
        localeObj[key] = value.replace(/%@/g, displayAppName);
      }
    }
    return localeObj;
  };

  AppRate.prototype.setup = function(prefs) {
    if (prefs.debug !== void 0) {
      AppRate.preferences.debug = true;
    }
    if (prefs.useLanguage !== void 0) {
      AppRate.preferences.autoDetectLanguage = false;
      AppRate.preferences.useLanguage = prefs.useLanguage;
    }
    if (prefs.customLocale !== void 0) {
      AppRate.preferences.customLocale = prefs.customLocale;
    }
    if (prefs.usesUntilPrompt !== void 0) {
      AppRate.preferences.usesUntilPrompt = prefs.usesUntilPrompt;
    }
    if (prefs.displayAppName !== void 0) {
      AppRate.preferences.displayAppName = prefs.displayAppName;
    }
    if (prefs.appStoreAppURL) {
      if (prefs.appStoreAppURL.ios !== void 0) {
        AppRate.preferences.appStoreAppURL.ios = prefs.appStoreAppURL.ios;
      }
      if (prefs.appStoreAppURL.android !== void 0) {
        AppRate.preferences.appStoreAppURL.android = prefs.appStoreAppURL.android;
      }
      if (prefs.appStoreAppURL.blackberry !== void 0) {
        AppRate.preferences.appStoreAppURL.blackberry = prefs.appStoreAppURL.blackberry;
      }
    }
    return this;
  };

  AppRate.prototype.promptForRating = function() {
    if (navigator.notification && navigator.globalization) {
      if (AppRate.preferences.autoDetectLanguage) {
        navigator.globalization.getPreferredLanguage(function(language) {
          AppRate.preferences.useLanguage = language.value.split(/_/)[0];
          return rate_try();
        }, function() {
          return rate_try();
        });
      } else {
        rate_try();
      }
    }
    return this;
  };

  AppRate.prototype.getAppVersion = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'AppRate', 'getAppVersion', []);
    return this;
  };

  AppRate.prototype.getAppTitle = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'AppRate', 'getAppTitle', []);
    return this;
  };

  return AppRate;

})();

module.exports = new AppRate(this);
