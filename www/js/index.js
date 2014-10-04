var app = {
  initialize: function() {
    this.bindEvents();
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  onDeviceReady: function() {
    qr = new QR();
    qr.init();
    initAd();
    app.receivedEvent('deviceready');
  },
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};


qr = new QR();
$(document).ready(function() {
  qr.init();
});

$(".photo").click( function() {
  qr.showText();
});

$(document).ajaxStart(function () {
  $(".spinner").css('left', ($(document).width() / 2) - 50);
  $(".spinner").css('top', $(document).height() / 2);
  qr.loading.show();
}).ajaxStop(function () {
  qr.loading.hide();
});

$("body").on("swiperight", function() { qr.nextItem("previous") });
$("body").on("swipeleft", function() { qr.nextItem("next") });
