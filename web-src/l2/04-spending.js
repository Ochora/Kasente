/* ===== Build 3 · logging expenses clearly, the Spending screen, health spending ===== */
window.forOptions=sel=>{const hh=S.household;if(!hh)return `<option value="me">Me</option>`;
 return `<option value="me" ${sel==='me'?'selected':''}>Me (personal)</option><option value="family" ${sel==='family'?'selected':''}>The household (shared)</option>`+hh.members.filter(m=>!m.me).map(m=>`<option value="${m.id}" ${sel===m.id?'selected':''}>${esc(m.name)}${m.role==='child'?' (child)':''}</option>`).join('')};
const isFamilyTx=t=>t.for&&t.for!=='me';

/* ---------- the add sheet ---------- */
ACT.add=()=>{const hh=S.household;const cashId=(S.accounts.find(a=>a.kind==='cash')||S.accounts[0]||{}).id;
 openSheet('Log a transaction',`
 <div class="seg" style="margin-bottom:14px"><button class="on" data-act="addTab" data-arg="quick">Quick note</button><button data-act="addTab" data-arg="form">Full form</button><button data-go="scan">Receipt</button></div>
 <form class="stack" data-form="quick" id="pane-quick"><label class="field"><span>Say it the way you'd say it</span><textarea id="qn" name="note" rows="2" data-live="note" placeholder="boda to town 4k"></textarea></label><div id="qnOut"><p class="xs muted">Examples: "boda to town 4k" · "pharmacy panadol 6,500" · "school uniform for Ethan 45000"</p></div>
  <div class="grid2"><label class="field"><span>Paid with</span><select name="acct">${acctOptions(cashId)}</select></label>${hh?`<label class="field"><span>For</span><select name="for" id="qnFor">${forOptions('me')}</select></label>`:'<span></span>'}</div>
  <button class="btn primary">Save expense</button></form>
 <form class="stack" data-form="full" id="pane-form" hidden>
  <div class="grid2"><label class="field"><span>Type</span><select name="kind" data-live="kindSel">${[['out','Spending'],['in','Income'],['borrow','Loan or advance received'],['repay','Repaying a loan or advance'],['lend','I lent money'],['borrowp','I borrowed from a person']].map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label><label class="field"><span>Amount</span><input name="amt" type="number" inputmode="decimal" step="any" required></label></div>
  <label class="field"><span>Description</span><input name="title" placeholder="e.g. Boda to work" required></label>
  <div class="grid2" id="catRow"><label class="field"><span>Category</span><select name="cat" data-live="catSub">${catOptions('food')}</select></label><label class="field"><span>Detail</span><select name="sub">${subOptions('food',null)}</select></label></div>
  <div class="grid2" id="debtRow" hidden><label class="field"><span>Kind of credit</span><select name="debt"><option value="advance">Advance (MoMo Advance, Fuliza…)</option><option value="loan">Loan (MoKash, bank loan…)</option></select></label><label class="field" id="personBox" hidden><span>Person</span><input name="person" placeholder="Name"></label></div>
  <div class="grid2"><label class="field"><span>Account</span><select name="acct">${acctOptions(cashId)}</select></label><label class="field"><span>Date</span><input name="date" type="date" value="${ymd(TODAY0)}"></label></div>
  <div class="grid2">${hh?`<label class="field" id="forBox"><span>For</span><select name="for">${forOptions('me')}</select></label>`:''}<label class="field" id="routeBox"><span>Route (transport)</span><select name="route">${routeOptions('')}</select></label></div>
  <button class="btn primary">Save</button></form>`,()=>LIVE.note())};
LIVE.kindSel=el=>{const k=el.value,f=el.form;f.querySelector('#catRow').hidden=k!=='out';f.querySelector('#debtRow').hidden=!['borrow','repay','borrowp','lend'].includes(k);
 f.querySelector('[name=debt]').closest('.field').hidden=!['borrow','repay'].includes(k);f.querySelector('#personBox').hidden=!['borrowp','lend'].includes(k);const fb=f.querySelector('#forBox');if(fb)fb.hidden=k!=='out';f.querySelector('#routeBox').hidden=k!=='out'};
LIVE.note=()=>{const el=$('#qn');if(!el)return;if(!el.value.trim()){return}const p=parseNote(el.value);const [cc,sub]=guessCatSub(el.value);const c=cat(cc==='income'?'other':cc)||cat('other');
 const hh=S.household;if(hh){const m=hh.members.find(m=>!m.me&&new RegExp('\\b'+m.name.split(' ')[0]+'\\b','i').test(el.value));const fs=$('#qnFor');if(fs&&m)fs.value=m.id;else if(fs&&/\b(home|house|family|household)\b/i.test(el.value))fs.value='family'}
 $('#qnOut').innerHTML=p.amt?`<div class="card row" style="background:var(--bg);padding:12px"><span class="chip" style="--c:${c.c}">${ic(c.ic)}</span><div class="grow"><b class="small">${esc(p.title)}</b><div class="xs muted">${c.name}${sub?' · '+esc(sub):''} · suggested</div></div><b class="tnum">${ugx(p.amt)}</b></div>`:`<p class="xs muted">Include an amount, like 12,000 or 12k.</p>`};
FORMS.quick=fd=>{const note=fd.get('note')||'';const p=parseNote(note);if(!p.amt){LIVE.note();return}const [cc,sub]=guessCatSub(note);
 const route=/boda|taxi/i.test(note)?null:null;addTxn({acct:fd.get('acct'),kind:'out',amt:p.amt,cat:cc==='income'?'other':cc,sub,for:fd.get('for')||'me',title:p.title,src:'manual'});closeSheet();refresh()};
FORMS.full=fd=>{const amt=+fd.get('amt');if(!amt)return;let kind=fd.get('kind');const base={acct:fd.get('acct'),amt,title:fd.get('title'),src:'manual',d:fd.get('date')+' '+stamp().slice(11)};
 if(kind==='out'){const r=fd.get('route');addTxn({...base,kind,cat:fd.get('cat'),sub:fd.get('sub')||guessSub(fd.get('cat'),fd.get('title')),for:fd.get('for')||'me',...(r?{route:r,mode:/taxi/i.test(fd.get('title'))?'taxi':'boda'}:{})})}
 else if(kind==='in')addTxn({...base,kind,cat:'income'});
 else if(kind==='borrow'||kind==='repay')addTxn({...base,kind,cat:kind,debt:fd.get('debt')});
 else if(kind==='lend')addTxn({...base,kind:'lend',cat:'lend',loanWho:fd.get('person')||'Someone'});
 else if(kind==='borrowp')addTxn({...base,kind:'borrow',cat:'borrow',fromPerson:fd.get('person')||'Someone',title:fd.get('title')||'Borrowed from '+(fd.get('person')||'someone')});
 closeSheet();refresh()};

/* ---------- the Spending screen ---------- */
TITLES.spending='Spending';if(!ROOTS.includes('spending'))ROOTS.push('spending');{const i=ROOTS.indexOf('activity');if(i>=0)ROOTS.splice(i,1)}
function spRange(k){const now=new Date();
 if(k==='today')return[TODAY0,now,plusDays(TODAY0,-1),TODAY0,'yesterday'];
 if(k==='week')return[plusDays(TODAY0,-6),now,plusDays(TODAY0,-13),plusDays(TODAY0,-6),'the 7 days before'];
 if(k==='last'){const pp=new Date(PREV_START.getFullYear(),PREV_START.getMonth()-1,PREV_START.getDate());return[PREV_START,CYCLE_START,pp,PREV_START,'the cycle before']}
 const el=now-CYCLE_START;return[CYCLE_START,now,PREV_START,new Date(PREV_START.getTime()+el),'the same point last cycle']}
const inR=(t,a,b)=>{const d=pd(t.d);return d>=a&&d<b};
function spList(a,b,scope){return S.txns.filter(t=>t.kind==='out'&&inR(t,a,b)&&(scope==='all'||(scope==='me'?!isFamilyTx(t):isFamilyTx(t))))}
const groupSum=(list,key)=>{const g={};list.forEach(t=>{const k=key(t)||'—';g[k]=(g[k]||0)+t.amt});return Object.entries(g).sort((a,b)=>b[1]-a[1])};
SCREENS.spending=()=>{const u=S.ui;u.sp=u.sp||'cycle';u.spScope=u.spScope||'all';const hh=S.household;
 const [a,b,pa,pb,plabel]=spRange(u.sp);const list=spList(a,b,u.spScope),prev=spList(pa,pb,u.spScope);
 const tot=sumAmt(list),ptot=sumAmt(prev);const days=Math.max(1,Math.ceil((Math.min(b,new Date())-a)/DAY));
 const byCat=groupSum(list,t=>t.cat).map(([id,v])=>({c:cat(id)||cat('other'),id,v}));
 const tr=list.filter(t=>t.cat==='transport'),hl=list.filter(t=>t.cat==='health'),fees=list.filter(t=>t.sub==='Mobile money & bank fees'||/fee$/i.test(t.title));
 const places=groupSum(list.filter(t=>t.sub!=='Mobile money & bank fees'),t=>t.title.replace(/\s*·.*$/,'').slice(0,40)).slice(0,5);
 const delta=ptot?Math.round((tot-ptot)/ptot*100):null;
 return `
 <div class="seg">${[['today','Today'],['week','7 days'],['cycle','This cycle'],['last','Last cycle']].map(([k,l])=>`<button class="${u.sp===k?'on':''}" data-act="spPer" data-arg="${k}">${l}</button>`).join('')}</div>
 ${hh?`<div class="chips">${[['all','Everything'],['me','Personal'],['family','Household']].map(([k,l])=>`<button class="chipbtn ${u.spScope===k?'on':''}" data-act="spScope" data-arg="${k}">${l}</button>`).join('')}</div>`:''}
 <div class="card stack" style="gap:10px"><span class="eyebrow">Spent · ${u.sp==='today'?'today':u.sp==='week'?'last 7 days':u.sp==='last'?'last cycle':cycleLabel()}</span>
  <div class="between" style="align-items:baseline"><span class="tnum" style="font-family:var(--f-display);font-weight:800;font-size:28px">${ugx(tot)}</span>${delta!=null?`<span class="pill ${delta>10?'warn':delta<-5?'good':''}">${delta>0?'▲':'▼'} ${Math.abs(delta)}% vs ${plabel}</span>`:''}</div>
  <div class="stat3"><div class="stat" style="background:var(--bg)"><span>Per day</span><b>${kf(tot/days)}</b></div><div class="stat" style="background:var(--bg)"><span>Payments</span><b>${list.length}</b></div><div class="stat" style="background:var(--bg)"><span>Biggest</span><b>${list.length?kf(Math.max(...list.map(t=>t.amt))):'—'}</b></div></div></div>
 ${!list.length?`<div class="card small muted" style="text-align:center">Nothing spent in this period yet. Tap the yellow + to log an expense.</div>`:`
 <div class="card stack"><b>Where the money went</b><div class="row" style="gap:16px;flex-wrap:wrap;justify-content:center">${donut(byCat.map(x=>({c:x.c.c,v:x.v})),140,20,`<text x="70" y="68" text-anchor="middle" style="font:800 16px var(--f-display);fill:var(--ink)">${kf(tot)}</text><text x="70" y="84" text-anchor="middle" style="font:600 10px var(--f-body);fill:var(--muted)">${list.length} payments</text>`)}</div></div>
 <div class="list">${byCat.map(x=>{const subs=groupSum(list.filter(t=>t.cat===x.id),t=>subOf(t)||'Not specified');return `<details class="lesson" style="border-bottom:1px solid var(--line)"><summary><span class="chip" style="--c:${x.c.c}">${ic(x.c.ic)}</span><span class="grow"><span class="between"><b style="font-size:14.5px">${x.c.name}</b><b class="tnum">${num(x.v)}</b></span><span class="bar" style="margin-top:6px;display:block"><i style="width:${x.v/byCat[0].v*100}%;background:${x.c.c}"></i></span><span class="xs muted">${Math.round(x.v/tot*100)}% · ${(n=>n+(n===1?" payment":" payments"))(list.filter(t=>t.cat===x.id).length)}</span></span></summary><div class="body">${subs.map(([n,v])=>`<div class="subrow"><span class="small">${esc(n)}</span><span class="small tnum">${num(v)}</span><span class="bar" style="grid-column:1/-1;height:5px"><i style="width:${v/subs[0][1]*100}%;background:${x.c.c};opacity:.7"></i></span></div>`).join('')}<button class="link small" style="margin-top:8px" data-act="spTx" data-arg="${x.id}">See these payments →</button></div></details>`}).join('')}</div>
 ${tr.length?`<div class="card stack" style="gap:8px"><div class="between"><b>${ic('bike',18).replace('class="i"','class="i" style="display:inline;vertical-align:-3px;margin-right:6px;color:var(--accent)"')}Transport</b><b class="tnum">${ugx(sumAmt(tr))}</b></div>${groupSum(tr,t=>subOf(t)||'Other transport').map(([n,v])=>{const k=tr.filter(t=>(subOf(t)||'Other transport')===n);return `<div class="between small"><span>${esc(n)} <span class="muted">· ${k.length} trip${k.length>1?'s':''}, about ${kf(v/k.length)} each</span></span><span class="tnum">${num(v)}</span></div>`}).join('')}<button class="link small" style="align-self:flex-start" data-go="transport">Check fares →</button></div>`:''}
 <div class="card stack" style="gap:8px"><div class="between"><b>${ic('cross',18).replace('class="i"','class="i" style="display:inline;vertical-align:-3px;margin-right:6px;color:#CC4670"')}Health</b><b class="tnum">${ugx(sumAmt(hl))}</b></div>${hl.length?groupSum(hl,t=>subOf(t)||'Other health').map(([n,v])=>`<div class="between small"><span>${esc(n)}</span><span class="tnum">${num(v)}</span></div>`).join('')+`<p class="xs muted">${Math.round(sumAmt(hl)/tot*100)}% of spending in this period.${hl.some(t=>subOf(t)==='Health insurance')?'':' If health costs keep coming, compare the cost of a health insurance plan with what you pay out of pocket.'}</p>`:`<p class="small muted">No health spending in this period. Log pharmacy, clinic, lab and insurance costs here to see what your health really costs.</p>`}</div>
 ${fees.length?`<div class="note warn">${ic('coins')}<span class="small"><b>${ugx(sumAmt(fees))} in mobile money and bank fees</b> across ${fees.length} payment${fees.length>1?'s':''}. Sending larger amounts less often, or paying merchants directly, usually costs less.</span></div>`:''}
 ${places.length?`<div class="sec-head"><h2>Top places</h2></div><div class="list">${places.map(([n,v])=>`<div class="setrow"><span class="grow"><b>${esc(n)}</b></span><span class="small tnum" style="font-weight:600">${num(v)}</span></div>`).join('')}</div>`:''}
 ${hh&&u.spScope==='all'?`<div class="sec-head"><h2>Who it was for</h2></div><div class="list">${groupSum(list,t=>t.for||'me').map(([k,v])=>`<div class="setrow"><span class="grow"><b>${k==='me'?'Me':k==='family'?'The household':esc((hh.members.find(m=>m.id===k)||{}).name||'Someone')}</b></span><span class="small tnum" style="font-weight:600">${num(v)} <span class="muted">· ${Math.round(v/tot*100)}%</span></span></div>`).join('')}</div>`:''}`}
 <button class="btn block" data-go="activity">${ic('list')}All transactions</button>`};
ACT.spPer=k=>{S.ui.sp=k;refresh()};ACT.spScope=k=>{S.ui.spScope=k;refresh()};
ACT.spTx=id=>{const [a,b]=spRange(S.ui.sp);const l=spList(a,b,S.ui.spScope||'all').filter(t=>t.cat===id).sort((x,y)=>pd(y.d)-pd(x.d));openSheet(esc((cat(id)||{}).name||'Payments'),`<div class="list">${l.map(txRow).join('')}</div>`)};

/* the bottom bar: Home · Spending · + · Advisor · More */
$('#nav').innerHTML=`<button data-go="home" data-nav="home">${ic('home',22)}<span>Home</span></button><button data-go="spending" data-nav="spending">${ic('chart',22)}<span>Spending</span></button><button class="fab" data-act="add" aria-label="Log a transaction">${ic('plus',28)}</button><button data-go="advisor" data-nav="advisor">${ic('sparkle',22)}<span>Advisor</span></button><button data-go="more" data-nav="more">${ic('grid',22)}<span>More</span></button>`;
