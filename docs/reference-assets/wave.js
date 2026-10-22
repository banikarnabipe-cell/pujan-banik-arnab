// Dot wave, as in the Retriever app. Draws on every <canvas class="wave">.
// Animates only while the canvas is visible and on screen; otherwise a still frame.
// Colour comes from the canvas's CSS color, so it follows light and dark mode.
// data-cols, data-rows, data-speed, data-alpha and data-size adjust it per area; the defaults are the app's for small areas, where the full grid and speed get restless.
(function () {
  var COLS = 48, ROWS = 26;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvases = Array.prototype.slice.call(document.querySelectorAll('canvas.wave'));
  var onScreen = new Map();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { onScreen.set(e.target, e.isIntersecting); });
  });
  canvases.forEach(function (cv) { onScreen.set(cv, true); io.observe(cv); });

  function draw(cv, t) {
    var s = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== w * s || cv.height !== h * s) { cv.width = w * s; cv.height = h * s; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(s, 0, 0, s, 0, 0);
    var rgb = getComputedStyle(cv).color.match(/\d+/g).slice(0, 3).join(',');
    var cols = +cv.dataset.cols || COLS, rows = +cv.dataset.rows || ROWS, speed = +cv.dataset.speed || 1;
    var alpha = +cv.dataset.alpha || 1, size = +cv.dataset.size || 1;   // stronger and bigger for large areas like the hero
    t = t * speed;
    var dx = w / cols, dy = h / rows;
    ctx.clearRect(0, 0, w, h);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var phase = c * 0.32 + r * 0.2 - t * 0.9;
      var sn = Math.sin(phase), k = (sn + 1) / 2;
      var x = (c + 0.5) * dx, y = (r + 0.5) * dy + sn * dy * 0.3;
      ctx.fillStyle = 'rgba(' + rgb + ',' + Math.min(1, (0.04 + k * 0.14) * alpha) + ')';
      ctx.beginPath(); ctx.arc(x, y, (1.5 + k * 2.5) * size / 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  function visible(cv) {
    if (!onScreen.get(cv) || document.hidden) return false;
    return cv.checkVisibility ? cv.checkVisibility({ visibilityProperty: true }) : true;
  }
  function frame(now) {
    var t = now / 1000;
    canvases.forEach(function (cv) { if (visible(cv)) draw(cv, t); });
    if (!still) requestAnimationFrame(frame);
  }
  // still frame for everything once, so hidden panes are not blank when they appear
  canvases.forEach(function (cv) { draw(cv, 0); });
  requestAnimationFrame(frame);
  addEventListener('resize', function () { canvases.forEach(function (cv) { draw(cv, 0); }); });
})();
