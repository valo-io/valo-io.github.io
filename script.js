/*
 * Links page behaviour.
 *
 * 1. Intro: <body> starts with "is-loading", switches to "is-playing" while the
 *    intro animation runs, then to "is-ready" (style.css reacts to these classes).
 * 2. Device fixes: phones get viewport-height CSS variables, and touch devices get
 *    the "is-touch" class. Older iOS and Android versions also get a few extra
 *    CSS rules inserted here, because of browser bugs with the viewport height.
 */
(function () {
  "use strict";

  var INTRO_START_DELAY_MS = 100;
  var INTRO_DURATION_MS = 2375;

  var body = document.body;
  var root = document.documentElement;

  // Works out the operating system and its version from the user agent string.
  function detectClient() {
    var ua = navigator.userAgent;
    var os = "other";
    var osVersion = 0;

    // Each entry: [os name, pattern, optional function that turns the match into a version].
    var toVersion = function (v) {
      return v.replace("_", ".").replace("_", "");
    };
    var osPatterns = [
      ["ios", /([0-9_]+) like Mac OS X/, toVersion],
      ["ios", /CPU like Mac OS X/, function () { return 0; }],
      ["ios", /iPad; CPU/, function () { return 0; }],
      ["android", /Android ([0-9\.]+)/, null],
      ["mac", /Macintosh.+Mac OS X ([0-9_]+)/, toVersion],
      ["windows", /Windows NT ([0-9\.]+)/, null],
      ["undefined", /Undefined/, null]
    ];

    for (var i = 0; i < osPatterns.length; i++) {
      var match = ua.match(osPatterns[i][1]);
      if (match) {
        os = osPatterns[i][0];
        osVersion = parseFloat(osPatterns[i][2] ? osPatterns[i][2](match[1]) : match[1]);
        break;
      }
    }

    // iPadOS 13+ reports itself as a Mac, so check for a touch screen at iPad sizes.
    var isIpadScreenSize =
      (screen.width === 1024 && screen.height === 1366) ||
      (screen.width === 834 && screen.height === 1112) ||
      (screen.width === 810 && screen.height === 1080) ||
      (screen.width === 768 && screen.height === 1024);
    if (os === "mac" && "ontouchstart" in window && isIpadScreenSize) {
      os = "ios";
    }

    return {
      os: os,
      osVersion: osVersion,
      mobile: os === "android" || os === "ios"
    };
  }

  // Creates an empty style sheet we can add rules to from JavaScript.
  function createStyleSheet() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    return style.sheet;
  }

  // Checks whether this browser understands the "dvw" unit (dynamic viewport width).
  function supportsDynamicViewportUnits() {
    var probe = document.createElement("div");
    probe.style.width = "100dvw";
    return probe.style.width !== "";
  }

  function useDynamicViewportHeights() {
    root.style.setProperty("--viewport-height", "100svh");
    root.style.setProperty("--background-height", "100dvh");
  }

  function useFixedViewportHeights() {
    root.style.setProperty("--viewport-height", window.innerHeight + "px");
    root.style.setProperty("--background-height", window.innerHeight + 250 + "px");
  }

  function startIntroAnimation() {
    window.addEventListener("load", function () {
      setTimeout(function () {
        body.classList.remove("is-loading");
        body.classList.add("is-playing");
        setTimeout(function () {
          body.classList.remove("is-playing");
          body.classList.add("is-ready");
        }, INTRO_DURATION_MS);
      }, INTRO_START_DELAY_MS);
    });
  }

  function applyPhoneViewportFix() {
    if (supportsDynamicViewportUnits()) {
      useDynamicViewportHeights();
      return;
    }
    window.addEventListener("load", useFixedViewportHeights);
    window.addEventListener("orientationchange", function () {
      setTimeout(useFixedViewportHeights, 100);
    });
  }

  // Android: a full-height ::after element so the background covers the whole screen.
  function applyAndroidFix() {
    var sheet = createStyleSheet();
    sheet.insertRule("body::after { }", 0);
    var afterRule = sheet.cssRules[0];
    var setHeight = function () {
      afterRule.style.cssText =
        "height: " + Math.max(screen.width, screen.height) + "px";
    };
    window.addEventListener("load", setHeight);
    window.addEventListener("orientationchange", setHeight);
    window.addEventListener("touchmove", setHeight);
    body.classList.add("is-touch");
  }

  // iOS 11 and older: work around background and focus bugs.
  function applyOldIosFix() {
    var sheet = createStyleSheet();

    sheet.insertRule("body::after { }", 0);
    sheet.cssRules[0].style.cssText = "-webkit-transform: scale(1.0)";

    sheet.insertRule("body.ios-focus-fix::before { }", 0);
    sheet.cssRules[0].style.cssText = "height: calc(100% + 60px)";
    window.addEventListener("focus", function () {
      body.classList.add("ios-focus-fix");
    }, true);
    window.addEventListener("blur", function () {
      body.classList.remove("ios-focus-fix");
    }, true);
  }

  function applyIosFix(osVersion) {
    if (osVersion <= 11) {
      applyOldIosFix();
    }
    body.classList.add("is-touch");
  }

  // ---- start -------------------------------------------------------------
  var client = detectClient();
  startIntroAnimation();

  if (client.mobile) {
    applyPhoneViewportFix();
  }
  if (client.os === "android") {
    applyAndroidFix();
  } else if (client.os === "ios") {
    applyIosFix(client.osVersion);
  }
})();
