/* Key Shift London — 3D scenes (hero globe + PRE:CORD network).
   ES module. three.js is dynamically imported only when a scene nears the viewport,
   so pages that never reach a scene never download it.

   Fallbacks: no WebGL, or <=2 cores, or reduced-motion with no WebGL -> the HTML
   fallback stays (the globe image / the node list). Reduced-motion with WebGL -> one
   still frame, no spin, no pulses, no drift. Scenes pause their RAF when offscreen. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOWPOWER = (navigator.hardwareConcurrency || 4) <= 2;
/* Hero globe sits on the lime hero, so it reads in ink + teal (lime would vanish). */
const BLACK = 0x0A0A0A, TEAL = 0x1A7A6E, TEALB = 0x2ABFAF, LIME = 0xCCFF00;

function webglOK() {
  try { const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
  catch (e) { return false; }
}
function onNear(el, cb) {
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { io.disconnect(); cb(); } });
  }, { rootMargin: '200px' });
  io.observe(el);
}
function latLon(THREE, lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/* ============================ HERO GLOBE ============================ */
async function initGlobe(host) {
  const THREE = await import('./vendor/three.module.min.js');
  const canvas = host.querySelector('.globe-canvas');
  const lonOut = host.querySelector('.globe-lon');
  const uiLayer = host.querySelector('.globe-ui');
  const R = 1;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cam.position.set(0, 0, 3.6);

  const pivot = new THREE.Group();            // user drag + sway (horizontal)
  const globe = new THREE.Group();            // holds the London-facing orientation
  pivot.add(globe); scene.add(pivot);

  // dot shell (fibonacci sphere)
  const N = 1500, pos = new Float32Array(N * 3);
  const gold = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = gold * i;
    pos[i*3] = Math.cos(th)*rad*R; pos[i*3+1] = y*R; pos[i*3+2] = Math.sin(th)*rad*R;
  }
  const dotG = new THREE.BufferGeometry();
  dotG.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(dotG, new THREE.PointsMaterial({ color: BLACK, size: 0.02, sizeAttenuation: true, transparent: true, opacity: 0.82 }));
  globe.add(dots);

  // 30-degree graticule (lat rings + meridians)
  const gpts = [];
  const ring = (fn) => { let prev = null; for (let a = 0; a <= 360; a += 4) { const p = fn(a * Math.PI/180); if (prev) { gpts.push(prev.x,prev.y,prev.z,p.x,p.y,p.z); } prev = p; } };
  for (let lat = -60; lat <= 60; lat += 30) { const y = Math.sin(lat*Math.PI/180)*R, rr = Math.cos(lat*Math.PI/180)*R; ring(a => new THREE.Vector3(Math.cos(a)*rr, y, Math.sin(a)*rr)); }
  for (let lon = 0; lon < 360; lon += 30) { const c = Math.cos(lon*Math.PI/180), s = Math.sin(lon*Math.PI/180); ring(a => new THREE.Vector3(Math.cos(a)*R*c, Math.sin(a)*R, Math.cos(a)*R*s)); }
  const gratG = new THREE.BufferGeometry(); gratG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gpts), 3));
  const graticule = new THREE.LineSegments(gratG, new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.55 }));
  globe.add(graticule);

  // orient so London faces the camera (+Z)
  const londonV = latLon(THREE, 51.5074, -0.1278, 1).normalize();
  globe.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(londonV, new THREE.Vector3(0, 0, 1)));

  // London pin + 3 pulsing rings (added to globe so they orient with London)
  const pinPos = latLon(THREE, 51.5074, -0.1278, R);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: BLACK }));
  pin.position.copy(pinPos); globe.add(pin);
  const normal = pinPos.clone().normalize();
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const rg = new THREE.Mesh(new THREE.RingGeometry(0.045, 0.058, 32), new THREE.MeshBasicMaterial({ color: TEALB, transparent: true, side: THREE.DoubleSide }));
    rg.position.copy(pinPos.clone().addScaledVector(normal, 0.001));
    rg.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal));
    rings.push(rg); globe.add(rg);
  }

  // borough HTML labels
  const boroughs = [['Southwark', 51.503, -0.089], ['Lambeth', 51.49, -0.12], ['Croydon', 51.376, -0.098]];
  const labels = boroughs.map(([name, la, lo]) => {
    const el = document.createElement('span'); el.className = 'globe-label';
    el.innerHTML = '<b>' + name + '</b> ' + la.toFixed(2) + '°N';
    uiLayer.appendChild(el);
    return { el, v: latLon(THREE, la, lo, R) };
  });

  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  size();
  new ResizeObserver(size).observe(host);

  host.classList.add('scene-on');

  // interaction: horizontal drag
  let dragging = false, lastX = 0, userY = 0, vel = 0;
  const down = e => { dragging = true; lastX = (e.touches ? e.touches[0].clientX : e.clientX); };
  const move = e => { if (!dragging) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); vel = (x - lastX) * 0.006; userY += vel; lastX = x; };
  const up = () => { dragging = false; };
  if (!REDUCED) {
    host.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up);
    host.style.cursor = 'grab';
  }

  // spin-in + loop
  const start = performance.now(), SPIN = 3600;
  const tmpV = new THREE.Vector3(), camDir = new THREE.Vector3();
  let running = true, raf = 0;
  function frame(now) {
    if (!running) return;
    const t = Math.min((now - start) / SPIN, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const spin = REDUCED ? 0 : (1 - ease) * Math.PI * 2;      // spin in, settle to 0
    const sway = REDUCED ? 0 : Math.sin(now / 2800) * 0.08 * ease;
    pivot.rotation.y = spin + sway + userY;
    if (!dragging) userY *= 0.96;

    // pulse rings
    if (!REDUCED) rings.forEach((r, i) => {
      const p = ((now / 1000) + i * 0.6) % 1.8 / 1.8;
      const s = 1 + p * 3.4; r.scale.set(s, s, s); r.material.opacity = (1 - p) * 0.55;
    });

    // longitude readout + borough labels
    cam.getWorldDirection(camDir);
    const frontLon = -0.1278 - pivot.rotation.y * 180 / Math.PI;
    let L = ((frontLon % 360) + 540) % 360 - 180;
    if (lonOut) lonOut.textContent = Math.abs(L).toFixed(2) + '° ' + (L < 0 ? 'W' : 'E');
    labels.forEach(({ el, v }) => {
      tmpV.copy(v).applyQuaternion(globe.quaternion).applyEuler(pivot.rotation);
      const facing = tmpV.clone().normalize().dot(new THREE.Vector3(0, 0, 1));
      const p = tmpV.clone().project(cam);
      if (facing > 0.15 && p.z < 1) {
        el.style.opacity = Math.min(1, (facing - 0.15) * 3);
        el.style.left = (p.x * 0.5 + 0.5) * 100 + '%';
        el.style.top = (-p.y * 0.5 + 0.5) * 100 + '%';
      } else el.style.opacity = 0;
    });

    renderer.render(scene, cam);
    if (!REDUCED || t < 1) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // pause offscreen
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
  }), { threshold: 0 }).observe(host);
}

/* ============================ PRE:CORD NETWORK ============================ */
async function initNetwork(host) {
  const THREE = await import('./vendor/three.module.min.js');
  const canvas = host.querySelector('.network-canvas');
  const uiLayer = host.querySelector('.network-ui');
  // the accessible list is the source of truth; cards drive node selection
  const cards = [...document.querySelectorAll('[data-node]')];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  cam.position.set(0, 0, 6.2);
  const root = new THREE.Group(); scene.add(root);

  // hub: wireframe icosahedron
  const hub = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.72, 1)),
    new THREE.LineBasicMaterial({ color: TEALB, transparent: true, opacity: 0.85 }));
  root.add(hub);
  const hubCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0),
    new THREE.MeshBasicMaterial({ color: LIME })); root.add(hubCore);

  // 4 nodes: [name, x, y, z, inward]  (commissioners = outward)
  const defs = [
    ['young people', -2.5, 1.25, 0.2, true],
    ['mentors', 2.5, 1.25, -0.2, true],
    ['organisations', -2.5, -1.25, -0.2, true],
    ['commissioners', 2.5, -1.25, 0.2, false],
  ];
  const nodes = defs.map(([name, x, y, z, inward], i) => {
    const p = new THREE.Vector3(x, y, z);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshBasicMaterial({ color: TEAL })); dot.position.copy(p); root.add(dot);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.26, 32),
      new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    halo.position.copy(p); root.add(halo);
    // cord: gentle bow from node to hub
    const mid = p.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0, 0.6));
    const curve = new THREE.CatmullRomCurve3([p.clone(), mid, new THREE.Vector3(0, 0, 0)]);
    const tubeG = new THREE.TubeGeometry(curve, 48, 0.022, 8, false);
    const cord = new THREE.Mesh(tubeG, new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.6 }));
    cord.geometry.setDrawRange(0, 0); root.add(cord);
    // pulse
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshBasicMaterial({ color: LIME })); pulse.visible = false; root.add(pulse);
    // in-scene label (aria-hidden; the list carries this for a11y)
    const el = document.createElement('button'); el.className = 'network-label'; el.type = 'button';
    el.textContent = name; el.setAttribute('tabindex', '-1'); el.setAttribute('aria-hidden', 'true');
    el.addEventListener('click', () => setActive(i)); uiLayer.appendChild(el);
    return { name, p, dot, halo, cord, curve, pulse, inward, el, idxCount: tubeG.index.count };
  });

  let active = -1;
  function setActive(i) {
    active = i;
    nodes.forEach((n, j) => {
      const on = j === i;
      n.dot.material.color.setHex(on ? LIME : TEAL);
      n.cord.material.color.setHex(on ? LIME : TEAL);
      n.cord.material.opacity = on ? 0.95 : 0.6;
      n.el.classList.toggle('on', on);
    });
    cards.forEach((c, j) => c.classList.toggle('node-active', j === i));
  }
  cards.forEach((c, i) => { c.style.cursor = 'pointer'; c.addEventListener('click', () => setActive(i)); });

  function size() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); new ResizeObserver(size).observe(host);
  host.classList.add('scene-on');

  const start = performance.now(), DRAW = 1200;
  const tmp = new THREE.Vector3();
  let running = true, raf = 0;
  function frame(now) {
    if (!running) return;
    const draw = Math.min((now - start) / DRAW, 1);
    const ease = 1 - Math.pow(1 - draw, 3);
    if (!REDUCED) root.rotation.y = Math.sin(now / 4000) * 0.18;

    nodes.forEach((n, i) => {
      n.cord.geometry.setDrawRange(0, Math.floor(n.idxCount * ease));
      // pulse travels once cords are drawn
      if (!REDUCED && draw >= 1) {
        n.pulse.visible = true;
        let t = ((now / 1000) + i * 0.4) % 1.6 / 1.6;          // 0..1
        if (!n.inward) t = 1 - t;                               // commissioners: hub -> node
        n.pulse.position.copy(n.curve.getPointAt(t));
        n.pulse.material.color.setHex(i === active ? LIME : TEALB);
      }
      // halo pulse on the active node
      if (i === active && !REDUCED) {
        const p = (now / 1000) % 1.4 / 1.4; const s = 1 + p * 1.8;
        n.halo.scale.set(s, s, s); n.halo.material.opacity = (1 - p) * 0.7;
      } else { n.halo.material.opacity = 0; }
      // position the HTML label
      tmp.copy(n.p).applyEuler(root.rotation).project(cam);
      n.el.style.left = (tmp.x * 0.5 + 0.5) * 100 + '%';
      n.el.style.top = (-tmp.y * 0.5 + 0.5) * 100 + '%';
    });
    hubCore.rotation.y += 0.004; hub.rotation.y -= 0.002;

    renderer.render(scene, cam);
    if (!REDUCED || draw < 1) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  setActive(0);

  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
  }), { threshold: 0 }).observe(host);
}

/* bootstrap */
if (webglOK() && !LOWPOWER) {
  const g = document.querySelector('[data-scene="globe"]');
  if (g) onNear(g, () => initGlobe(g).catch(err => console.warn('globe scene failed', err)));
  const n = document.querySelector('[data-scene="network"]');
  if (n) onNear(n, () => initNetwork(n).catch(err => { console.warn('network scene failed', err); n.classList.add('no-webgl'); }));
} else {
  /* no WebGL / low power: collapse the reserved scene space; the node list stands alone */
  document.querySelectorAll('.tpn-scene').forEach(s => s.classList.add('no-webgl'));
}
