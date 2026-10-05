/* ===== Build 3 · accounts, advances and loans, the message reader ===== */

/* ---------- recording a transaction ---------- */
const billWords2=b=>(b.kind+' '+b.name).toLowerCase().split(/[^a-z]+/).filter(w=>w.length>3&&!['bill','with','monthly','home','balance','term','subscription','repayment','contribution'].includes(w));
function applyBalance(t,dir){const a=acct(t.acct);if(!a)return;const v=t.orig?t.orig.amt:t.amt;const sign=effOf(t)>0?1:-1;a.bal+=dir*sign*v;
 if((t.kind==='move'||t.kind==='topup')&&t.acct!=='cash'){const c=S.accounts.find(x=>x.provider==='cash')||acct('cash');if(c)c.bal+=dir*(t.kind==='move'?1:-1)*t.amt/acctRate(c)}
 if(t.debt&&(t.kind==='borrow'||t.kind==='repay')){const k=t.debt==='advance'?'advUsed':'loanOwed';a[k]=Math.max(0,(a[k]||0)+dir*(t.kind==='borrow'?1:-1)*v)}}
window.addTxn=function(t,quiet){
 t.id=nid('t');t.d=t.d||stamp();if(!acct(t.acct))ensureAcct(t.acct);
 const a=acct(t.acct);
 if(a&&a.currency&&a.currency!==CUR()&&!t.orig){t.orig={cur:a.currency,amt:t.amt};t.amt=Math.round(t.amt*acctRate(a))}
 if(t.kind==='out'){if(!t.sub)t.sub=guessSub(t.cat,t.title+' '+(t.sms||''));if(!t.for)t.for='me'}
 S.txns.push(t);applyBalance(t,1);
 if(t.kind==='lend'&&t.loanWho)S.loans.unshift({id:nid('l'),dir:'out',who:t.loanWho,amt:t.amt,paid:0,date:t.d.slice(0,10),due:ymd(plusDays(pd(t.d),30)),note:'Detected from the MoMo note',auto:true});
 if(t.kind==='borrow'&&t.fromPerson)S.loans.unshift({id:nid('l'),dir:'in',who:t.fromPerson,amt:t.amt,paid:0,date:t.d.slice(0,10),due:ymd(plusDays(pd(t.d),30)),note:t.note||'',auto:true});
 if(t.invProvider)addToHolding(t.invProvider,t.amt,t.d);
 let paidBill=null;
 if(t.kind==='out'){const txt=(t.title+' '+(t.sms||'')).toLowerCase();paidBill=S.bills.find(b=>b.status!=='paid'&&b.amt&&Math.abs(b.amt-t.amt)/b.amt<.2&&billWords2(b).some(w=>txt.includes(w)));if(paidBill){paidBill.status='paid';paidBill.paidOn=t.d.slice(0,10);paidBill.auto=true}}
 if(window.gameLog&&t.src!=='sms')gameLog('log');
 if(quiet)return t;
 let msg=`Saved ${ugx(t.amt)} · ${catOf(t).name}`,icn='check';
 if(t.kind==='out'){const c=cat(t.cat);if(c&&c.budget){const p=catSpent(c.id)/c.budget;if(p>1)msg+=`. ${c.name} is now over budget`;else if(p>=S.settings.threshold/100)msg+=`. ${c.name} is at ${Math.round(p*100)}% of budget`}}
 if(t.route){const v=fareVerdict(route(t.route),t.mode,t.amt);if(v&&v.k!=='good'){msg=`You paid ${ugx(t.amt)} for ${routeName(route(t.route))}. The usual range is ${num(v.lo)}–${num(v.hi)}.`;icn='alert'}}
 if(paidBill)msg+=`. ${paidBill.name} marked paid`;
 toast(msg,icn);return t};
ensureAcct=function(id){if(acct(id))return;const map={mtn:'mtn-ug',airtel:'airtel-ug',bank:'bank-other',cash:'cash'};const p=provider(map[id]||id)||provider('bank-other');
 S.accounts.push(normalizeAccount({id,name:p.name,provider:p.id,type:KIND_LABEL[p.kind],bal:0,c:p.c,trend:[]}))};
function newAccount(pid,extra){const p=provider(pid)||provider('bank-other');const a=normalizeAccount({id:nid('a'),name:p.name,provider:p.id,type:KIND_LABEL[p.kind]||'',bal:0,c:p.c,trend:[],...(extra||{})});S.accounts.push(a);return a}

/* ---------- transaction rows ---------- */
window.txRow=t=>{const c=catOf(t);const pos=t.kind==='in'||t.kind==='borrow'||t.kind==='topup';const sign=pos?'+':'−';const a=acct(t.acct);
 const v=t.route?fareVerdict(route(t.route),t.mode,t.amt):null;const sub=subOf(t);const hh=S.household;
 const who=hh&&t.for&&t.for!=='me'?(t.for==='family'?'Household':(hh.members.find(m=>m.id===t.for)||{}).name):'';
 const right=t.orig?`<small>${money(t.orig.amt,t.orig.cur)}</small>`:v&&v.k!=='good'?`<small style="color:var(--${v.k==='bad'?'bad':'warn'})">${v.label}</small>`:`<small>${hm(t.d)}</small>`;
 return `<button class="tx" data-act="tx" data-arg="${t.id}"><span class="chip" style="--c:${c.c}">${ic(c.ic)}</span><span class="tx-main"><span class="tx-title">${t.review?'<span class="pill warn" style="margin-right:6px;font-size:10px;padding:1px 6px">Check</span>':''}${esc(t.title)}</span><span class="tx-sub">${esc(sub||c.name)}${who?' · '+esc(who):''} · ${esc(a?a.name:'')} ${t.receipt?ic('receipt',12).replace('class="i"','class="i" style="display:inline;vertical-align:-2px"'):''}<span class="src">${srcTag(t.src)}</span></span></span><span class="tx-amt ${pos?'pos':''}" style="${t.kind==='borrow'?'color:var(--warn)':''}">${sign}${num(t.amt)}${right}</span></button>`};

/* ---------- reading money messages: currencies, M-Pesa, advances, loans, fees, investments ---------- */
const CUR_TOK='(UGX|USh|Ushs?|Shs?|KES|Kshs?|TZS|Tshs?|RWF|Frw|BIF|FBu|CDF|NGN|\u20a6|GHS|GH\u20b5|GHC|ZMW|MWK|ETB|Birr|XOF|XAF|F ?CFA|CFA|USD|US\\$|ZAR)';
const AMT_RE=()=>new RegExp(CUR_TOK+'\\.?\\s?([\\d,]+(?:\\.\\d{1,2})?)(?![\\d])|([\\d,]+(?:\\.\\d{1,2})?)\\s?'+CUR_TOK+'\\b','gi');
function curCode(tok){const t=String(tok||'').toLowerCase().replace(/[\s.$]/g,'');const h=CUR();
 if(/^(ugx|ush)/.test(t))return'UGX';if(/^(ksh|kes)/.test(t))return'KES';if(/^(tsh|tzs)/.test(t))return'TZS';if(/^(rwf|frw)/.test(t))return'RWF';if(/^(bif|fbu)/.test(t))return'BIF';if(t==='cdf')return'CDF';
 if(t==='ngn'||t==='\u20a6')return'NGN';if(/^gh/.test(t))return'GHS';if(t==='zmw')return'ZMW';if(t==='mwk')return'MWK';if(t==='etb'||t==='birr')return'ETB';if(t==='xof')return'XOF';if(t==='xaf')return'XAF';
 if(/cfa/.test(t))return h==='XAF'||h==='XOF'?h:'XOF';if(/^(usd|us)$/.test(t))return'USD';if(t==='zar')return'ZAR';if(/^shs?$/.test(t))return['UGX','KES','TZS'].includes(h)?h:'UGX';return h}
function smsAmounts(s){const out=[];const re=AMT_RE();let m;while((m=re.exec(s))){const tok=m[1]||m[4];const v=parseFloat((m[2]||m[3]).replace(/,/g,''));if(v>0)out.push({cur:curCode(tok),amt:v,i:m.index,end:m.index+m[0].length})}return out}
const near=(s,list,re,win)=>{for(const a of list){const before=s.slice(Math.max(0,a.i-(win||28)),a.i);if(re.test(before))return a}return null};
const DEBT_RE=/\b(advance|mokash|wewole|overdraft|quick ?loan|loan|fuliza|m-?shwari|okoa|timiza|songesha|nivushe|kcb m-?pesa|credit line)\b/i;
const INVEST_RE=/\b(xeno|nssf|unit trust|money market fund|britam|old mutual|icea|sanlam|cic asset|portfolio|fund value|treasury bill|t-?bill)\b/i;
function smsProvider(sender,s,cur){const x=(sender+' '+s).toLowerCase();const cc={UGX:'UG',KES:'KE',TZS:'TZ',RWF:'RW',GHS:'GH',ZMW:'ZM',MWK:'MW',XAF:'CM',XOF:'CI',NGN:'NG',ZAR:'ZA',ETB:'ET',CDF:'CD',BIF:'BI',SSP:'SS'}[cur]||country()[0];
 const pick=id=>provider(id)?id:null;
 if(/m-?pesa|safaricom|vodacom/.test(x))return pick('mpesa-'+cc.toLowerCase())||'mpesa-ke';
 if(/airtel/.test(x))return pick('airtel-'+cc.toLowerCase())||'momo-other';
 if(/\bmtn\b|momo|mobile money/.test(sender.toLowerCase()+' '+x))return pick('mtn-'+cc.toLowerCase())||'momo-other';
 if(/mixx|tigo ?pesa|\byas\b/.test(x))return'mixx-tz';if(/halo ?pesa/.test(x))return'halopesa';if(/telebirr/.test(x))return'telebirr';if(/orange money/.test(x))return'orange-money';if(/\bwave\b/.test(x))return'wave';
 if(/\bopay\b/.test(x))return'opay';if(/palmpay/.test(x))return'palmpay';if(/moniepoint/.test(x))return'moniepoint';if(/t-?kash/.test(x))return'tkash';if(/mpamba/.test(x))return'mpamba';if(/telecel/.test(x))return'telecel-gh';if(/lumicash/.test(x))return'lumicash';
 const bank=PROVIDERS.filter(p=>p.kind==='bank'&&(p.cc==='*'||p.cc.split(' ').includes(cc))).find(p=>{const w=p.name.split(' ')[0].toLowerCase().replace(/[^a-z&-]/g,'');return w.length>2&&w!=='other'&&(x.includes(w)||(p.short.length>2&&new RegExp('\\b'+p.short.toLowerCase().replace(/[^a-z&]/g,'')+'\\b').test(x)))});
 if(bank)return bank.id;if(/a\/c|acct|account|bank|card/.test(x))return'bank-other';return'momo-other'}
function acctForProvider(pid,cur){let a=S.accounts.find(x=>x.provider===pid&&(!cur||x.currency===cur))||S.accounts.find(x=>x.provider===pid);
 if(!a){const p=provider(pid)||provider('momo-other');a=S.accounts.find(x=>x.kind===p.kind&&x.provider===p.id);if(!a)a=newAccount(pid,{currency:cur||CUR(),type:KIND_LABEL[p.kind]+' · from SMS'})}return a}
function partyOf(s){let party=(s.match(/\b(?:to|from)\s+([A-Za-z][A-Za-z0-9&.' -]{1,40}?)(?=\s*(?:\(|,|\.|;|:|\s(?:\+?2\d{2}|0)\d{6,}|\s\d{6,}|\son\b|\sat\b|\sref|\stid|\swith\b|\sfor\b|\snew\b|$))/i)||[])[1];
 if(!party)party=(s.match(/\bto\s+(?:\+?2\d{2}|0)\d{6,}\s+([A-Za-z][A-Za-z' -]{1,30}?)(?=[.,]|\s(?:charge|fee|bal|on|new)\b|$)/i)||[])[1];
 if(party&&/^(your|you|account|a\/c|mobile|the|wallet|number|m-?pesa|agent)\b/i.test(party))party=null;return party?titleCase(party.trim()):null}
function smsDate(s){let m=s.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/);if(m)return `${m[1]}-${m[2]}-${m[3]} ${m[4]}`;
 m=s.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s*(?:at\s*)?(\d{1,2}):(\d{2})\s*([AP]M)?)?/i);
 if(m){let y=+m[3];if(y<100)y+=2000;let h=m[4]?+m[4]:12;if(m[6]&&/pm/i.test(m[6])&&h<12)h+=12;if(m[6]&&/am/i.test(m[6])&&h===12)h=0;return `${y}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')} ${String(h).padStart(2,'0')}:${m[5]||'00'}`}return null}
function readMoneySms(raw,sender,when){
 const s=String(raw||'').replace(/\s+/g,' ').trim(),low=s.toLowerCase();sender=String(sender||'');
 const am=smsAmounts(s);if(!am.length)return null;
 if(/\b(otp|one[- ]time|verification code|code is|password|pin is|failed|unsuccessful|insufficient|declined|not successful|reversed|reversal|cancelled)\b/i.test(s))return null;
 const main=am[0],cur=main.cur;
 const fee=near(s,am,/(fee|charge|transaction cost|commission)s?[^.\d]{0,12}$/i,30);
 const balA=near(s,am,/(balance|bal|avl\.?)[^.\d]{0,22}$/i,34);
 const pid=smsProvider(sender,s,cur);const p=provider(pid)||{};
 const res={raw:s,sender,cur,amt:main.amt,date:smsDate(s)||(when?`${ymd(new Date(when))} ${hhmm(new Date(when))}`:stamp()),pid,providerName:p.name||'Account',bal:balA&&balA!==main?balA.amt:null,
  ref:(s.match(/(?:transaction id|txn id|trans(?:action)? ?ref|\btid|reference|\bref)\s*(?:no\.?|:|#)?\s*([A-Z0-9.]{6,})/i)||s.match(/^([A-Z0-9]{8,12}) confirmed/i)||[])[1],
  reason:(s.match(/(?:reason|message|note|narration)\s*:\s*([^.]+)/i)||[])[1],fee:fee&&fee!==main?fee.amt:0,party:partyOf(s),txns:[],limits:null,invest:null,uncertain:false};
 /* limits: no money moved */
 if(/(limit|qualify|eligible|borrow up to|can borrow|available to borrow)/i.test(s)&&DEBT_RE.test(s)&&!/\b(received|disbursed|credited|sent|paid|repaid|recovered|deducted)\b/i.test(s)){
  res.limits={kind:/advance|overdraft|fuliza|okoa|songesha|nivushe/i.test(s)?'adv':'loan',amt:main.amt};res.type='Limit update';return res}
 /* messages from investment providers themselves */
 const fromInvest=INVEST_RE.test(sender)||(/\b(xeno|nssf|unit trust|money market fund|portfolio|fund value)\b/i.test(s)&&!/\b(sent to|paid to|transferred to)\b/i.test(s));
 if(fromInvest){const ip=/xeno/i.test(sender+s)?'xeno':/nssf/i.test(sender+s)?'nssf-ug':/old mutual|uap/i.test(s)?'uap-om':/britam/i.test(s)?'britam':/icea/i.test(s)?'icea':/sanlam/i.test(s)?'sanlam':'invest-other';
  const value=near(s,am,/(value|balance|worth|total)[^.\d]{0,22}$/i,34);
  res.invest={pid:ip,amt:main.amt,value:value&&value!==main?value.amt:(/(value|worth|balance) (is|of)/i.test(s)&&am.length===1?main.amt:null),kind:/contribution/i.test(s)?'contribution':/withdraw/i.test(s)?'withdrawal':/interest|return|dividend/i.test(s)?'return':'deposit'};
  res.type='Investment update';return res}
 const isDebt=DEBT_RE.test(s);const debt=/advance|overdraft|fuliza|okoa|songesha|nivushe/i.test(s)?'advance':'loan';
 const recA=isDebt&&am.length>1?(near(s,am,/(recover\w*|deduct\w*|repa(id|yment)( of)?)[^.\d]{0,20}$/i,40)||am.find(a=>a!==main&&/^[^.]{0,30}(recovered|deducted|repaid)/i.test(s.slice(a.end)))):null;
 let kind=null,type=null;
 const around=s.slice(Math.max(0,main.i-45),main.end+30);const debtNear=DEBT_RE.test(around);
 if(debtNear&&/\b(disbursed|granted|approved|you have been given|has been sent to your|credited|received)\b/i.test(s)&&!/\b(repaid|repayment|recovered|deducted|cleared)\b/i.test(around)){kind='borrow';type=debt==='advance'?'Advance received':'Loan received'}
 else if(debtNear&&/\b(repaid|repayment|recovered|deducted|cleared|paid)\b/i.test(around)){kind='repay';type=debt==='advance'?'Advance repaid':'Loan repayment'}
 else if(/\b(received|credited|cash ?in)\b|deposit(?:ed)? .{0,20}(?:to|into) your/i.test(s)){kind='in';type=/deposit/i.test(s)?'Deposit':'Received'}
 else if(/\bgive\b.{0,30}\bcash to\b/i.test(s)){kind='topup';type='Cash deposit at agent'}
 else if(/withdr\w*|cash ?out/i.test(s)){kind='move';type='Withdrawn to cash'}
 else if(/\bbought\b.{0,40}airtime|airtime (purchase|for)/i.test(s)){kind='out';type='Airtime'}
 else if(/\bdebited\b/i.test(s)){kind='out';type='Bank debit'}
 else if(/\b(paid|payment|bought|purchase)\b/i.test(s)){kind='out';type='Paid to merchant'}
 else if(/\b(sent|transferred|transfer of)\b/i.test(s)){kind='out';type='Sent'}
 if(!kind)return null;
 res.type=type;res.kind=kind;
 const isLoanOut=kind==='out'&&/\b(loan|pay (?:you|me) back|borrow)/i.test(res.reason||'');
 const invOut=kind==='out'&&INVEST_RE.test((res.party||'')+' '+(res.reason||''));
 const body2=s.replace(/(fee|charge|transaction cost|balance|bal|tid|transaction id|ref)[^.]*\.?/gi,'');
 let catId='income',sub=null;
 if(kind==='out'){if(type==='Airtime'){catId='airtime';sub='Airtime'}else{[catId,sub]=guessCatSub(`${res.party||''} ${res.reason||''}`);if(catId==='other')[catId,sub]=guessCatSub(body2)}}
 if(invOut){catId='savings';sub='Investment'}
 const base={acct:null,src:'sms',sms:s,d:res.date,orig:null};
 const t={...base,kind:isLoanOut?'lend':kind,amt:main.amt,cat:isLoanOut?'lend':kind==='out'?catId:kind==='in'?'income':kind,sub:kind==='out'&&!isLoanOut?sub:null,
  title:isLoanOut?`Loan to ${res.party||'someone'}`:kind==='borrow'||kind==='repay'?`${res.providerName} ${debt==='advance'?'advance':'loan'}${kind==='repay'?' repaid':''}`:kind==='move'?`Cash withdrawal${res.party?' · '+res.party:''}`:kind==='topup'?'Cash deposit':kind==='in'?(res.party?`From ${res.party}`:type):(res.party||type),
  loanWho:isLoanOut?(res.party||'Someone'):null,debt:kind==='borrow'||kind==='repay'?debt:null,
  invProvider:invOut?(/xeno/i.test(res.party+'')?'xeno':/nssf/i.test(res.party+'')?'nssf-ug':'invest-other'):null};
 res.uncertain=!type||(kind!=='move'&&kind!=='topup'&&kind!=='borrow'&&kind!=='repay'&&type!=='Bank debit'&&type!=='Airtime'&&!res.party);
 t.review=res.uncertain;res.txns.push(t);
 if(recA&&kind==='in')res.txns.push({...base,kind:'repay',amt:recA.amt,cat:'repay',debt,title:`${res.providerName} ${debt} recovered`});
 if(res.fee)res.txns.push({...base,kind:'out',amt:res.fee,cat:'other',sub:'Mobile money & bank fees',title:`${res.providerName} fee`,linked:true});
 return res}
/* the older reader shape, still used by a few screens */
window.parseSMS=function(raw,sender){const r=readMoneySms(raw,sender);if(!r||!r.txns.length)return null;const t=r.txns[0];
 return{amt:r.amt,kind:t.kind,type:r.type,party:r.party||'Unknown',date:r.date,bal:r.bal!=null?num(r.bal):null,ref:r.ref,reason:r.reason,fee:r.fee?num(r.fee):null,provider:'mtn',cat:t.cat,isLoan:t.kind==='lend',uncertain:r.uncertain}};

/* apply one reading to the books */
function applySms(r,quiet){if(!r)return 0;let n=0;
 if(r.invest){const h=updateHolding(r.invest,r.date);pushAlert(`${(provider(r.invest.pid)||{}).name||'Investment'}: ${r.invest.kind==='return'?'returns of':r.invest.kind==='withdrawal'?'withdrawal of':r.invest.kind==='contribution'?'contribution of':'deposit of'} ${money(r.invest.amt,r.cur)}`,h?`Your holding is now ${ugx(h.value)}.`:'Recorded under Investments.','invest','trend');return 1}
 const a=acctForProvider(r.pid,r.cur);
 if(r.limits){if(r.limits.kind==='adv')a.advLimit=r.limits.amt;else a.loanLimit=r.limits.amt;pushAlert(`${a.name}: ${r.limits.kind==='adv'?'advance':'loan'} limit is ${money(r.limits.amt,a.currency)}`,'Saved on the account so you can see the credit available to you.','accounts','hand');return 1}
 if(r.invest){const h=updateHolding(r.invest,r.date);pushAlert(`${(provider(r.invest.pid)||{}).name||'Investment'}: ${r.invest.kind==='return'?'returns of':r.invest.kind==='withdrawal'?'withdrawal of':r.invest.kind==='contribution'?'contribution of':'deposit of'} ${money(r.invest.amt,r.cur)}`,h?`Your holding is now ${ugx(h.value)}.`:'Recorded under Investments.','invest','trend');return 1}
 r.txns.forEach(t=>{t.acct=a.id;addTxn(t,true);n++});
 if(r.bal!=null){a.bal=r.bal}
 return n}

/* ---------- investments fed by messages ---------- */
function holdingFor(pid){const p=provider(pid)||{name:'Investment'};let h=S.inv.find(x=>x.pid===pid)||S.inv.find(x=>x.name.toLowerCase().includes((p.name||'').split(' ')[0].toLowerCase()));
 if(!h){h={id:nid('i'),pid,type:pid==='nssf-ug'?'pension':pid==='xeno'||pid==='uap-om'||pid==='britam'||pid==='icea'||pid==='sanlam'?'unit':'unit',name:p.name,detail:'Updated from messages',invested:0,value:0};S.inv.push(h)}h.pid=pid;return h}
function addToHolding(pid,amt,d){const h=holdingFor(pid);h.invested+=amt;h.value+=amt;h.last=d;h.lastAmt=amt}
function updateHolding(iv,d){const h=holdingFor(iv.pid);
 const dup=h.lastAmt===iv.amt&&h.last&&Math.abs(pd(h.last)-pd(d))<4*DAY;
 if(iv.kind==='withdrawal'){h.value=Math.max(0,h.value-iv.amt)}
 else if(iv.kind==='return'){h.value+=iv.amt}
 else if(!dup){h.value+=iv.amt;h.invested+=iv.amt}
 if(iv.value)h.value=iv.value;h.last=d;h.lastAmt=iv.amt;return h}
function pushAlert(title,body,goTo,icn){S.alerts=S.alerts||[];S.alerts.unshift({id:'al'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),title,body,go:goTo,ic:icn||'info',t:'accent',when:Date.now()});S.alerts=S.alerts.slice(0,40)}
if(!INV_TYPES.pension)INV_TYPES.pension={name:'Pension (NSSF)',c:'#0B5DA6',risk:'Low',learn:'Mandatory retirement savings. In Uganda, employers pay 10% of your salary and you pay 5% to NSSF, which pays yearly interest. You can check your balance with NSSF online or by SMS. Voluntary contributions are also possible.',suits:'Long-term retirement security.'};

/* ---------- reading the phone's messages ---------- */
smsSync=function(manual){
 if(!NATIVE||!isFresh())return;
 if(!S.settings.sms){if(manual)toast('Turn on "Read money SMS" in Settings first.','sms');return}
 let ok=false;try{ok=NATIVE.hasSmsPermission()}catch(e){}
 if(!ok){if(manual)try{NATIVE.requestSmsPermission()}catch(e){}return}
 const since=S.smsSince||(Date.now()-60*DAY);let list=[];try{list=JSON.parse(NATIVE.readSms(String(since))||'[]')}catch(e){list=[]}
 S.smsSeen=S.smsSeen||[];let added=0,review=0,maxDate=since;
 list.sort((a,b)=>a.date-b.date).forEach(m=>{const key=m.date+'|'+String(m.body||'').slice(0,48);if(m.date>maxDate)maxDate=m.date;if(S.smsSeen.includes(key))return;S.smsSeen.push(key);
  const r=readMoneySms(m.body,m.address,+m.date);if(!r)return;if(!r.limits&&!r.invest&&r.txns[0]){const d=new Date(+m.date);r.txns.forEach(t=>t.d=`${ymd(d)} ${hhmm(d)}`)}
  added+=applySms(r,true);if(r.uncertain)review++});
 S.smsSeen=S.smsSeen.slice(-1500);S.smsSince=maxDate;S.smsLast=Date.now();
 if(added){refresh();toast(`${added} item${added>1?'s':''} read from your messages${review?`. ${review} to check`:''}`,'sms')}else{save();if(manual)toast('No new money messages found.','sms')}};

/* SMS tester sheet uses the new reader */
LIVE.sms=()=>{const el=$('#smsIn');if(!el)return;const r=readMoneySms(el.value,'');$('#smsSave').disabled=!r;
 if(!r){$('#smsOut').innerHTML=`<div class="note warn">${ic('alert')}<span class="small">This doesn't look like a money confirmation, so Kasente would skip it.</span></div>`;return}
 const rows=r.limits?[['Update',r.limits.kind==='adv'?'Advance limit':'Loan limit'],['Amount',money(r.limits.amt,r.cur)]]:r.invest?[['Provider',(provider(r.invest.pid)||{}).name],['Type',r.invest.kind],['Amount',money(r.invest.amt,r.cur)],...(r.invest.value?[['Value now',money(r.invest.value,r.cur)]]:[])]
  :[['Type',r.type],['Amount',money(r.amt,r.cur)],[r.txns[0].kind==='in'?'From':'To',r.party||'—'],['When',`${dlabel(r.date)} ${hm(r.date)}`],['Account',r.providerName],...(r.fee?[['Fee (logged separately)',money(r.fee,r.cur)]]:[]),...(r.txns[1]&&r.txns[1].kind==='repay'?[['Recovered',money(r.txns[1].amt,r.cur)]]:[]),...(r.bal!=null?[['Balance after',money(r.bal,r.cur)]]:[]),...(r.ref?[['Reference',r.ref]]:[]),['Category',r.txns[0].kind==='out'?((cat(r.txns[0].cat)||{}).name||'Other')+(r.txns[0].sub?' · '+r.txns[0].sub:''):catOf(r.txns[0]).name]];
 $('#smsOut').innerHTML=`<div class="card" style="background:var(--bg);padding:12px"><div class="between" style="margin-bottom:8px"><b class="small">Read from message</b><span class="pill ${r.uncertain?'warn':'accent'}">${r.uncertain?'Check this':r.type}</span></div><dl class="kv" style="margin:0">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`};
FORMS.sms=fd=>{const r=readMoneySms(fd.get('sms'),'');if(!r)return;const n=applySms(r);closeSheet();refresh();toast(n?`Logged from the message`:'Nothing to log','sms')};
SAMPLE_SMS.advance='Y\'ello. You have received UGX 200,000 from JOHN MUKASA (256772000111) on 2026-10-05 09:12. Your MoMo Advance of UGX 110,000 has been recovered. Your new balance is UGX 90,000. Transaction ID: 3320011223.';
SAMPLE_SMS.mpesa='QJK4H7LM2P Confirmed. Ksh1,500.00 sent to MARY WANJIKU 0712345678 on 5/10/26 at 10:15 AM. New M-PESA balance is Ksh3,245.00. Transaction cost, Ksh23.00.';
SAMPLE_SMS.xeno='Dear client, your deposit of UGX 100,000 to your Xeno Emergency goal has been received and invested. Thank you for saving with Xeno.';
const baseSmsTest=ACT.smsTest;
ACT.smsTest=()=>{baseSmsTest();const chips=document.querySelector('.sheet-body .chips');if(chips)chips.insertAdjacentHTML('beforeend',[['advance','MoMo advance'],['mpesa','M-Pesa (Kenya)'],['xeno','Xeno']].map(([k,l])=>`<button class="chipbtn" data-act="smsSample" data-arg="${k}">${l}</button>`).join(''))};

/* ---------- editing a transaction ---------- */
FORMS.editTx=(fd,f)=>{const t=S.txns.find(x=>x.id===f.dataset.id);if(!t)return;applyBalance(t,-1);
 const amt=Math.abs(+fd.get('amt'))||t.amt;const a1=acct(fd.get('acct'));
 t.title=fd.get('title')||t.title;t.kind=fd.get('kind');t.acct=fd.get('acct');t.d=fd.get('date')+' '+t.d.slice(11);
 if(a1&&a1.currency!==CUR()){t.orig={cur:a1.currency,amt};t.amt=Math.round(amt*acctRate(a1))}else{t.orig=null;t.amt=amt}
 if(fd.get('cat'))t.cat=fd.get('cat');if(fd.get('sub')!==null)t.sub=fd.get('sub')||null;if(fd.get('for'))t.for=fd.get('for');
 if(t.kind==='in')t.cat='income';else if(t.kind==='lend')t.cat='lend';else if(t.kind==='borrow'||t.kind==='repay'){t.cat=t.kind;t.debt=t.debt||'loan'}else if(['income','lend','borrow','repay'].includes(t.cat))t.cat=guessCat(t.title);
 applyBalance(t,1);t.review=false;closeSheet();refresh();toast('Changes saved')};
ACT.txDel=(id,el)=>{if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent='Tap again to delete';return}const i=S.txns.findIndex(t=>t.id===id);const t=S.txns[i];applyBalance(t,-1);if(t.receipt&&NATIVE&&NATIVE.deleteReceipt)try{NATIVE.deleteReceipt(t.receipt)}catch(e){}S.txns.splice(i,1);closeSheet();refresh();toast('Transaction deleted')};
ACT.tx=id=>{const t=S.txns.find(x=>x.id===id);if(!t)return;const c=catOf(t);const r=t.sms?readMoneySms(t.sms,''):null;const a=acct(t.acct);const hh=S.household;const v=t.route?fareVerdict(route(t.route),t.mode,t.amt):null;
 const forOpts=hh?`<label class="field"><span>Who it was for</span><select name="for">${forOptions(t.for||'me')}</select></label>`:'';
 openSheet('Transaction',`<div class="stack">
  ${t.review?`<div class="note warn">${ic('alert')}<span class="small">Kasente wasn't sure how to read this message. Check the details below.</span></div><button class="btn" data-act="reviewed" data-arg="${id}">${ic('check')}It's right</button>`:''}
  <div class="row"><span class="chip" style="--c:${c.c};width:52px;height:52px">${ic(c.ic,24)}</span><div class="grow"><div class="tnum" style="font-family:var(--f-display);font-weight:800;font-size:26px;color:${effOf(t)>0?'var(--good)':'var(--ink)'}">${effOf(t)>0?'+':'−'}${ugx(t.amt)}</div><div class="small muted">${esc(t.title)}</div>${t.orig?`<div class="xs muted">${money(t.orig.amt,t.orig.cur)} at ${fmtNum(acctRate(a))} ${CUR()} each</div>`:''}</div></div>
  ${v?`<div class="note ${v.k==='bad'?'bad':v.k==='warn'?'warn':''}">${ic('bike')}<span class="small"><b>${v.label}.</b> ${routeName(route(t.route))} by ${t.mode} usually costs ${ugx(v.lo)}–${num(v.hi)}.</span></div>`:''}
  ${t.kind==='borrow'?`<div class="note warn">${ic('hand')}<span class="small">This is borrowed money, so it isn't counted as income. It's added to what you owe ${esc(a?a.name:'')}.</span></div>`:''}
  ${t.receipt?`<img class="thumb" src="${t.receipt}" alt="Receipt photo">`:''}
  ${t.items&&t.items.length?`<div class="field"><span>Items</span><div class="list">${t.items.map(x=>`<div class="setrow" style="padding:8px 12px"><span class="grow"><b style="font-size:13.5px">${esc(x[0])}</b></span><span class="small tnum">${num(x[1])}</span></div>`).join('')}</div></div>`:''}
  <dl class="kv"><dt>When</dt><dd>${dlabel(t.d)}, ${hm(t.d)}</dd><dt>Account</dt><dd>${esc(a?a.name:'')}</dd>${subOf(t)?`<dt>Type</dt><dd>${esc(subOf(t))}</dd>`:''}<dt>Captured from</dt><dd>${srcTag(t.src)}</dd>${r&&r.ref?`<dt>Reference</dt><dd>${esc(r.ref)}</dd>`:''}</dl>
  ${t.sms?`<div class="field"><span>Original message</span><div class="mono">${esc(t.sms)}</div></div>`:''}
  <details class="card" style="padding:12px 14px" ${t.review?'open':''}><summary style="cursor:pointer;font-weight:600">Edit details</summary><form class="stack" data-form="editTx" data-id="${id}" style="margin-top:10px">
   <label class="field"><span>Description</span><input name="title" value="${esc(t.title)}"></label>
   <div class="grid2"><label class="field"><span>Amount${t.orig?' ('+t.orig.cur+')':''}</span><input name="amt" type="number" inputmode="decimal" step="any" value="${t.orig?t.orig.amt:t.amt}"></label><label class="field"><span>Type</span><select name="kind">${[['out','Spending'],['in','Income'],['lend','Money lent'],['borrow','Loan or advance received'],['repay','Loan repayment'],['move','Withdrawal to cash']].map(([k,l])=>`<option value="${k}" ${t.kind===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
   ${t.kind==='out'?`<div class="grid2"><label class="field"><span>Category</span><select name="cat" data-live="catSub">${catOptions(t.cat)}</select></label><label class="field"><span>Detail</span><select name="sub" id="subSel">${subOptions(t.cat,subOf(t))}</select></label></div>${forOpts}`:''}
   <div class="grid2"><label class="field"><span>Account</span><select name="acct">${acctOptions(t.acct)}</select></label><label class="field"><span>Date</span><input name="date" type="date" value="${t.d.slice(0,10)}"></label></div>
   <button class="btn primary">Save changes</button></form></details>
  <button class="btn danger" data-act="txDel" data-arg="${t.id}">Delete transaction</button></div>`)};
window.subOptions=(c,sel)=>`<option value="">—</option>`+(SUBS[c]||[]).map(x=>`<option ${x===sel?'selected':''}>${esc(x)}</option>`).join('');
LIVE.catSub=el=>{const s=el.form&&el.form.querySelector('[name=sub]');if(s)s.innerHTML=subOptions(el.value,null)};
window.acctOptions=sel=>S.accounts.map(a=>`<option value="${a.id}" ${a.id===sel?'selected':''}>${esc(a.name)}${a.currency!==CUR()?' ('+a.currency+')':''}</option>`).join('');

/* ---------- accounts screen and details ---------- */
SCREENS.accounts=()=>{const groups=['momo','bank','cash','sacco','invest','other'];const liquid=S.accounts.filter(a=>['momo','bank','cash'].includes(a.kind)).reduce((s,a)=>s+inHome(a),0);
 const credit=S.accounts.reduce((s,a)=>s+Math.max(0,(a.advLimit||0)-(a.advUsed||0))*acctRate(a),0);const owed=providerDebt();
 return `<div class="kpi"><div class="stat"><span>Money you can use</span><b>${ugx(liquid)}</b></div><div class="stat"><span>All accounts</span><b>${ugx(acctTotal())}</b></div>${owed?`<div class="stat"><span>Owed to providers</span><b class="liab">${ugx(owed)}</b></div>`:''}${credit?`<div class="stat"><span>Advance still available</span><b>${ugx(credit)}</b></div>`:''}</div>
 ${groups.map(g=>{const list=S.accounts.filter(a=>a.kind===g);if(!list.length)return'';return `<div class="sec-head"><h2>${KIND_LABEL[g]}</h2><span class="small muted tnum">${ugx(list.reduce((s,a)=>s+inHome(a),0))}</span></div><div class="list">${list.map(a=>{const debt=(a.advUsed||0)+(a.loanOwed||0);return `<button class="tx" data-act="acct" data-arg="${a.id}">${acctBadge(a,40)}<span class="tx-main"><span class="tx-title">${esc(a.name)}</span><span class="tx-sub">${debt?`<span class="liab">Owes ${money(debt,a.currency)}</span>`:esc((provider(a.provider)||{}).name||KIND_LABEL[a.kind])}${a.currency!==CUR()?' · '+a.currency:''}</span></span><span class="tx-amt">${fmtNum(a.bal,a.currency)}${a.currency!==CUR()?`<small>≈ ${kf(inHome(a))}</small>`:''}</span></button>`}).join('')}</div>`}).join('')}
 <button class="btn block primary" data-act="addAccount">${ic('plus')}Add an account</button>
 <div class="note">${ic('info')}<span class="small">Mobile money and bank balances update from confirmation messages. Advances and loans from MTN, Airtel, M-Pesa and banks are tracked as money you owe, not as income.</span></div>`};
const acctSheetBody=a=>{const ts=S.txns.filter(t=>t.acct===a.id).sort((x,y)=>pd(y.d)-pd(x.d)).slice(0,6);const cur=a.currency;
 const hasCredit=a.advLimit||a.advUsed||a.loanLimit||a.loanOwed;
 const credit=hasCredit?`<div class="card stack" style="gap:10px;background:var(--bg)"><b>Credit and loans</b>
  ${a.advLimit||a.advUsed?`<div class="stack" style="gap:5px"><div class="between small"><span>Advance used</span><b class="tnum ${a.advUsed?'liab':''}">${money(a.advUsed,cur)}${a.advLimit?` <span class="muted" style="font-weight:500">of ${fmtNum(a.advLimit,cur)}</span>`:''}</b></div>${a.advLimit?`<div class="bar"><i style="width:${Math.min(100,a.advUsed/a.advLimit*100)}%;background:var(--warn)"></i></div><div class="xs muted">Still available: ${money(Math.max(0,a.advLimit-a.advUsed),cur)}</div>`:''}</div>`:''}
  ${a.loanLimit||a.loanOwed?`<div class="stack" style="gap:5px"><div class="between small"><span>Loan outstanding</span><b class="tnum ${a.loanOwed?'liab':''}">${money(a.loanOwed,cur)}</b></div>${a.loanLimit?`<div class="xs muted">Loan limit: ${money(a.loanLimit,cur)}</div>`:''}</div>`:''}
  ${a.advUsed?`<div class="note warn" style="padding:10px 12px">${ic('info')}<span class="small">The next money you receive on ${esc(a.name)} repays the ${money(a.advUsed,cur)} advance first. If you receive ${money(a.advUsed*2,cur)}, about ${money(a.advUsed,cur)} reaches your balance.</span></div>`:''}
  <div class="between small"><span class="muted">Balance minus what you owe</span><b class="tnum">${money(a.bal-(a.advUsed||0)-(a.loanOwed||0),cur)}</b></div></div>`:'';
 return `<div class="row">${acctBadge(a,52)}<div class="grow"><span class="eyebrow">${esc(KIND_LABEL[a.kind]||'')}${a.currency!==CUR()?' · '+a.currency:''}</span><div class="tnum" style="font-family:var(--f-display);font-weight:800;font-size:26px">${money(a.bal,cur)}</div>${a.currency!==CUR()?`<div class="xs muted">≈ ${ugx(inHome(a))} at ${fmtNum(acctRate(a))} ${CUR()} per ${cur}</div>`:''}</div></div>
 <div style="margin:12px 0">${spark([...(a.trend||[]).slice(0,-1),a.bal/1000],340,46,'var(--accent)',true)}</div>
 ${credit}
 <div class="row" style="margin:12px 0"><button class="btn sm grow" data-act="editAcct" data-arg="${a.id}">${ic('gear',16)}Edit account</button>${a.kind==='momo'||a.kind==='bank'?`<button class="btn sm grow" data-act="acctCredit" data-arg="${a.id}">${ic('hand',16)}Advance & loans</button>`:''}</div>
 ${a.kind==='bank'?`<label class="btn block" for="stmt" style="margin-bottom:12px">${ic('upload')}Import a bank statement (CSV)</label><input id="stmt" type="file" accept=".csv,text/csv" hidden data-live="stmt">`:''}
 <b class="small">Recent</b><div class="list" style="margin-top:8px">${ts.length?ts.map(txRow).join(''):'<div class="setrow muted small">No transactions yet</div>'}</div>`};
ACT.acct=id=>{const a=acct(id);if(!a)return;openSheet(esc(a.name),acctSheetBody(a))};
const provOptions=(sel,cc)=>{const list=providersFor(cc||country()[0]);const groups=['momo','bank','sacco','invest','cash'];return groups.map(g=>{const l=list.filter(p=>p.kind===g);return l.length?`<optgroup label="${KIND_LABEL[g]}">${l.map(p=>`<option value="${p.id}" ${p.id===sel?'selected':''}>${esc(p.name)}</option>`).join('')}</optgroup>`:''}).join('')+`<optgroup label="Other countries">${PROVIDERS.filter(p=>!list.includes(p)).map(p=>`<option value="${p.id}" ${p.id===sel?'selected':''}>${esc(p.name)} (${p.cc.split(' ')[0]})</option>`).join('')}</optgroup>`};
const curOptions=sel=>Object.entries(CURRENCIES).map(([k,v])=>`<option value="${k}" ${k===sel?'selected':''}>${k} · ${v[0]}</option>`).join('');
function acctForm(a){const isNew=!a;a=a||{provider:providersFor(country()[0]).find(p=>p.kind==='momo')?.id||'momo-other',currency:CUR(),bal:'',advLimit:0,advUsed:0,loanLimit:0,loanOwed:0};
 return `<form class="stack" data-form="${isNew?'addAccount':'editAcct'}" ${isNew?'':`data-id="${a.id}"`}>
  <label class="field"><span>Provider</span><select name="provider" data-live="provName">${provOptions(a.provider)}</select></label>
  <label class="field"><span>Name in Kasente</span><input name="name" id="acctName" value="${esc(a.name||provider(a.provider)?.name||'')}" required></label>
  <div class="grid2"><label class="field"><span>Currency</span><select name="currency" data-live="acctCur">${curOptions(a.currency)}</select></label><label class="field"><span>Balance now</span><input name="bal" type="number" inputmode="decimal" step="any" value="${a.bal}" placeholder="0"></label></div>
  <label class="field" id="rateBox" ${a.currency===CUR()?'hidden':''}><span>Exchange rate: ${CUR()} per 1 ${'<b id="rateCur">'+a.currency+'</b>'}</span><input name="rate" type="number" inputmode="decimal" step="any" value="${a.rate||(a.currency!==CUR()?Math.round(rateOf(a.currency)*100)/100:'')}"></label>
  <details ${a.advLimit||a.loanLimit||a.advUsed||a.loanOwed?'open':''}><summary class="small" style="cursor:pointer;font-weight:600;color:var(--accent)">Advance and loans on this account</summary>
   <div class="stack" style="margin-top:10px"><p class="xs muted">For MoMo Advance, Airtel advances, M-Pesa Fuliza, MoKash and similar. Leave at 0 if you don't use them.</p>
   <div class="grid2"><label class="field"><span>Advance limit</span><input name="advLimit" type="number" inputmode="decimal" step="any" value="${a.advLimit||''}" placeholder="0"></label><label class="field"><span>Advance used now</span><input name="advUsed" type="number" inputmode="decimal" step="any" value="${a.advUsed||''}" placeholder="0"></label></div>
   <div class="grid2"><label class="field"><span>Loan limit</span><input name="loanLimit" type="number" inputmode="decimal" step="any" value="${a.loanLimit||''}" placeholder="0"></label><label class="field"><span>Loan owed now</span><input name="loanOwed" type="number" inputmode="decimal" step="any" value="${a.loanOwed||''}" placeholder="0"></label></div></div></details>
  <div class="field"><span>Picture (optional)</span><div class="thumbrow">${a.img?`<img src="${a.img}" alt="">`:acctBadge(a.id?a:{provider:a.provider,name:a.name||''},64)}<label class="btn sm" for="acctImg">${ic('camera',16)}Choose picture</label>${a.img?`<button type="button" class="btn sm" data-act="acctImgClear">Remove</button>`:''}</div><input id="acctImg" type="file" accept="image/*" hidden data-live="acctImg"><input type="hidden" name="img" id="acctImgVal" value="${a.img||''}"><span class="xs muted">You can use a photo of your card or the provider's logo from your phone. It stays on this phone.</span></div>
  <button class="btn primary">${isNew?'Add account':'Save'}</button>
  ${isNew?'':`<button type="button" class="btn danger" data-act="delAcct" data-arg="${a.id}">Delete account</button>`}</form>`}
ACT.addAccount=()=>openSheet('Add an account',acctForm(null));
ACT.editAcct=id=>openSheet('Edit account',acctForm(acct(id)));
ACT.acctCredit=id=>{ACT.editAcct(id);const d=document.querySelector('.sheet-body details');if(d){d.open=true;d.scrollIntoView({block:'start'})}};
LIVE.provName=el=>{const p=provider(el.value);const n=$('#acctName');if(p&&n)n.value=p.kind==='sacco'||p.id.endsWith('-other')?'':p.name};
LIVE.acctCur=el=>{const box=$('#rateBox');if(!box)return;box.hidden=el.value===CUR();$('#rateCur').textContent=el.value;const r=box.querySelector('input');if(r)r.value=Math.round(rateOf(el.value)*100)/100};
LIVE.acctImg=el=>{const f=el.files[0];if(!f)return;shrinkImage(f,128,u=>{$('#acctImgVal').value=u;const tr=el.closest('.field').querySelector('.thumbrow');tr.firstElementChild.outerHTML=`<img src="${u}" alt="">`})};
ACT.acctImgClear=(a,el)=>{$('#acctImgVal').value='';el.remove();const im=document.querySelector('.thumbrow img');if(im)im.outerHTML='<span class="pbadge" style="width:64px;height:64px;background:var(--surface-2)"></span>'};
function shrinkImage(file,max,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.85))};im.src=r.result};r.readAsDataURL(file)}
const acctFields=(fd,a)=>{const p=provider(fd.get('provider'))||provider('bank-other');Object.assign(a,{name:(fd.get('name')||p.name).trim(),provider:p.id,kind:p.kind,type:KIND_LABEL[p.kind],c:p.c,currency:fd.get('currency')||CUR(),bal:+fd.get('bal')||0,rate:fd.get('currency')!==CUR()?(+fd.get('rate')||rateOf(fd.get('currency'))):null,advLimit:+fd.get('advLimit')||0,advUsed:+fd.get('advUsed')||0,loanLimit:+fd.get('loanLimit')||0,loanOwed:+fd.get('loanOwed')||0,img:fd.get('img')||null});return a};
FORMS.addAccount=fd=>{const a=acctFields(fd,{id:nid('a'),trend:[]});S.accounts.push(normalizeAccount(a));closeSheet();refresh();toast(`${a.name} added`)};
FORMS.editAcct=(fd,f)=>{const a=acct(f.dataset.id);acctFields(fd,a);closeSheet();refresh();toast('Account saved')};
ACT.delAcct=(id,el)=>{const used=S.txns.filter(t=>t.acct===id).length;if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent=used?`Tap again: also removes ${used} transaction${used>1?'s':''}`:'Tap again to delete';return}
 S.txns=S.txns.filter(t=>t.acct!==id);S.accounts=S.accounts.filter(a=>a.id!==id);closeSheet();refresh();toast('Account deleted')};
/* bank statement CSV: date, description, amount (or debit/credit) */
LIVE.stmt=el=>{const f=el.files[0];if(!f)return;const a=S.accounts.find(x=>x.kind==='bank');const r=new FileReader();r.onload=()=>{const rows=String(r.result).split(/\r?\n/).map(l=>l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c=>c.replace(/^"|"$/g,'').trim())).filter(x=>x.length>=3);
 if(rows.length<2){toast("That file doesn't look like a statement with rows.",'alert');return}const head=rows[0].map(h=>h.toLowerCase());const iD=head.findIndex(h=>/date/.test(h)),iT=head.findIndex(h=>/desc|narr|details|particular/.test(h)),iA=head.findIndex(h=>/^amount/.test(h)),iDr=head.findIndex(h=>/debit|withdraw/.test(h)),iCr=head.findIndex(h=>/credit|deposit/.test(h));
 let n=0;rows.slice(1).forEach(c=>{const dv=c[iD>=0?iD:0];let d=smsDate(dv)||(/^\d{4}-\d{2}-\d{2}/.test(dv)?dv.slice(0,10)+' 12:00':null);if(!d)return;const title=c[iT>=0?iT:1]||'Bank transaction';let v=0;
  if(iA>=0)v=parseFloat((c[iA]||'').replace(/[^\d.-]/g,''));else v=(parseFloat((c[iCr]||'0').replace(/[^\d.]/g,''))||0)-(parseFloat((c[iDr]||'0').replace(/[^\d.]/g,''))||0);if(!v)return;
  const [cc,sub]=guessCatSub(title);addTxn({acct:(a||{}).id||'bank',kind:v>0?'in':'out',amt:Math.abs(v),cat:v>0?'income':cc,sub,title:title.slice(0,60),src:'import',d,review:true},true);n++});
 closeSheet();refresh();toast(n?`Imported ${n} rows. They're marked Check so you can confirm the categories.`:"No rows could be read. Columns needed: date, description and amount.",'upload')};r.readAsText(f)};
