'use strict';
/* Additive modules only. Original editor and assets remain untouched. */
(function(){
  const el = id => document.getElementById(id);
  const gate = el('entryGate');
  const memberForm = el('memberForm');
  const guestForm = el('guestForm');
  function entryMode(guest){
    memberForm.classList.toggle('hidden', guest);
    guestForm.classList.toggle('hidden', !guest);
    el('memberChoice').classList.toggle('active', !guest);
    el('guestChoice').classList.toggle('active', guest);
  }
  window.showLittleLettersEntry = function(){gate.classList.remove('hidden')};
  window.dispatchEvent(new Event('littleletters:entry-ready'));
  el('memberChoice').addEventListener('click',()=>entryMode(false));
  el('guestChoice').addEventListener('click',()=>entryMode(true));
  function enter(profile){
    try{sessionStorage.setItem('little-letters-demo-visitor',JSON.stringify(profile))}catch(e){}
    gate.classList.add('hidden');
  }
  memberForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(!memberForm.reportValidity())return;
    enter({mode:'demo',name:el('memberName').value.trim(),email:el('memberEmail').value.trim()});
  });
  el('continueGuest').addEventListener('click',()=>enter({mode:'guest'}));
  const studio = el('engineeringStudio');
  function showStudio(){el('home').classList.add('hidden');el('workspace').classList.add('hidden');studio.classList.remove('hidden');window.scrollTo(0,0)}
  function leaveStudio(){studio.classList.add('hidden');el('home').classList.remove('hidden');window.scrollTo(0,0)}
  el('engineeringNav').addEventListener('click',showStudio);
  el('returnFromEngineering').addEventListener('click',leaveStudio);
  // Existing Home / Write actions still use their original functions; hide the extra section when leaving it.
  for(const id of ['homeNav','startNav','startHero'])el(id).addEventListener('click',()=>studio.classList.add('hidden'),true);
  const coeff={organic:[2.4,1.05,2.5,.38],semi:[3,1.12,2.5,.35],embedded:[3.6,1.2,2.5,.32]};
  function calculate(){
    const kloc=Number(el('seKloc').value), cost=Number(el('seCost').value), mode=el('seMode').value;
    const out=el('seResults');
    if(!Number.isFinite(kloc)||kloc<=0||!Number.isFinite(cost)||cost<0||!coeff[mode]){out.textContent='Enter a positive KLOC and a non-negative monthly cost.';return}
    const [a,b,c,d]=coeff[mode], effort=a*Math.pow(kloc,b), duration=c*Math.pow(effort,d);
    const money=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
    out.replaceChildren();
    for(const [name,value] of [['Effort',effort.toFixed(2)+' person-months'],['Duration',duration.toFixed(2)+' months'],['Average team', (effort/duration).toFixed(2)+' people'],['Estimated cost',money.format(effort*cost)]]){
      const div=document.createElement('div'),label=document.createElement('small'),strong=document.createElement('strong');
      label.textContent=name;strong.textContent=value;div.append(label,strong);out.append(div);
    }
  }
  ['seKloc','seCost','seMode'].forEach(id=>el(id).addEventListener('input',calculate));
  calculate();
  el('runSeTests').addEventListener('click',()=>{
    const checks=[
      ['Editor fields exist',()=>['recipient','signature','message','paper','envelope'].every(id=>!!el(id))],
      ['Six stationery choices configured',()=>Array.isArray(papers)&&papers.length===6],
      ['Seven vintage stamps configured',()=>Array.isArray(stamps)&&stamps.length===7],
      ['Spotify valid track accepted',()=>!!spotifyLink('https://open.spotify.com/track/123abc')],
      ['Non-Spotify link rejected',()=>spotifyLink('https://example.com/track/123')===null],
      ['Polaroid upload configured for images',()=>el('upload').accept==='image/*'&&el('upload').multiple],
      ['Local draft storage accessible',()=>{try{const k='ll-se-storage-test';localStorage.setItem(k,'ok');const ok=localStorage.getItem(k)==='ok';localStorage.removeItem(k);return ok}catch(e){return false}}]
    ];
    const results=el('seTestResults');results.replaceChildren();let passed=0;
    checks.forEach(([name,test])=>{let ok=false;try{ok=!!test()}catch(e){}if(ok)passed++;const p=document.createElement('p');p.textContent=(ok?'✓ PASS · ':'✕ FAIL · ')+name;p.className=ok?'test-pass':'test-fail';results.append(p)});
    const summary=document.createElement('strong');summary.textContent=`${passed}/${checks.length} checks passed. These are lightweight smoke tests, not a full browser test suite.`;results.prepend(summary);
  });
})();
