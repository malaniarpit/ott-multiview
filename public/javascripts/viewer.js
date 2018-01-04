// Copyright 2016 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Birme (Eyevinn Technology)
var activeViewPort;
var shakaPlayers = {};

function initHlsPlayer(conf, videoelemid, donecb) {
  var hlsconfig = {
    capLevelToPlayerSize: true
  };
  var hls = new Hls(hlsconfig);
  var videoelem = document.getElementById(videoelemid);
  hls.attachMedia(videoelem);
  hls.on(Hls.Events.MEDIA_ATTACHED, function() {
    hls.loadSource(conf.manifest);
    hls.on(Hls.Events.MANIFEST_PARSED, function(ev, data) {
      videoelem.muted = true;
      videoelem.play();
      donecb(videoelem);
    });
  });
  hls.on(Hls.Events.ERROR, function (event, data) {
    if (data.fatal) {
      switch(data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
      // try to recover network error
        console.log("fatal network error encountered, try to recover");
        hls.startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.log("fatal media error encountered, try to recover");
        hls.recoverMediaError();
        break;
      default:
        // cannot recover
        hls.destroy();
        break;
      }
    }
  });
  hls.on(Hls.Events.LEVEL_SWITCH, function(event, data) {
    var level = hls.levels[data.level];
    //var metaelem = document.getElementById(hls.media.id + '-meta');
    //metaelem.innerHTML = (level.bitrate / 1000).toFixed(0) + 'kbps';
    //var titleelem = document.getElementById(videoelemid+'-title');
    //titleelem.innerHTML += ' (' + (level.bitrate / 1000).toFixed(0) + 'kbps' + ')';  
  });
}

function initDashPlayer(conf, videoelemid, donecb) {
  var videoelem = document.getElementById(videoelemid);
  var shakap = new shaka.Player(videoelem);
  shakaPlayers[videoelemid] = shakap;
  videoelem.addEventListener('progress', function(ev) {
    if (shakaPlayers[ev.target.id]) {
      var p = shakaPlayers[ev.target.id];
      var stats = p.getStats();
      //var metaelem = document.getElementById(ev.target.id + '-meta');
      //metaelem.innerHTML = (stats.streamBandwidth / 1000).toFixed(0) + 'kbps';
      //var titleelem = document.getElementById(videoelemid+'-title');
      //titleelem.innerHTML += ' (' + (level.bitrate / 1000).toFixed(0) + 'kbps' + ')';  
    }
  });

  shakap.load(conf.manifest).then(function(ev) {
    videoelem.muted = true;
    shakap.setMaxHardwareResolution(600, 600);
    videoelem.play();
    donecb(videoelem);
  }).catch(function(e) { console.log("Error: ", e); });
}

function initPlayer(conf, videoelemid, donecb) {
  if (conf.type === 'hls') {
    initHlsPlayer(conf, videoelemid, donecb);
  } else if (conf.type === 'dash') {
    initDashPlayer(conf, videoelemid, donecb);
  }
}

function onVideoClick(ev) {
  activateViewPort(ev.target.id);
}

function onWaiting(ev) {
  ev.target.className +=" video-buffering";
}

function onPlaying(ev) {
  ev.target.className = ev.target.className.replace("video-buffering", "");
}

function initViewPort(conf, videoelemid) {
  var titleelem = document.getElementById(videoelemid+'-title');
  titleelem.innerHTML = conf.title;

  initPlayer(conf, videoelemid, function(videoelem) {
    //console.log(videoelemid + " loaded!");
    videoelem.addEventListener("click", onVideoClick);
    videoelem.addEventListener("waiting", onWaiting);
    videoelem.addEventListener("playing", onPlaying);
  });
}

function initViewPortRow(row, numcols, config) {
  for (var i=0; i<numcols; i++) {
    videoelemid = "vp"+row+i;
    c = config['row'+row][i];
    if (c) {
      initViewPort(c, videoelemid);
    }
  }
}

function activateViewPort(videoelemid) {
  if (activeViewPort) {
    currentActiveVideoElem = document.getElementById(activeViewPort);
    currentActiveVideoElem.className = currentActiveVideoElem.className.replace("video-unmuted", "");
    currentActiveVideoElem.muted = true;
  }
  if (activeViewPort != videoelemid) {
    newActiveVideoElem = document.getElementById(videoelemid);
    newActiveVideoElem.className += " video-unmuted";
    newActiveVideoElem.muted = false;
    activeViewPort = videoelemid;
  } else {
    activeViewPort = undefined;
  }
}

function togglePlayback(videoelem) {
  if (videoelem.paused) {
    videoelem.play();
  } else {
    videoelem.pause();
  }
}

function togglePlaybackOnAllViewPorts() {
  for(var i=0; i<4; i++) {
    for(var j=0; j<4; j++) {
      var videoelem = document.getElementById('vp'+i+j);
      togglePlayback(videoelem);
    }
  } 
}

function initMultiView(config) {
  if (config) {
    shaka.polyfill.installAll();
    initViewPortRow(0, 4, config);
    initViewPortRow(1, 4, config);
    initViewPortRow(2, 4, config);
    initViewPortRow(3, 4, config);
  }
}

function onKeyPress(ev) {
  if (ev.keyCode == 32) {
    // space
    console.log('operator hit space');
    togglePlaybackOnAllViewPorts();
    ev.preventDefault();
    ev.stopPropagation();
  } else if (ev.keyCode == 102) {
    // f
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  } else if (ev.keyCode >= 49 && ev.keyCode <= 57) {
    // 1-9 
    var idx = ev.keyCode - 49;
    var row = Math.floor(idx/4);
    idx = idx % 4;
    videoelemid = 'vp' + row + idx;
    activateViewPort(videoelemid);
  }else if (ev.keyCode >= 65 && ev.keyCode <= 71) {
    // A-C 
    var idx = ev.keyCode - 56;
    var row = Math.floor(idx/4);
    idx = idx % 4;
    videoelemid = 'vp' + row + idx;
    activateViewPort(videoelemid);
  }
}

function initKeyControls() {
  document.addEventListener("keypress", onKeyPress, false);
}
