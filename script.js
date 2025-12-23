
(function () {
    var on = addEventListener,
      $ = function (q) {
        return document.querySelector(q);
      },
      $$ = function (q) {
        return document.querySelectorAll(q);
      },
      $body = document.body,
      $inner = $(".inner"),
      client = (function () {
        var o = {
            browser: "other",
            browserVersion: 0,
            os: "other",
            osVersion: 0,
            mobile: false,
            canUse: null,
            flags: { lsdUnits: false },
          },
          ua = navigator.userAgent,
          a,
          i;
        a = [
          ["firefox", /Firefox\/([0-9\.]+)/],
          ["edge", /Edge\/([0-9\.]+)/],
          ["safari", /Version\/([0-9\.]+).+Safari/],
          ["chrome", /Chrome\/([0-9\.]+)/],
          ["chrome", /CriOS\/([0-9\.]+)/],
          ["ie", /Trident\/.+rv:([0-9]+)/],
        ];
        for (i = 0; i < a.length; i++) {
          if (ua.match(a[i][1])) {
            o.browser = a[i][0];
            o.browserVersion = parseFloat(RegExp.$1);
            break;
          }
        }
        a = [
          [
            "ios",
            /([0-9_]+) like Mac OS X/,
            function (v) {
              return v.replace("_", ".").replace("_", "");
            },
          ],
          [
            "ios",
            /CPU like Mac OS X/,
            function (v) {
              return 0;
            },
          ],
          [
            "ios",
            /iPad; CPU/,
            function (v) {
              return 0;
            },
          ],
          ["android", /Android ([0-9\.]+)/, null],
          [
            "mac",
            /Macintosh.+Mac OS X ([0-9_]+)/,
            function (v) {
              return v.replace("_", ".").replace("_", "");
            },
          ],
          ["windows", /Windows NT ([0-9\.]+)/, null],
          ["undefined", /Undefined/, null],
        ];
        for (i = 0; i < a.length; i++) {
          if (ua.match(a[i][1])) {
            o.os = a[i][0];
            o.osVersion = parseFloat(
              a[i][2] ? a[i][2](RegExp.$1) : RegExp.$1
            );
            break;
          }
        }
        if (
          o.os == "mac" &&
          "ontouchstart" in window &&
          ((screen.width == 1024 && screen.height == 1366) ||
            (screen.width == 834 && screen.height == 1112) ||
            (screen.width == 810 && screen.height == 1080) ||
            (screen.width == 768 && screen.height == 1024))
        )
          o.os = "ios";
        o.mobile = o.os == "android" || o.os == "ios";
        var _canUse = document.createElement("div");
        o.canUse = function (property, value) {
          var style;
          style = _canUse.style;
          if (!(property in style)) return false;
          if (typeof value !== "undefined") {
            style[property] = value;
            if (style[property] == "") return false;
          }
          return true;
        };
        o.flags.lsdUnits = o.canUse("width", "100dvw");
        return o;
      })(),
      trigger = function (t) {
        dispatchEvent(new Event(t));
      },
      cssRules = function (selectorText) {
        var ss = document.styleSheets,
          a = [],
          f = function (s) {
            var r = s.cssRules,
              i;
            for (i = 0; i < r.length; i++) {
              if (
                r[i] instanceof CSSMediaRule &&
                matchMedia(r[i].conditionText).matches
              )
                f(r[i]);
              else if (
                r[i] instanceof CSSStyleRule &&
                r[i].selectorText == selectorText
              )
                a.push(r[i]);
            }
          },
          x,
          i;
        for (i = 0; i < ss.length; i++) f(ss[i]);
        return a;
      },
      thisHash = function () {
        var h = location.hash ? location.hash.substring(1) : null,
          a;
        if (!h) return null;
        if (h.match(/\?/)) {
          a = h.split("?");
          h = a[0];
          history.replaceState(undefined, undefined, "#" + h);
          window.location.search = a[1];
        }
        if (h.length > 0 && !h.match(/^[a-zA-Z]/)) h = "x" + h;
        if (typeof h == "string") h = h.toLowerCase();
        return h;
      },
      scrollToElement = function (e, style, duration) {
        var y, cy, dy, start, easing, offset, f;
        if (!e) y = 0;
        else {
          offset =
            (e.dataset.scrollOffset
              ? parseInt(e.dataset.scrollOffset)
              : 0) *
            parseFloat(getComputedStyle(document.documentElement).fontSize);
          switch (
            e.dataset.scrollBehavior ? e.dataset.scrollBehavior : "default"
          ) {
            case "default":
            default:
              y = e.offsetTop + offset;
              break;
            case "center":
              if (e.offsetHeight < window.innerHeight)
                y =
                  e.offsetTop -
                  (window.innerHeight - e.offsetHeight) / 2 +
                  offset;
              else y = e.offsetTop - offset;
              break;
            case "previous":
              if (e.previousElementSibling)
                y =
                  e.previousElementSibling.offsetTop +
                  e.previousElementSibling.offsetHeight +
                  offset;
              else y = e.offsetTop + offset;
              break;
          }
        }
        if (!style) style = "smooth";
        if (!duration) duration = 750;
        if (style == "instant") {
          window.scrollTo(0, y);
          return;
        }
        start = Date.now();
        cy = window.scrollY;
        dy = y - cy;
        switch (style) {
          case "linear":
            easing = function (t) {
              return t;
            };
            break;
          case "smooth":
            easing = function (t) {
              return t < 0.5
                ? 4 * t * t * t
                : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            };
            break;
        }
        f = function () {
          var t = Date.now() - start;
          if (t >= duration) window.scroll(0, y);
          else {
            window.scroll(0, cy + dy * easing(t / duration));
            requestAnimationFrame(f);
          }
        };
        f();
      },
      scrollToTop = function () {
        scrollToElement(null);
      },
      loadElements = function (parent) {
        var a, e, x, i;
        a = parent.querySelectorAll('iframe[data-src]:not([data-src=""])');
        for (i = 0; i < a.length; i++) {
          a[i].contentWindow.location.replace(a[i].dataset.src);
          a[i].dataset.initialSrc = a[i].dataset.src;
          a[i].dataset.src = "";
        }
        a = parent.querySelectorAll("video[autoplay]");
        for (i = 0; i < a.length; i++) {
          if (a[i].paused) a[i].play();
        }
        e = parent.querySelector('[data-autofocus="1"]');
        x = e ? e.tagName : null;
        switch (x) {
          case "FORM":
            e = e.querySelector(
              ".field input, .field select, .field textarea"
            );
            if (e) e.focus();
            break;
          default:
            break;
        }
      },
      unloadElements = function (parent) {
        var a, e, x, i;
        a = parent.querySelectorAll('iframe[data-src=""]');
        for (i = 0; i < a.length; i++) {
          if (a[i].dataset.srcUnload === "0") continue;
          if ("initialSrc" in a[i].dataset)
            a[i].dataset.src = a[i].dataset.initialSrc;
          else a[i].dataset.src = a[i].src;
          a[i].contentWindow.location.replace("about:blank");
        }
        a = parent.querySelectorAll("video");
        for (i = 0; i < a.length; i++) {
          if (!a[i].paused) a[i].pause();
        }
        e = $(":focus");
        if (e) e.blur();
      };
    window._scrollToTop = scrollToTop;
    var thisURL = function () {
      return window.location.href
        .replace(window.location.search, "")
        .replace(/#$/, "");
    };
    var getVar = function (name) {
      var a = window.location.search.substring(1).split("&"),
        b,
        k;
      for (k in a) {
        b = a[k].split("=");
        if (b[0] == name) return b[1];
      }
      return null;
    };
    var errors = {
      handle: function (handler) {
        window.onerror = function (message, url, line, column, error) {
          handler(error.message);
          return true;
        };
      },
      unhandle: function () {
        window.onerror = null;
      },
    };
    on("load", function () {
      setTimeout(function () {
        $body.classList.remove("is-loading");
        $body.classList.add("is-playing");
        setTimeout(function () {
          $body.classList.remove("is-playing");
          $body.classList.add("is-ready");
        }, 2375);
      }, 100);
    });
    loadElements(document.body);
    var style, sheet, rule;
    style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    sheet = style.sheet;
    if (client.mobile) {
      (function () {
        if (client.flags.lsdUnits) {
          document.documentElement.style.setProperty(
            "--viewport-height",
            "100svh"
          );
          document.documentElement.style.setProperty(
            "--background-height",
            "100dvh"
          );
        } else {
          var f = function () {
            document.documentElement.style.setProperty(
              "--viewport-height",
              window.innerHeight + "px"
            );
            document.documentElement.style.setProperty(
              "--background-height",
              window.innerHeight + 250 + "px"
            );
          };
          on("load", f);
          on("orientationchange", function () {
            setTimeout(function () {
              f();
            }, 100);
          });
        }
      })();
    }
    if (client.os == "android") {
      (function () {
        sheet.insertRule("body::after { }", 0);
        rule = sheet.cssRules[0];
        var f = function () {
          rule.style.cssText =
            "height: " + Math.max(screen.width, screen.height) + "px";
        };
        on("load", f);
        on("orientationchange", f);
        on("touchmove", f);
      })();
      $body.classList.add("is-touch");
    } else if (client.os == "ios") {
      if (client.osVersion <= 11)
        (function () {
          sheet.insertRule("body::after { }", 0);
          rule = sheet.cssRules[0];
          rule.style.cssText = "-webkit-transform: scale(1.0)";
        })();
      if (client.osVersion <= 11)
        (function () {
          sheet.insertRule("body.ios-focus-fix::before { }", 0);
          rule = sheet.cssRules[0];
          rule.style.cssText = "height: calc(100% + 60px)";
          on(
            "focus",
            function (event) {
              $body.classList.add("ios-focus-fix");
            },
            true
          );
          on(
            "blur",
            function (event) {
              $body.classList.remove("ios-focus-fix");
            },
            true
          );
        })();
      $body.classList.add("is-touch");
    }

    // Mouse effect code
    let start = new Date().getTime();
    const originPosition = { x: 0, y: 0 };
    const last = { starTimestamp: start, starPosition: originPosition, mousePosition: originPosition };
    const config = {
      starAnimationDuration: 1500,
      minimumTimeBetweenStars: 250,
      minimumDistanceBetweenStars: 75,
      glowDuration: 75,
      maximumGlowPointSpacing: 10,
      colors: [[249, 146, 253], [252, 254, 255]],
      sizes: ['1.4rem', '1rem', '0.6rem'],
      animations: ['fall-1', 'fall-2', 'fall-3']
    };

    let count = 0;
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const selectRandom = (items) => items[rand(0, items.length - 1)];
    const withUnit = (value, unit) => `${value}${unit}`;
    const px = (value) => withUnit(value, 'px');
    const ms = (value) => withUnit(value, 'ms');
    const calcDistance = (a, b) => {
      const diffX = b.x - a.x;
      const diffY = b.y - a.y;
      return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    };
    const calcElapsedTime = (start, end) => end - start;
    const appendElement = (element) => document.body.appendChild(element);
    const removeElement = (element, delay) => setTimeout(() => document.body.removeChild(element), delay);

    const createStar = (position) => {
      const star = document.createElement('span');
      const color = selectRandom(config.colors);
      star.className = 'star fa-solid fa-sparkle';
      star.style.left = px(position.x);
      star.style.top = px(position.y);
      star.style.fontSize = selectRandom(config.sizes);
      star.style.color = `rgb(${color})`;
      star.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
      star.style.animationName = config.animations[count % 3];
      star.style.animationDuration = ms(config.starAnimationDuration);
      appendElement(star);
      removeElement(star, config.starAnimationDuration);
    };

    const createGlowPoint = (position) => {
      const glow = document.createElement('div');
      glow.className = 'glow-point';
      glow.style.left = px(position.x);
      glow.style.top = px(position.y);
      appendElement(glow);
      removeElement(glow, config.glowDuration);
    };

    const determinePointQuantity = (distance) =>
      Math.max(Math.floor(distance / config.maximumGlowPointSpacing), 1);

    const createGlow = (last, current) => {
      const distance = calcDistance(last, current);
      const quantity = determinePointQuantity(distance);
      const dx = (current.x - last.x) / quantity;
      const dy = (current.y - last.y) / quantity;
      Array.from({ length: quantity }, (_, index) => {
        const x = last.x + dx * index;
        const y = last.y + dy * index;
        createGlowPoint({ x, y });
      });
    };

    const updateLastStar = (position) => {
      last.starTimestamp = new Date().getTime();
      last.starPosition = position;
    };

    const updateLastMousePosition = (position) => {
      last.mousePosition = position;
    };

    const adjustLastMousePosition = (position) => {
      if (last.mousePosition.x === 0 && last.mousePosition.y === 0) {
        last.mousePosition = position;
      }
    };

    const handleOnMove = (e) => {
      const mousePosition = { x: e.clientX, y: e.clientY };
      adjustLastMousePosition(mousePosition);
      const now = new Date().getTime();
      const hasMovedFarEnough =
        calcDistance(last.starPosition, mousePosition) >= config.minimumDistanceBetweenStars;
      const hasBeenLongEnough =
        calcElapsedTime(last.starTimestamp, now) >= config.minimumTimeBetweenStars;
      if (hasMovedFarEnough && hasBeenLongEnough) {
        createStar(mousePosition);
        updateLastStar(mousePosition);
      }
      if (mousePosition.x !== last.mousePosition.x || mousePosition.y !== last.mousePosition.y) {
        createGlow(last.mousePosition, mousePosition);
      }
      updateLastMousePosition(mousePosition);
    };

    window.onmousemove = (e) => handleOnMove(e);
    window.ontouchmove = (e) => handleOnMove(e.touches[0]);
    document.body.onmouseleave = () => updateLastMousePosition(originPosition);
  }
)();