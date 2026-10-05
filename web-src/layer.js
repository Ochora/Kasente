/* ===== Kasente test build layer: real dates, saved data, Android bridge ===== */
let SAMPLE_SNAPSHOT=JSON.stringify(S);
const STORE='kasente.v1';
const NATIVE=window.KasenteNative||null;
const hashPin=p=>{let x=5381;for(const c of 'kasente:'+p)x=((x<<5)+x+c.charCodeAt(0))|0;return 'h'+(x>>>0).toString(36)};
const plusDays=(d,n)=>new Date(d.getTime()+n*DAY);
const hhmm=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
const cycleLabel=()=>`${CYCLE_START.getDate()} ${MON[CYCLE_START.getMonth()]} – ${CYCLE_END.getDate()} ${MON[CYCLE_END.getMonth()]}`;
const isFresh=()=>S.mode==='fresh';
const initials=n=>(n||'?').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
const ordinal=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])};
const sumAmt=a=>a.reduce((x,t)=>x+t.amt,0);
ONB[2].p='Everything is stored on this phone and works offline. Save a backup file from Settings whenever you like. No ads, no data selling.';

/* ---------- history for charts ---------- */
function H(){
 if(!isFresh())return{labels:HIST.labels,inc:HIST.inc,exp:HIST.exp,nw:HIST.nw,nwLabels:HIST.labels,prev:HIST.nw[HIST.nw.length-1]*1e6};
 const labels=[],inc=[],exp=[];
 for(let i=11;i>=0;i--){const d=new Date(TODAY0.getFullYear(),TODAY0.getMonth()-i,1);const k=ymd(d).slice(0,7);labels.push(MON[d.getMonth()]);
  inc.push(sumAmt(S.txns.filter(t=>t.kind==='in'&&t.d.startsWith(k))));exp.push(sumAmt(S.txns.filter(t=>t.kind==='out'&&t.d.startsWith(k))))}
 const today=ymd(TODAY0);const ks=Object.keys(S.nwHist||{}).filter(k=>k<today).sort().slice(-11);
 const prevK=ks.filter(k=>k<=ymd(CYCLE_START)).pop()||ks[0];
 return{labels,inc,exp,nw:ks.map(k=>S.nwHist[k]/1e6),nwLabels:[...ks,today].map(k=>{const d=pd(k+' 00:00');return d.getDate()+' '+MON[d.getMonth()]}),prev:prevK!=null?S.nwHist[prevK]:null};
}

/* ---------- saving ---------- */
function recordDaily(){const k=ymd(TODAY0);S.nwHist=S.nwHist||{};S.nwHist[k]=netWorth();
 if(isFresh())S.accounts.forEach(a=>{a.hist=a.hist||{};a.hist[k]=a.bal;a.trend=Object.keys(a.hist).sort().slice(-8).map(d=>a.hist[d]/1000)})}
function save(){if(!S.mode)return;recordDaily();try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}}
function bumpIds(){let mx=NID;const scan=o=>{if(Array.isArray(o))o.forEach(scan);else if(o&&typeof o==='object'){if(typeof o.id==='string'){const n=parseInt(o.id.replace(/\D/g,''),10);if(n>mx)mx=n}Object.values(o).forEach(v=>{if(v&&typeof v==='object')scan(v)})}};scan(S);NID=mx}
function load(){try{const j=localStorage.getItem(STORE);if(!j)return false;const d=JSON.parse(j);if(!d||!d.mode)return false;Object.assign(S,d);S.ui={...S.ui,q:''};bumpIds();return true}catch(e){return false}}
function startFresh(name,pdy){
 Object.assign(S,JSON.parse(SAMPLE_SNAPSHOT));
 Object.assign(S,{mode:'fresh',user:{name,full:name,role:''},txns:[],bills:[],loans:[],goals:[],inv:[],notifs:[],family:null,nwHist:{},readN:[],smsSeen:[],smsSince:0});
 S.accounts=[['mtn','MTN MoMo','Mobile money · auto from SMS','#F5C000'],['airtel','Airtel Money','Mobile money · auto from SMS','#D7262E'],['cash','Cash on hand','Adjusted by you','#2F8A5B']].map(([id,n,t,c])=>({id,name:n,type:t,bal:0,c,trend:[]}));
 S.settings={...S.settings,payday:pdy,lock:false,pin:null,sms:true,wa:false};
 S.ui={tx:'all',acct:'all',q:'',range:6,lendTab:'open',invTab:'all'};
 S.chat=[{me:false,html:`Hi ${esc(name)}. Ask me about your spending, budgets, bills or goals. I work from the figures on this phone, and they don't leave it.`}];
 S.wa=[{me:false,html:'Send <b>balance</b>, <b>spent today</b> or <b>budget</b>, or paste a MoMo message to log it.',time:hhmm(new Date())}];
 tick();
}
function ensureAcct(id){if(acct(id))return;const d={mtn:['MTN MoMo','Mobile money · auto from SMS','#F5C000'],airtel:['Airtel Money','Mobile money · auto from SMS','#D7262E'],bank:['Bank','Bank · from SMS','#2558B0'],cash:['Cash on hand','Adjusted by you','#2F8A5B']}[id]||['Account','','#7C8F8B'];S.accounts.push({id,name:d[0],type:d[1],bal:0,c:d[2],trend:[]})}

/* ---------- bills that repeat ---------- */
function rollBills(){S.bills.forEach(b=>{if(b.status!=='paid'||(b.note||'')==='Once')return;const rep=b.rep||'Monthly';if(rep==='Once')return;
 let guard=0;while(daysUntil(b.due)<0&&guard++<24){const d=pd(b.due+' 00:00');const n=rep==='Yearly'?new Date(d.getFullYear()+1,d.getMonth(),d.getDate()):rep==='Every term'?new Date(d.getFullYear(),d.getMonth()+4,d.getDate()):new Date(d.getFullYear(),d.getMonth()+1,d.getDate());b.due=ymd(n);b.status='due';b.auto=false}})}

/* ---------- notifications worked out from your data ---------- */
function computeNotifs(){const out=[],cs=ymd(CYCLE_START),th=S.settings.threshold/100;
 S.cats.forEach(c=>{if(!c.budget)return;const sp=catSpent(c.id),p=sp/c.budget;
  if(p>1)out.push({id:`over-${c.id}-${cs}`,t:'bad',ic:'alert',title:`${c.name} is over budget`,body:`${ugx(sp)} spent of ${ugx(c.budget)}.`,when:'This cycle',go:'budgets'});
  else if(p>=th)out.push({id:`warn-${c.id}-${cs}`,t:'warn',ic:'alert',title:`${c.name} is at ${Math.round(p*100)}% of budget`,body:`${DAYS_LEFT} days left in this cycle.`,when:'This cycle',go:'budgets'})});
 S.bills.filter(b=>b.status!=='paid').forEach(b=>{const d=daysUntil(b.due);
  if(d<0)out.push({id:`late-${b.id}-${b.due}`,t:'bad',ic:'calendar',title:`${b.name} is ${-d} day${d===-1?'':'s'} late`,body:b.amt?`About ${ugx(b.amt)}.`:'Mark it paid once it is settled.',when:dlabel(b.due),go:'bills'});
  else if(d<=3)out.push({id:`due-${b.id}-${b.due}`,t:'accent',ic:'calendar',title:d===0?`${b.name} is due today`:`${b.name} due in ${d} day${d===1?'':'s'}`,body:b.amt?`About ${ugx(b.amt)}.`:'',when:dlabel(b.due),go:'bills'})});
 S.loans.filter(l=>l.amt>l.paid&&daysUntil(l.due)<0).forEach(l=>out.push({id:`loan-${l.id}-${l.due}`,t:'warn',ic:'hand',title:l.dir==='out'?`${l.who}'s repayment date has passed`:`Your repayment to ${l.who} is late`,body:`${ugx(l.amt-l.paid)} outstanding since ${dlabel(l.due)}.`,when:dlabel(l.due),go:'lending'}));
 const rd=S.readN||[];out.forEach(n=>n.read=rd.includes(n.id));return out}
ACT.notif=a=>{const n=S.notifs.find(x=>x.id===a);if(!n)return;n.read=true;S.readN=[...new Set([...(S.readN||[]),a])].slice(-300);go(n.go)};
ACT.readAll=()=>{S.notifs.forEach(n=>n.read=true);S.readN=[...new Set([...(S.readN||[]),...S.notifs.map(n=>n.id)])].slice(-300);refresh()};

/* ---------- phone reminders (Android alarms) ---------- */
let lastSched='';
function scheduleReminders(){if(!NATIVE||!NATIVE.schedule||!S.mode)return;const now=Date.now(),list=[];
 if(!isFresh()){const j='[]';if(j!==lastSched){lastSched=j;try{NATIVE.schedule(j)}catch(e){}}return}
 const at=(ds,off)=>{const d=pd(ds+' 08:00');return d.getTime()-off*DAY};
 S.bills.filter(b=>b.status!=='paid').forEach(b=>[3,1,0].forEach(o=>{const t=at(b.due,o);if(t>now)list.push({title:o?`${b.name} due in ${o} day${o>1?'s':''}`:`${b.name} is due today`,body:b.amt?`About ${ugx(b.amt)}. Tap to open Kasente.`:'Tap to open Kasente.',at:t})}));
 S.loans.filter(l=>l.amt>l.paid).forEach(l=>{const t=at(l.due,1);if(t>now)list.push({title:l.dir==='out'?`${l.who} is due to repay tomorrow`:`You're due to repay ${l.who} tomorrow`,body:`${ugx(l.amt-l.paid)} outstanding.`,at:t})});
 list.sort((a,b)=>a.at-b.at);const j=JSON.stringify(S.settings.push?list.slice(0,60):[]);if(j===lastSched)return;lastSched=j;try{NATIVE.schedule(j)}catch(e){}}

/* ---------- status bar colour follows the theme ---------- */
let lastBars='';
function applyBars(){if(!NATIVE||!NATIVE.setBars)return;const st=getComputedStyle(document.documentElement);const bg=st.getPropertyValue('--bg').trim();const t=document.documentElement.getAttribute('data-theme');const dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;const k=bg+dark;if(k===lastBars)return;lastBars=k;try{NATIVE.setBars(bg,!dark)}catch(e){}}

/* ---------- render wrapper ---------- */
const baseRender=window.render;
window.render=function(keep){tick();rollBills();if(isFresh())S.notifs=computeNotifs();baseRender(keep);save();applyBars();scheduleReminders()};

/* ---------- recording transactions ---------- */
const billWords=b=>(b.kind+' '+b.name).toLowerCase().split(/[^a-z]+/).filter(w=>w.length>3&&!['bill','with','monthly','home','balance','term','subscription','repayment','contribution'].includes(w));
window.addTxn=function(t,quiet){t.id=nid('t');t.d=t.d||stamp();ensureAcct(t.acct);S.txns.push(t);const a=acct(t.acct);if(a)a.bal+=t.kind==='in'?t.amt:-t.amt;if(t.kind==='move'&&t.acct!=='cash'){ensureAcct('cash');acct('cash').bal+=t.amt}
 if(t.kind==='lend'&&t.loanWho)S.loans.unshift({id:nid('l'),dir:'out',who:t.loanWho,amt:t.amt,paid:0,date:t.d.slice(0,10),due:ymd(plusDays(pd(t.d),30)),note:'Detected from the MoMo note',auto:true});
 let paidBill=null;
 if(t.kind==='out'){const txt=(t.title+' '+(t.sms||'')).toLowerCase();paidBill=S.bills.find(b=>b.status!=='paid'&&b.amt&&Math.abs(b.amt-t.amt)/b.amt<.2&&billWords(b).some(w=>txt.includes(w)));if(paidBill){paidBill.status='paid';paidBill.paidOn=t.d.slice(0,10);paidBill.auto=true}}
 if(quiet)return t;
 let msg=`Saved ${ugx(t.amt)} · ${catOf(t).name}`,icn='check';
 if(t.kind==='out'){const c=cat(t.cat);if(c&&c.budget){const p=catSpent(c.id)/c.budget;if(p>1)msg+=`. ${c.name} is now over budget`;else if(p>=S.settings.threshold/100)msg+=`. ${c.name} is at ${Math.round(p*100)}% of budget`}}
 if(t.route){const v=fareVerdict(route(t.route),t.mode,t.amt);if(v&&v.k!=='good'){msg=`You paid ${ugx(t.amt)} for ${routeName(route(t.route))}. The usual range is ${num(v.lo)}–${num(v.hi)}.`;icn='alert'}}
 if(paidBill)msg+=`. ${paidBill.name} marked paid`;
 toast(msg,icn);return t};

/* ---------- reading real MoMo messages ---------- */
const MONEY_RE=/(?:UGX|Ugx|Ushs?|Shs?)\.?\s?[\d,]{2,}|[\d,]{3,}(?:\.\d+)?\s?(?:UGX|Ushs?)/i;
const SKIP_RE=/\b(otp|one[- ]time|verification|code is|password|failed|unsuccessful|insufficient|declined|not successful|reversal|win\b|winner|offer|promo|bonus|dial \*|qualif|congratulations|loan limit|eligible|click|http)/i;
const ACTION_RE=/\b(sent|received|paid|payment|withdr\w*|deposit\w*|debited|credited|transferred|transfer|cash ?out|cash ?in|bought|purchase)\b/i;
const isMoneySms=b=>!!b&&MONEY_RE.test(b)&&ACTION_RE.test(b)&&!SKIP_RE.test(b);
window.parseSMS=function(raw,sender){
 const s=String(raw||'').replace(/\s+/g,' ').trim(),from=String(sender||'');
 const am=s.match(/(?:UGX|Ugx|Ushs?|Shs?)\.?\s?([\d,]+(?:\.\d+)?)/i)||s.match(/([\d,]{3,})(?:\.\d+)?\s?(?:UGX|Ushs?)/i);
 if(!am)return null;const amt=Math.round(+am[1].replace(/,/g,''));if(!amt)return null;
 let kind='out',type=null;
 if(/withdr\w*|cash ?out/i.test(s)){kind='move';type='Withdrawn to cash'}
 else if(/\breceived\b|\bcredited\b|cash ?in\b|deposit(?:ed)? .{0,20}(?:to|into) your/i.test(s)){kind='in';type=/deposit/i.test(s)?'Deposit':'Received'}
 else if(/\bdebited\b/i.test(s))type='Bank debit';
 else if(/\bpaid\b|\bpayment\b|\bbought\b|\bpurchase/i.test(s))type='Paid to merchant';
 else if(/\bsent\b|transferred|transfer of/i.test(s))type='Sent';
 let party=(s.match(/\b(?:to|from)\s+([A-Za-z][A-Za-z0-9&.' -]{1,40}?)(?=\s*(?:\(|,|\.|;|:|\s(?:\+?256|0)\d{6,}|\s\d{6,}|\son\b|\sat\b|\sref|\stid|\swith\b|\sfor\b|$))/i)||[])[1];
 if(!party&&kind==='move')party=(s.match(/\bat (?:agent\s+)?([A-Za-z][A-Za-z0-9&.' -]{2,30}?)(?=\s+on\b|[.,]|$)/i)||[])[1];
 if(!party)party=(s.match(/\bto\s+(?:\+?256|0)\d{6,}\s+([A-Za-z][A-Za-z' -]{1,30}?)(?=[.,]|\s(?:charge|fee|bal|on)\b|$)/i)||[])[1];
 if(party&&/^(your|you|account|a\/c|mobile|the|wallet|number)\b/i.test(party))party=null;
 const dm=s.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}:\d{2}))?/);
 const date=dm?`${dm[3]}-${dm[2]}-${dm[1]} ${dm[4]||'12:00'}`:stamp();
 const bal=(s.match(/(?:new balance|available balance|avl\.? bal|balance|\bbal)\s*(?:is|:)?\s*(?:UGX|Ugx|Ushs?|Shs?)\.?\s?([\d,]+)/i)||[])[1];
 const ref=(s.match(/(?:transaction id|txn id|trans(?:action)? ?ref|\btid|reference|\bref)\s*(?:no\.?|:|#)?\s*([A-Z0-9.]{6,})/i)||[])[1];
 const reason=(s.match(/(?:reason|message|note)\s*:\s*([^.]+)/i)||[])[1];
 const fee=(s.match(/(?:fee|charge)s?(?: was| of)?\s*:?\s*(?:UGX|Ugx|Shs?)\.?\s?([\d,]+)/i)||[])[1];
 const provider=/airtel/i.test(from+' '+s)?'airtel':/(mtn|momo|m-money)/i.test(from)?'mtn':/(stanbic|centenary|dfcu|absa|equity|housing|bank|a\/c|acct)/i.test(from+' '+s)?'bank':'mtn';
 const isLoan=kind==='out'&&/\b(loan|pay (?:you|me) back|borrow)/i.test(reason||'');
 const c=kind==='in'?'income':kind==='move'?'move':isLoan?'lend':guessCat(`${party||''} ${reason||''} ${s}`);
 return{amt,kind:isLoan?'lend':kind,type:type||'Money out',party:titleCase(party)||'Unknown',date,bal,ref,reason,fee,provider,cat:c,isLoan,uncertain:!type||(!party&&kind!=='move'&&type!=='Bank debit')};
};
function smsSync(manual){
 if(!NATIVE||!isFresh())return;
 if(!S.settings.sms){if(manual)toast('Turn on "Read money SMS" in Settings first.','sms');return}
 let ok=false;try{ok=NATIVE.hasSmsPermission()}catch(e){}
 if(!ok){if(manual)try{NATIVE.requestSmsPermission()}catch(e){}return}
 const since=S.smsSince||(Date.now()-60*DAY);let list=[];try{list=JSON.parse(NATIVE.readSms(String(since))||'[]')}catch(e){list=[]}
 S.smsSeen=S.smsSeen||[];let added=0,review=0,maxDate=since;
 list.sort((a,b)=>a.date-b.date).forEach(m=>{const key=m.date+'|'+String(m.body||'').slice(0,48);if(m.date>maxDate)maxDate=m.date;if(S.smsSeen.includes(key))return;S.smsSeen.push(key);
  if(!isMoneySms(m.body))return;const p=parseSMS(m.body,m.address);if(!p)return;const d=new Date(+m.date);ensureAcct(p.provider);
  addTxn({acct:p.provider,kind:p.kind,amt:p.amt,cat:p.cat,title:p.kind==='lend'?`Loan to ${p.party}`:p.kind==='move'?`Cash withdrawal${p.party!=='Unknown'?' · '+p.party:''}`:p.kind==='in'?(p.party==='Unknown'?p.type:`From ${p.party}`):(p.party==='Unknown'?p.type:p.party),src:'sms',sms:m.body,d:`${ymd(d)} ${hhmm(d)}`,loanWho:p.isLoan?p.party:null,review:p.uncertain},true);
  if(p.bal){const a=acct(p.provider);if(a)a.bal=+p.bal.replace(/,/g,'')}
  added++;if(p.uncertain)review++});
 S.smsSeen=S.smsSeen.slice(-1500);S.smsSince=maxDate;S.smsLast=Date.now();
 if(added){refresh();toast(`${added} transaction${added>1?'s':''} read from your messages${review?`. ${review} to check`:''}`,'sms')}else{save();if(manual)toast('No new money messages found.','sms')}
}

/* ---------- Android hooks ---------- */
window.kasenteOnPermission=(what,granted)=>{if(what==='sms'){if(granted){S.settings.sms=true;smsSync(true)}else{toast('No SMS access. You can still log by hand, and turn it on later in Settings.','sms');refresh()}
 if(S.askNotif){S.askNotif=false;setTimeout(()=>{try{NATIVE.requestNotifications()}catch(e){}},800)}}};
window.kasenteOnResume=away=>{if(!S.mode)return;tick();if(S.settings.lock&&S.settings.pin&&away>15000&&$('#lock').hidden)showLock();smsSync(false);refresh()};
window.kasenteOnBiometric=ok=>{if(ok){$('#lock').hidden=true;pin='';toast(`Welcome back, ${S.user.name}`,'lock')}else drawLock('Use your PIN')};
window.kasenteBack=()=>{if(!$('#lock').hidden||!$('#onb').hidden)return false;if($('#layer').innerHTML){closeSheet();return true}if(stack.length>1){back();return true}if(cur()!=='home'){go('home');return true}return false};

/* ---------- lock ---------- */
const canBio=()=>{try{return !!(NATIVE&&NATIVE.canBiometric&&NATIVE.canBiometric()&&S.settings.bio)}catch(e){return false}};
window.drawLock=function(msg){const L=$('#lock');const wait=Math.max(0,Math.ceil((lockedUntil-Date.now())/1000));
 L.innerHTML=`<span class="logo-mark lg">K</span><div class="lock-name">Kasente</div><p>${wait?`Too many attempts. Try again in ${wait}s.`:msg||'Enter your PIN'}</p><div class="pin-dots" id="dots">${[0,1,2,3].map(i=>`<i class="${i<pin.length?'f':''}"></i>`).join('')}</div>${S.mode==='sample'?'<p class="xs" style="opacity:.75">Sample PIN: 2580</p>':'<p class="xs" style="opacity:0">.</p>'}
 <div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-act="key" data-arg="${n}" ${wait?'disabled':''}>${n}</button>`).join('')}${canBio()?`<button data-act="bio" aria-label="Use fingerprint" ${wait?'disabled':''}>${ic('finger',28)}</button>`:'<span></span>'}<button data-act="key" data-arg="0" ${wait?'disabled':''}>0</button><button data-act="key" data-arg="del" aria-label="Delete" ${wait?'disabled':''}>${ic('del',26)}</button></div>`;
 if(wait)setTimeout(()=>drawLock(),1000)};
ACT.key=k=>{if(k==='del'){pin=pin.slice(0,-1);drawLock();return}if(pin.length>=4)return;pin+=k;drawLock();
 if(pin.length===4)setTimeout(()=>{if(hashPin(pin)===S.settings.pin){fails=0;pin='';$('#lock').hidden=true}else{fails++;pin='';if(fails>=5){lockedUntil=Date.now()+30000;fails=0;drawLock()}else{drawLock(`Wrong PIN · ${5-fails} tries left`);$('#dots').classList.add('shake')}}},160)};
ACT.bio=()=>{try{NATIVE.biometric()}catch(e){drawLock('Use your PIN')}};
window.showLock=function(){pin='';$('#lock').hidden=false;drawLock();if(canBio())setTimeout(()=>ACT.bio(),300)};
ACT.lockNow=()=>{if(!S.settings.pin){ACT.setPin();return}showLock()};
ACT.setPin=()=>openSheet('Set a 4-digit PIN',`<form class="stack" data-form="setPin"><label class="field"><span>New PIN</span><input name="a" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" required autocomplete="off"></label><label class="field"><span>Type it again</span><input name="b" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" required autocomplete="off"></label><p id="pinErr" class="small" style="color:var(--bad)"></p><button class="btn primary">Save PIN and turn on lock</button><p class="xs muted">Kasente asks for it each time you open the app after 15 seconds away. Five wrong tries lock it for 30 seconds.</p></form>`);
FORMS.setPin=fd=>{const a=fd.get('a'),b=fd.get('b');if(!/^\d{4}$/.test(a)){$('#pinErr').textContent='Use exactly 4 digits.';return}if(a!==b){$('#pinErr').textContent="The two PINs don't match. Try again.";return}S.settings.pin=hashPin(a);S.settings.lock=true;closeSheet();refresh();toast('PIN saved. App lock is on.','lock')};

/* ---------- onboarding and setup ---------- */
window.showOnboard=function(i){const o=$('#onb');o.hidden=false;const s=ONB[i];const last=i===ONB.length-1;
 o.innerHTML=`<div class="between"><span class="logo-mark">K</span><button class="link" data-act="onbDone">${S.mode?'Close':'Skip'}</button></div><div class="onb-art">${s.art==='k'?`<div style="position:relative;width:200px;height:200px">${donut([{c:'var(--accent)',v:45},{c:'var(--sun)',v:25},{c:'#DD7A22',v:15},{c:'#3B76CC',v:15}],200,30)}<span class="logo-mark lg" style="position:absolute;inset:0;margin:auto">K</span></div>`:s.art==='sms'?`<div class="stack" style="width:100%;max-width:300px"><div class="mono">${SAMPLE_SMS.mtnPaid}</div><div style="text-align:center;color:var(--accent)">${ic('down',28)}</div><div class="list"><div class="tx"><span class="chip" style="--c:#0F8A83">${ic('bike')}</span><span class="tx-main"><span class="tx-title">Boda Safe Rides</span><span class="tx-sub">Transport · MTN MoMo <span class="src">SMS</span></span></span><span class="tx-amt">−4,000</span></div></div></div>`:`<span class="chip" style="--c:var(--accent);width:140px;height:140px;border-radius:44px">${ic('shield',72)}</span>`}</div><h2>${s.t}</h2><p>${s.p}</p><div class="dots">${ONB.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div>${!last?`<button class="btn primary block" data-act="onbNext" data-arg="${i+1}">Continue</button>`:S.mode?`<button class="btn primary block" data-act="onbDone">Done</button>`:`<button class="btn sun block" data-act="onbSetup">Set up Kasente</button>`}`};
ACT.onbDone=()=>{if(!S.mode){ACT.onbSetup();return}$('#onb').hidden=true;go('home')};
ACT.onbSetup=()=>{const o=$('#onb');o.hidden=false;
 o.innerHTML=`<div class="between"><span class="logo-mark">K</span></div><div style="flex:1;overflow:auto;padding-top:22px"><h2>Set up Kasente</h2><p>Two quick questions. You can change both later in Settings.</p>
 <form class="stack" data-form="setup" style="margin-top:22px">
  <label class="field"><span>What should Kasente call you?</span><input id="setupName" name="name" required autocomplete="given-name" placeholder="Your first name"></label>
  <label class="field"><span>When are you usually paid?</span><select name="payday">${Array.from({length:31},(_,i)=>`<option value="${i+1}" ${i===24?'selected':''}>The ${ordinal(i+1)} of the month</option>`).join('')}</select></label>
  <div class="field"><span>Start with</span>
   <label class="card row" style="padding:12px 14px;cursor:pointer"><input type="radio" name="mode" value="fresh" checked style="accent-color:var(--accent);width:20px;height:20px"><span class="grow"><b>My own money</b><br><span class="small muted">An empty app. Log what you spend and let Kasente read your MoMo messages.</span></span></label>
   <label class="card row" style="padding:12px 14px;cursor:pointer"><input type="radio" name="mode" value="sample" style="accent-color:var(--accent);width:20px;height:20px"><span class="grow"><b>Sample data</b><br><span class="small muted">Explore with Sarah's example month. You can switch to your own data any time.</span></span></label>
  </div>
  <button class="btn primary block">Start</button>
 </form></div>`};
FORMS.setup=fd=>{const name=(fd.get('name')||'').trim()||'Friend',pdy=+fd.get('payday')||25;
 if(fd.get('mode')==='sample'){Object.assign(S,JSON.parse(SAMPLE_SNAPSHOT));S.mode='sample';S.settings={...S.settings,pin:hashPin('2580'),lock:false,payday:25,sms:false};S.user={...S.user};tick()}
 else startFresh(name,pdy);
 $('#onb').hidden=true;stack=['home'];render();
 if(isFresh()){toast(`Welcome, ${name}. Set your budget limits under More → Budgets.`,'sparkle');
  if(NATIVE)setTimeout(()=>{try{if(NATIVE.hasSmsPermission()){smsSync(true);NATIVE.requestNotifications()}else{S.askNotif=true;NATIVE.requestSmsPermission()}}catch(e){}},600)}
 else toast('Sample data loaded. Switch to your own data in Settings.','sparkle')};

/* ---------- home ---------- */
function insight(){
 if(!isFresh()){const fp=catSpent('food')/cat('food').budget;return{t:'Food is running ahead',b:`You've used ${Math.round(fp*100)}% of your food budget with ${DAYS_LEFT} days to go. Market and canteen spending is about 15% above last cycle.`,q:'Am I on track this month?'}}
 const pace=DAY_OF_CYCLE/CYCLE_DAYS;
 if(!expenses().length)return{t:'Start with today',b:NATIVE?'Log what you spend today. Your MoMo and Airtel Money messages are read automatically once SMS access is on.':'Log what you spend today, even small things like boda fares and lunch. A week of entries is enough for useful patterns.',q:null};
 const ahead=S.cats.filter(c=>c.budget&&catSpent(c.id)>0).map(c=>({c,p:catSpent(c.id)/c.budget})).sort((a,b)=>b.p-a.p)[0];
 if(ahead&&ahead.p>pace+.15)return{t:`${ahead.c.name} is running ahead`,b:`You've used ${Math.round(ahead.p*100)}% of your ${ahead.c.name.toLowerCase()} budget with ${DAYS_LEFT} days to go.`,q:'Am I on track this month?'};
 return{t:"You're on pace",b:`Spending is in line with an even pace across your budget, ${DAY_OF_CYCLE} days into this cycle.`,q:'Am I on track this month?'};
}
SCREENS.home=()=>{
 const nw=netWorth(),h=H(),prev=h.prev,delta=prev!=null?nw-prev:null;
 const spent=cycleSpent(),bud=totalBudget(),p=bud?spent/bud:0,pace=DAY_OF_CYCLE/CYCLE_DAYS;
 const bills=S.bills.filter(b=>b.status!=='paid').sort((a,b)=>a.due.localeCompare(b.due)).slice(0,3);
 const recent=S.txns.slice().sort((a,b)=>pd(b.d)-pd(a.d)).slice(0,5);const ins=insight();
 const review=S.txns.filter(t=>t.review).length;
 return `
 <section class="hero" aria-label="Net worth">
  <div class="between"><span class="eyebrow">Net worth · all accounts</span>${isFresh()?'':'<span class="ghost-pill">Sample data</span>'}</div>
  <div class="hero-num"><small>UGX</small>${num(nw)}</div>
  <div class="hero-delta">${delta!=null&&prev?`<b>${delta>=0?'▲':'▼'} ${num(delta)}</b> (${(delta/Math.abs(prev)*100).toFixed(1)}%) since last cycle`:'Tracking started. Changes show from tomorrow.'}</div>
  <div class="hero-spark">${spark([...h.nw,nw/1e6],300,54,'var(--sun)',true)}</div>
  <div class="hero-foot"><div><span>Spent today</span><b>${num(todaySpent())}</b></div><div><span>In this cycle</span><b>${num(cycleIncome())}</b></div><div><span>Cycle</span><b>Day ${DAY_OF_CYCLE} of ${CYCLE_DAYS}</b></div></div>
 </section>
 ${review?`<button class="note warn" data-go="activity" style="text-align:left">${ic('alert')}<span class="grow"><b>${review} message${review>1?'s':''} to check.</b> Kasente wasn't sure how to read ${review>1?'them':'it'}. <span class="link">Review →</span></span></button>`:''}
 <div class="sec-head"><h2>Accounts</h2><button class="link" data-go="accounts">See all</button></div>
 <div class="rail">${S.accounts.map(a=>`<button class="acct" data-act="acct" data-arg="${a.id}"><span class="acct-head"><span class="acct-dot" style="background:${a.c}"></span>${esc(a.name)}</span><span class="acct-type">${esc(a.type.split(' · ')[0])}</span><span class="acct-bal">${num(a.bal)}</span><div style="margin-top:6px">${spark(a.trend,130,26,'var(--accent)')}</div></button>`).join('')}<button class="acct add" data-act="addAccount">${ic('plus')}Add account</button></div>
 <div class="quick">
  <button class="qa" data-act="add"><span class="qi">${ic('plus',22)}</span>Log expense</button>
  <button class="qa" data-go="scan"><span class="qi">${ic('receipt',22)}</span>Scan receipt</button>
  <button class="qa" data-go="transport"><span class="qi">${ic('bike',22)}</span>Check fare</button>
  <button class="qa" data-go="lending"><span class="qi">${ic('hand',22)}</span>Lend / borrow</button>
 </div>
 <button class="card stack" data-go="budgets" style="text-align:left;gap:10px">
  <div class="between"><span class="eyebrow">This cycle's budget · ${cycleLabel()}</span><span class="pill ${p>pace+.15?'warn':'good'}">${DAYS_LEFT} days left</span></div>
  <div class="between" style="align-items:baseline"><span style="font-family:var(--f-display);font-weight:800;font-size:24px" class="tnum">${num(spent)}</span><span class="muted small tnum">of ${num(bud)}</span></div>
  <div class="bar thick"><i style="width:${Math.min(100,p*100)}%"></i><span class="pace" style="left:${pace*100}%"></span></div>
  <span class="xs muted">${isFresh()?(spent?`The line marks where you'd be at an even pace. ${p>pace?"You're ahead of it.":"You're under it."}`:'These are starting limits. Tap to set your own.'):"The line marks where you'd be at an even pace. Rent and school fees went out early this cycle."}</span>
 </button>
 <div class="insight">${ic('sparkle')}<div class="grow"><b style="font-size:14px">${ins.t}</b><p class="small" style="margin-top:2px">${ins.b}</p>${ins.q?`<button class="link small" style="margin-top:6px" data-act="askAdvisor" data-arg="${ins.q}">Ask the advisor →</button>`:`<button class="link small" style="margin-top:6px" data-act="add">Log an expense →</button>`}</div></div>
 <div class="sec-head"><h2>Coming up</h2><button class="link" data-go="bills">All bills</button></div>
 ${bills.length?`<div class="list">${bills.map(billRow).join('')}</div>`:`<button class="card" data-act="addBill" style="text-align:left"><b>No bills yet</b><p class="small muted" style="margin-top:4px">Add UMEME, water, rent or school fees once and Kasente reminds you 3 days and 1 day before.</p><span class="link small" style="display:block;margin-top:8px">Add a bill →</span></button>`}
 <div class="sec-head"><h2>Recent activity</h2><button class="link" data-go="activity">See all</button></div>
 ${recent.length?`<div class="list">${recent.map(txRow).join('')}</div>`:`<div class="card stack" style="gap:10px"><b>Nothing logged yet</b><p class="small muted">Tap the yellow + to log an expense. ${NATIVE?'Mobile money appears here by itself once SMS access is on.':''}</p>${NATIVE?`<button class="btn sm" data-act="smsNow">${ic('sms',16)}Read my MoMo messages</button>`:''}</div>`}`;
};
ACT.smsNow=()=>smsSync(true);

/* ---------- bills: the real month ---------- */
SCREENS.bills=()=>{
 const due=S.bills.filter(b=>b.status!=='paid').sort((a,b)=>a.due.localeCompare(b.due)),paid=S.bills.filter(b=>b.status==='paid');
 const late=due.filter(b=>daysUntil(b.due)<0),soon=due.filter(b=>daysUntil(b.due)>=0);
 const total=soon.filter(b=>b.due<=ymd(CYCLE_END)).reduce((a,b)=>a+b.amt,0);
 const y=TODAY0.getFullYear(),mo=TODAY0.getMonth(),lead=(new Date(y,mo,1).getDay()+6)%7,dim=new Date(y,mo+1,0).getDate(),td=TODAY0.getDate();
 let cal=['M','T','W','T','F','S','S'].map(d=>`<span class="dow">${d}</span>`).join('');
 for(let i=0;i<lead;i++)cal+='<span></span>';
 for(let d=1;d<=dim;d++){const ds=ymd(new Date(y,mo,d));const bs=S.bills.filter(b=>b.due===ds);const cls=['d',d===td?'today':'',bs.length?'has':'',bs.some(b=>b.status!=='paid'&&daysUntil(b.due)<0)?'over':'',bs.length&&bs.every(b=>b.status==='paid')?'paid':'',d<td?'muted':''].join(' ');cal+=`<span class="${cls}" title="${esc(bs.map(b=>b.name).join(', '))}">${d}</span>`}
 return `
 <div class="stat3"><div class="stat"><span>Due by ${CYCLE_END.getDate()} ${MON[CYCLE_END.getMonth()]}</span><b>${kf(total)}</b></div><div class="stat"><span>Late</span><b style="color:${late.length?'var(--bad)':'inherit'}">${late.length}</b></div><div class="stat"><span>Paid</span><b>${paid.length}</b></div></div>
 <div class="card"><div class="between" style="margin-bottom:10px"><b>${MONTH_FULL[mo]} ${y}</b><span class="xs muted">Dots mark due dates</span></div><div class="cal">${cal}</div></div>
 ${late.length?`<div class="sec-head"><h2>Late</h2></div><div class="list">${late.map(billRow).join('')}</div>`:''}
 <div class="sec-head"><h2>Upcoming</h2><button class="link" data-act="addBill">Add bill</button></div>
 ${soon.length?`<div class="list">${soon.map(billRow).join('')}</div>`:`<div class="card small muted">Nothing upcoming. Add your regular bills and they repeat by themselves.</div>`}
 ${paid.length?`<div class="sec-head"><h2>Paid</h2></div><div class="list">${paid.map(billRow).join('')}</div>`:''}
 <div class="note">${ic('bell')}<span>${NATIVE?'Your phone reminds you at 8:00 three days before, one day before and on the due date.':'Reminders arrive 3 days and 1 day before each due date.'} A bill marks itself paid when Kasente sees a matching payment, and comes back for the next period.</span></div>`};
FORMS.addBill=fd=>{const k=fd.get('kind');const icm={UMEME:'bolt',NWSC:'bolt','DSTV / GOtv':'tv','Internet / Data':'signal',Rent:'house','School fees':'book',Insurance:'shield',SACCO:'coins','Loan repayment':'wallet'};S.bills.push({id:nid('b'),name:fd.get('name'),kind:k,ic:icm[k]||'calendar',amt:+fd.get('amt'),due:fd.get('due'),status:'due',rep:fd.get('rep'),note:fd.get('rep')});closeSheet();refresh();toast(`Reminder set for ${dlabel(fd.get('due'))}`,'bell')};
ACT.addBill=()=>openSheet('Add a bill',`<form class="stack" data-form="addBill"><label class="field"><span>Bill type</span><select name="kind">${['UMEME','NWSC','DSTV / GOtv','Internet / Data','Rent','School fees','Insurance','SACCO','Loan repayment'].map(k=>`<option>${k}</option>`).join('')}</select></label><label class="field"><span>Name or provider</span><input name="name" placeholder="e.g. UMEME Yaka" required></label><div class="grid2"><label class="field"><span>About (UGX)</span><input name="amt" type="number" inputmode="numeric" required></label><label class="field"><span>Next due</span><input name="due" type="date" value="${ymd(plusDays(TODAY0,7))}" required></label></div><label class="field"><span>Repeats</span><select name="rep"><option>Monthly</option><option>Every term</option><option>Yearly</option><option>Once</option></select></label><button class="btn primary">Add bill</button></form>`);

/* ---------- family: needs accounts for each person ---------- */
const baseFamily=SCREENS.family;
SCREENS.family=()=>S.family?baseFamily():`<div class="card stack" style="gap:10px"><span class="chip" style="--c:var(--accent);width:52px;height:52px">${ic('people',26)}</span><b style="font-size:17px">Family and group money</b><p class="small muted">Shared household dashboards, a student sub-account and savings groups need each member's phone to connect, so they arrive with online sync in the next phase.</p><p class="small muted">To see how it will work, load the sample data from Settings and open this screen.</p></div>`;

/* ---------- whatsapp preview in your own data ---------- */
ACT.waSms=()=>{if(!isFresh())return waSend(SAMPLE_SMS.umeme);S.wa.push({me:false,html:'Paste the MoMo or Airtel Money message into the box below and send it. I will log it.',time:hhmm(new Date())});refresh()};
LIVE.waFile=el=>{if(!el.files[0])return;S.wa.push({me:true,html:'📷 Receipt photo',time:hhmm(new Date())});S.wa.push({me:false,html:'Receipt photos over WhatsApp arrive with the live bot. For now, use <b>Scan a receipt</b> in the app.',time:hhmm(new Date())});refresh()};

/* ---------- receipt photo: you type, Kasente adds it up ---------- */
const baseLiveSms=LIVE.sms;
LIVE.sms=()=>{const el=$('#smsIn');if(el){const p=parseSMS(el.value);if(p)ensureAcct(p.provider)}baseLiveSms()};
const baseInvest=SCREENS.invest;
SCREENS.invest=()=>S.inv.length?baseInvest():`<div class="card stack" style="gap:10px"><b style="font-size:17px">No investments recorded</b><p class="small muted">Add SACCO shares, Treasury bills or bonds, unit trusts, USE shares or fixed deposits to see their value in one place.</p><button class="btn primary" data-act="addInv">${ic('plus')}Add a holding</button></div>
 <div class="sec-head"><h2>Learn the options</h2></div>
 <div class="stack">${Object.entries(INV_TYPES).map(([k,t])=>`<details class="card" style="padding:14px 16px"><summary class="between" style="cursor:pointer;list-style:none"><span class="row"><i style="width:10px;height:10px;border-radius:3px;background:${t.c}"></i><b>${t.name}</b></span><span class="pill">${t.risk} risk</span></summary><p class="small" style="margin-top:10px">${t.learn}</p><p class="xs muted" style="margin-top:8px"><b>Suits:</b> ${t.suits}</p></details>`).join('')}</div>
 <div class="note">${ic('info')}<span class="small">General education in plain language, not regulated financial advice.</span></div>`;
LIVE.rcpt=el=>{const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{SCAN={merchant:'',date:ymd(TODAY0),items:[['',0]],img:r.result,manual:true};refresh()};r.readAsDataURL(f)};

/* ---------- transactions: checking and editing ---------- */
const baseTxRow=window.txRow;
window.txRow=t=>{const h=baseTxRow(t);return t.review?h.replace('<span class="tx-title">','<span class="tx-title"><span class="pill warn" style="margin-right:6px;font-size:10px;padding:1px 6px">Check</span>'):h};
ACT.tx=id=>{openTx(id);const t=S.txns.find(x=>x.id===id);const box=document.querySelector('.sheet-body .stack');if(!t||!box)return;
 box.insertAdjacentHTML('beforeend',`<details class="card" style="padding:12px 14px" ${t.review?'open':''}><summary style="cursor:pointer;font-weight:600">Edit details</summary><form class="stack" data-form="editTx" data-id="${id}" style="margin-top:10px"><label class="field"><span>Description</span><input name="title" value="${esc(t.title)}"></label><div class="grid2"><label class="field"><span>Amount (UGX)</span><input name="amt" type="number" inputmode="numeric" value="${t.amt}"></label><label class="field"><span>Type</span><select name="kind">${[['out','Money out'],['in','Money in'],['lend','Money lent']].map(([k,l])=>`<option value="${k}" ${t.kind===k?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="grid2"><label class="field"><span>Account</span><select name="acct">${acctOptions(t.acct)}</select></label><label class="field"><span>Date</span><input name="date" type="date" value="${t.d.slice(0,10)}"></label></div><button class="btn primary">Save changes</button></form></details>`);
 if(t.review)box.insertAdjacentHTML('afterbegin',`<div class="note warn">${ic('alert')}<span class="small">Kasente wasn't sure how to read this message. Check the amount and type below.</span></div><button class="btn" data-act="reviewed" data-arg="${id}">${ic('check')}It's right</button>`)};
ACT.reviewed=id=>{const t=S.txns.find(x=>x.id===id);if(t)t.review=false;closeSheet();refresh()};
FORMS.editTx=(fd,f)=>{const t=S.txns.find(x=>x.id===f.dataset.id);if(!t)return;const eff=x=>x.kind==='in'?x.amt:-x.amt;
 const a0=acct(t.acct);if(a0)a0.bal-=eff(t);if(t.kind==='move'&&acct('cash'))acct('cash').bal-=t.amt;
 t.title=fd.get('title')||t.title;t.amt=Math.abs(+fd.get('amt'))||t.amt;t.kind=fd.get('kind');t.acct=fd.get('acct');t.d=fd.get('date')+' '+t.d.slice(11);
 if(t.kind==='in')t.cat='income';else if(t.kind==='lend')t.cat='lend';else if(t.cat==='income'||t.cat==='lend')t.cat=guessCat(t.title);
 const a1=acct(t.acct);if(a1)a1.bal+=eff(t);t.review=false;closeSheet();refresh();toast('Changes saved')};

/* ---------- advisor working from your own figures ---------- */
const baseAdvise=window.advise;
window.advise=function(q){if(!isFresh())return baseAdvise(q);
 const s=q.toLowerCase();let m;const spent=cycleSpent(),bud=totalBudget(),pace=DAY_OF_CYCLE/CYCLE_DAYS,cur=expenses();
 const prevTx=S.txns.filter(t=>{const d=pd(t.d);return d>=PREV_START&&d<CYCLE_START});
 const prevIn=sumAmt(prevTx.filter(t=>t.kind==='in')),prevOut=sumAmt(prevTx.filter(t=>t.kind==='out'));
 const none="I don't have enough to go on yet. Log a few days of spending, or let Kasente read your MoMo messages, then ask again.";
 const byCat=list=>{const g={};list.forEach(t=>g[t.cat]=(g[t.cat]||0)+t.amt);return Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([id,v])=>({c:cat(id)||cat('other'),v}))};
 if(m=s.match(/save\s+(?:ugx\s*)?([\d.,]+)\s*(k|m|million|mn)?\b.*?\bby\s+([a-z]+)/)){let amt=parseFloat(m[1].replace(/,/g,''));if(/k/.test(m[2]||''))amt*=1e3;else if(/m/.test(m[2]||''))amt*=1e6;else if(amt<1000)amt*=1e6;
  const mi=MONTH_FULL.findIndex(x=>x.toLowerCase().startsWith(m[3].slice(0,3)));if(mi<0)return 'Tell me the month you are aiming for, for example "save 2 million by June".';
  let y=TODAY.getFullYear();if(mi<=TODAY.getMonth())y++;const end=new Date(y,mi+1,0);const months=Math.max(1,(end-TODAY0)/(30.44*DAY));const per=Math.ceil(amt/months/5000)*5000;
  return `To reach <b>${ugx(amt)}</b> by the end of ${MONTH_FULL[mi]} ${y} you need about <b>${ugx(per)} a month</b> for ${months.toFixed(1)} months.<ul>${prevTx.length?`<li>Last cycle you kept ${ugx(prevIn-prevOut)} after spending, so this ${per>prevIn-prevOut?'needs some cuts as well':'fits if you keep last cycle\'s habits'}.</li>`:'<li>Once you have a full cycle logged I can tell you whether this fits your usual leftover.</li>'}<li>Moving the money on payday, before spending starts, works better than saving what is left.</li></ul><button class="link small" data-act="addGoalPrefill" data-arg="${amt}|${ymd(end)}">Create this goal</button>`}
 if(/on track|on budget|how am i doing|this month/.test(s)){if(!cur.length)return none;
  const over=S.cats.filter(c=>c.budget&&catSpent(c.id)>c.budget),ahead=S.cats.filter(c=>c.budget&&catSpent(c.id)<=c.budget&&catSpent(c.id)/c.budget>pace+.15).sort((a,b)=>catSpent(b.id)/b.budget-catSpent(a.id)/a.budget);
  const daily=Math.max(0,(bud-spent)/Math.max(1,DAYS_LEFT+1));
  return `You've spent <b>${ugx(spent)}</b> of <b>${ugx(bud)}</b> with <b>${DAYS_LEFT} days</b> left. That's ${Math.round(spent/bud*100)}% used with ${Math.round(pace*100)}% of the cycle gone.<ul>${over.map(c=>`<li><b>${c.name}</b> is over by ${ugx(catSpent(c.id)-c.budget)}.</li>`).join('')}${ahead.slice(0,2).map(c=>`<li><b>${c.name}</b> is at ${Math.round(catSpent(c.id)/c.budget*100)}% of its limit. About ${ugx(Math.round((c.budget-catSpent(c.id))/Math.max(1,DAYS_LEFT+1)/500)*500)} a day keeps it inside.</li>`).join('')}${!over.length&&!ahead.length?'<li>No category is running ahead of pace.</li>':''}</ul>Across everything, about <b>${ugx(Math.round(daily/500)*500)} a day</b> keeps you inside your total budget.`}
 if(/boda|transport|taxi|fare/.test(s)){const tr=cur.filter(t=>t.cat==='transport');if(!tr.length)return 'No transport logged this cycle yet. Log boda and taxi fares, or pay riders by MoMo, and I can compare them with normal prices.';
  const tot=sumAmt(tr),wk=tot/Math.max(1,DAY_OF_CYCLE/7);const over=tr.filter(t=>{const v=t.route&&fareVerdict(route(t.route),t.mode,t.amt);return v&&t.amt>v.hi});const big=tr.slice().sort((a,b)=>b.amt-a.amt)[0];
  return `You're spending about <b>${ugx(Math.round(wk/500)*500)} a week</b> on transport (${ugx(tot)} this cycle, ${tr.length} trips).<ul>${over.length?`<li>${over.length} ride${over.length>1?'s were':' was'} above the usual fare, ${ugx(over.reduce((a,t)=>a+t.amt-fareVerdict(route(t.route),t.mode,t.amt).hi,0))} more than the top of the range in total.</li>`:'<li>None of the rides with a route set were above the usual fare.</li>'}<li>Your biggest trip was ${esc(big.title)} at ${ugx(big.amt)}.</li><li>Pick a route when you log a ride and I will check every fare.</li></ul>`}
 if(/run out|ran out|where.*money|why/.test(s)){const base=prevTx.filter(t=>t.kind==='out').length>4?prevTx.filter(t=>t.kind==='out'):cur;if(!base.length)return none;const top=byCat(base).slice(0,3);const label=base===cur?'this cycle':'last cycle';
  return `Here is where the money went ${label} (${ugx(sumAmt(base))} in total):<ul>${top.map(x=>`<li><b>${x.c.name}</b>: ${ugx(x.v)} (${Math.round(x.v/sumAmt(base)*100)}%)</li>`).join('')}</ul>${S.cats.filter(c=>c.budget&&catSpent(c.id)>c.budget).length?`Over budget now: ${S.cats.filter(c=>c.budget&&catSpent(c.id)>c.budget).map(c=>c.name).join(', ')}.`:'Small daily spending adds up fastest. A daily limit for the top category usually closes most of the gap.'}`}
 if(/school fees|january|term/.test(s)){const g=S.goals.find(x=>/school|fee|term|tuition/i.test(x.name));if(!g)return `You don't have a school fees goal yet. Create one with the amount and the date it's due, and I'll tell you how much to put aside each month. <button class="link small" data-act="addGoal">New goal</button>`;const need=goalNeed(g);
  return `For <b>${esc(g.name)}</b> you need ${ugx(g.target)} by ${shortDate(g.date)}. You have ${ugx(g.saved)}.<ul><li>That is about <b>${ugx(Math.round(need/1000)*1000)} a month</b> from now.</li>${g.rate?`<li>You're putting in ${ugx(g.rate)} a month, so you're ${g.rate>=need?'on track':'about '+ugx(Math.round((need-g.rate)/1000)*1000)+' a month short'}.</li>`:''}</ul>`}
 if(/umeme|electric|yaka|power/.test(s)){const l=S.txns.filter(t=>t.kind==='out'&&/umeme|yaka|electric/i.test(t.title+' '+(t.sms||''))).sort((a,b)=>pd(a.d)-pd(b.d)).slice(-3);
  const tips='<ul><li>Note your Yaka meter reading every Sunday for two weeks to see which days use the most.</li><li>Irons, water heaters and old fridges are the usual causes of a rise.</li><li>If the units you get per top-up fall while the amount is the same, ask UMEME to check the meter.</li></ul>';
  if(l.length<2)return 'I need at least two UMEME payments to compare. Meanwhile:'+tips;const ch=(l[l.length-1].amt-l[0].amt)/l[0].amt;
  return `Your last UMEME payments were ${l.map(t=>ugx(t.amt)).join(', ')}, ${ch>=0?'up':'down'} ${Math.abs(Math.round(ch*100))}%.`+tips}
 if(/t-?bill|treasury|bond|fixed deposit/.test(s))return 'Both are low-risk. The differences:<ul><li><b>Treasury bills</b> are sold by Bank of Uganda for 91, 182 or 364 days. You pay less than the face value and receive the full amount at maturity. Rates are set at each auction.</li><li><b>Fixed deposits</b> are with one bank at an agreed rate. Easy to open, but breaking early usually costs interest.</li><li>Compare the latest T-bill auction rate with your bank\'s offer for the same term, after withholding tax on both.</li></ul>This is general information, not regulated financial advice.';
 if(/sacco/.test(s))return 'A SACCO is a savings and credit co-operative owned by its members.<ul><li>You buy shares and save regularly. Members can borrow, usually at better rates than a microfinance lender.</li><li>Many pay a yearly dividend on shares.</li><li>Before joining, check it is registered, ask for the latest audited accounts and find out how quickly members can withdraw.</li></ul>';
 if(/lend|owe|borrow|loan/.test(s)){const open=S.loans.filter(l=>l.amt>l.paid);if(!open.length)return 'No open loans recorded. Send money with the note "loan" or record it under Lending, and I will keep track.';
  return `People owe you <b>${ugx(owedToMe())}</b> and you owe <b>${ugx(iOwe())}</b>.<ul>${open.map(l=>`<li>${esc(l.who)}: ${ugx(l.amt-l.paid)} ${l.dir==='out'?'owed to you':'you owe'}, due ${dlabel(l.due)}${daysUntil(l.due)<0?' (late)':''}.</li>`).join('')}</ul>`}
 const c=S.cats.find(c=>s.includes(c.name.toLowerCase().split(/[ &]/)[0]));
 if(c&&/spen|spent|cost|much/.test(s)){const v=catSpent(c.id);return `You've spent <b>${ugx(v)}</b> on ${c.name} this cycle${c.budget?`, ${Math.round(v/c.budget*100)}% of the ${ugx(c.budget)} limit`:''}.`}
 return 'I can answer questions about this cycle\'s spending, budgets, bills, goals and loans. Try "Am I on track this month?" or "How much did I spend on food?"'};

/* ---------- settings for the test build ---------- */
function saveOut(name,mime,text){
 if(NATIVE){let ok=false;try{ok=NATIVE.saveFile(name,mime,text)}catch(e){}if(ok){toast(`Saved to Downloads: ${name}`,'down');return}try{NATIVE.share(text,name);return}catch(e){}}
 openSheet(name,`<p class="small muted" style="margin-bottom:8px">Copy this text and keep it somewhere safe.</p><textarea id="outText" readonly class="mono" style="width:100%;min-height:260px;border:0">${esc(text)}</textarea><button class="btn block" style="margin-top:10px" data-act="copyOut">Copy</button>`)}
ACT.copyOut=()=>{const el=$('#outText');navigator.clipboard.writeText(el.value).then(()=>toast('Copied')).catch(()=>{el.select();toast('Selected. Use your phone\'s Copy.')})};
const toCSV=()=>{const q=v=>`"${String(v).replace(/"/g,'""')}"`;return ['Date,Time,Account,Type,Category,Description,Amount (UGX),Source'].concat(S.txns.slice().sort((a,b)=>pd(a.d)-pd(b.d)).map(t=>[t.d.slice(0,10),t.d.slice(11),acct(t.acct)?acct(t.acct).name:t.acct,t.kind==='in'?'In':t.kind==='lend'?'Lent':'Out',catOf(t).name,t.title,(t.kind==='in'?'':'-')+t.amt,srcTag(t.src)].map(q).join(','))).join('\n')};
ACT.exportR=a=>{if(a==='Excel'){saveOut(`kasente-transactions-${ymd(TODAY0)}.csv`,'text/csv',toCSV());return}toast('PDF reports come with the full app build. Use Excel (CSV) for now; it opens in Excel and Google Sheets.','down')};
ACT.backup=()=>saveOut(`kasente-backup-${ymd(TODAY0)}.json`,'application/json',JSON.stringify({app:'kasente',v:1,saved:new Date().toISOString(),data:S}));
LIVE.restore=el=>{const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{let d;try{d=JSON.parse(r.result);d=d.data||d}catch(e){toast("That file isn't a Kasente backup.",'alert');return}
 if(!d||!Array.isArray(d.txns)||!d.mode){toast("That file isn't a Kasente backup.",'alert');return}
 window._restore=d;openSheet('Restore this backup?',`<div class="stack"><dl class="kv"><dt>Name</dt><dd>${esc(d.user&&d.user.name)}</dd><dt>Transactions</dt><dd>${d.txns.length}</dd><dt>Data</dt><dd>${d.mode==='fresh'?'Own data':'Sample'}</dd></dl><p class="small">This replaces everything currently in the app.</p><button class="btn primary" data-act="restoreYes">Replace with this backup</button><button class="btn" data-act="close">Cancel</button></div>`)};r.readAsText(f)};
ACT.restoreYes=()=>{Object.assign(S,window._restore);window._restore=null;bumpIds();closeSheet();stack=['home'];render();toast('Backup restored')};
ACT.editProfile=()=>openSheet('Your details',`<form class="stack" data-form="profile"><label class="field"><span>Name</span><input name="name" value="${esc(S.user.name)}" required></label><label class="field"><span>Payday</span><select name="payday">${Array.from({length:31},(_,i)=>`<option value="${i+1}" ${i+1===S.settings.payday?'selected':''}>The ${ordinal(i+1)} of the month</option>`).join('')}</select></label><p class="xs muted">Your budget cycle runs from one payday to the day before the next. If the month is shorter, it uses the last day.</p><button class="btn primary">Save</button></form>`);
FORMS.profile=fd=>{S.user.name=fd.get('name').trim()||S.user.name;S.user.full=S.user.name;if(isFresh())S.settings.payday=+fd.get('payday');closeSheet();refresh();toast(isFresh()?`Budget cycle now ${cycleLabel()}`:'Saved. The sample data keeps its own pay cycle.')};
ACT.switchData=to=>openSheet(to==='sample'?'Load sample data?':'Start with your own data?',`<div class="stack"><p>${to==='sample'?'This replaces what is in the app with Sarah\'s example month. Save a backup first if you want to keep your entries.':'This clears the sample and starts an empty app for your own money.'}</p>${to==='sample'?`<button class="btn" data-act="backup">${ic('down',18)}Save a backup first</button>`:''}<button class="btn primary" data-act="switchYes" data-arg="${to}">${to==='sample'?'Load sample data':'Start fresh'}</button><button class="btn" data-act="close">Cancel</button></div>`);
ACT.switchYes=to=>{closeSheet();if(to==='sample'){const keep=S.settings.theme;Object.assign(S,JSON.parse(SAMPLE_SNAPSHOT));S.mode='sample';S.settings={...S.settings,pin:hashPin('2580'),lock:false,payday:25,sms:false,theme:keep};tick();stack=['home'];render();toast('Sample data loaded')}else{ACT.onbSetup()}};
ACT.wipeYes=()=>{try{localStorage.removeItem(STORE)}catch(e){}location.reload()};
const baseToggle=ACT.toggle;
ACT.toggle=a=>{if(a==='lock'&&!S.settings.lock&&!S.settings.pin){ACT.setPin();return}
 if(a==='sms'&&!S.settings.sms&&NATIVE&&isFresh()){S.settings.sms=true;refresh();smsSync(true);return}
 if(a==='push'&&!S.settings.push&&NATIVE&&NATIVE.requestNotifications){try{NATIVE.requestNotifications()}catch(e){}}
 baseToggle(a)};
SCREENS.settings=()=>{const s=S.settings;const tg=(k,l,d)=>`<div class="setrow"><span class="grow"><b>${l}</b><span>${d}</span></span><button class="toggle ${s[k]?'on':''}" data-act="toggle" data-arg="${k}" aria-pressed="${!!s[k]}" aria-label="${l}"></button></div>`;
 const bio=NATIVE&&NATIVE.canBiometric&&(()=>{try{return NATIVE.canBiometric()}catch(e){return false}})();
 return `
 <div class="card row"><span class="avatar" style="width:52px;height:52px;font-size:17px">${initials(S.user.name)}</span><div class="grow"><b style="font-size:16px">${esc(S.user.full||S.user.name)}</b><div class="small muted">${isFresh()?'Your own data':'Sample data'}</div></div><button class="btn sm" data-act="editProfile">Edit</button></div>
 <div class="sec-head"><h2>Pay cycle</h2></div>
 <div class="list"><button class="setrow" data-act="editProfile"><span class="grow"><b>Payday: the ${ordinal(s.payday||25)}</b><span>This cycle runs ${cycleLabel()}</span></span>${ic('chev',16)}</button><button class="setrow" data-go="budgets"><span class="grow"><b>Budget limits</b><span>${S.cats.filter(c=>c.budget).length} categories with limits · ${ugx(totalBudget())} in total</span></span>${ic('chev',16)}</button></div>
 <div class="sec-head"><h2>Security</h2></div>
 <div class="list">${tg('lock','App lock','Ask for your PIN when Kasente opens')}${bio?tg('bio','Use fingerprint','Falls back to your PIN'):''}<button class="setrow" data-act="setPin"><span class="grow"><b>${s.pin?'Change PIN':'Set a PIN'}</b><span>4 digits · 5 wrong tries lock the app for 30 seconds</span></span>${ic('lock',18)}</button></div>
 <div class="sec-head"><h2>Mobile money messages</h2></div>
 <div class="list">${isFresh()?tg('sms','Read money SMS automatically','MTN, Airtel and bank confirmations only'):'<div class="setrow"><span class="grow"><b>Reading SMS is off in sample mode</b><span>Switch to your own data to use it</span></span></div>'}
  ${NATIVE&&isFresh()?`<button class="setrow" data-act="smsNow"><span class="grow"><b>Check for new messages now</b><span>${S.smsLast?'Last checked '+dlabel(new Date(S.smsLast))+' '+hhmm(new Date(S.smsLast)):'Reads the last 60 days the first time'}</span></span>${ic('sms',18)}</button>`:''}
  ${!NATIVE?'<div class="setrow"><span class="grow"><b>Automatic reading works in the Android app</b><span>Here you can paste a message into the SMS reader</span></span></div>':''}
  <button class="setrow" data-act="smsTest"><span class="grow"><b>Test the reader with a message</b><span>Paste any MoMo or Airtel Money SMS</span></span>${ic('chev',16)}</button>
  <button class="setrow" data-act="smsScope"><span class="grow"><b>What Kasente can and can't read</b><span>See the exact message types</span></span>${ic('chev',16)}</button></div>
 <div class="sec-head"><h2>Privacy</h2></div>
 <div class="list"><div class="setrow"><span class="chip sm" style="--c:var(--good)">${ic('shield',18)}</span><span class="grow"><b>Your data stays on this phone</b><span>Saved inside the app · works offline · nothing is sent to any server</span></span></div><button class="setrow" data-act="aiPayload"><span class="grow"><b>What a cloud advisor would receive</b><span>The anonymised summary planned for the next phase</span></span>${ic('chev',16)}</button></div>
 <div class="sec-head"><h2>Backup</h2></div>
 <div class="list"><button class="setrow" data-act="backup"><span class="grow"><b>Save a backup file</b><span>${NATIVE?'Saved to your Downloads folder':'Copy the backup text'}</span></span>${ic('down',18)}</button><label class="setrow" for="restoreFile" style="cursor:pointer"><span class="grow"><b>Restore from a backup</b><span>Choose a kasente-backup file</span></span>${ic('upload',18)}</label><input id="restoreFile" type="file" accept=".json,application/json,text/plain" hidden data-live="restore"></div>
 <p class="xs muted" style="padding:0 4px">Uninstalling the app deletes its data. Updating to a newer test build keeps it.</p>
 <div class="sec-head"><h2>Notifications</h2></div>
 <div class="list">${tg('push','Bill and loan reminders','Phone notifications at 8:00 before due dates')}<div class="setrow"><span class="grow"><b>Budget alert at</b><span>Warn me when a category reaches this share</span></span><select class="input" style="width:auto;min-height:38px" data-live="threshold" aria-label="Budget alert threshold">${[70,80,90].map(v=>`<option ${s.threshold===v?'selected':''} value="${v}">${v}%</option>`).join('')}</select></div></div>
 <div class="sec-head"><h2>Appearance</h2></div>
 <div class="card stack"><div class="seg">${[['system','System'],['light','Light'],['dark','Dark']].map(([k,l])=>`<button class="${s.theme===k?'on':''}" data-act="theme" data-arg="${k}">${l}</button>`).join('')}</div><label class="field"><span>Language</span><select data-live="lang"><option value="en" ${s.lang==='en'?'selected':''}>English</option><option value="lg" disabled>Luganda (coming later)</option></select></label></div>
 <div class="sec-head"><h2>Your data</h2></div>
 <div class="list"><button class="setrow" data-act="exportR" data-arg="Excel"><span class="grow"><b>Export transactions</b><span>CSV file for Excel or Google Sheets</span></span>${ic('down',18)}</button>
  ${isFresh()?`<button class="setrow" data-act="switchData" data-arg="sample"><span class="grow"><b>Look at the sample data</b><span>Replaces your entries, so save a backup first</span></span>${ic('chev',16)}</button>`:`<button class="setrow" data-act="switchData" data-arg="fresh"><span class="grow"><b>Start with my own data</b><span>Clears the sample</span></span>${ic('chev',16)}</button>`}
  <button class="setrow" data-act="wipe"><span class="grow"><b style="color:var(--bad)">Delete all data</b><span>Removes everything and starts setup again</span></span>${ic('x',18)}</button></div>
 <p class="xs muted" style="text-align:center;padding:8px 0">Kasente test build ${NATIVE&&NATIVE.appVersion?esc(NATIVE.appVersion()):'(browser)'} · no ads, data never sold</p>`};
ACT.theme=a=>{S.settings.theme=a;if(a==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',a);refresh()};

/* ---------- start ---------- */
window.kasenteBoot=function(){
 const had=load();if(window.kasenteMigrate)kasenteMigrate(had);S.settings.payday=S.settings.payday||25;
 if(S.settings.theme&&S.settings.theme!=='system')document.documentElement.setAttribute('data-theme',S.settings.theme);
 tick();render();
 if(!had){showOnboard(0);return}
 if(S.settings.lock&&S.settings.pin)showLock();
 setTimeout(()=>smsSync(false),500);
 matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{lastBars='';applyBars()});
};

/* ===== Account: sign in with a Microsoft email, data kept in the user's own OneDrive ===== */
const CLOUD_FILE='kasente-data.json';
const cloudReady=()=>{try{return !!(NATIVE&&NATIVE.cloudConfigured&&NATIVE.cloudConfigured())}catch(e){return false}};
const cloudSignedIn=()=>{try{return !!(NATIVE&&NATIVE.cloudSignedIn&&NATIVE.cloudSignedIn())}catch(e){return false}};
const cloudWait={};
function cloudCall(op,name,body){return new Promise(res=>{const id='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);cloudWait[id]=res;
 try{NATIVE.cloudCall(op,name||'',body||'',id)}catch(e){delete cloudWait[id];res({ok:false,status:0,text:String(e)})}
 setTimeout(()=>{if(cloudWait[id]){delete cloudWait[id];res({ok:false,status:0,text:'timeout'})}},90000)})}
window.kasenteCloud=(id,ok,status,text)=>{const r=cloudWait[id];if(r){delete cloudWait[id];r({ok,status,text})}};
const MS_ICON='<svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>';
const timeAgo=ms=>{if(!ms)return 'never';const m=Math.round((Date.now()-ms)/60000);if(m<1)return 'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+' h ago';return dlabel(new Date(ms))};

/* what counts as a change worth syncing */
const dataSig=()=>JSON.stringify(S,(k,v)=>(k==='ui'||k==='updatedAt'||k==='account'||k==='notifs')?undefined:v);
let lastSig='',syncTimer=null,syncing=false;
const baseSave=save;
save=function(){if(!S.mode)return;recordDaily();const sig=dataSig();if(sig!==lastSig){if(lastSig)S.updatedAt=Date.now();lastSig=sig;queueUpload()}try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}};
function queueUpload(){if(!isFresh()||!S.account||!cloudSignedIn())return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>pushCloud(false),6000)}
async function pushCloud(manual){if(!S.account||syncing)return;if(!isFresh()){if(manual)toast('OneDrive keeps your own data, not the sample.','cloud');return}
 syncing=true;S.updatedAt=S.updatedAt||Date.now();
 const r=await cloudCall('put',CLOUD_FILE,JSON.stringify({app:'kasente',v:1,updatedAt:S.updatedAt,data:S}));syncing=false;
 if(r.ok){S.account.lastSync=Date.now();S.account.problem=null;try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}if(manual)toast('Saved to your OneDrive','cloud');if(cur()==='settings')refresh()}
 else cloudProblem(r,manual)}
function cloudProblem(r,manual){S.account.problem=r.status===401?'signin':'offline';if(manual||r.status===401)toast(r.status===401?'OneDrive needs you to sign in again. Open Settings → Account.':"Couldn't reach OneDrive. Kasente will try again later.",'cloud');if(cur()==='settings')refresh()}
function replaceFrom(remote,acc){const keepTheme=S.settings&&S.settings.theme;Object.assign(S,remote);S.account=acc;S.mode=S.mode||'fresh';if(keepTheme&&!S.settings.theme)S.settings.theme=keepTheme;bumpIds();tick();lastSig=dataSig()}
async function pullCloud(manual){if(!S.account||!isFresh())return;const r=await cloudCall('get',CLOUD_FILE);
 if(r.status===404){pushCloud(manual);return}
 if(!r.ok){cloudProblem(r,manual);return}
 let p;try{p=JSON.parse(r.text)}catch(e){if(manual)toast("The OneDrive copy couldn't be read.",'alert');return}
 if(p&&p.data&&(p.updatedAt||0)>(S.updatedAt||0)+1000){replaceFrom(p.data,{...S.account,lastSync:Date.now(),problem:null});render();toast('Updated with your latest data from OneDrive','cloud')}
 else if((S.updatedAt||0)>(p.updatedAt||0)+1000)pushCloud(manual);
 else{S.account.lastSync=Date.now();S.account.problem=null;if(manual)toast('Already up to date','cloud');if(cur()==='settings')refresh()}}

ACT.signIn=()=>{if(!cloudReady()){toast(NATIVE?"Sign-in isn't switched on in this build yet.":'Sign-in works in the Android app.','info');return}toast('Opening Microsoft sign-in…','cloud');try{NATIVE.cloudSignIn()}catch(e){toast("Couldn't open sign-in.",'alert')}};
window.kasenteOnSignIn=(ok,msg)=>{if(!ok){toast(msg||"Sign-in didn't finish.",'alert');return}afterSignIn()};
async function afterSignIn(){
 toast('Signed in. Checking your OneDrive…','cloud');
 const me=await cloudCall('me');if(!me.ok){toast("Signed in, but couldn't read your account details. Try again from Settings.",'alert');return}
 let u={};try{u=JSON.parse(me.text)}catch(e){}
 const acc={provider:'onedrive',email:u.mail||u.userPrincipalName||'',name:u.displayName||'',since:Date.now(),lastSync:0};
 const r=await cloudCall('get',CLOUD_FILE);let remote=null;
 if(r.ok){try{const p=JSON.parse(r.text);remote=p&&p.data?p:null}catch(e){}}
 else if(r.status!==404){S.account=acc;cloudProblem(r,true);return}
 if(remote&&(!S.mode||(isFresh()&&!S.txns.length))){replaceFrom(remote.data,{...acc,lastSync:Date.now()});$('#onb').hidden=true;stack=['home'];render();toast(`Welcome back, ${esc((S.user&&S.user.name)||acc.name)}. Your data is restored from OneDrive.`,'cloud');return}
 S.account=acc;
 if(!S.mode){ACT.onbSetup();return}
 if(remote){window._remote=remote;openSheet('Your OneDrive already has Kasente data',`<div class="stack"><dl class="kv"><dt>Saved</dt><dd>${remote.updatedAt?dlabel(new Date(remote.updatedAt))+' '+hhmm(new Date(remote.updatedAt)):'—'}</dd><dt>Transactions</dt><dd>${(remote.data.txns||[]).length}</dd><dt>On this phone</dt><dd>${S.txns.length} transactions</dd></dl><button class="btn primary" data-act="useRemote">Use the OneDrive data</button><button class="btn" data-act="useLocal">Keep this phone's data</button><p class="xs muted">The option you don't pick is replaced.</p></div>`);return}
 if(isFresh())pushCloud(true);else{refresh();toast('Signed in. Switch to your own data to start saving to OneDrive.','cloud')}}
ACT.useRemote=()=>{const r=window._remote;window._remote=null;if(!r)return;replaceFrom(r.data,{...S.account,lastSync:Date.now()});closeSheet();stack=['home'];render();toast('Using your OneDrive data','cloud')};
ACT.useLocal=()=>{window._remote=null;closeSheet();if(!isFresh()){toast('Switch to your own data first, then save to OneDrive.','cloud');return}S.updatedAt=Date.now();pushCloud(true)};
ACT.cloudPush=()=>pushCloud(true);
ACT.cloudPull=()=>pullCloud(true);
ACT.signOut=()=>openSheet('Sign out of Microsoft?',`<div class="stack"><p>Your data stays on this phone and in your OneDrive. Kasente stops saving changes to OneDrive until you sign in again.</p><button class="btn danger" data-act="signOutYes">Sign out</button><button class="btn" data-act="close">Cancel</button></div>`);
ACT.signOutYes=()=>{try{NATIVE.cloudSignOut()}catch(e){}S.account=null;closeSheet();refresh();toast('Signed out')};

/* sign-in step at the top of setup */
const baseSetup=ACT.onbSetup;
ACT.onbSetup=()=>{baseSetup();const form=document.querySelector('#onb form[data-form="setup"]');if(!form)return;
 const acc=S.account;
 const box=acc?`<div class="card row" style="padding:12px 14px"><span class="avatar">${initials(acc.name||acc.email)}</span><div class="grow"><b>Signed in</b><div class="small muted" style="overflow-wrap:anywhere">${esc(acc.email)}</div></div><span class="pill good">${ic('check',12)} OneDrive</span></div><p class="xs muted">Your data will be kept in your OneDrive, in Apps › Kasente.</p>`
 :`<div class="card stack" style="gap:10px"><b>Your account</b><p class="small muted">Sign in with your Microsoft email (Outlook, Hotmail, Live or a work account). Kasente keeps your data in your own OneDrive, so reinstalling or changing phones loses nothing.</p><button type="button" class="btn block" style="background:var(--surface);border:1px solid var(--line)" data-act="signIn" ${cloudReady()?'':'disabled'}>${MS_ICON}Sign in with Microsoft</button><button type="button" class="btn block" disabled>Google Drive · coming soon</button><p class="xs muted">${cloudReady()?'Or skip this and keep everything on this phone only.':NATIVE?"Sign-in isn't switched on in this build yet. You can keep everything on this phone for now.":'Sign-in works in the Android app.'}</p></div>`;
 form.insertAdjacentHTML('afterbegin',box);
 if(acc&&acc.name){const n=$('#setupName');if(n&&!n.value)n.value=acc.name.split(/\s+/)[0]}};

/* account section in Settings */
const baseSettings=SCREENS.settings;
SCREENS.settings=()=>{const acc=S.account;let sec;
 if(acc)sec=`<div class="list"><div class="setrow"><span class="chip sm" style="--c:#0078D4">${ic('cloud',18)}</span><span class="grow"><b style="overflow-wrap:anywhere">${esc(acc.email)}</b><span>Microsoft account · OneDrive › Apps › Kasente</span></span></div>
  <div class="setrow"><span class="grow"><b>${acc.problem==='signin'?'Sign in again to keep saving':acc.problem==='offline'?'Waiting for a connection':isFresh()?'Saved automatically':'Not saving sample data'}</b><span>Last saved ${timeAgo(acc.lastSync)}</span></span>${acc.problem?`<span class="pill ${acc.problem==='signin'?'bad':'warn'}">${acc.problem==='signin'?'Action needed':'Offline'}</span>`:`<span class="pill good">${ic('check',12)} On</span>`}</div>
  ${acc.problem==='signin'?`<button class="setrow" data-act="signIn"><span class="grow"><b>Sign in again</b><span>${esc(acc.email)}</span></span>${ic('chev',16)}</button>`:''}
  <button class="setrow" data-act="cloudPush"><span class="grow"><b>Save to OneDrive now</b><span>Changes also save by themselves a few seconds after you make them</span></span>${ic('upload',18)}</button>
  <button class="setrow" data-act="cloudPull"><span class="grow"><b>Get the latest from OneDrive</b><span>Use this after changing something on another phone</span></span>${ic('down',18)}</button>
  <button class="setrow" data-act="signOut"><span class="grow"><b>Sign out</b><span>Data stays on this phone and in OneDrive</span></span>${ic('x',18)}</button></div>`;
 else sec=`<div class="card stack" style="gap:10px"><p class="small">Sign in with your Microsoft email to keep your data in your own OneDrive. You can then reinstall Kasente or move to a new phone without losing anything.</p><button class="btn block" style="background:var(--surface);border:1px solid var(--line)" data-act="signIn" ${cloudReady()?'':'disabled'}>${MS_ICON}Sign in with Microsoft</button><button class="btn block" disabled>Google Drive · coming soon</button>${cloudReady()?'':`<p class="xs muted">${NATIVE?"Sign-in isn't switched on in this build yet.":'Sign-in works in the Android app.'}</p>`}</div>`;
 const html=baseSettings();const at=html.indexOf('<div class="sec-head"><h2>Pay cycle</h2></div>');
 return html.slice(0,at)+`<div class="sec-head"><h2>Account</h2></div>${sec}`+html.slice(at).replace("Uninstalling the app deletes its data. Updating to a newer test build keeps it.",acc?'Your OneDrive copy stays even if you uninstall the app.':'Uninstalling the app deletes its data unless you sign in or save a backup. Updating to a newer test build keeps it.')};

/* on open and on return to the app */
const baseResume=window.kasenteOnResume;
window.kasenteOnResume=away=>{baseResume(away);if(S.account&&away>30000)pullCloud(false)};
setTimeout(()=>{if(!NATIVE)return;
 if(cloudSignedIn()&&!S.account){afterSignIn();return}
 if(S.account&&!cloudSignedIn()){S.account.problem='signin';return}
 if(S.account)pullCloud(false)},900);
const baseSetupForm=FORMS.setup;
FORMS.setup=(fd,f)=>{baseSetupForm(fd,f);if(S.account&&isFresh()){S.updatedAt=Date.now();setTimeout(()=>pushCloud(false),1500)}};
