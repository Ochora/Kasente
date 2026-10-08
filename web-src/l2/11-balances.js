/* ===== Build 4 · balances that add up =====
   An account never shows a negative balance as positive. Spending more than an account holds
   leaves it at zero and records the rest as owed: an advance on mobile money, an overdraft on a bank,
   or a shortfall on cash. Money arriving on mobile money repays an open advance first, as MTN and Airtel do. */
const signedNum=(n,c)=>(n<0?'−':'')+fmtNum(n,c);
const DEBT_KEY=a=>a.kind==='momo'?'advUsed':a.kind==='bank'?'loanOwed':'short';
const baseApplyBalance=applyBalance;
applyBalance=function(t,dir){const a=acct(t.acct);
 if(dir<0&&a){if(t.autoDebt){const k=t.autoDebt.k,fromDebt=Math.min(t.autoDebt.amt,a[k]||0);a[k]=(a[k]||0)-fromDebt;a.bal-=fromDebt}if(t.autoRecover){a.advUsed=(a.advUsed||0)+t.autoRecover;a.bal+=t.autoRecover}}
 baseApplyBalance(t,dir);if(!a)return;
 if(dir>0){delete t.autoDebt;delete t.autoRecover;
  if(a.bal<0){const over=-a.bal,k=DEBT_KEY(a);a[k]=(a[k]||0)+over;a.bal=0;t.autoDebt={k,amt:over}}
  else if(a.kind==='momo'&&a.advUsed>0&&t.src!=='sms'&&(t.kind==='in'||t.kind==='topup')){const v=t.orig?t.orig.amt:t.amt;const rec=Math.min(v,a.advUsed,a.bal);if(rec>0){a.advUsed-=rec;a.bal-=rec;t.autoRecover=rec}}}
 if(dir<0&&a.bal<0){const over=-a.bal,k=DEBT_KEY(a);a[k]=(a[k]||0)+over;a.bal=0}};
/* A message's own balance is the truth; if it shows less than expected while an advance is open, the difference repaid it */
const baseApplySms=applySms;
applySms=function(r,quiet){if(!r)return 0;let before=null,a=null;if(!r.limits&&!r.invest){a=acctForProvider(r.pid,r.cur);before={bal:a.bal,adv:a.advUsed||0}}
 const n=baseApplySms(r,quiet);
 if(a&&before&&r.bal!=null&&r.txns.length){const main=r.txns[0];const recInMsg=r.txns.some(t=>t.kind==='repay');
  if(main.kind==='in'&&!recInMsg&&before.adv>0){const expected=before.bal+r.amt;const gap=expected-r.bal;if(gap>0){const rec=Math.min(gap,a.advUsed||0);if(rec>0){a.advUsed-=rec;pushAlert(`${a.name}: ${money(rec,a.currency)} of your advance was repaid`,`Your balance after the payment is ${money(r.bal,a.currency)}.`,'accounts','hand')}}}
  if(a.bal<0){const k=DEBT_KEY(a);a[k]=(a[k]||0)-a.bal;a.bal=0}}
 return n};
/* old saved data: move any negative balances into what is owed */
const baseMigrate4=window.kasenteMigrate;
window.kasenteMigrate=function(had){baseMigrate4(had);S.accounts.forEach(a=>{a.short=+a.short||0;if(a.bal<0){const k=DEBT_KEY(a);a[k]=(a[k]||0)-a.bal;a.bal=0}})};
const acctOwes=a=>(a.advUsed||0)+(a.loanOwed||0)+(a.short||0);
const liquidAccts=()=>S.accounts.filter(a=>['momo','bank','cash'].includes(a.kind));
const owedTotal=()=>S.accounts.reduce((s,a)=>s+acctOwes(a)*acctRate(a),0)+loansTaken();
/* the short on cash is money spent that wasn't recorded coming in */

/* ---------- home: money you can use, what you owe, what's left this cycle ---------- */
function liquidHistory(){S.liqHist=S.liqHist||{};S.liqHist[ymd(TODAY0)]=liquidNow();const ks=Object.keys(S.liqHist).sort().slice(-30);return ks.map(k=>S.liqHist[k]/1000)}
const baseHome4=SCREENS.home;
SCREENS.home=()=>{let h=baseHome4();const s0=h.indexOf('<section class="hero"'),s1=h.indexOf('</section>',s0);if(s0<0||s1<0)return h;
 const liquid=liquidNow(),owe=owedTotal(),after=liquid-owe;const left=cycleIncome()-cycleSpent();const hist=liquidHistory();
 const hero=`<section class="hero" aria-label="Money you can use">
  <div class="between"><span class="eyebrow">Money you can use now</span>${isFresh()?'':'<span class="ghost-pill">Sample data</span>'}</div>
  <div class="hero-num"><small>${CUR()}</small>${num(liquid)}</div>
  <div class="hero-delta">${owe?`You owe <b>${ugx(owe)}</b> · after debts <b style="color:${after<0?'#FFB4A8':'var(--sun)'}">${after<0?'−':''}${CUR()} ${num(after)}</b>`:'Nothing owed. Mobile money, bank and cash together.'}</div>
  <div class="hero-spark">${spark(hist.length>1?hist:[liquid/1000,liquid/1000],300,54,'var(--sun)',true)}</div>
  <div class="hero-foot"><div><span>Spent today</span><b>${num(todaySpent())}</b></div><div><span>Left this cycle</span><b style="${left<0?'color:#FFB4A8':''}">${signedNum(left)}</b></div><div><span>Cycle</span><b>Day ${DAY_OF_CYCLE} of ${CYCLE_DAYS}</b></div></div>
  <button class="link small" data-go="profile" style="color:var(--hero-muted);margin-top:10px;display:block">Net worth and full picture → My money profile</button>
 </section>`;
 h=h.slice(0,s0)+hero+h.slice(s1+10);
 const shortA=S.accounts.filter(a=>a.short>0);if(shortA.length){const i=h.indexOf('<div class="sec-head"><h2>Accounts</h2>');if(i>=0)h=h.slice(0,i)+shortA.map(a=>`<button class="note warn" data-act="acct" data-arg="${a.id}" style="text-align:left">${ic('alert')}<span class="grow small"><b>${esc(a.name)}: ${money(a.short,a.currency)} more spent than recorded.</b> Some money came in without being logged. Tap to count it and fix the balance.</span></button>`).join('')+h.slice(i)}
 return h};
/* account details show the shortfall and let you clear it */
const baseAcctSheet=ACT.acct;
ACT.acct=id=>{baseAcctSheet(id);const a=acct(id);if(!a||!a.short)return;const b=document.querySelector('.sheet-body');if(b)b.insertAdjacentHTML('afterbegin',`<div class="note warn" style="margin-bottom:12px">${ic('alert')}<span class="small grow"><b>${money(a.short,a.currency)} more was spent than this account had.</b> Usually that means money came in without being logged. <button class="link small" data-act="fixShort" data-arg="${id}">Log it as money received</button> · <button class="link small" data-act="clearShort" data-arg="${id}">Clear</button></span></div>`)};
ACT.fixShort=id=>{const a=acct(id);const v=a.short;a.short=0;S.txns.push({id:nid('t'),d:stamp(),acct:id,kind:'in',amt:Math.round(v*acctRate(a)),cat:'income',title:'Money received (not logged earlier)',src:'manual'});closeSheet();refresh();toast('Recorded. The balance now adds up.')};
ACT.clearShort=id=>{acct(id).short=0;closeSheet();refresh()};
/* transaction details explain automatic advance moves */
const baseTx4=ACT.tx;
ACT.tx=id=>{baseTx4(id);const t=S.txns.find(x=>x.id===id);const box=document.querySelector('.sheet-body .stack');if(!t||!box)return;const a=acct(t.acct)||{};
 const msg=t.autoDebt?`${money(t.autoDebt.amt,a.currency)} of this was more than ${esc(a.name||'the account')} held, so it's counted as ${t.autoDebt.k==='advUsed'?'advance used':t.autoDebt.k==='loanOwed'?'overdraft owed':'a shortfall to check'}.`:t.autoRecover?`${money(t.autoRecover,a.currency)} of this repaid your open advance, so only the rest reached your balance.`:'';
 if(msg)box.insertAdjacentHTML('afterbegin',`<div class="note">${ic('info')}<span class="small">${msg}</span></div>`)};
/* the accounts list and profile use what's owed including shortfalls */
providerDebt=()=>S.accounts.reduce((s,a)=>s+acctOwes(a)*acctRate(a),0);
