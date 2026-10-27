/* Key Shift London — scroll-motion layer (reveals, parallax-zoom, zoom-on-scroll,
   one pinned zoom). Loaded after site.js on every page.

   Robustness: every reveal/zoom lives INSIDE the gsap + reduced-motion guard below.
   If GSAP is missing, or the visitor prefers reduced motion, this file does nothing
   and the page stays exactly as site.css renders it (content visible at rest). So
   there is no "hidden until JS" state for no-JS or reduced-motion users. */
(function(){
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  var DESKTOP = window.matchMedia('(min-width: 820px)').matches;

  /* 1) Scroll reveals: fade + rise; big headings also resolve out of a light blur */
  gsap.utils.toArray('.reveal').forEach(function (el) {
    if (el.closest('.hero')) return;                 // hero shows immediately
    if (el.closest('#what-we-do')) return;           // the journey owns its own scroll
    var from = { autoAlpha: 0, y: 36 };
    var to = { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out',
               scrollTrigger: { trigger: el, start: 'top 86%' } };
    if (el.matches('.big, .huge')) { from.filter = 'blur(10px)'; to.filter = 'blur(0px)'; to.duration = 1.05; }
    gsap.fromTo(el, from, to);
  });

  /* 2) Zoom on scroll: section media gently scales as it travels through the viewport */
  gsap.utils.toArray('.pss-media img, .aud-media img, .who-img, .trust-photo img').forEach(function (img) {
    gsap.fromTo(img, { scale: 1.14 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img.closest('section, header') || img, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* 3) Hero parallax-zoom: copy eases back and fades, the visual pushes in, on scroll out */
  var hero = document.querySelector('.hero');
  if (hero) {
    gsap.to('.hero-copy', { yPercent: 6, scale: .96, autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-visual', { scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* 4) Section headings scale in a touch as they enter (not in the hero) */
  gsap.utils.toArray('h1.big, h2.big, .huge').forEach(function (h) {
    if (h.closest('.hero')) return;
    if (h.closest('#what-we-do')) return;            // the journey owns its own scroll
    gsap.from(h, { scale: .93, ease: 'power2.out', duration: .9,
      scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  /* 5) Signature pinned zoom on the closing section (desktop only): the headline is
        held and zooms up as you scroll through it, then releases to the footer. */
  var close = document.querySelector('.final');
  var closeHead = close && (close.querySelector('.huge') || close.querySelector('h2'));
  if (close && closeHead && DESKTOP) {
    gsap.timeline({
      scrollTrigger: { trigger: close, start: 'top top', end: '+=70%', scrub: true,
        pin: true, pinSpacing: true, anticipatePin: 1 }
    }).fromTo(closeHead, { scale: .82, autoAlpha: .35 }, { scale: 1.1, autoAlpha: 1, ease: 'none' });
  }

  ScrollTrigger.refresh();
})();
