/* ===== Build 3 · exports, settings, home, more, start-up ===== */

/* ---------- saving files: Downloads + Open / Share ---------- */
saveOut=function(name,mime,text,b64){
 if(NATIVE){let uri='';try{uri=b64?NATIVE.saveFileB64(name,mime,text):NATIVE.saveFile(name,mime,text)}catch(e){}
  if(uri){if(uri===true||uri==='true'){toast(`Saved to Downloads: ${name}`,'down');return}window._lastFile={uri,mime,name};
   openSheet('Saved',`<div class="stack"><div class="note">${ic('check')}<span class="small"><b>${esc(name)}</b> is in your phone's Downloads folder.</span></div><button class="btn primary" data-act="fileOpen">${ic('chev',18)}Open it</button><button class="btn" data-act="fileShare">${ic('send',18)}Share (WhatsApp, email, Drive…)</button></div>`);return}
  if(!b64)try{NATIVE.share(text,name);return}catch(e){}
  toast("The file couldn't be saved on this phone.",'alert');return}
 if(b64){const a=document.createElement('a');a.href=`data:${mime};base64,${text}`;a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Downloaded '+name,'down');return}
 openSheet(name,`<p class="small muted" style="margin-bottom:8px">Copy this text and keep it somewhere safe.</p><textarea id="outText" readonly class="mono" style="width:100%;min-height:260px;border:0">${esc(text)}</textarea><button class="btn block" style="margin-top:10px" data-act="copyOut">Copy</button>`)};
ACT.fileOpen=()=>{const f=window._lastFile;if(!f)return;let ok=false;try{ok=NATIVE.openUri(f.uri,f.mime)}catch(e){}if(!ok)toast(`No app on this phone opens ${f.mime.includes('sheet')?'Excel files. Install Excel, Google Sheets or WPS Office':'this file'}.`,'alert')};
ACT.fileShare=()=>{const f=window._lastFile;if(f)try{NATIVE.shareUri(f.uri,f.mime)}catch(e){}};
ACT.backup=()=>saveOut(`kasente-backup-${ymd(TODAY0)}.json`,'application/json',JSON.stringify({app:'kasente',v:3,saved:new Date().toISOString(),data:S}));

/* ---------- report period ---------- */
const baseOpenReport=openReport;openReport=function(k){S.ui.report=k;baseOpenReport(k)};
function reportRange(){const k=S.ui.report||'monthly';
 if(k==='annual')return[new Date(TODAY0.getFullYear()-1,TODAY0.getMonth(),TODAY0.getDate()+1),new Date(),'Last 12 months'];
 if(k==='custom'){const ins=[...document.querySelectorAll('.sheet-body input[type=date]')];if(ins.length===2&&ins[0].value&&ins[1].value){const a=pd(ins[0].value+' 00:00'),b=plusDays(pd(ins[1].value+' 00:00'),1);return[a,b,`${shortDate(ins[0].value)} – ${shortDate(ins[1].value)}`]}return[PREV_START,new Date(),'Custom range']}
 return[CYCLE_START,plusDays(CYCLE_END,0),'Pay cycle '+cycleLabel()]}
const txInRange=(a,b)=>S.txns.filter(t=>{const d=pd(t.d);return d>=a&&d<b}).sort((x,y)=>pd(x.d)-pd(y.d));
const kindName=t=>({in:'Income',out:'Spending',lend:'Lent',move:'Withdrawal to cash',topup:'Cash deposit',borrow:'Loan or advance received',repay:'Loan repayment'}[t.kind]||t.kind);
const forName=t=>{const hh=S.household;if(!hh||!t.for||t.for==='me')return 'Me';if(t.for==='family')return 'Household';return (hh.members.find(m=>m.id===t.for)||{}).name||''};

/* ---------- Excel workbook ---------- */
function loadXlsx(){return new Promise((res,rej)=>{if(window.XLSX)return res(window.XLSX);const s=document.createElement('script');s.src='xlsx.mini.min.js';s.onload=()=>res(window.XLSX);s.onerror=()=>rej(new Error('Excel library missing'));document.head.appendChild(s)})}
async function exportExcel(){let X;try{X=await loadXlsx()}catch(e){toast("Excel export isn't available in this build. Use CSV.",'alert');return}
 const [a,b,label]=reportRange();const tx=txInRange(a,b);const out=tx.filter(t=>t.kind==='out'),inc=tx.filter(t=>t.kind==='in');
 const wb=X.utils.book_new();const add=(name,rows,widths)=>{const ws=X.utils.aoa_to_sheet(rows);if(widths)ws['!cols']=widths.map(w=>({wch:w}));X.utils.book_append_sheet(wb,ws,name)};
 add('Summary',[['Kasente report',label],['Name',S.user.name||''],['Currency',CUR()],['Created',new Date().toLocaleString()],[],['Income',sumAmt(inc)],['Spending',sumAmt(out)],['Left over',sumAmt(inc)-sumAmt(out)],['Net worth today',Math.round(netWorth())],['Owed to providers',Math.round(providerDebt())],[],['Spending by category','Amount','Share'],...groupSum(out,t=>(cat(t.cat)||{}).name||t.cat).map(([n,v])=>[n,v,sumAmt(out)?Math.round(v/sumAmt(out)*1000)/10+'%':''])],[28,18,10]);
 add('Transactions',[['Date','Time','Account','Type','Category','Detail','For','Description',`Amount (${CUR()})`,'Original amount','Source'],...tx.map(t=>[t.d.slice(0,10),t.d.slice(11),(acct(t.acct)||{}).name||'',kindName(t),t.kind==='out'?(cat(t.cat)||{}).name||'':catOf(t).name,subOf(t)||'',t.kind==='out'?forName(t):'',t.title,effOf(t)>0?t.amt:-t.amt,t.orig?`${t.orig.cur} ${t.orig.amt}`:'',srcTag(t.src)])],[11,6,16,20,18,26,12,34,14,14,9]);
 add('Accounts',[['Account','Type','Currency','Balance',`Balance (${CUR()})`,'Advance used','Advance limit','Loan owed','Loan limit'],...S.accounts.map(x=>[x.name,KIND_LABEL[x.kind]||'',x.currency,x.bal,Math.round(inHome(x)),x.advUsed||0,x.advLimit||0,x.loanOwed||0,x.loanLimit||0])],[22,16,9,14,14,12,12,12,12]);
 add('Budgets',[['Category','Limit','Spent this cycle','Left'],...S.cats.map(c=>[c.name,c.budget,catSpent(c.id),c.budget-catSpent(c.id)])],[22,12,16,12]);
 add('Bills',[['Bill','Amount','Due','Status','Repeats'],...S.bills.map(x=>[x.name,x.amt,x.due,x.status==='paid'?'Paid':daysUntil(x.due)<0?'Late':'Upcoming',x.rep||x.note||''])],[26,12,12,10,12]);
 add('Loans',[['Person','Direction','Amount','Repaid','Outstanding','Due','Note'],...S.loans.map(l=>[l.who,l.dir==='out'?'Owes me':'I owe',l.amt,l.paid,l.amt-l.paid,l.due,l.note||''])],[20,10,12,12,12,12,24]);
 add('Goals',[['Goal','Target','Saved','Target date','Needed per month'],...S.goals.map(g=>[g.name,g.target,g.saved,g.date,Math.round(goalNeed(g))])],[26,12,12,12,16]);
 add('Assets & investments',[['Item','Type','Value'],...(S.assets||[]).map(x=>[x.name,(ASSET_TYPES[x.type]||ASSET_TYPES.other)[0],x.value]),...S.inv.map(x=>[x.name,(INV_TYPES[x.type]||{}).name||x.type,x.value])],[30,20,14]);
 const b64=X.write(wb,{type:'base64',bookType:'xlsx'});saveOut(`kasente-${(S.ui.report||'monthly')}-${ymd(TODAY0)}.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',b64,true)}

/* ---------- PDF report (Android's print screen → Save as PDF) ---------- */
function reportHtml(){const [a,b,label]=reportRange();const tx=txInRange(a,b);const out=tx.filter(t=>t.kind==='out'),inc=tx.filter(t=>t.kind==='in');const T=sumAmt(out);
 const row=(l,v,cls)=>`<tr><td>${esc(l)}</td><td class="r ${cls||''}">${esc(v)}</td></tr>`;const bar=(v,m,c)=>`<div class="bar"><i style="width:${m?v/m*100:0}%;background:${c}"></i></div>`;
 const byCat=groupSum(out,t=>t.cat);const top=byCat.length?byCat[0][1]:0;
 return `<!doctype html><html><head><meta charset="utf-8"><title>Kasente report</title><style>
 body{font-family:-apple-system,Roboto,"Segoe UI",Arial,sans-serif;color:#0F2624;margin:28px;font-size:12px}
 h1{font-size:22px;margin:0}h2{font-size:14px;margin:22px 0 8px;color:#0E6B66;border-bottom:1px solid #D4DEDB;padding-bottom:4px}
 .muted{color:#566C69}.kpis{display:flex;gap:10px;margin-top:14px}.kpi{flex:1;border:1px solid #D4DEDB;border-radius:10px;padding:10px}.kpi b{display:block;font-size:15px;margin-top:2px}
 table{width:100%;border-collapse:collapse}td,th{padding:5px 4px;border-bottom:1px solid #E7EEEC;text-align:left;vertical-align:top}th{font-size:11px;color:#566C69}.r{text-align:right;white-space:nowrap}.bad{color:#BD3628}
 .bar{height:6px;background:#E7EEEC;border-radius:6px;overflow:hidden;margin-top:3px}.bar i{display:block;height:100%}
 .brand{display:flex;align-items:center;gap:10px}.k{width:34px;height:34px;border-radius:10px;background:#0E6B66;color:#fff;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center}
 @page{size:A4;margin:14mm}</style></head><body>
 <div class="brand"><div class="k">K</div><div><h1>Kasente money report</h1><div class="muted">${esc(S.user.name||'')} · ${esc(label)} · ${CUR()}</div></div></div>
 <div class="kpis"><div class="kpi">Income<b>${esc(ugx(sumAmt(inc)))}</b></div><div class="kpi">Spending<b>${esc(ugx(T))}</b></div><div class="kpi">Left over<b>${esc(ugx(sumAmt(inc)-T))}</b></div><div class="kpi">Net worth<b>${esc(ugx(netWorth()))}</b></div></div>
 <h2>Spending by category</h2><table>${byCat.map(([id,v])=>{const c=cat(id)||cat('other');return `<tr><td style="width:45%">${esc(c.name)}${bar(v,top,c.c)}</td><td class="r">${esc(num(v))}</td><td class="r muted">${T?Math.round(v/T*100):0}%</td></tr>`}).join('')||'<tr><td class="muted">No spending in this period.</td></tr>'}</table>
 <h2>Biggest details</h2><table>${groupSum(out,t=>subOf(t)||(cat(t.cat)||{}).name).slice(0,10).map(([n,v])=>row(n,num(v))).join('')}</table>
 ${S.cats.some(c=>c.budget)&&(S.ui.report||'monthly')==='monthly'?`<h2>Budget check</h2><table><tr><th>Category</th><th class="r">Limit</th><th class="r">Spent</th></tr>${S.cats.filter(c=>c.budget).map(c=>`<tr><td>${esc(c.name)}</td><td class="r">${num(c.budget)}</td><td class="r ${catSpent(c.id)>c.budget?'bad':''}">${num(catSpent(c.id))}</td></tr>`).join('')}</table>`:''}
 <h2>Accounts today</h2><table>${S.accounts.map(x=>row(x.name+((x.advUsed||x.loanOwed)?` (owes ${fmtNum((x.advUsed||0)+(x.loanOwed||0),x.currency)})`:''),money(x.bal,x.currency))).join('')}</table>
 ${S.bills.filter(x=>x.status!=='paid').length?`<h2>Bills coming up</h2><table>${S.bills.filter(x=>x.status!=='paid').sort((p,q)=>p.due.localeCompare(q.due)).slice(0,10).map(x=>row(`${x.name} · ${shortDate(x.due)}`,ugx(x.amt))).join('')}</table>`:''}
 ${S.goals.length?`<h2>Savings goals</h2><table>${S.goals.map(g=>row(`${g.name} · by ${shortDate(g.date)}`,`${num(g.saved)} of ${num(g.target)}`)).join('')}</table>`:''}
 <h2>Transactions</h2><table><tr><th>Date</th><th>Description</th><th>Category</th><th class="r">Amount</th></tr>${tx.slice(-120).map(t=>`<tr><td>${t.d.slice(0,10)}</td><td>${esc(t.title)}</td><td class="muted">${esc(t.kind==='out'?(subOf(t)||(cat(t.cat)||{}).name||''):kindName(t))}</td><td class="r">${effOf(t)>0?'+':'−'}${esc(num(t.amt))}</td></tr>`).join('')}</table>
 ${tx.length>120?`<p class="muted">Showing the last 120 of ${tx.length} transactions. The Excel export has all of them.</p>`:''}
 <p class="muted" style="margin-top:20px">Made with Kasente on ${new Date().toLocaleDateString()}. Figures come from what was logged on this phone.</p></body></html>`}
function exportPdf(){const html=reportHtml();if(NATIVE&&NATIVE.printHtml){try{NATIVE.printHtml('Kasente report '+ymd(TODAY0),html);toast('Choose "Save as PDF" as the printer, then tap the download button.','down');return}catch(e){}}
 openSheet('Report preview',`<iframe title="Report" srcdoc="${esc(html)}" style="width:100%;height:60vh;border:1px solid var(--line);border-radius:12px;background:#fff"></iframe><p class="xs muted" style="margin-top:8px">In the Android app this opens the print screen, where "Save as PDF" makes the file.</p>`)}
ACT.exportR=k=>{if(k==='PDF')return exportPdf();if(k==='CSV')return saveOut(`kasente-transactions-${ymd(TODAY0)}.csv`,'text/csv',toCSV2());return exportExcel()};
const toCSV2=()=>{const q=v=>`"${String(v).replace(/"/g,'""')}"`;return ['Date,Time,Account,Type,Category,Detail,For,Description,Amount ('+CUR()+'),Source'].concat(S.txns.slice().sort((a,b)=>pd(a.d)-pd(b.d)).map(t=>[t.d.slice(0,10),t.d.slice(11),(acct(t.acct)||{}).name||'',kindName(t),t.kind==='out'?(cat(t.cat)||{}).name||'':catOf(t).name,subOf(t)||'',t.kind==='out'?forName(t):'',t.title,effOf(t)>0?t.amt:-t.amt,srcTag(t.src)].map(q).join(','))).join('\n')};
const baseOpenReport2=openReport;openReport=function(k){baseOpenReport2(k);const g=document.querySelector('.sheet-body .grid2:last-child');if(g&&g.querySelector('[data-arg="Excel"]'))g.insertAdjacentHTML('afterend',`<button class="btn block" style="margin-top:10px" data-act="exportR" data-arg="CSV">${ic('down',18)}CSV (simple list)</button>`)};

/* ---------- settings additions ---------- */
const rateAge=()=>S.rates&&S.rates.at?timeAgo(S.rates.at):'built-in approximate rates';
ACT.updateRates=async()=>{if(!NATIVE||!NATIVE.fetchRates){toast('Live rates work in the Android app.','info');return}toast('Getting today\'s rates…','trend');
 const r=await new Promise(res=>{const id='fx'+Date.now();cloudWait[id]=res;try{NATIVE.fetchRates(id)}catch(e){delete cloudWait[id];res({ok:false})}setTimeout(()=>{if(cloudWait[id]){delete cloudWait[id];res({ok:false})}},25000)});
 let d=null;try{d=JSON.parse(r.text)}catch(e){}if(!r.ok||!d||!d.rates){toast("Couldn't get rates. Check your internet connection.",'alert');return}
 S.rates={perUsd:d.rates,at:Date.now()};S.accounts.forEach(a=>{if(a.currency!==CUR())a.rate=Math.round(rateOf(a.currency)*10000)/10000});refresh();toast('Exchange rates updated','trend')};
ACT.saveAiKey=()=>{const v=($('#aiKey')||{}).value||'';if(!/^sk-ant-/.test(v.trim())){toast('That doesn\'t look like a Claude API key. It starts with sk-ant-.','alert');return}try{NATIVE.setAiKey(v.trim());S.settings.useClaude=true;refresh();toast('Claude advisor switched on','sparkle')}catch(e){toast("Couldn't save the key.",'alert')}};
ACT.removeAiKey=()=>{try{NATIVE.setAiKey('')}catch(e){}refresh();toast('Key removed. The advisor works on the phone again.')};
LIVE.setCountry=el=>{const c=COUNTRIES.find(x=>x[0]===el.value);S.settings.country=el.value;if(c&&S.accounts.every(a=>!a.bal)&&!S.txns.length)S.settings.currency=c[2];refresh();toast(`Country set to ${c?c[1]:el.value}`)};
LIVE.setCurrency=el=>{const old=S.settings.currency;S.settings.currency=el.value;S.accounts.forEach(a=>{if(a.currency===old){a.currency=el.value;a.rate=null}});refresh();toast(`Main currency is now ${el.value}. Amounts are relabelled, not converted.`,'info')};
LIVE.setLang=el=>{S.settings.lang=el.value;refresh();if(window.i18nApply)i18nApply(document.getElementById('phone'))};
const baseSettings3=SCREENS.settings;
SCREENS.settings=()=>{let h=baseSettings3();const s=S.settings;const hasKey=(()=>{try{return NATIVE&&NATIVE.hasAiKey&&NATIVE.hasAiKey()}catch(e){return false}})();const foreign=S.accounts.filter(a=>a.currency!==CUR());
 const region=`<div class="sec-head"><h2>Country, currency and language</h2></div><div class="card stack">
  <div class="grid2"><label class="field"><span>Country</span><select data-live="setCountry">${countryOptions(s.country)}</select></label><label class="field"><span>Main currency</span><select data-live="setCurrency">${curOptions(s.currency)}</select></label></div>
  <label class="field"><span>Language</span><select data-live="setLang">${langOptions(s.lang)}</select></label>
  <p class="xs muted">Kiswahili and Français cover most screens; some longer texts are still in English. Translations will be checked by native speakers before launch.</p>
  <div class="between"><span class="small"><b>Exchange rates</b><br><span class="muted xs">${rateAge()}</span></span><button class="btn sm" data-act="updateRates">${ic('trend',16)}Update</button></div>
  ${foreign.length?foreign.map(a=>`<div class="between xs"><span>${esc(a.name)}</span><span class="tnum">1 ${a.currency} = ${fmtNum(acctRate(a))} ${CUR()}</span></div>`).join(''):'<p class="xs muted">Add an account in another currency under Accounts, for example a Kenyan M-Pesa line or a dollar account.</p>'}</div>`;
 const adv=`<div class="sec-head"><h2>Advisor</h2></div><div class="card stack" style="gap:10px">${hasKey?`<div class="between"><span class="small"><b>Claude advisor is on</b><br><span class="xs muted">Questions and reviews use your own Claude API key</span></span><button class="toggle ${s.useClaude!==false?'on':''}" data-act="toggle" data-arg="useClaude" aria-label="Use Claude"></button></div><button class="btn sm" data-act="removeAiKey">Remove key</button>`
  :`<p class="small">For testing, you can connect the advisor to Claude with your own API key from console.anthropic.com. Only an anonymised summary is sent: totals by category, no names, numbers or transactions.</p>${NATIVE&&NATIVE.setAiKey?`<label class="field"><span>Claude API key</span><input id="aiKey" type="password" autocomplete="off" placeholder="sk-ant-…"></label><button class="btn sm primary" data-act="saveAiKey">Save key</button>`:'<p class="xs muted">Available in the Android app.</p>'}<p class="xs muted">The key is kept in the app's private storage on this phone, not in backups or OneDrive. A public version will use a Kasente server instead, so people don't need their own key.</p>`}</div>`;
 const exp=`<div class="sec-head"><h2>Export</h2></div><div class="list"><button class="setrow" data-act="exportR" data-arg="Excel"><span class="grow"><b>Excel workbook</b><span>Transactions, accounts, budgets, bills, loans, goals and assets</span></span>${ic('down',18)}</button><button class="setrow" data-act="exportR" data-arg="PDF"><span class="grow"><b>PDF report</b><span>This pay cycle, ready to print or send</span></span>${ic('down',18)}</button><button class="setrow" data-act="exportR" data-arg="CSV"><span class="grow"><b>CSV list</b><span>Simple list that opens anywhere</span></span>${ic('down',18)}</button></div>`;
 h=h.replace(/<label class="field"><span>Language<\/span><select data-live="lang">[\s\S]*?<\/select><\/label>/,'');
 const at=h.indexOf('<div class="sec-head"><h2>Pay cycle</h2></div>');h=at>=0?h.slice(0,at)+region+h.slice(at):h+region;
 const at2=h.indexOf('<div class="sec-head"><h2>Notifications</h2></div>');h=at2>=0?h.slice(0,at2)+adv+exp+h.slice(at2):h+adv+exp;
 return h};
const baseToggle3=ACT.toggle;ACT.toggle=a=>{if(a==='useClaude'){S.settings.useClaude=S.settings.useClaude===false;refresh();return}baseToggle3(a)};
const baseSwitch=ACT.switchYes;ACT.switchYes=to=>{const lang=S.settings.lang;baseSwitch(to);if(to==='sample'){S.settings.lang=lang;kasenteMigrate(true);refresh()}};

/* ---------- notifications include message alerts ---------- */
const baseCompute=computeNotifs;computeNotifs=function(){const rd=S.readN||[];return[...(S.alerts||[]).map(a=>({...a,when:dlabel(new Date(a.when)),read:rd.includes(a.id)})),...baseCompute()]};

/* ---------- WhatsApp preview understands every format ---------- */
const baseWa=waReply;waReply=function(q){if(isFresh()&&/(sent|paid|received|withdr|confirmed|debited|credited)/i.test(q)&&smsAmounts(q).length){const r=readMoneySms(q,'');if(!r)return "I couldn't read that message. Forward the full confirmation.";const n=applySms(r);return n?`Logged ✓ <b>${money(r.amt,r.cur)}</b> · ${r.type} · ${esc(r.providerName)}${r.fee?`<br>Fee of ${money(r.fee,r.cur)} logged too.`:''}`:'Nothing to log.'}return baseWa(q)};

/* ---------- top bar, home, more ---------- */
const baseTopbar=topbar;topbar=function(c){let h=baseTopbar(c);if(c==='home'&&S.mode)h=h.replace('<div class="top-actions">',`<div class="top-actions"><button class="icon-btn" data-go="profile" aria-label="My money profile" style="font-weight:800;font-size:13px;color:var(--accent)">${initials(S.user&&S.user.name)}</button>`).replace(`<button class="icon-btn" data-act="lockNow" aria-label="Lock app">${ic('lock')}</button>`,'');return h};
const baseHome=SCREENS.home;SCREENS.home=()=>{let h=baseHome();h=h.replace('<small>UGX</small>',`<small>${CUR()}</small>`);
 const r0=h.indexOf('<div class="rail">'),r1=h.indexOf('<div class="quick">');
 if(r0>=0&&r1>r0)h=h.slice(0,r0)+`<div class="rail">${S.accounts.map(a=>{const debt=(a.advUsed||0)+(a.loanOwed||0);return `<button class="acct" data-act="acct" data-arg="${a.id}"><span class="acct-head">${acctBadge(a,30)}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</span></span><span class="acct-type">${esc(KIND_LABEL[a.kind]||'')}${a.currency!==CUR()?' · '+a.currency:''}</span><span class="acct-bal ${acctReads(a)<0?'liab':''}">${signedNum(acctReads(a),a.currency)}</span>${advLine(a)?`<span class="xs ${a.advUsed?'liab':'muted'}" style="font-weight:600">${advLine(a)}</span>`:a.loanOwed?`<span class="xs liab" style="font-weight:600">Loan ${fmtNum(a.loanOwed,a.currency)}</span>`:`<div style="margin-top:6px">${spark(acctHist(a,14),130,22,'var(--accent)')}</div>`}</button>`}).join('')}<button class="acct add" data-act="addAccount">${ic('plus')}Add account</button></div>\n `+h.slice(r1);
 const s0=h.indexOf('</section>');if(s0>=0&&S.mode)h=h.slice(0,s0+10)+streakCard()+h.slice(s0+10);
 const advA=S.accounts.filter(a=>a.advUsed>0);if(advA.length){const i=h.indexOf('<div class="sec-head"><h2>Accounts</h2>');if(i>=0)h=h.slice(0,i)+advA.map(a=>`<button class="note warn" data-act="acct" data-arg="${a.id}" style="text-align:left">${ic('hand')}<span class="grow small"><b>${esc(a.name)} advance: ${money(a.advUsed,a.currency)} owed.</b> The next ${money(a.advUsed,a.currency)} you receive goes to repaying it first.</span></button>`).join('')+h.slice(i)}
 return h};
SCREENS.more=()=>{const late=S.bills.filter(b=>b.status!=='paid'&&daysUntil(b.due)<0).length,soon=S.bills.filter(b=>b.status!=='paid'&&daysUntil(b.due)>=0&&daysUntil(b.due)<=7).length;const over=S.cats.filter(c=>c.budget&&catSpent(c.id)>c.budget).length;const g=G();
 const T=(go,icn,t,s,em,act)=>`<button class="tile" ${act?`data-act="${act}"`:`data-go="${go}"`}><span class="tile-ic">${ic(icn)}</span><b>${t}</b><span>${s}</span>${em?`<em>${em}</em>`:''}</button>`;
 return `<div class="sec-head" style="margin-top:0"><h2>You</h2></div>
 <div class="tiles">${T('profile','wallet','My money profile','Net worth, debts, assets, wellness score','')}${T('rewards','bolt','Streaks & rewards',`${g.streak||0}-day streak · ${g.points} points`,'')}${T('accounts','house','Accounts','Mobile money, banks, cash, SACCO',providerDebt()?'Advance or loan owed':'')}${T('family','people','Family & household',S.household?esc(S.household.name):'Personal and household spending','')}</div>
 <div class="sec-head"><h2>Money</h2></div>
 <div class="tiles">${T('spending','chart','Spending','Where the money goes, clearly','')}${T('budgets','target','Budgets','Monthly limits per category',over?`${over} over budget`:'')}${T('bills','calendar','Bills','Rent, utilities, school fees',`${late?late+' late · ':''}${soon} due this week`)}${T('goals','piggy','Savings goals','Progress to each goal','')}${T('lending','hand','Lending','Who owes you, who you owe','')}${T('invest','trend','Investments','SACCO, T-bills, unit trusts, NSSF','')}</div>
 <div class="sec-head"><h2>Learn and report</h2></div>
 <div class="tiles">${T('','book','Learn','Lessons and books on money','','openLearn')}${T('analytics','chart','Analytics & reports','Charts, Excel and PDF','')}</div>
 <div class="sec-head"><h2>Capture</h2></div>
 <div class="tiles">${T('scan','receipt','Scan a receipt','Photo to expense, read on the phone','')}${T('','sms','SMS reader','Test how messages are read','','smsTest')}${T('whatsapp','whatsapp','WhatsApp bot','Preview of the coming bot','')}${T('transport','bike','Transport fares','Boda and taxi price check','')}</div>
 <div class="sec-head"><h2>App</h2></div>
 <div class="list"><button class="setrow" data-go="settings"><span class="chip sm" style="--c:var(--accent)">${ic('gear',18)}</span><span class="grow"><b>Settings & privacy</b><span>Country, currency, language, lock, backup, export</span></span>${ic('chev',16)}</button><button class="setrow" data-act="lockNow"><span class="chip sm" style="--c:var(--accent)">${ic('lock',18)}</span><span class="grow"><b>Lock Kasente now</b><span>PIN or fingerprint to open</span></span>${ic('chev',16)}</button><button class="setrow" data-act="onboard"><span class="chip sm" style="--c:var(--accent)">${ic('sparkle',18)}</span><span class="grow"><b>Replay the welcome tour</b><span>The first screens again</span></span>${ic('chev',16)}</button></div>`};
ACT.openLearn=()=>{S.ui.adv='learn';go('advisor')};
const baseTransport=SCREENS.transport;SCREENS.transport=()=>(country()[0]!=='UG'?`<div class="note">${ic('info')}<span class="small">The fare reference covers Uganda for now. Add the routes you use in your city with "Add route" and Kasente will check your fares against them.</span></div>`:'')+baseTransport();
const baseInvest3=SCREENS.invest;SCREENS.invest=()=>`<div class="note">${ic('sms')}<span class="small">Kasente picks up confirmation messages from Xeno, NSSF, unit trust managers and similar, updates the holding and lets you know.</span></div>`+baseInvest3();

/* ---------- render, start-up and resume ---------- */
const baseRender3=window.render;
window.render=function(keep){baseRender3(keep);const c=cur();if(c==='activity'){document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav==='spending'))}if(S.mode&&!render._chk){render._chk=1;setTimeout(()=>{render._chk=0;gameChecks()},2000)}};
const baseBoot=window.kasenteBoot;window.kasenteBoot=function(){baseBoot();if(S.mode){gameOpen();save()}setTimeout(()=>{if(window.kasenteReceiptReady)kasenteReceiptReady()},600);if(SCAN&&S.mode&&!$('#onb').hidden===false&&cur()!=='scan'&&SCAN.status!=='reading'&&(SCAN.items||[]).some(x=>x[0]||x[1]))toast('You have an unsaved receipt. Open More → Scan a receipt to finish it.','receipt')};
const baseResume3=window.kasenteOnResume;window.kasenteOnResume=away=>{baseResume3(away);if(S.mode){const k=ymd(TODAY0);if(!(G().days[k]||{}).o){gameOpen();refresh()}}};
