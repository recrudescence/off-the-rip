var system = require('system');
var page = require('webpage').create();

var info = {};
var logs = [];

// Capture Resources
page.onResourceRequested = function(request) {
  // console.log('Request ' + JSON.stringify(request, undefined, 4));

  // Get highest res artwork
  if (request.url.indexOf('500x500') !== -1 && !info.artwork) {
    info.artwork = request.url;

    logs.push({
      type: "log",
      data: "Found artwork: [" + info.artwork + "]"
    });
  }

  // build stream url ourselves
  if(request.url.indexOf('api.soundcloud') !== -1 && !info.stream_api_uri) {

    var split = request.url.split("tracks/");
    var tid = split[1].substring(0, split[1].indexOf('/'));

    split = request.url.split("client_id=");
    var cid = split[1].substring(0, split[1].indexOf('&'));

    split = request.url.split("app_version=");
    var av = split[1];

    info.stream_api_uri = "https://api.soundcloud.com/i1/tracks/" + tid + "/streams?client_id=" + cid + "&app_version=" + av;

    logs.push({
      type: "log",
      data: "Found stream API url: [" + info.stream_api_uri + "]"
    });
  }

  if(info.artwork && info.stream_api_uri && info.title && info.username) {

    // Attempt to extract an artist name from the track title, kind of common in soundcloud tracks
    var split;
    if (info.title.indexOf('~') !== -1) { split = '~'; }
    else if (info.title.indexOf('-') !== -1) { split = '-'; }

    if(split) {
      var parts = info.title.split(split);
      info.artist = parts[0].trim();
      info.title = parts[1].trim();
    }
    else {
      info.artist = info.username;
    }

    logs.push({
      type: "log",
      data: "Found title: [" + info.title + "]"
    });

    logs.push({
      type: "log",
      data: "Found artist: [" + info.artist + "]"
    });

    logs.push({
      type: "payload",
      data: info
    });

    console.log(JSON.stringify(logs));

    setTimeout(function() {
      phantom.exit(0);
    }, 0);
  }
};

var url = system.args[1];
if(url) {
  page.open(url, function(status) {
    page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {

      // Check the page until the play button exists
      logs.push({
        type: "log",
        data: "Waiting for play button"
      });
      var interval = setInterval(function() {

        if(page.evaluate(function() {
          return $('.playButton').length;
        })) {
          clearInterval(interval);

          info.title = page.evaluate(function() {
            return $('.soundTitle__title:first').text().replace("\n", "").trim();
          });

          info.username = page.evaluate(function() {
            return $('.soundTitle__usernameHero').text().replace("\n", "").trim();
          });
        }
      }, 300);
    });
  });
}
