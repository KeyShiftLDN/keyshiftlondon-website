/* KSL "three moves" journey. Drop-in for #what-we-do on the restructured homepage.
   Starts on lime with the pattern in black ink, dives to black as the shapes light up in brand colour,
   then flies through 01 Prepare (grey arrows align), 02 Process (six teal pillars rise), 03 Precord (lime arrows chain into a hub),
   and fades to plain black so it hands straight over to the dark PRE:CORD section.
   The page is fully readable without this file: it only switches on "live" mode once the scene is ready.
   Works alongside Lenis (native scroll) and needs no GSAP. */
const THREE_URL = new URL('./vendor/three.module.min.js', import.meta.url).href; // self-hosted three.js r160
const root = document.documentElement;
const journey = document.querySelector('#what-we-do.kj');
const stage = document.getElementById('kj-stage');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOW = (navigator.hardwareConcurrency || 4) <= 2;
const SPRITES = ['arrow-lime','arrow-teal','arrow-grey', ...Array.from({length:27},(_,i)=>'doodle-'+String(i).padStart(2,'0'))];

if (!REDUCED && !LOW && journey && stage) boot().catch(()=>{ /* stay static */ });

async function boot(){
  const THREE = await import(THREE_URL);
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;

  const loader = new THREE.TextureLoader(), tex = {};
  await Promise.all(SPRITES.map(n => new Promise((res, rej) => loader.load(new URL(`./sprites/${n}.png`, import.meta.url).href, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; tex[n] = t; res(); }, undefined, rej))));

  const MOBILE = innerWidth < 820;
  const LIME = new THREE.Color(0xC8FF00), BLACK = new THREE.Color(0x0A0A0A), WHITE = new THREE.Color(0xffffff), INK = new THREE.Color(0x0A0A0A);
  const TEAL = 0x1A7A6E, TEALB = 0x2ABFAF, LIMEH = 0xC8FF00;

  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const ground = LIME.clone();
  scene.fog = new THREE.Fog(ground, 4, 34);
  const camera = new THREE.PerspectiveCamera(MOBILE ? 66 : 55, 1, .1, 120);

  const path = new THREE.CatmullRomCurve3([[0,.3,7],[.6,.5,-14],[-.4,.9,-34],[.5,.4,-58],[-.3,.8,-82],[.3,1.4,-106],[0,1.8,-124]].map(p=>new THREE.Vector3(...p)));
  const at = (p, off=new THREE.Vector3()) => path.getPointAt(Math.min(Math.max(p,0),1)).add(off);
  const side = MOBILE ? new THREE.Vector3(0,1.15,0) : new THREE.Vector3(2.5,.1,0);

  /* every sprite material is tinted: black ink on lime, true colour on black */
  const tinted = [];
  function sprite(name, height, opacity=1, parent=scene){
    const t = tex[name], asp = t.image.width / t.image.height;
    const mat = new THREE.MeshBasicMaterial({ map:t, transparent:true, depthWrite:false, opacity, color:INK.clone() });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(height*asp, height), mat);
    m.userData.baseOpacity = opacity; parent.add(m); tinted.push(m); return m;
  }

  const grid = new THREE.GridHelper(260, 130, TEAL, TEAL);
  grid.material.transparent = true; grid.material.opacity = 0; grid.material.depthWrite = false;
  grid.position.set(0, -4.2, -60); scene.add(grid);

  const rnd = mulberry(11);
  const doodles = [];
  for (let i=0, N = MOBILE ? 110 : 180; i<N; i++){
    const z = 3 - rnd()*146;
    const base = path.getPointAt(Math.min(Math.max((7 - z)/131,0),1));
    const s = rnd()<.5 ? -1 : 1;
    const m = sprite('doodle-'+String(Math.floor(rnd()*27)).padStart(2,'0'), .5 + rnd()*.9, .14 + rnd()*.3);
    m.position.set(base.x + s*(2.6 + rnd()*7.5), -3.2 + rnd()*8.5, z);
    m.rotation.z = (rnd()-.5)*1;
    m.userData = { ...m.userData, y:m.position.y, ph:rnd()*6.28, sp:.4+rnd()*.6, doodle:true };
    doodles.push(m);
  }

  /* intro arrows: large, inked on lime, light up as the ground drops */
  const introBase = at(0);
  const intro = (MOBILE
    ? [['arrow-lime',1.3,[1.3,2.4,-6.5]],['arrow-teal',1.05,[-1.4,3.0,-8.5]],['arrow-grey',.95,[2.1,1.1,-9.5]]]
    : [['arrow-lime',1.9,[3.4,.3,-6.5]],['arrow-teal',1.5,[5.4,1.7,-9.5]],['arrow-grey',1.4,[4.6,-1.6,-8.5]]]
  ).map(([n,h,p],i)=>{ const m=sprite(n,h); m.position.copy(introBase).add(new THREE.Vector3(...p)); m.userData.y=m.position.y; m.userData.ph=i*2; return m; });

  /* 01 Prepare */
  const prepC = at(.29+.045, side);
  const prep = Array.from({length:7},(_,i)=>{
    const m = sprite('arrow-grey', MOBILE?.8:1);
    Object.assign(m.userData, { from:new THREE.Vector3((rnd()-.5)*4.6,(rnd()-.5)*3.2,(rnd()-.5)*3).add(prepC), fr:(rnd()-.5)*2.8, to:new THREE.Vector3(-1.8+i*.6,-1.4+i*.45,-i*.25).add(prepC), tr:.35 });
    return m;
  });

  /* 02 Process */
  const procC = at(.53+.045, side);
  const colGeo = new THREE.PlaneGeometry(.07, 1); colGeo.translate(0,.5,0);
  const proc = Array.from({length:6},(_,i)=>{
    const m = sprite('arrow-teal', MOBILE?.75:.95, 0);
    const x = -2.3 + i*.92 + procC.x, z = -i*.35 + procC.z;
    const col = new THREE.Mesh(colGeo, new THREE.MeshBasicMaterial({ color:TEALB, transparent:true, opacity:0, depthWrite:false }));
    col.position.set(x,-4.2,z); scene.add(col);
    Object.assign(m.userData, { x, z, top:-.7 + i*.28 + procC.y, col });
    return m;
  });

  /* 03 Precord */
  const recC = at(.78+.04, side);
  const hub = new THREE.Vector3(1.7,.5,-.5).add(recC), start = new THREE.Vector3(-2.5,-1.5,.6).add(recC);
  const hubRing = new THREE.Mesh(new THREE.RingGeometry(.42,.5,64), new THREE.MeshBasicMaterial({ color:LIMEH, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false }));
  const hubDot = new THREE.Mesh(new THREE.CircleGeometry(.16,32), new THREE.MeshBasicMaterial({ color:LIMEH, transparent:true, opacity:0, depthWrite:false }));
  hubRing.position.copy(hub); hubDot.position.copy(hub); scene.add(hubRing, hubDot);
  const chain = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:40},(_,i)=>start.clone().lerp(hub,i/39))), new THREE.LineBasicMaterial({ color:LIMEH, transparent:true, opacity:.85 }));
  scene.add(chain);
  const d = hub.clone().sub(start), ang = Math.atan2(d.y,d.x) - Math.PI/2;
  const rec = Array.from({length:5},(_,i)=>{
    const m = sprite('arrow-lime', MOBILE?.75:.9, 0);
    Object.assign(m.userData, { from:new THREE.Vector3((rnd()-.5)*5,3.5+rnd()*2,(rnd()-.5)*2).add(recC), to:start.clone().lerp(hub,.08+i*.17), r:ang });
    return m;
  });

  /* overlay */
  const panels = [...journey.querySelectorAll('.kj-panel')].map(el=>({ el, from:+el.dataset.from, to:+el.dataset.to }));
  const pager = journey.querySelector('.kj-pager'), pages = [...pager.querySelectorAll('a')];
  const shade = journey.querySelector('.kj-shade');
  const span = () => journey.offsetHeight - innerHeight;
  pages.forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    const y = journey.offsetTop + (+a.dataset.at)*span();
    window.lenis ? window.lenis.scrollTo(y) : scrollTo({ top:y, behavior:'smooth' });
  }));

  root.classList.add('kj-live');
  // the section just grew to its pinned height: let ScrollTrigger and Lenis re-measure the page
  requestAnimationFrame(()=>{ window.ScrollTrigger?.refresh(); window.lenis?.resize?.(); });

  const smooth = t => t<=0?0:t>=1?1:t*t*(3-2*t);
  const win = (p,a,b) => smooth((p-a)/(b-a));
  let pt = 0, p = 0, running = false, raf = 0;
  const tmp = new THREE.Vector3(), look = new THREE.Vector3(), tint = new THREE.Color();

  const readScroll = () => { const r = journey.getBoundingClientRect(); pt = Math.max(0, Math.min(1, -r.top / Math.max(1, span()))); };
  addEventListener('scroll', readScroll, { passive:true });

  function frame(now){
    const t = now/1000;
    p += (pt - p) * .085; if (Math.abs(pt-p) < 1e-5) p = pt;

    /* the dive: lime ground drops to black, ink lights up into brand colour */
    const dark = win(p, .07, .19);
    ground.copy(LIME).lerp(BLACK, dark);
    renderer.setClearColor(ground, 1); scene.fog.color.copy(ground);
    tint.copy(INK).lerp(WHITE, dark);
    const handoff = 1 - win(p, .9, .985);           // everything fades to plain black at the end
    for (const m of tinted){ m.material.color.copy(tint); }
    for (const m of doodles){ m.material.opacity = m.userData.baseOpacity * (.75 + .25*dark) * handoff; m.position.y = m.userData.y + Math.sin(t*m.userData.sp + m.userData.ph)*.12; }
    grid.material.opacity = .22 * dark * handoff;
    shade.style.setProperty('--kj-dark', dark.toFixed(3));
    pager.classList.toggle('ink', dark < .5);

    camera.position.copy(path.getPointAt(p));
    look.copy(path.getPointAt(Math.min(p+.04,1)));
    if (p > .96) look.add(path.getTangentAt(1).multiplyScalar(4));
    camera.lookAt(look);

    intro.forEach((m,i)=>{ m.position.y = m.userData.y + Math.sin(t*.8+m.userData.ph)*.12; m.rotation.z = Math.sin(t*.4+i)*.06; m.material.opacity = handoff; });

    const kP = win(p,.19,.33);
    prep.forEach((m,i)=>{ const k = smooth(kP*1.3 - i*.05); m.position.lerpVectors(m.userData.from, m.userData.to, k); m.rotation.z = m.userData.fr + (m.userData.tr - m.userData.fr)*k; m.material.opacity = dark*handoff; });

    const kQ = win(p,.43,.57);
    proc.forEach((m,i)=>{
      const k = smooth(kQ*1.7 - i*.12), y = -4.6 + (m.userData.top + 4.6)*k;
      m.position.set(m.userData.x, y+.5, m.userData.z); m.material.opacity = k*handoff;
      const c = m.userData.col; c.scale.y = Math.max(.001, y+4.2); c.material.opacity = .55*k*handoff; c.lookAt(camera.position.x, c.position.y, camera.position.z);
    });

    const kR = win(p,.67,.81);
    rec.forEach((m,i)=>{ const k = smooth(kR*1.5 - i*.1); m.position.lerpVectors(m.userData.from, m.userData.to, k); m.rotation.z = m.userData.r*k + (1-k)*(i-2)*.6; m.material.opacity = Math.min(1,k*1.5)*handoff; });
    chain.geometry.setDrawRange(0, Math.floor(40*smooth(kR*1.4-.3))); chain.material.opacity = .85*handoff;
    const kH = smooth(kR*1.6-.6)*handoff;
    hubRing.material.opacity = kH; hubDot.material.opacity = kH;
    hubRing.scale.setScalar(1 + Math.sin(t*2.2)*.06*kH); hubRing.lookAt(camera.position); hubDot.lookAt(camera.position);

    for (const pn of panels){
      const o = Math.min(pn.from <= 0 ? 1 : win(p, pn.from, pn.from+.04), pn.to >= 1 ? 1 : 1 - win(p, pn.to-.04, pn.to));
      pn.el.style.opacity = o.toFixed(3);
      pn.el.style.transform = `translateY(${((1-o)*18).toFixed(1)}px)`;
      pn.el.classList.toggle('on', o > .02);
    }
    const move = p < .19 ? -1 : p < .41 ? 0 : p < .65 ? 1 : 2;
    pages.forEach((a,i)=>a.classList.toggle('on', i===move));
    pager.style.opacity = String(handoff);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(stage); resize(); readScroll(); p = pt;

  new IntersectionObserver(([e])=>{
    if (e.isIntersecting && !running){ running = true; raf = requestAnimationFrame(frame); }
    else if (!e.isIntersecting && running){ running = false; cancelAnimationFrame(raf); }
  }).observe(journey);
}

function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
