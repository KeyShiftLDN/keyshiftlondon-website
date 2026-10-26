/* Key Shift London, shared site behaviour.
   Loaded with defer on every page. All handlers no-op when their DOM is absent,
   so one file is safe across homepage + sub-pages.

   Removed in the restructure (content shown at rest, no hidden-until-scrolled):
   loader, hero intro, scroll-reveal animation, the parallax statement, marquee,
   outcome counters. Kept for a later pass: grain, custom cursor, parallax photo
   floats (the [data-speed] drift), magnetic buttons, card tilt. */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ---------- Platform + booking constants ---------- */
const PRECORD_URL = 'https://precord.keyshiftlondon.org';   // the PRE:CORD platform
const CAL_LINK = 'https://cal.com/key-shift-london-uwjros/30min';
const ENQUIRY_API  = 'https://ksl-payments.onrender.com/api/licensing/enquiry';
const PRECORD_API  = 'https://ksl-payments.onrender.com/api/precord/send';
const CHECKOUT_API = 'https://ksl-payments.onrender.com/api/training/checkout';
const DONATE_API   = 'https://ksl-payments.onrender.com/api/donate';
const L2_PRICE = 34.99;

/* Cal.com booking links (every [data-calcom] opens the booking in a new tab) */
document.querySelectorAll('[data-calcom]').forEach(a=>{
  if(CAL_LINK){ a.href=CAL_LINK; a.target='_blank'; a.rel='noopener'; }
});
/* PRE:CORD platform links, wired from the single PRECORD_URL constant */
document.querySelectorAll('[data-precord-trial]').forEach(a=>{ a.href=PRECORD_URL+'/auth'; a.target='_blank'; a.rel='noopener'; });
document.querySelectorAll('[data-precord-enter]').forEach(a=>{ a.href=PRECORD_URL; a.target='_blank'; a.rel='noopener'; });

/* ---------- Mobile nav ---------- */
const burger=document.getElementById('burger');
const navlinks=document.getElementById('navlinks');
if(burger && navlinks){
  const setMenu=open=>{navlinks.classList.toggle('open',open);burger.setAttribute('aria-expanded',open?'true':'false');};
  burger.addEventListener('click',()=>setMenu(!navlinks.classList.contains('open')));
  navlinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navlinks.classList.contains('open')){setMenu(false);burger.focus();}});
}

/* ---------- Cloudflare Turnstile (enquiry + precord forms) ---------- */
window.TURNSTILE_SITEKEY = '0x4AAAAAAD6DMsPG1LLrJEqb';
function onCfTurnstile(){
  if(window.TURNSTILE_SITEKEY && window.turnstile){
    var el=document.getElementById('cfTurnstile');
    if(el){ try{ window.__cfWid = window.turnstile.render('#cfTurnstile',{
      sitekey: window.TURNSTILE_SITEKEY,'refresh-expired':'auto','retry':'auto',
      'error-callback': function(){ window.cfRefresh(); }}); }catch(e){} }
    var el2=document.getElementById('cfPrecord');
    if(el2){ try{ window.__cfPrecordWid = window.turnstile.render('#cfPrecord',{
      sitekey: window.TURNSTILE_SITEKEY,'refresh-expired':'auto','retry':'auto',
      'error-callback': function(){ window.precordRefresh(); }}); }catch(e){} }
  }
}
window.cfRefresh = function(){ if(window.turnstile && window.__cfWid!=null){ try{ window.turnstile.reset(window.__cfWid); }catch(e){} } };
window.precordRefresh = function(){ if(window.turnstile && window.__cfPrecordWid!=null){ try{ window.turnstile.reset(window.__cfPrecordWid); }catch(e){} } };

if(typeof gsap==='undefined'){ document.body.classList.add('no-anim'); }

if(typeof gsap!=='undefined'){
gsap.registerPlugin(ScrollTrigger);

/* ---------- Lenis smooth scroll (optional, never fatal) ---------- */
let lenis=null;
try{
  const LenisLib = window.Lenis || (window.lenis && window.lenis.default);
  if(!REDUCED && typeof LenisLib==='function'){
    lenis=new LenisLib({lerp:.1,wheelMultiplier:1,smoothWheel:true});
    window.lenis=lenis;
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add((t)=>lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
  }
}catch(err){ lenis=null; }
/* in-page anchor links through Lenis */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href');
    if(id.length>1){const t=document.querySelector(id);
      if(t){e.preventDefault(); lenis?lenis.scrollTo(t,{offset:-70}):t.scrollIntoView({behavior:'smooth'});}}
  });
});

/* ---------- Parallax photo floats (deferred-removal; kept for now) ---------- */
gsap.utils.toArray('[data-speed]').forEach(el=>{
  const speed=parseFloat(el.getAttribute('data-speed'));
  gsap.to(el,{yPercent:-speed*100,ease:'none',
    scrollTrigger:{trigger:el.closest('section,header')||el,start:'top bottom',end:'bottom top',scrub:true}});
});
/* card/feature images drift within their clipped frame */
gsap.utils.toArray('.pss-media img,.aud-media img,.section-photo img,.who-photo .who-img').forEach(img=>{
  gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',
    scrollTrigger:{trigger:img.closest('section,header')||img,start:'top bottom',end:'bottom top',scrub:true}});
});
const heroTitle=document.getElementById('heroTitle');
if(heroTitle){ gsap.to(heroTitle,{yPercent:18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}}); }

/* ---------- Progress bar + nav hide + back-to-top (guarded) ---------- */
const progress=document.getElementById('progress');
const nav=document.getElementById('nav');
const totop=document.getElementById('totop');
let lastY=0;
ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{
  if(progress) gsap.set(progress,{scaleX:self.progress});
  const y=self.scroll();
  if(nav){ if(y>lastY&&y>200) gsap.to(nav,{yPercent:-100,duration:.4}); else gsap.to(nav,{yPercent:0,duration:.4}); }
  lastY=y;
  if(totop) totop.classList.toggle('show',y>600);
}});
if(totop) totop.addEventListener('click',()=>lenis?lenis.scrollTo(0):window.scrollTo({top:0,behavior:'smooth'}));

/* ---------- Card 3D tilt + magnetic buttons + custom cursor (fine pointers only) ---------- */
if(FINE && !REDUCED){
  document.querySelectorAll('[data-tilt]').forEach(card=>{
    const qx=gsap.quickTo(card,'rotationY',{duration:.5,ease:'power3'});
    const qy=gsap.quickTo(card,'rotationX',{duration:.5,ease:'power3'});
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();
      qx(((e.clientX-r.left)/r.width-.5)*10); qy(-((e.clientY-r.top)/r.height-.5)*10);});
    card.addEventListener('pointerleave',()=>{qx(0);qy(0);});
  });
  document.querySelectorAll('[data-magnetic]').forEach(btn=>{
    const mx=gsap.quickTo(btn,'x',{duration:.4,ease:'power3'});
    const my=gsap.quickTo(btn,'y',{duration:.4,ease:'power3'});
    btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();
      mx((e.clientX-(r.left+r.width/2))*.35); my((e.clientY-(r.top+r.height/2))*.35);});
    btn.addEventListener('pointerleave',()=>{mx(0);my(0);});
  });
  const dot=document.getElementById('cdot'), ring=document.getElementById('cring'), clabel=document.getElementById('clabel');
  if(dot && ring){
    const dx=gsap.quickTo(dot,'x',{duration:.15,ease:'power3'}), dy=gsap.quickTo(dot,'y',{duration:.15,ease:'power3'});
    const rx=gsap.quickTo(ring,'x',{duration:.35,ease:'power3'}), ry=gsap.quickTo(ring,'y',{duration:.35,ease:'power3'});
    window.addEventListener('pointermove',e=>{dx(e.clientX);dy(e.clientY);rx(e.clientX);ry(e.clientY);});
    document.querySelectorAll('a,button,[data-cursor],input,select').forEach(el=>{
      el.addEventListener('pointerenter',()=>{ring.classList.add('grow');
        const lab=el.getAttribute('data-cursor'); if(lab&&lab!==''){ring.classList.add('label');if(clabel)clabel.textContent=lab;}});
      el.addEventListener('pointerleave',()=>{ring.classList.remove('grow','label');if(clabel)clabel.textContent='';});
    });
  }
}

ScrollTrigger.refresh();
} /* end gsap guard */

/* ---------- Collapsible sections (click to reveal) ---------- */
document.querySelectorAll('.sec-toggle').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const sec=btn.closest('.collapsible');
    const open=sec.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
    const txt=btn.querySelector('.tog-txt');
    if(txt) txt.textContent=open?'Hide':(btn.dataset.label||'Reveal');
    if(window.ScrollTrigger){ setTimeout(()=>ScrollTrigger.refresh(),500); }
  });
});

/* ---------- PRE:CORD, In Practice: optional "email it to me" ---------- */
(function(){
  const form=document.getElementById('precordForm'); if(!form) return;
  const email=document.getElementById('precordEmail'), hp=document.getElementById('precordHp'),
        btn=document.getElementById('precordSend'), msg=document.getElementById('precordMsg');
  const ok=v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v||'').trim());
  form.addEventListener('submit',async function(e){
    e.preventDefault(); msg.className='pp-msg'; msg.textContent='';
    if(!ok(email.value)){ msg.className='pp-msg err'; msg.textContent='Enter a valid email.'; email.focus(); return; }
    const tsToken=(window.TURNSTILE_SITEKEY && window.turnstile && window.__cfPrecordWid!=null)
      ? (window.turnstile.getResponse(window.__cfPrecordWid)||'') : '';
    if(window.TURNSTILE_SITEKEY && !tsToken){ window.precordRefresh&&window.precordRefresh();
      msg.className='pp-msg err'; msg.textContent='Just verifying you’re human, give it a second, then tap Send again.'; return; }
    const prev=btn.textContent; btn.disabled=true; btn.style.opacity='.7'; btn.textContent='Sending…';
    try{
      const res=await fetch(PRECORD_API,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email.value.trim(),company_website:hp?hp.value:'',turnstile_token:tsToken})});
      if(!res.ok) throw new Error('HTTP '+res.status);
      form.querySelector('.pp-row').style.display='none';
      const cf=document.getElementById('cfPrecord'); if(cf) cf.style.display='none';
      msg.className='pp-msg'; msg.textContent='Sent ✦ check your inbox (and spam) for the PDF link.';
    }catch(err){
      btn.disabled=false; btn.style.opacity=''; btn.textContent=prev;
      window.precordRefresh&&window.precordRefresh();
      msg.className='pp-msg err'; msg.textContent='Couldn’t send just now, use the Download button, or try again.';
    }
  });
})();

/* ---------- Enquiry form (organisations page) ---------- */
(function(){
  const enquiryForm=document.getElementById('enquiryForm');
  const submitBtn=document.getElementById('submitBtn');
  if(!enquiryForm || !submitBtn) return;
  const emailOk=v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  function formError(m){
    let n=enquiryForm.querySelector('.form-error');
    if(!n){n=document.createElement('p');n.className='form-error';n.setAttribute('role','alert');
      n.style.cssText='color:#ff6b6b;font-family:var(--mono);font-size:.7rem;letter-spacing:.04em;margin-top:.7rem;text-align:center';
      enquiryForm.querySelector('.form-note').before(n);}
    n.textContent=m;
  }
  enquiryForm.addEventListener('submit',async function(e){
    e.preventDefault();
    const name=document.getElementById('name'), email=document.getElementById('email'), interest=document.getElementById('interest');
    if(!name.value.trim()){name.focus();return;}
    if(!emailOk(email.value)){email.focus();return;}
    const tsToken = (window.TURNSTILE_SITEKEY && window.turnstile && window.__cfWid!=null)
      ? (window.turnstile.getResponse(window.__cfWid) || '') : '';
    if(window.TURNSTILE_SITEKEY && !tsToken){ window.cfRefresh&&window.cfRefresh();
      formError('Just verifying you’re human, give it a second, then tap Send again.'); return; }
    const enqHp=document.getElementById('enqHp');
    const prev=submitBtn.innerHTML;
    submitBtn.disabled=true; submitBtn.style.opacity='.7'; submitBtn.innerHTML='Sending…';
    const old=enquiryForm.querySelector('.form-error'); if(old) old.remove();
    try{
      if(ENQUIRY_API){
        const res=await fetch(ENQUIRY_API,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name:name.value.trim(),email:email.value.trim(),interest:interest.value,
            message:'',company_website:enqHp?enqHp.value:'',turnstile_token:tsToken})});
        if(!res.ok) throw new Error('HTTP '+res.status);
      }
      submitBtn.innerHTML="Thanks ✦";
      enquiryForm.querySelectorAll('input,select').forEach(el=>el.disabled=true);
      window.location.href='thank-you.html';
      return;
    }catch(err){
      submitBtn.disabled=false; submitBtn.style.opacity=''; submitBtn.innerHTML=prev;
      window.cfRefresh&&window.cfRefresh();
      formError('Couldn’t send, please email hello@keyshiftlondon.org or try again.');
    }
  });
})();

/* ---------- Post-payment / donation confirmation banner (returning from Stripe) ---------- */
(function(){
  var p=new URLSearchParams(location.search);
  var kind = p.get('signup')==='success' ? 'training' : p.get('donation')==='thanks' ? 'donation' : null;
  if(!kind) return;
  var b=document.getElementById('payBanner'); if(!b) return;
  var m=document.getElementById('payBannerMsg');
  if(m) m.textContent = kind==='donation'
    ? '✓ Thank you for your support. A receipt is on its way to your email.'
    : '✓ Payment received. Check your email for your Precision Training access link.';
  b.classList.add('show');
  var x=document.getElementById('payBannerX'); if(x) x.addEventListener('click',function(){b.classList.remove('show');});
  setTimeout(function(){b.classList.remove('show');},12000);
  history.replaceState(null,'',location.pathname+location.hash);
})();

/* ---------- Training sign-up modal + checkout (L1 free, L2 £34.99) ---------- */
(function(){
  const modal=document.getElementById('signupModal'); if(!modal) return;
  const $=id=>document.getElementById(id);
  const nameEl=$('suName'), emailEl=$('suEmail'), orgEl=$('suOrg'), roleEl=$('suRole'),
        l1=$('suL1'), l2=$('suL2'), hp=$('suHp'),
        totalEl=$('suTotal'), rateEl=$('suRate'), submitBtn=$('suSubmit'),
        noteEl=$('suNote'), errEl=$('suErr'), form=$('signupForm');
  let lastFocus=null;
  const paid=()=>l2.checked;
  function recompute(){
    if(paid()){
      totalEl.textContent='£'+L2_PRICE.toFixed(2); rateEl.textContent='one-off';
      submitBtn.innerHTML='Continue to payment <span class="arr">→</span>';
      noteEl.textContent='Level 2 checkout is secured by Stripe.'+(l1.checked?' Level 1 is included free.':'');
    } else if(l1.checked){
      totalEl.textContent='Free'; rateEl.textContent='instant access';
      submitBtn.innerHTML='Get free access <span class="arr">→</span>';
      noteEl.textContent='Level 1 is free, no card needed. We’ll email your access link right away.';
    } else {
      totalEl.textContent='-'; rateEl.textContent='select a level';
      submitBtn.innerHTML='Continue <span class="arr">→</span>';
      noteEl.textContent='Choose at least one level to continue.';
    }
  }
  const formView=$('suFormView'), donView=$('suDonate');
  function showForm(){ if(formView)formView.hidden=false; if(donView)donView.hidden=true; }
  function showDonate(afterEnrol){
    if(!donView) return;
    if(formView)formView.hidden=true; donView.hidden=false;
    const t=$('donTitle'), s=$('donSub');
    if(t) t.textContent = afterEnrol ? 'you’re in, keep it free?' : 'keep level 1 free.';
    if(s) s.textContent = afterEnrol
      ? 'Your free Level 1 link is on its way to your inbox. Level 1 is free because cost shouldn’t keep anyone out, a donation of any size keeps it free for the next practitioner.'
      : 'We made Precision Training Level 1 free so cost is never the reason a practitioner goes without it. A donation of any size keeps it free for the next mentor, coach or pastoral lead.';
  }
  function open(opts){
    opts=opts||{};
    if(opts.level==='L1'){l1.checked=true;l2.checked=false;}
    else if(opts.level==='L2'){l1.checked=true;l2.checked=true;}
    else if(opts.level==='both'){l1.checked=true;l2.checked=true;}
    showForm(); errEl.textContent=''; recompute();
    lastFocus=document.activeElement;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    setTimeout(()=>nameEl.focus(),60);
  }
  function close(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; showForm(); if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
  window.kslOpenSignup=open;
  window.kslOpenDonate=function(){ showDonate(false); lastFocus=document.activeElement;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
  document.querySelectorAll('[data-donate]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault(); window.kslOpenDonate();}));
  try{ const q=new URLSearchParams(location.search); if(q.has('donate')||location.hash==='#support'||location.hash==='#donate'){ window.kslOpenDonate(); } }catch(e){}
  /* training.html#level-1 opens the Level 1 sign-up on arrival */
  try{ if(location.hash==='#level-1'){ open({level:'L1'}); } }catch(e){}
  modal.querySelectorAll('[data-sm-close]').forEach(b=>b.addEventListener('click',close));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&modal.classList.contains('open')) close(); });
  [l1,l2].forEach(e=>e.addEventListener('input',recompute));
  document.querySelectorAll('[data-signup]').forEach(el=>el.addEventListener('click',e=>{ e.preventDefault(); open({level:el.dataset.signup}); }));
  form.addEventListener('submit',async e=>{
    e.preventDefault(); errEl.textContent='';
    if(!nameEl.value.trim()){nameEl.focus();return;}
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailEl.value)){emailEl.focus();errEl.textContent='Enter a valid email.';return;}
    const levels=[]; if(l1.checked)levels.push('L1'); if(l2.checked)levels.push('L2');
    if(!levels.length){errEl.textContent='Choose at least one level.';return;}
    const wasPaid=paid();
    const prev=submitBtn.innerHTML; submitBtn.disabled=true; submitBtn.style.opacity='.7';
    submitBtn.innerHTML=wasPaid?'Setting up…':'Enrolling…';
    try{
      const res=await fetch(CHECKOUT_API,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:nameEl.value.trim(),email:emailEl.value.trim(),
          organisation:orgEl.value.trim()||null,role:roleEl.value.trim()||null,
          levels:levels,company_website:hp.value})});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data=await res.json();
      if(data.checkout_url && /^https:\/\/checkout\.stripe\.com\//.test(data.checkout_url)){ window.location.href=data.checkout_url; return; }
      if(data.free || data.status==='enrolled'){ submitBtn.disabled=false; submitBtn.style.opacity=''; submitBtn.innerHTML=prev; showDonate(true); return; }
      throw new Error('no url');
    }catch(err){
      submitBtn.disabled=false; submitBtn.style.opacity=''; submitBtn.innerHTML=prev;
      errEl.textContent=wasPaid?'Couldn’t start checkout. Email hello@keyshiftlondon.org or try again.'
                               :'Couldn’t set up access. Email hello@keyshiftlondon.org or try again.';
    }
  });
  recompute();
})();

/* ---------- Donations (pay-what-you-want Stripe Checkout) ---------- */
(function(){
  const form=document.getElementById('donateForm'); if(!form) return;
  const $=id=>document.getElementById(id);
  const other=$('donOther'), hp=$('donHp'), submitBtn=$('donSubmit'), lbl=$('donAmtLbl'), errEl=$('donErr');
  const btns=[...document.querySelectorAll('.don-amt')];
  let amount=25;
  const fmt=x=>'£'+(Number.isInteger(x)?x:x.toFixed(2));
  function setAmount(v,fromInput){
    amount=Math.max(0,v||0);
    if(!fromInput) other.value='';
    btns.forEach(b=>b.classList.toggle('is-on', !fromInput && parseInt(b.dataset.amt)===amount));
    lbl.textContent=amount>=1?fmt(amount):'';
  }
  btns.forEach(b=>b.addEventListener('click',()=>setAmount(parseInt(b.dataset.amt),false)));
  other.addEventListener('input',()=>{ btns.forEach(b=>b.classList.remove('is-on')); setAmount(parseFloat(other.value),true); });
  form.addEventListener('submit',async e=>{
    e.preventDefault(); errEl.textContent='';
    if(!(amount>=1)){ errEl.textContent='Enter an amount of £1 or more.'; other.focus(); return; }
    const prev=submitBtn.innerHTML; submitBtn.disabled=true; submitBtn.style.opacity='.7'; submitBtn.innerHTML='Opening checkout…';
    try{
      const res=await fetch(DONATE_API,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({amount_gbp:amount,company_website:hp.value})});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data=await res.json();
      if(data.checkout_url && /^https:\/\/checkout\.stripe\.com\//.test(data.checkout_url)){ window.location.href=data.checkout_url; return; }
      throw new Error('no url');
    }catch(err){
      submitBtn.disabled=false; submitBtn.style.opacity=''; submitBtn.innerHTML=prev;
      errEl.textContent='Couldn’t open checkout. Email hello@keyshiftlondon.org or try again.';
    }
  });
})();
