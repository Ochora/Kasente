/* ===== Build 4 · balances that add up =====
   An account never shows a negative balance as positive. Spending more than an account holds
   leaves it at zero and records the rest as owed: an advance on mobile money, an overdraft on a bank,
   or a shortfall on cash. Money arriving on mobile money repays an open advance first, as MTN and Airtel do. */
const signedNum=(n,c)=>(n<0?'−':'')+fmtNum(n,c);
/* ---------- mobile money advance (MTN MoMo Advance and similar) ----------
   How MTN describes it: you can spend past your balance up to your advance limit; each draw costs an access fee
   (2.75% at MTN Uganda) and anything still owed at the end of a day attracts daily interest (0.95%).
   Any money that later reaches the wallet repays the fees, interest and advance first.
   advUsed = everything owed on the advance (amount drawn + fees + interest); advFee = the fees and interest part. */
const DEBT_KEY=a=>a.kind==='momo'?'advUsed':a.kind==='bank'?'loanOwed':'short';
const ADV_DEFAULTS={'mtn-ug':[2.75,0.95]};
const advPrin=a=>Math.max(0,(a.advUsed||0)-(a.advFee||0));
const advAvail=a=>a.advLimit?Math.max(0,a.advLimit-advPrin(a)):0;
const feePct=a=>a.advFeePct!=null?+a.advFeePct:(ADV_DEFAULTS[a.provider]||[0,0])[0];
const dailyPct=a=>a.advDaily!=null?+a.advDaily:(ADV_DEFAULTS[a.provider]||[0,0])[1];
const advFeeOn=(a,amt)=>Math.round(amt*feePct(a)/100);
function advAccrue(a){if(a.kind!=='momo')return;const today=ymd(TODAY0);if(!(a.advUsed>0)){a.advAccr=today;return}
 if(!a.advAccr){a.advAccr=today;return}const days=Math.round((pd(today+' 00:00')-pd(a.advAccr+' 00:00'))/DAY);if(days<=0)return;
 const r=dailyPct(a)/100;if(r>0){let owed=a.advUsed;for(let i=0;i<Math.min(days,365);i++)owed+=owed*r;const add=Math.round(owed-a.advUsed);a.advUsed+=add;a.advFee=(a.advFee||0)+add}a.advAccr=today}
const advAccrueAll=()=>S.accounts.forEach(advAccrue);
/* money in: fees and interest first, then the advance itself */
function advRecover(a,amt){const rec=Math.min(amt,a.advUsed||0);if(rec<=0)return[0,0];const fee=Math.min(rec,a.advFee||0);a.advFee=(a.advFee||0)-fee;a.advUsed-=rec;if(a.advUsed<=0){a.advUsed=0;a.advFee=0}return[rec,fee]}
const baseApplyBalance=applyBalance;
applyBalance=function(t,dir){const a=acct(t.acct);
 if(dir<0&&a){const d=t.autoDebt;if(d){const back=Math.min(d.amt+(d.fee||0),a[d.k]||0);a[d.k]=(a[d.k]||0)-back;if(d.fee)a.advFee=Math.max(0,(a.advFee||0)-d.fee);if(d.short)a.short=Math.max(0,(a.short||0)-d.short);a.bal-=d.amt+(d.short||0)}
  if(t.autoRecover){a.advUsed=(a.advUsed||0)+t.autoRecover;a.advFee=(a.advFee||0)+(t.autoRecoverFee||0);a.bal+=t.autoRecover}}
 const wasAdv=a&&a.advUsed>0;
 baseApplyBalance(t,dir);if(!a)return;
 if(dir>0){delete t.autoDebt;delete t.autoRecover;delete t.autoRecoverFee;
  /* an advance message from the provider: add the access fee to what is owed */
  if(t.debt==='advance'&&t.kind==='borrow'&&a.kind==='momo'){const fee=advFeeOn(a,t.amt);if(fee){a.advUsed+=fee;a.advFee=(a.advFee||0)+fee;t.advFeeAdded=fee}}
  if(a.bal<0){const over=-a.bal;a.bal=0;
   if(t.src==='sms'){/* the message's own balance follows and is the truth; never invent debt from a message */}
   else if(a.kind==='momo'){advAccrue(a);const take=a.advLimit?Math.min(over,advAvail(a)):over;const fee=advFeeOn(a,take);const rest=over-take;
    a.advUsed=(a.advUsed||0)+take+fee;a.advFee=(a.advFee||0)+fee;if(rest>0)a.short=(a.short||0)+rest;t.autoDebt={k:'advUsed',amt:take,fee,short:rest}}
   else{const k=DEBT_KEY(a);a[k]=(a[k]||0)+over;t.autoDebt={k,amt:over}}}
  else if(a.kind==='momo'&&a.advUsed>0&&t.src!=='sms'&&(t.kind==='in'||t.kind==='topup')){const v=t.orig?t.orig.amt:t.amt;const[rec,fee]=advRecover(a,Math.min(v,a.bal));if(rec>0){a.bal-=rec;t.autoRecover=rec;t.autoRecoverFee=fee}}
  if(a.kind==='momo'&&!wasAdv&&a.advUsed>0)a.advAccr=ymd(TODAY0)}
 if(dir<0&&a.bal<0){const over=-a.bal;a.bal=0;if(t.src!=='sms'){const k=DEBT_KEY(a);a[k]=(a[k]||0)+over}}};
/* A message's own balance is the truth. Money arriving while an advance is open is recovered by the provider first:
   if the new balance is lower than expected, the difference repaid the advance; if nothing was taken, nothing is owed. */
const baseApplySms=applySms;
applySms=function(r,quiet){if(!r)return 0;let before=null,a=null;if(!r.limits&&!r.invest){a=acctForProvider(r.pid,r.cur);advAccrue(a);before={bal:a.bal,adv:a.advUsed||0,fromSms:!!a.balSms,at:a.balSmsAt||''}}
 const n=baseApplySms(r,quiet);
 if(a&&before&&r.txns.length){const main=r.txns[0];const recInMsg=r.txns.some(t=>t.kind==='repay'||t.kind==='borrow');const when=r.date||'';
  /* an older message read late never overrides a newer balance */
  if(r.bal!=null&&before.at&&when&&when<before.at){a.bal=before.bal;return n}
  if(r.bal!=null){a.balSms=true;a.balSmsAt=when||a.balSmsAt;
   /* paid more than the wallet held and the balance is now zero: the rest came from the advance */
   if(a.kind==='momo'&&main.kind==='out'&&!recInMsg&&r.bal===0&&before.fromSms&&a.advLimit){const over=Math.round(r.amt+(r.fee||0)-before.bal);const take=Math.min(Math.max(0,over),advAvail(a));if(take>0){const fee=advFeeOn(a,take);if(!(a.advUsed>0))a.advAccr=ymd(TODAY0);a.advUsed=(a.advUsed||0)+take+fee;a.advFee=(a.advFee||0)+fee;main.advTaken=take;if(!quiet)pushAlert(`${a.name}: ${money(take,a.currency)} taken from your advance`,`You now owe ${money(a.advUsed,a.currency)} including fees. The next money you receive repays it first.`,'accounts','hand')}}
   if(a.kind==='momo'&&main.kind==='in'&&!recInMsg&&before.adv>0){const expected=before.bal+r.amt-(r.fee||0);const gap=Math.round(expected-r.bal);
    if(gap>0){const[rec]=advRecover(a,gap);if(rec>0&&!quiet)pushAlert(`${a.name}: ${money(rec,a.currency)} of your advance was repaid`,a.advUsed?`Still owed on the advance: ${money(a.advUsed,a.currency)}.`:'Your advance is fully repaid.','accounts','hand')}
    else if(before.fromSms&&r.bal>0){a.advUsed=0;a.advFee=0;if(!quiet)pushAlert(`${a.name}: your advance is cleared`,'Money came in without any deduction, so nothing is owed on the advance.','accounts','hand')}}}
  if(a.bal<0)a.bal=0}
 if(a&&a.kind==='momo'){if(a.advLimit&&advPrin(a)>a.advLimit)a.advUsed=a.advLimit+(a.advFee||0);if(a.advUsed<0)a.advUsed=0}
 return n};
/* MoKash and other wallet savings: money you have, and saving regularly raises the MoKash loan limit */
const SAVE_RE=/\b(mokash|momo ?save|savings? (?:account|wallet)|wewole save|m-shwari|lock savings)\b/i;
const baseApplySms2=applySms;
applySms=function(r,quiet){const n=baseApplySms2(r,quiet);if(!r||r.limits||r.invest||!r.txns.length)return n;const t=r.txns[0];const s=t.sms||'';if(!SAVE_RE.test(s))return n;const a=acctForProvider(r.pid,r.cur);
 const sb=s.match(/sav\w*\s*(?:account\s*)?bal(?:ance)?\s*(?:is|:)?\s*(?:UGX|KES|TZS|RWF|USD)?\s*([\d,]+(?:\.\d+)?)/i);
 if(t.kind==='out'){t.cat='savings';t.sub='Mobile money savings';t.title=`Saved to ${/mokash/i.test(s)?'MoKash':'wallet savings'}`;a.saved=(+a.saved||0)+t.amt}
 else if(t.kind==='in'&&/\bfrom\b[^.]{0,40}(mokash|sav)/i.test(s)){t.cat='savings';t.title=`From ${/mokash/i.test(s)?'MoKash':'wallet'} savings`;a.saved=Math.max(0,(+a.saved||0)-t.amt)}
 if(sb)a.saved=num(sb[1]);return n};
/* old saved data: put right what earlier builds got wrong */
const baseMigrate4=window.kasenteMigrate;
window.kasenteMigrate=function(had){baseMigrate4(had);
 S.accounts.forEach(a=>{a.short=+a.short||0;a.advFee=+a.advFee||0;a.saved=+a.saved||0;
  if(a.kind==='momo'){const dfl=ADV_DEFAULTS[a.provider]||[0,0];if(a.advFeePct==null)a.advFeePct=dfl[0];if(a.advDaily==null)a.advDaily=dfl[1]}
  if(a.bal<0){if(a.kind==='momo'&&!a.advFix4)a.bal=0;else{const k=DEBT_KEY(a);a[k]=(a[k]||0)-a.bal;a.bal=0}}
  /* build 4 counted every message that went past the balance as advance used; rebuild it from real advance events */
  if(a.kind==='momo'&&!a.advFix4){a.advFix4=1;const ts=S.txns.filter(t=>t.acct===a.id);if(ts.some(t=>t.src==='sms'&&t.autoDebt)||(a.advLimit&&a.advUsed>a.advLimit)){let u=0;
    ts.sort((x,y)=>pd(x.d)-pd(y.d)).forEach(t=>{if(t.src==='sms'&&t.autoDebt){delete t.autoDebt;return}if(t.debt==='advance')u=t.kind==='borrow'?u+t.amt:Math.max(0,u-t.amt);if(t.autoDebt&&t.autoDebt.k==='advUsed')u+=t.autoDebt.amt;if(t.autoRecover)u=Math.max(0,u-t.autoRecover)});
    a.advUsed=Math.min(a.advUsed,u);a.advFee=0;if(a.advLimit)a.advUsed=Math.min(a.advUsed,a.advLimit);a.short=0}}
  if(a.kind==='momo'&&a.advLimit&&advPrin(a)>a.advLimit)a.advUsed=a.advLimit+(a.advFee||0)});
 advAccrueAll()};
const acctOwes=a=>(a.advUsed||0)+(a.loanOwed||0);
const liquidAccts=()=>S.accounts.filter(a=>['momo','bank','cash'].includes(a.kind));
const owedTotal=()=>S.accounts.reduce((s,a)=>s+acctOwes(a)*acctRate(a),0)+loansTaken();
/* what an account "reads": a wallet on advance reads minus what is owed on it */
const acctReads=a=>(a.bal||0)-(a.kind==='momo'?(a.advUsed||0):0);
const advLine=a=>a.kind!=='momo'||!(a.advLimit||a.advUsed)?'':a.advUsed?`Advance owed ${fmtNum(a.advUsed,a.currency)}${a.advLimit?` · ${kf(advAvail(a))} left`:''}`:`Advance available ${kf(a.advLimit)}`;
creditLeft=()=>S.accounts.reduce((s,a)=>s+(advAvail(a)+Math.max(0,(a.loanLimit||0)-(a.loanOwed||0)))*acctRate(a),0);
const baseSavings4=savingsNow;savingsNow=()=>baseSavings4()+S.accounts.reduce((s,a)=>s+(+a.saved||0)*acctRate(a),0);
/* ---------- home: money you can use, what you owe, what's left this cycle ---------- */
/* the line on the home card: money you could use at the end of each of the last 30 days, worked back from today
   through every recorded transaction, so it moves with what really happened */
function balSeries(accs,days,home){const ids=new Set(accs.map(a=>a.id));const cash=accs.find(a=>a.kind==='cash');
 let v=accs.reduce((x,a)=>x+(home?inHome(a):a.bal),0);const end=plusDays(TODAY0,1);
 const delta=t=>{let d=0;const a=acct(t.acct);if(a&&ids.has(a.id)){const r=home?acctRate(a):1;const amt=t.orig?t.orig.amt:(home?t.amt:t.amt/acctRate(a));d+=(effOf(t)>0?1:-1)*amt*r;if(t.autoDebt)d+=(t.autoDebt.amt+(t.autoDebt.short||0))*r;if(t.autoRecover)d-=t.autoRecover*r}
  if(cash&&(t.kind==='move'||t.kind==='topup')&&t.acct!==cash.id)d+=(t.kind==='move'?1:-1)*t.amt/(home?1:acctRate(cash));return d};
 const ts=S.txns.filter(t=>pd(t.d)>=plusDays(TODAY0,-days)).sort((x,y)=>pd(y.d)-pd(x.d));
 const out=[];let i=0;for(let k=0;k<=days;k++){const dayEnd=plusDays(end,-k);while(i<ts.length&&pd(ts[i].d)>=dayEnd){v-=delta(ts[i]);i++}out.push(Math.max(0,v))}return out.reverse()}
function liquidHistory(){return balSeries(liquidAccts(),30,true).map(x=>x/1000)}
const acctHist=(a,days)=>balSeries([a],days||14,false).map(x=>x/1000);
/* putting the advance right by hand */
ACT.advRepaid=id=>{const a=acct(id);a.advUsed=0;a.advFee=0;closeSheet();refresh();toast(`${a.name}: advance cleared. The full limit is available again.`,'check')};
ACT.advFix=id=>{const a=acct(id);openSheet(`${esc(a.name)} · advance`,`<form class="stack" data-form="advFix" data-id="${id}" style="gap:10px">
 <div class="grid2"><label class="field"><span>Advance limit</span><input name="lim" type="number" min="0" step="any" value="${a.advLimit||''}"></label><label class="field"><span>Owed now (with fees)</span><input name="used" type="number" min="0" step="any" value="${a.advUsed||''}" placeholder="0"></label></div>
 <div class="grid2"><label class="field"><span>Fee each draw (%)</span><input name="fee" type="number" min="0" step="any" value="${feePct(a)}"></label><label class="field"><span>Interest per day (%)</span><input name="daily" type="number" min="0" step="any" value="${dailyPct(a)}"></label></div>
 <label class="field"><span>Savings on this wallet (e.g. MoKash)</span><input name="saved" type="number" min="0" step="any" value="${a.saved||''}" placeholder="0"></label>
 <p class="xs muted">Dial *165# (MTN) or check your last message to see what you owe. MTN Uganda charges 2.75% each time you draw an advance and 0.95% a day on what is still owed.</p>
 <button class="btn primary">Save</button></form>`)};
FORMS.advFix=(fd,f)=>{const a=acct(f.dataset.id);a.advLimit=+fd.get('lim')||0;const u=+fd.get('used')||0;if(u!==a.advUsed){a.advUsed=u;a.advFee=0;a.advAccr=ymd(TODAY0)}a.advFeePct=+fd.get('fee')||0;a.advDaily=+fd.get('daily')||0;a.saved=+fd.get('saved')||0;closeSheet();refresh();toast('Saved','check')};

const baseHome4=SCREENS.home;
SCREENS.home=()=>{advAccrueAll();let h=baseHome4();const s0=h.indexOf('<section class="hero"'),s1=h.indexOf('</section>',s0);if(s0<0||s1<0)return h;
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
