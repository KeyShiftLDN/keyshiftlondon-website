/* Key Shift London — scroll-motion layer. Loaded after site.js on every page.

   Entrance animations: as each section scrolls into view the first time, its
   top-level content blocks fade + rise in a stagger (big headings also resolve
   out of a soft blur). The hero / page top plays on arrival, right after the
   KSL loader leaves.

   Robustness: everything lives INSIDE the gsap + reduced-motion guard below.
   If GSAP is missing, or the visitor prefers reduced motion, this file does
   nothing and the page stays exactly as site.css renders it (content visible at
   rest) — so there is no "hidden until JS" state for no-JS / reduced-motion. */
(function(){
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  var DESKTOP = window.matchMedia('(min-width: 820px)').matches;

  /* ---------- 1) Content entrance (text, images, elements) ---------- */
  // Top-level content units. Nested matches are dropped so a card animates as one
  // piece (not the card AND its inner text). Transform-positioned pieces (e.g.
  // .tf-portrait, .globe) are handled separately so we don't fight their centring.
  var UNIT = 'h1,h2,h3,h4,p,.chapter,.eyebrow,.lead,.btn,.gcard,.aud-card,.pcb-node,' +
             '.tpn-node,.fs-item,.callout,.pss-card,.dopt,.proof-col,.shape-row,' +
             'picture,.pcb-panel,.tf-quote,.precord-logo,.gallery-pager,.sys-detail,' +
             '.train-note,.cta-strip,.final-ctas,.don-amts,.form-card,.price-pill';

  function topLevel(scope){
    var cands = Array.prototype.slice.call(scope.querySelectorAll(UNIT));
    return cands.filter(function(el){
      return !cands.some(function(o){ return o !== el && o.contains(el); });
    });
  }

  function revealSection(sec){
    var units = topLevel(sec);
    if (units.length){
      gsap.from(units, {
        autoAlpha: 0, y: 32, duration: .8, ease: 'power3.out', stagger: .07,
        scrollTrigger: { trigger: sec, start: 'top 82%', once: true }
      });
    }
    // big headings also resolve from a soft blur
    gsap.utils.toArray(sec.querySelectorAll('.big, .huge')).forEach(function (h) {
      gsap.fromTo(h, { filter: 'blur(9px)' }, {
        filter: 'blur(0px)', duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sec, start: 'top 82%', once: true }
      });
    });
  }

  function heroIntro(){
    var txt = document.querySelectorAll('.hero .hero-tag, .hero h1, .hero-sub, .hero-ctas, .hero-copy > p, .hero-badge, .hero-desc');
    if (txt.length) gsap.from(txt, { autoAlpha: 0, y: 34, duration: .9, ease: 'power3.out', stagger: .09 });
    var globe = document.querySelector('.hero .globe');            // autoAlpha only — it has its own spin + parallax
    if (globe) gsap.from(globe, { autoAlpha: 0, duration: 1.1, ease: 'power2.out' });
    if (document.querySelector('.hero h1'))
      gsap.fromTo('.hero h1', { filter: 'blur(10px)' }, { filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' });
  }

  // Sections to reveal: skip the journey (owns its own scroll) and the closing
  // section (its entrance is the signature pinned zoom, set up below).
  var sections = gsap.utils.toArray('section').filter(function (s) {
    return s.id !== 'what-we-do' && !s.classList.contains('final');
  });

  var done = false;
  function setupReveals(){
    if (done) return; done = true;
    sections.forEach(revealSection);
    heroIntro();
    ScrollTrigger.refresh();
  }
  // Play after the homepage loader leaves; on pages without it, play on run.
  if (document.getElementById('kslLoader')) {
    document.addEventListener('ksl:ready', setupReveals, { once: true });
    setTimeout(setupReveals, 2600);                 // fallback if the loader never signals
  } else {
    setupReveals();
  }

  /* ---------- 2) Zoom on scroll: section media gently scales through the viewport ---------- */
  gsap.utils.toArray('.pss-media img, .aud-media img, .who-img, .trust-photo img, .gc-media img').forEach(function (img) {
    gsap.fromTo(img, { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img.closest('section, header') || img, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- 3) Hero parallax-zoom on scroll-out ---------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    gsap.to('.hero-copy', { yPercent: 6, scale: .96, autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-visual', { scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- 4) Signature pinned zoom on the closing section (desktop) ---------- */
  var close = document.querySelector('.final');
  var closeHead = close && (close.querySelector('.huge') || close.querySelector('h2'));
  var closeBg = close && close.querySelector('.community-bg');
  if (close && closeHead && DESKTOP) {
    var tl = gsap.timeline({
      scrollTrigger: { trigger: close, start: 'top top', end: '+=70%', scrub: true,
        pin: true, pinSpacing: true, anticipatePin: 1 }
    });
    tl.fromTo(closeHead, { scale: .82, autoAlpha: .35 }, { scale: 1.1, autoAlpha: 1, ease: 'none' });
    if (closeBg) tl.fromTo(closeBg, { yPercent: -7, scale: 1.12 }, { yPercent: 7, scale: 1, ease: 'none' }, 0);  // bg drifts behind the pinned zoom
  } else if (closeBg) {
    gsap.fromTo(closeBg, { yPercent: -10 }, { yPercent: 10, ease: 'none',   // mobile / no-pin: plain scrub parallax
      scrollTrigger: { trigger: close, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  ScrollTrigger.refresh();
})();
