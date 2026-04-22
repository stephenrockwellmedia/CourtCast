/* ============================================================
   CourtCast — Site utilities
   Hamburger menu · Scroll reveal · Stat counters · Live clock
   ============================================================ */

/* ── HAMBURGER MENU ── */
function toggleMobileMenu(){
  var ham=document.getElementById('navHam'),menu=document.getElementById('mobileMenu');
  ham.classList.toggle('open');
  menu.classList.toggle('open');
}
function closeMobileMenu(){
  document.getElementById('navHam').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}
document.addEventListener('click',function(e){
  var ham=document.getElementById('navHam'),menu=document.getElementById('mobileMenu');
  if(!ham.contains(e.target)&&!menu.contains(e.target)){
    ham.classList.remove('open');menu.classList.remove('open');
  }
});

/* ── SCROLL REVEAL ── */
(function(){
  var targets=document.querySelectorAll(
    '.section-label,.section-title,.section-sub,.stat-item,.product-card,.step,.demo-feature,.pricing-card,.scorebug-demo,.trust-item'
  );
  targets.forEach(function(el){el.classList.add('reveal');});

  // stagger sibling cards
  ['.stat-item','.product-card','.step','.demo-feature','.pricing-card','.trust-item'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el,i){
      el.classList.add('reveal-d'+Math.min(i+1,4));
    });
  });

  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}
    });
  },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});

  targets.forEach(function(el){io.observe(el);});
})();

/* ── ANIMATED STAT COUNTERS ── */
(function(){
  var animated=false;
  var statNums=document.querySelectorAll('.stat-num');
  var targets=[16,60,null,0]; // null = infinity symbol, skip
  function countUp(el,end,duration){
    if(end===null)return;
    var start=0,step=Math.ceil(end/40),interval=Math.round(duration/40);
    var t=setInterval(function(){
      start=Math.min(start+step,end);
      el.innerHTML=start+(el.innerHTML.includes('+')?'<span>+</span>':el.innerHTML.includes('s')?'<span>s</span>':'');
      if(start>=end)clearInterval(t);
    },interval);
  }
  var io2=new IntersectionObserver(function(entries){
    if(animated)return;
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        animated=true;
        statNums.forEach(function(el,i){countUp(el,targets[i],700);});
        io2.disconnect();
      }
    });
  },{threshold:0.3});
  var statsRow=document.querySelector('.stats-row');
  if(statsRow)io2.observe(statsRow);
})();

/* ── LIVE HERO CLOCK ── */
(function(){
  function updateHeroClock(){
    var el=document.getElementById('heroBarTime');
    if(!el)return;
    var n=new Date(),h=n.getHours(),m=n.getMinutes(),a=h>=12?'PM':'AM';
    h=h%12||12;
    el.textContent=h+':'+(m<10?'0':'')+m+' '+a;
  }
  updateHeroClock();
  setInterval(updateHeroClock,30000);
})();
