// Author: Neil Marion dela Cruz
// * new means new items for the month being determined by the API

function QR () {
  _this = this;
  this.host = $conf['host'];
  this.downloadHost = $conf['downloadHost'];
  this.albumId = $conf['album_id'];

  this.read = JSON.parse(localStorage.getItem("read")); // * new items that have
                                                        // been read by the user
  this.notRead = [];                                    // * new items that
                                                        // haven't been read by the user
  this.loading = $(".spinner").hide();
  this.macAddress = null;
  this.mode = "offline";

  this.photoCache = [];
  this.photoCacheIndex;

  this.autoDownloadMode = false;
  this.downloadFileFolderNativeURL = null;

  this.textCache = {};
  this.text = "";

  this.getMonthURL = this.host + "/v1/month";
  this.getNewIdsURL = this.host + "/v1/new_ids?album_id=" + this.albumId;

  this.current = localStorage.getItem('last');

  this.screenHeight = $(document).height();

  this.currentAd = null;
  this.counterBeforeShowingAd = 1;
  this.showAdCount = 20;

  this.pushNotification = window.plugins.pushNotification;
  this.enablePushNotifications = JSON.parse(localStorage.getItem('enablePushNotifications'));
  this.enablePushNotificationsUpdated = JSON.parse(localStorage.getItem('enablePushNotificationsUpdated'));
  this.regId = localStorage.getItem('regId');

  document.title = $conf["app_name"];
}

QR.prototype = {
  constructor: QR,
  getMacAddress: function () {
    window.MacAddress.getMacAddress(
      function(macAddress) { _this.macAddress = macAddress }, null /* TODO: Specific error*/
    );
  },

  nextItem: function (direction) {
    this.showSpinner();
    if(direction == "random") {
      var url = this.host + '/v1/show?id=' + this.randomPhoto["id"] + "&device=" + (this.macAddress || '')
      $(".photo").hide('slide', {direction: 'left'}, 100);
    } else {
      var url = this.host + '/v1/show?id=' + JSON.parse(this.current)[direction]["id"] + "&device=" + (this.macAddress || '')
      if (direction == "next") {
        $(".photo").hide('slide', {direction: 'left'}, 100);
      } else {
        $(".photo").hide('slide', {direction: 'right'}, 100);
      }
    }

    _this.hideRibbon();

    $.ajax({
      type: "GET",
      url: url,
      xhrFields: { withCredentials: true },
      dataType: "json",
      success: function (data) {
        console.log(data);
        _this.iterateBeforeShowingAdCounter();
        _this.displayCurrent(_this.downloadHost + data["current"][$conf["photo_key"]]);
        $(".photo-prev").html("<img src='" + _this.downloadHost + data["previous"][$conf["photo_key"]] + "'>");
        $(".photo-next").html("<img src='" + _this.downloadHost + data["next"][$conf["photo_key"]] + "'>");

        if (direction == "random") {
          _this.randomPhoto = data["random"];
          $(".photo-random").html("<img src='" + _this.downloadHost + data["random"][$conf["photo_key"]] + "'>");
        }

        _this.adjustPhotoMargin(direction, data["current"]["id"]);

        _this.setText(data["current"]["text"], data["current"]["created_at"]);
        _this.autoDownload(data["current"]);
        _this.current = JSON.stringify(data);
        _this.mode = "online";

        localStorage.setItem("last", _this.current);
        _this.hideSpinner();
      }, error: function() {
        _this.showPhotoFromCache(direction);
        $(".random-btn").show();
        $(".new-btn").hide();
        _this.hideRibbon();
        _this.mode = "offline";
        _this.hideSpinner();
      }
    });
  },

  getNew: function () {
    _this.showSpinner();
    $(".photo").hide('slide', {direction: 'left'}, 100);
    _this.hideRibbon();
    $.ajax({
      type: "GET",
      url: this.host + '/v1/show?id=' + this.notRead[0] + "&device=" + this.macAddress,
      xhrFields: {withCredentials: true},
      dataType: "json",
      success: function (data) {
        console.log(data);
        $(".photo").html("<img src='" + _this.downloadHost + data["current"][$conf["photo_key"]] + "'>");
        $(".photo-prev").html("<img src='" + _this.downloadHost + data["previous"][$conf["photo_key"]] + "'>");
        $(".photo-next").html("<img src='" + _this.downloadHost + data["next"][$conf["photo_key"]] + "'>");
        _this.adjustPhotoMargin('next', data["current"]["id"]);
        _this.current = JSON.stringify(data);
        localStorage.setItem("last", _this.current);

        if ( _this.notRead.length <= 0 ) {
          $(".random-btn").show();
          $(".new-btn").hide();
        } else {
          _this.updateNewBtnCount();
        }

        _this.mode = "online";
        _this.setText(data["current"]["text"], data["current"]["created_at"]);
        _this.autoDownload(data["current"]);
        _this.hideSpinner();
      }, error: function() {
        _this.showPhotoFromPhotoCache("random");
        $(".random-btn").show();
        $(".new-btn").hide();
        _this.hideRibbon();
        _this.mode = "offline";
      }
    });

  },

  showRibbon: function () {
    $(".ribbon-wrapper-green").css('margin-top', $(".photo").css('margin-top'));
    $(".ribbon-wrapper-green").show('slide', {direction: 'right'}, 600);
  },

  hideRibbon: function () {
    $(".ribbon-wrapper-green").hide();
  },

  updateNewBtnCount: function () {
    $(".new-btn").html("New (" + this.notRead.length + ")");
  },

  setText: function (text, date) {
    if (text != null) {
      text = text.replace(/(?:\r\n|\r|\n)/g, '<br />')
      url = text.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g) || [];
      $.each(url, function(i, v) {
        text  = text.replace(v, '<a href="' + v + '">' + v + '</a>');
      });
      $("#text div").html("<p>" + text.replace(/(?:\r\n|\r|\n)/g, '<br />') + "<br /><br /><i>Posted, " + date + " </i></p>");
    }
  },

  isUnread: function (id) {
    i = this.notRead.indexOf(id);
    if (i > -1) {
      this.read.push(this.notRead[i]);
      localStorage.setItem("read", JSON.stringify(this.read)); // place it in the 'read' array
      this.notRead.splice(i, 1);

      if (this.notRead.length <= 0) {
        $(".random-btn").show();
        $(".new-btn").hide();
      }

      this.showRibbon();
      this.updateNewBtnCount();
    }
  },

  init: function () {
    if($conf['with_ads']) {
      window.plugins.AdMob.createBannerView();
      window.plugins.AdMob.showAd(true,function(){},function(e){ });
    }

    this.getMacAddress();
    if (localStorage.getItem('last') == null ) {
      var url = this.host + "/v1/show?album_id=" + this.albumId + "&device=" + this.macAddress;
    } else {
      val = JSON.parse(localStorage.getItem("last"));
      var url = this.host + '/v1/show?id=' + val["current"]["id"] + "&device=" + this.macAddress;
    }

    if (localStorage.getItem('photoCacheIndex') == null ) {
      localStorage.setItem('photoCacheIndex', '0');
      this.photoCacheIndex = JSON.parse(localStorage.getItem('photoCacheIndex'));
    } else {
      this.photoCacheIndex = JSON.parse(localStorage.getItem('photoCacheIndex'));
    }

    this.current = localStorage.getItem('last') || null;

    if (this.autoDownloadMode) {
      $("#auto-dl").addClass("on");
    } else {
      $("#auto-dl").addClass("off");
    }

    this.stylePushNotifButton();

    $.ajax({
      type: "GET",
      url: url,
      xhrFields: {withCredentials: true},
      dataType: "json",
      success: function (data) {
        console.log(data);
        _this.getMonth();
        $(".photo").html("<img src='" + _this.downloadHost + data["current"][$conf["photo_key"]] + "'>");
        $(".photo-random").html("<img src='" + _this.downloadHost + data["random"][$conf["photo_key"]] + "'>");
        $(".photo-prev").html("<img src='" + _this.downloadHost + data["previous"][$conf["photo_key"]] + "'>");
        $(".photo-next").html("<img src='" + _this.downloadHost + data["next"][$conf["photo_key"]] + "'>");

        _this.randomPhoto = data["random"];

        _this.adjustPhotoMargin('next', data["current"]["id"]);
        _this.current = JSON.stringify(data);
        //_this.isUnread(data["current"]["id"]);
        _this.mode = "online";
        _this.setText(data["current"]["text"], data["current"]["created_at"]);
        _this.showInitialMessage($messages["initial_message"]);
        _this.createDirectory($conf["download_folder"]);
        localStorage.setItem("last", _this.current);
        _this.toggleAutoDownload(false);
        _this.getAdvertisement();
        _this.getRegId();
        _this.togglePushNotificationsOnServer();
      }, error: function(request, status, error) {
        $(".random-btn").show();
        $(".new-btn").hide();
        _this.hideRibbon();
        _this.mode = "offline";
        _this.createDirectory($conf["download_folder"]);
      }
    });
  },

  getLastItem: function () {
    return localStorage.getItem("last");
  },

  getNewIds: function () {
    $.ajax({
      type: "GET",
      url: this.getNewIdsURL,
      xhrFields: { withCredentials: true },
      dataType: "json",
      success: function (data) {
        _this.getNotReadIds(data, function(notRead) { _this.notRead = notRead; });
        if ( _this.notRead.length > 0 ) {
          $(".random-btn").hide();
          $(".new-btn").show();
          $(".new-btn").append(" (" + _this.notRead.length + ")");
        }
      }, error: function() {
        // TODO: general error popup
      }
    });
  },

  getMonth: function () {
    $.ajax({
      type: 'GET',
      url: this.getMonthURL,
      xhrFields: { withCredentials: true },
      dataType: 'json',
      success: function (month) {
        // reset new items if it's a new month
        if (localStorage.getItem('month') != month) {
          localStorage.setItem('month', month);
          localStorage.setItem('read', '[]');
          _this.read = [];
        }

        _this.read = JSON.parse(localStorage.getItem('read'));
        _this.getNewIds();
      }, error: function() {
        console.log("error getMonth");
      }
    });
  },

  getNotReadIds: function (data, callBack) {
    notRead = [];
    console.log(data);
    $.each(data, function(index, value) {
      i = _this.read.indexOf(value);
      if (i <= -1) {
        notRead.push(value);
      }
    });
    callBack(notRead);
  },

  // file

  createDirectory: function (folderName) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemSuccess, fileSystemFail);

    function fileSystemSuccess(fileSystem) {
      var directoryEntry = fileSystem.root; // to get root path of directory
      directoryEntry.getDirectory(folderName, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard
    }

    function onDirectorySuccess(parent) {
      _this.getDownloadedPhotos(folderName);
    }

    function onDirectoryFail(error) {
      $("#download-error").popup('open', {transition: "flip"});
    }

    function fileSystemFail(evt) {
      $("#download-error").popup('open', {transition: "flip"});
    }
  },

  showInitialMessage: function (text) {
    $("#initial-message div").html(text);
    $("#initial-message").popup('open', {transition: "pop"});
    // remove when not testing $("#initial-message").popup('open', {transition: "pop"});
  },

  autoDownload: function (photo) {
    if(this.autoDownloadMode) {
      this.textCache[photo['id'] + ".png"] = photo['text'];
      this.downloadFile(this.downloadHost + photo[$conf['photo_key']], $conf["download_folder"], photo['id'], null);
      this.writeToFile(JSON.stringify(this.textCache), $conf["textCacheFilePath"]);
    }
  },

  toggleAutoDownload: function (withPopUp) {
    if(this.autoDownloadMode) {
      this.autoDownloadMode = false;
      $("#auto-dl").addClass("off");
      $("#auto-dl").removeClass("on");
      $("#auto-download-off").popup('open', {transition: "pop"});
      localStorage.setItem( "autoDownloadMode", false )
    } else {
      this.autoDownloadMode = true;
      this.autoDownload(JSON.parse(localStorage.getItem("last"))["current"]);
      $("#auto-dl").addClass("on");
      $("#auto-dl").removeClass("off");

      $("#auto-download-on div").html($messages["auto_download_on_message"]);
      if(withPopUp) {
        $("#auto-download-on").popup('open', {transition: "pop"});
      }
      // remove when not testing $("#auto-download-on").popup('open', {transition: "pop"});
      localStorage.setItem("autoDownloadMode", true)
    }
  },

  getDownloadedPhotos: function (folderName) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemSuccess, fail);

    function fileSystemSuccess(fileSystem) {
      var directoryEntry = fileSystem.root;
      fp = fileSystem.root.nativeURL + folderName + "/";
      _this.downloadFileFolderNativeURL = fp;
      window.resolveLocalFileSystemURL(fp, resolveSuccess, resolveFail);
    }

    function resolveSuccess (directoryEntry) {
      var directoryReader = directoryEntry.createReader();
      directoryReader.readEntries(success, fail);
    }

    function resolveFail(error) {
      // TODO: specific error
    }

    function success(entries) {
      var i;

      _this.readFile($conf["textCacheFilePath"], _this.getText);

      for (i=0; i<entries.length; i++) {
        _this.photoCache.push(entries[i].name);
      }

      if( _this.mode == "offline" ) {
        _this.showPhotoFromCache("random");
      }
    }

    function fail(error) {
      // TODO: specific error
    }
  },

  writeToFile: function (text, filePath) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemSuccess, fail);

    function fileSystemSuccess(fileSystem) {
      var directoryEntry = fileSystem.root;
      fileSystem.root.getFile(filePath, {create: true}, success, fail);
    }

    function success(entry) {
      entry.createWriter(gotFileWriter, fail);
    }
    function gotFileWriter(writer) {
      writer.onwrite = function(evt) {
        console.log("write success");
      };
      writer.write(text);
    }
    function fail(error) {
      _this.errorPopup();
    }
  },

  readFile: function (filePath, text) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemSuccess, fail);

    function fileSystemSuccess(fileSystem) {
      var directoryEntry = fileSystem.root;
      fileSystem.root.getFile(filePath, {create: true}, success, fail);
    }

    function success( entry ) {
      entry.file(gotFile, fail);
    }

    function gotFile(file) {
      readAsText(file);
    }

    function readAsText(file) {
      var reader = new FileReader();
      reader.onloadend = function(evt) {
        if(evt.target.result == "") {
          _this.writeToFile( "{}", $conf["textCacheFilePath"] )
          _this.textCache = {};
        } else {
          _this.getText(evt.target.result);
        }
      };
      reader.readAsText(file);
    }

    function fail(error) {
      _this.errorPopup();
    }
  },

  getText: function (text) {
    _this.textCache = JSON.parse(text);
  },

  downloadFile: function(url, folderName, fileName, shareMethod) {
    if (url == null && folderName == null && fileName == null) {
      return;
    } else {
      var networkState = navigator.connection.type;
      if (networkState == Connection.NONE) {
        return;
      } else {
        this.download(url, folderName, fileName, shareMethod); //If available download function call
      }
    }
  },

  download: function (url, folderName, fileName, shareMethod) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemSuccess, fileSystemFail);

    function fileSystemSuccess(fileSystem) {
      var downloadLink = encodeURI(url);
      var directoryEntry = fileSystem.root; // to get root path of directory
      console.log(directoryEntry);
      directoryEntry.getDirectory(folderName, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard
      var rootdir = fileSystem.root;
      var fp = rootdir.nativeURL; // Returns Fulpath of local directory
      fp = fp + folderName + "/" + fileName + ".png"; // fullpath and name of the file which we want to give
      _this.fileTransfer(downloadLink, fp, shareMethod);
      _this.storeToPhotoCache(fileName + ".png");
    }

    function onDirectorySuccess(parent) {
    }

    function onDirectoryFail(error) {
      $("#download-error").popup('open', {transition: "flip"});
    }

    function fileSystemFail(evt) {
      $("#download-error").popup('open', {transition: "flip"});
    }
  },

  storeToPhotoCache: function (photoName) {
    this.photoCache.push( photoName );
    this.photoCache = $.unique( this.photoCache );
  },

  fileTransfer: function (downloadLink, fp, shareMethod) {
    console.log(fp);
    var fileTransfer = new FileTransfer();
    fileTransfer.download(downloadLink, fp,
      function (entry) {
        _this.loading.hide();
        if (shareMethod == "facebook") {
            window.plugins.socialsharing.shareViaFacebook($messages['share'], fp, null, null, null);
        } else if ( shareMethod == "twitter" ) {
            window.plugins.socialsharing.shareViaTwitter($messages['share'], fp, null);
        } else if ( shareMethod == "general" ) {
            window.plugins.socialsharing.share(_this.textCache[fp.substr(fp.lastIndexOf('/') + 1)] + " \n " + $messages['share'], null, fp, null);
        }
      }, function (error) {
        console.log(error);
        $("#download-error").popup('open', {transition: "flip"});
        _this.loading.hide();
      }
    );
  },

  showPhotoFromCache: function (direction) {
    switch (direction) {
      case "next":
        this.photoCacheIndex = this.photoCacheIndex + 1;
        if ( this.photoCacheIndex == this.photoCache.length ) {
          this.photoCacheIndex = 0;
        }

        break;
      case "previous":
        this.photoCacheIndex = this.photoCacheIndex - 1;
        if ( this.photoCacheIndex == -1 ) {
          this.photoCacheIndex = this.photoCache.length - 1;
        }

        break;
      default:
        this.photoCacheIndex = Math.floor(( Math.random() * this.photoCache.length ));
    }

    $(".photo").html("<img src='" + this.downloadFileFolderNativeURL + this.photoCache[ this.photoCacheIndex ] + "'>");
    this.adjustPhotoMargin(direction, null);
    $("#text div").html("<p>" + this.textCache[ this.photoCache[ this.photoCacheIndex ] ] + "</p>");
  },

  showText: function () {
    if (this.counterBeforeShowingAd % this.showAdCount == 0 && this.currentAd) {
      window.open(this.currentAd['link'], '_system');
      return;
    }

    if ($conf['show_text']) {
      $("#text").popup('open', {transition: "pop"});
    }
  },

  errorPopup: function () {
    $("#download-error").popup('open', {transition: "pop"});
  },

  share: function() {
    this.showSpinnerOnShare();
    this.downloadPhoto("general");
  },

  shareViaFB: function() {
    this.showSpinnerOnShare();
    this.downloadPhoto("facebook");
  },

  shareViaTwitter: function() {
    this.showSpinnerOnShare();
    this.downloadPhoto("twitter");
  },

  downloadPhoto: function(shareMethod) {
    this.showSpinnerOnShare();
    photo = JSON.parse(localStorage.getItem("last"));
    filePath = photo["current"][$conf["big_photo"]];
    this.textCache[photo["current"]["id"] + ".png"] = photo["current"]["text"];
    this.writeToFile(JSON.stringify(this.textCache), $conf["textCacheFilePath"]);
    this.downloadFile(this.downloadHost + photo["current"][$conf["big_photo"]], $conf["download_folder"], photo["current"]["id"], shareMethod);
  },

  showSpinnerOnShare: function () {
    this.loading.css("margin-top", "0px");
    this.loading.show();
  },

  showAnnouncements: function () {
    $.ajax({
      type: "GET",
      url: this.host + "/v1/announcements?album_id=" + this.albumId,
      xhrFields: {withCredentials: true},
      dataType: "json",
      success: function (data) {
        _this.showInitialMessage(data);
      }, error: function() {

      }
    });
  },

  adjustPhotoMargin: function (direction, id) {
    if (direction == "previous") {
      $(".photo").show('slide', {direction: 'left'}, 100);
    } else {
      $(".photo").show('slide', {direction: 'right'}, 100);
    }

    $('.photo img').load(function() {
      $(".photo").css('margin-top', (_this.screenHeight - $('.photo img').height()) / 2);
      if (id != null) {
        _this.isUnread(id);
      }
    });
  },

  getAdvertisement: function () {
    $.ajax({
      type: "GET",
      url: this.host + "/v1/getadvertisement?album_id=" + this.albumId,
      xhrFields: {withCredentials: true},
      dataType: "json",
      success: function (data) {
        _this.currentAd = data;
        $(".photo-ad").html("<img src='" + _this.downloadHost + this.currentAd['photo'] + "'>");
      }, error: function() {

      }
    });
  },

  iterateBeforeShowingAdCounter: function () {
    if (this.currentAd) {
      this.counterBeforeShowingAd++;
    }
  },

  displayCurrent: function (photoUrl) {
    if (this.counterBeforeShowingAd % this.showAdCount == 0 && this.currentAd) {
      $(".photo").html("<img src='" + _this.downloadHost + this.currentAd['photo'] + "'>");
      this.getAdvertisement();
    } else {
      $(".photo").html("<img src='" + photoUrl + "'>");
    }
  },

  showSpinner: function () {
    $(".spinner").css('left', ($(document).width() / 2) - 50);
    $(".spinner").css('top', $(document).height() / 2);
    qr.loading.show();
  },

  hideSpinner: function () {
    qr.loading.hide();
  },

  onNotification: function (e) {
    switch( e.event ) {
      case 'registered':
        if ( e.regid.length > 0 ) {
          this.regId = e.regid;
          localStorage.setItem('regId', this.regId);
          this.togglePushNotificationsOnServer();
          console.log("regID = " + e.regid);
        }
        break;
      case 'message':
        if (e.foreground) {
        } else {	// otherwise we were launched because the user touched a notification in the notification tray.
          if (e.coldstart) {
            console.log('coldstart notification');
          } else {
            console.log('background notification');
          }
        }
        break;
      case 'error':
        console.log('error');
        break;
      default:
        console.log('unknown event');
        break;
    }
  },

  registerOnPushNotifications: function () {
    this.pushNotification.register(
      function successHandler (result) {
        console.log(result);
      },
      function errorHandler (error) {
        console.log(error);
      },
      {
        "senderID":$conf['sender_id'],
        "ecb":"_this.onNotification"
    });
  },

  getRegId: function () {
    if (localStorage.getItem('regId') == null) {
      this.enablePushNotifications = true;
      localStorage.setItem('enablePushNotifications', true);
      $("#pushnotif").removeClass("off")
      $("#pushnotif").addClass("on");
      this.registerOnPushNotifications();
    }
  },

  stylePushNotifButton: function () {
    if (this.enablePushNotifications == false) {
      $("#pushnotif").removeClass("on")
      $("#pushnotif").addClass("off");
    } else {
      $("#pushnotif").removeClass("off")
      $("#pushnotif").addClass("on");
    }
  },

  togglePushNotifications: function () {
    if (this.enablePushNotifications == false) {
      console.log("false");
      this.enablePushNotifications = true;
      localStorage.setItem('enablePushNotificationsUpdated', false);
      this.enablePushNotificationsUpdated = false;
      $("#pushnotif").removeClass("off")
      $("#pushnotif").addClass("on");
      $("#push-notif-on div").html($messages["push_notif_on_message"]);
      $("#push-notif-on").popup('open', {transition: "pop"});
    } else {
      console.log("true");
      this.enablePushNotifications = false;
      localStorage.setItem('enablePushNotificationsUpdated', false);
      this.enablePushNotificationsUpdated = false;
      $("#pushnotif").removeClass("on")
      $("#pushnotif").addClass("off");
      $("#push-notif-off").popup('open', {transition: "pop"});
    }
    localStorage.setItem('enablePushNotifications', this.enablePushNotifications);
    qr.togglePushNotificationsOnServer();
  },

  togglePushNotificationsOnServer: function () {
    if (!this.enablePushNotificationsUpdated) {
      $.ajax({
        type: 'POST',
        url: this.host + '/v1/enablepushnotifications',
        xhrFields: { withCredentials: true },
        data: { device: this.macAddress, reg_id: this.regId, album_id: $conf['album_id'], platform: device.platform, enable: this.enablePushNotifications },
        dataType: 'json',
        success: function () {
          this.enablePushNotificationsUpdated = true;
          localStorage.setItem('enablePushNotificationsUpdated', true);
        }, error: function() {
          this.enablePushNotificationsUpdated = false;
          localStorage.setItem('enablePushNotificationsUpdated', false);
        }
      });
    }
  }
}
