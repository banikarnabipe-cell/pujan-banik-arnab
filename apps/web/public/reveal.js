// Motion contract: reveal-on-enter. Transform/opacity only.
// v0.7.0 policy: NO reduced-motion gate — reveals animate for every user
// (owner directive, documented in docs/MOTION.md). The only fallback is the
// absence of IntersectionObserver (no-observe).
//
// v0.7.1: this logic moved OUT of Layout.astro into an external file.
// Astro auto-inlines small processed <script> blocks, and the CSP in
// apps/web/public/_headers pins inline scripts by sha256 — an unpinned
// inline script is silently blocked on the edge, leaving every
// [data-reveal] element permanently invisible. An external script is
// covered by script-src 'self' with zero hash maintenance.
// Enforced by tooling/scripts/verify-csp.mjs (CI) and
// tooling/scripts/verify-csp-render.mjs (render-level gate).
(function () {
  var root = document.documentElement;
  if (!("IntersectionObserver" in window)) {
    root.classList.add("no-observe");
    return;
  }
  var io = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add("is-in");
          io.unobserve(entries[i].target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );
  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    io.observe(el);
  });
})();
