/* Key Shift London — cookie/consent banner + privacy-first analytics loader.
 *
 * One self-contained script (injects its own styles + DOM) so every page gets a
 * consistent banner with a single <script src> include. Analytics is loaded ONLY after
 * the visitor accepts, and only a cookieless, privacy-friendly provider is used — so the
 * privacy policy's "no tracking cookies" promise stays true. The choice is remembered in
 * localStorage (functional, not tracking). No analytics runs until you configure it below.
 */
(function () {
  "use strict";

  // ---- CONFIGURE YOUR ANALYTICS HERE (both cookieless / GDPR-friendly) ----------------
  var ANALYTICS = {
    provider: "cloudflare",             // "plausible" | "cloudflare" | ""  ("" = off)
    plausibleDomain: "keyshiftlondon.org",
    cloudflareToken: "<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "9931eefe58674ba38db66f9b1cd41e69"}'></script><!-- End Cloudflare Web Analytics -->"                 // <-- paste your Cloudflare Web Analytics token here
  };
  // -------------------------------------------------------------------------------------

  var KEY = "ksl-consent";              // "granted" | "denied"
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}

  function loadAnalytics() {
    if (ANALYTICS.provider === "plausible" && ANALYTICS.plausibleDomain) {
      var p = document.createElement("script");
      p.defer = true; p.setAttribute("data-domain", ANALYTICS.plausibleDomain);
      p.src = "https://plausible.io/js/script.js";
      document.head.appendChild(p);
    } else if (ANALYTICS.provider === "cloudflare" && ANALYTICS.cloudflareToken) {
      var c = document.createElement("script");
      c.defer = true; c.src = "https://static.cloudflareinsights.com/beacon.min.js";
      c.setAttribute("data-cf-beacon", JSON.stringify({ token: ANALYTICS.cloudflareToken }));
      document.head.appendChild(c);
    }
  }

  if (stored === "granted") { loadAnalytics(); return; }
  if (stored === "denied") { return; }

  // ---- first visit: show the banner ----
  var css = ""
    + ".ksl-cc{position:fixed;left:0;right:0;bottom:0;z-index:1000;display:flex;justify-content:center;padding:14px;pointer-events:none}"
    + ".ksl-cc__card{pointer-events:auto;background:#fff;color:#1a1a1a;max-width:640px;width:100%;border:2px solid #0A0A0A;border-radius:14px;box-shadow:0 10px 40px -12px rgba(0,0,0,.35);padding:16px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-family:'Barlow Condensed',system-ui,sans-serif}"
    + ".ksl-cc__t{flex:1 1 260px;font-size:15.5px;line-height:1.45}"
    + ".ksl-cc__t a{color:#1A7A6E;font-weight:700}"
    + ".ksl-cc__btns{display:flex;gap:8px;flex:0 0 auto}"
    + ".ksl-cc__b{font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.04em;font-size:13.5px;padding:.6rem 1.1rem;border-radius:50px;cursor:pointer;border:2px solid #0A0A0A;background:#0A0A0A;color:#C8FF00}"
    + ".ksl-cc__b.ghost{background:transparent;color:#0A0A0A}"
    + ".ksl-cc__b:focus-visible{outline:3px solid #2ABFAF;outline-offset:2px}"
    + "@media(max-width:520px){.ksl-cc__btns{flex:1 1 100%}.ksl-cc__b{flex:1}}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement("div");
  bar.className = "ksl-cc";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", "Cookie and analytics consent");
  bar.innerHTML =
    '<div class="ksl-cc__card">' +
      '<div class="ksl-cc__t">We use privacy-friendly, cookieless analytics to see what’s useful — no ads, no selling your data. ' +
        'See our <a href="/privacy.html">Privacy Policy</a>.</div>' +
      '<div class="ksl-cc__btns">' +
        '<button class="ksl-cc__b ghost" type="button" data-ksl="deny">Decline</button>' +
        '<button class="ksl-cc__b" type="button" data-ksl="accept">Accept</button>' +
      '</div>' +
    '</div>';

  function decide(choice) {
    try { localStorage.setItem(KEY, choice); } catch (e) {}
    document.body.classList.remove("ksl-consent-open");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    if (choice === "granted") loadAnalytics();
  }

  function mount() {
    document.body.appendChild(bar);
    document.body.classList.add("ksl-consent-open");
    bar.addEventListener("click", function (e) {
      var t = e.target.closest("[data-ksl]");
      if (!t) return;
      decide(t.getAttribute("data-ksl") === "accept" ? "granted" : "denied");
    });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
