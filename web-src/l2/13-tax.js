/* ===== Build 4 · Tax guide for Uganda (tax year 1 July 2026 – 30 June 2027) =====
   Estimates only. Rates from the Income Tax Act (Cap. 338) as amended by the Income Tax (Amendment) Act 2026,
   the VAT (Amendment) Act 2026 and URA guidance on presumptive tax. Review every July when the Finance Acts change. */
const TAX_YEAR='2026/27';
/* resident individual rates, annual chargeable income (employment, business profit of a sole proprietor) */
function indivTax(y){y=Math.max(0,y);let t=0;
 if(y<=4020000)t=0;else if(y<=4920000)t=(y-4020000)*.2;else if(y<=5820000)t=180000+(y-4920000)*.25;else t=405000+(y-5820000)*.3;
 if(y>120000000)t+=(y-120000000)*.1;return Math.round(t)}
const payeMonth=m=>Math.round(indivTax(m*12)/12);
const rentalTax=g=>Math.round(Math.max(0,g-2820000)*.12);
/* presumptive tax for small businesses, turnover up to UGX 150M; final tax, no deductions */
const PRES=[[10e6,30e6,0,.004,80000],[30e6,50e6,80000,.005,200000],[50e6,80e6,180000,.006,400000],[80e6,150e6,360000,.007,900000]];
function presTax(turn,records){if(turn<=10e6)return 0;const r=PRES.find(([lo,hi])=>turn>lo&&turn<=hi);if(!r)return null;return records?Math.round(r[2]+(turn-r[0])*r[3]):r[4]}
const PROF_SECTORS=['professional','legal','health','tech'];
const VAT_LIMIT=300e6;

/* turnover and profit for the tax year so far, and a full-year projection */
function bizTaxYear(b){const from=taxYearStart(),now=plusDays(TODAY0,1);const p=bizPeriod(b,from,now);const days=Math.max(1,Math.round((now-from)/DAY));
 const f=days<30?0:365/days;const tx=b.tax||{};
 const turn=+tx.turnover||(f?Math.round(p.sales*f):p.sales);const profit=tx.turnover?Math.round(turn*(p.sales?p.profit/p.sales:.3)):(f?Math.round(p.profit*f):p.profit);
 return{p,days,turn,profit,projected:!!f&&!tx.turnover,manual:!!tx.turnover}}

/* which rules apply to one business, and the estimate */
function bizTax(b){const y=bizTaxYear(b);const tx=b.tax||{};const prof=PROF_SECTORS.includes(b.sector);const out={y,lines:[],notes:[],exempt:[],regime:'',tax:0};
 const vatOut=(b.invoices||[]).filter(i=>i.vat&&!['draft','void'].includes(i.status)&&pd(i.date+' 00:00')>=taxYearStart()).reduce((s,i)=>s+invSum(i).vat,0);
 if(b.sector==='rental'&&b.structure!=='company'){out.regime='Rental income tax (individual)';out.tax=rentalTax(y.turn);out.lines.push(['Rent received in the year',y.turn],['Tax-free amount',-Math.min(y.turn,2820000)],['12% of the rest',out.tax]);out.notes.push('Individuals pay 12% on gross rent above UGX 2,820,000 a year. Expenses are not deducted. Rental income is taxed on its own, apart from other income.')}
 else if(tx.newExempt){out.regime='Exempt: new business (first 3 years)';out.tax=0;out.exempt.push('New business owned by Ugandan citizens, registered from 1 July 2025 with capital up to UGX 500M: exempt for 3 years if the conditions are met (for example, returns still have to be filed). Confirm you qualify with URA.')}
 else if(b.sector==='other'&&tx.sacco){out.regime='Exempt: SACCO';out.tax=0;out.exempt.push('SACCO income is exempt until 30 June 2027 for qualifying SACCOs.')}
 else if(b.structure==='company'){out.regime='Corporation tax, 30% of profit';out.tax=Math.round(Math.max(0,y.profit)*.3);out.lines.push(['Expected profit for the year',y.profit],['30%',out.tax]);out.notes.push('A company pays 30% on its chargeable income (profit after allowable expenses and capital allowances). It pays provisional tax in two instalments, by the 6th and 12th month of its year. Money you take out as dividends then has 15% withheld.')}
 else{const canPres=!prof&&y.turn<=150e6&&!tx.normal;const pres=presTax(y.turn,b.records);const share=b.structure==='partnership'?Math.max(1,+tx.partners||2):1;const normal=indivTax(Math.max(0,y.profit)/share)*share;
  if(canPres){out.regime=y.turn<=10e6?'Presumptive tax: below the threshold':'Presumptive tax (small business)';out.tax=pres;
   out.lines.push(['Expected turnover for the year',y.turn],[b.records?'Tax with proper records':'Tax without records',pres]);
   out.notes.push('Presumptive tax is a final tax on turnover between UGX 10M and 150M. No expenses are deducted and it can\'t be reduced by tax withheld.');
   if(!b.records)out.notes.push('Keeping proper records (Kasente counts) usually gives a lower figure. Tick "I keep proper records" in business settings once you do.');
   if(normal<pres)out.notes.push(`On your profit, normal individual rates would come to about ${money(normal)}. You can choose to be taxed on profit instead; tell URA when filing.`)}
  else{out.regime=(b.structure==='partnership'?'Partners taxed on their shares':'Individual rates on business profit');out.tax=normal;
   out.lines.push(['Expected profit for the year',y.profit]);if(share>1)out.lines.push([`Split between ${share} partners`,Math.round(y.profit/share)]);out.lines.push(['Tax at individual rates',normal]);
   if(prof)out.notes.push('Professional services (legal, medical, accounting, engineering, IT consulting and similar) can\'t use presumptive tax, so profit is taxed at individual rates.');
   if(!prof&&y.turn>150e6)out.notes.push('Turnover above UGX 150M is outside presumptive tax.');
   out.notes.push('This adds the business profit on its own. If you also have a salary, the two are added together and taxed as one income, which can push part of it into a higher band.')}
  if(prof)out.notes.push('Clients that are withholding agents (government bodies, banks, larger companies) deduct 6% of your fee and give you a certificate. Under normal rates that 6% counts against your tax, so keep the certificates.')}
 if(y.turn>VAT_LIMIT&&!b.vat)out.notes.unshift(`Your turnover is heading past UGX 300M a year. You must register for VAT within 20 days of crossing it.`);
 else if(y.turn>VAT_LIMIT*.8&&!b.vat)out.notes.push('You are close to the VAT threshold of UGX 300M a year. Plan for registration.');
 if(b.vat){out.vatOut=vatOut;out.notes.push(`VAT charged on invoices this tax year: ${money(vatOut)}. Pay it to URA by the 15th of the next month, less VAT you paid on business purchases (keep the EFRIS invoices).`)}
 if(b.sector==='manufacturing'||tx.export)out.exempt.push('Exporters of finished consumer or capital goods may be exempt if at least 80% of production is exported (licence and conditions apply).');
 if(y.turn<=10e6)out.exempt.push('Turnover up to UGX 10M a year: no income tax under the presumptive regime.');
 return out}
window.bizTaxCard=b=>{if(country()[0]!=='UG')return '';const t=bizTax(b);return `<button class="card stack" data-act="openTax" data-arg="biz|${b.id}" style="gap:6px;text-align:left;width:100%"><div class="between"><b>Tax estimate ${TAX_YEAR}</b><b class="tnum">${money(t.tax)}</b></div><span class="xs muted">${esc(t.regime)}${t.y.projected?' · projected from sales so far':''} · Tap for details</span></button>`};

/* ---------- personal ---------- */
function personalTax(){const s=S.taxMe||{};const sal=+s.salary||0,rent=+s.rent||0;const paye=payeMonth(sal);
 const bizSole=(S.businesses||[]).filter(b=>b.structure==='sole'&&b.sector!=='rental');
 const soleNormal=bizSole.filter(b=>{const t=bizTax(b);return /Individual rates/.test(t.regime)});const soleProfit=soleNormal.reduce((x,b)=>x+Math.max(0,bizTaxYear(b).profit),0);
 const combined=soleProfit?indivTax(sal*12+soleProfit)-indivTax(sal*12):0;
 return{sal,rent,paye,payeY:paye*12,rentT:rentalTax(rent),soleProfit,combined,total:paye*12+rentalTax(rent)+combined}}

/* ---------- deadlines ---------- */
function taxDeadlines(){const y0=taxYearStart().getFullYear();const L=[];
 const hasBiz=(S.businesses||[]).length,hasCo=(S.businesses||[]).some(b=>b.structure==='company'),hasVat=(S.businesses||[]).some(b=>b.vat),hasStaff=!!(S.taxMe&&S.taxMe.employer);
 [[`${y0}-09-30`,'1st'],[`${y0}-12-31`,'2nd'],[`${y0+1}-03-31`,'3rd'],[`${y0+1}-06-30`,'4th']].forEach(([d,n])=>{if(hasBiz||(S.taxMe&&+S.taxMe.rent))L.push([d,`Provisional tax, ${n} instalment (individuals)`,'If you expect business or rental income'])});
 if(hasCo){L.push([`${y0}-12-31`,'Provisional tax, 1st instalment (companies)','Half of the year\'s estimated tax']);L.push([`${y0+1}-06-30`,'Provisional tax, 2nd instalment (companies)','The balance of the estimate'])}
 L.push([`${y0}-12-31`,`Income tax return for ${y0-1}/${String(y0).slice(2)}`,'Individuals, partnerships and companies with a June year end']);
 L.push([`${y0}-10-31`,'Local Service Tax','Employers remit LST deducted from staff']);
 for(let k=0;k<3;k++){const d=new Date(TODAY0.getFullYear(),TODAY0.getMonth()+k,15);const due=ymd(d);
  if(hasStaff||hasBiz)L.push([due,'PAYE, withholding tax and NSSF for last month','Due by the 15th · NSSF is 15% of gross pay (5% staff, 10% employer)']);
  if(hasVat)L.push([due,'VAT return and payment','Due by the 15th of the next month'])}
 return L.filter(x=>pd(x[0]+' 23:59')>=TODAY0).sort((a,b)=>a[0].localeCompare(b[0]))}

/* ---------- screen ---------- */
TITLES.tax='Tax guide';
const taxRow=(l,v,cls)=>`<tr class="${cls||''}"><td>${l}</td><td class="r">${signedNum(v,'UGX')}</td></tr>`;
SCREENS.tax=()=>{const tab=S.ui.taxTab||'me';const ug=country()[0]==='UG';
 const tabs=`<div class="tabbar">${[['me','Personal'],['biz','Business'],['dates','Deadlines'],['free','Exemptions']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="taxTab" data-arg="${k}">${l}</button>`).join('')}</div>`;
 const warn=ug?'':`<div class="note warn">${ic('alert')}<span class="small">This guide uses Uganda's tax law. Rules for ${esc(country()[1])} are coming; until then, treat these figures as an illustration only.</span></div>`;
 let body='';
 if(tab==='me'){const s=S.taxMe||{};const t=personalTax();
  body=`<form class="card stack" data-form="taxMe" style="gap:10px"><b>Your income</b>
   <label class="field"><span>Monthly salary before tax (gross)</span><input name="salary" type="number" min="0" step="any" value="${s.salary||''}" placeholder="0"></label>
   <label class="field"><span>Rent you receive in a year, if any</span><input name="rent" type="number" min="0" step="any" value="${s.rent||''}" placeholder="0"></label>
   <label class="row small" style="gap:8px"><input type="checkbox" name="employer" ${s.employer?'checked':''}> I employ staff (house help, shop attendants…)</label>
   <button class="btn primary">Work it out</button></form>
  ${t.sal||t.rent||t.soleProfit?`<div class="card"><b>Estimated tax · ${TAX_YEAR}</b><table class="bs" style="width:100%;border-collapse:collapse;margin-top:6px">
   ${t.sal?taxRow('PAYE per month (your employer deducts it)',t.paye)+taxRow('PAYE for the year',t.payeY):''}
   ${t.rent?taxRow('Rental income tax (12% above 2.82M)',t.rentT):''}
   ${t.soleProfit?taxRow('Extra tax on business profit added to salary',t.combined):''}
   ${taxRow('Total for the year',t.total,'t')}</table>
   ${t.sal?`<p class="xs muted" style="margin-top:8px">Take-home after PAYE and 5% NSSF: about <b>${money(t.sal-t.paye-Math.round(t.sal*.05))}</b> a month. ${t.sal<=335000?'Up to UGX 335,000 a month is tax free, so you pay no PAYE.':''}</p>`:''}</div>`:''}
  <details class="card" style="padding:12px 16px"><summary class="small" style="cursor:pointer;font-weight:600">How PAYE is worked out (from 1 July 2026)</summary><table class="bs small" style="width:100%;margin-top:8px">
   <tr class="h"><td>Monthly income</td><td class="r">Tax</td></tr><tr><td>Up to 335,000</td><td class="r">Nil</td></tr><tr><td>335,001 – 410,000</td><td class="r">20% of the amount above 335,000</td></tr><tr><td>410,001 – 485,000</td><td class="r">15,000 + 25% above 410,000</td></tr><tr><td>Above 485,000</td><td class="r">33,750 + 30% above 485,000</td></tr><tr><td>Above 10,000,000</td><td class="r">plus 10% on the amount above 10M</td></tr></table></details>`}
 if(tab==='biz'){const L=S.businesses||[];
  body=L.length?L.map(b=>{const t=bizTax(b);const y=t.y;return `<div class="card stack bizwrap" style="gap:8px;${bizVars(b)}"><div class="row" style="gap:10px"><span class="lg" style="width:36px;height:36px">${bizLogo(b)}</span><div class="grow"><b>${esc(b.name)}</b><div class="xs muted">${esc(STRUCT[b.structure]||'')} · ${esc(SECTORS[b.sector]?.n||'')}</div></div><b class="tnum">${money(t.tax)}</b></div>
   <span class="pill" style="align-self:flex-start">${esc(t.regime)}</span>
   <table class="bs small" style="width:100%;border-collapse:collapse">${t.lines.map(([l,v],k)=>taxRow(esc(l),v,k===t.lines.length-1?'t':'')).join('')}</table>
   <p class="xs muted">${y.manual?'Using the yearly turnover you entered.':y.projected?`Projected from ${y.days} days of records this tax year (sales so far ${money(y.p.sales)}).`:'Based on records so far; the estimate firms up after a month.'}</p>
   ${t.notes.map(n=>`<div class="note">${ic('info')}<span class="small">${esc(n)}</span></div>`).join('')}
   ${t.exempt.map(n=>`<div class="note good">${ic('check')}<span class="small">${esc(n)}</span></div>`).join('')}
   <button class="btn sm" data-act="taxBizQ" data-arg="${b.id}">${ic('gear',16)}Answer a few questions to refine this</button></div>`}).join('')
  :`<div class="card stack" style="gap:10px"><b>No businesses yet</b><p class="small muted">Add a business to see its tax: presumptive tax for small traders, individual rates for professionals, 30% for companies, and VAT.</p><button class="btn primary" data-act="addBiz">${ic('plus')}Add a business</button></div>`}
 if(tab==='dates'){const L=taxDeadlines();
  body=`<div class="list">${L.map(([d,t,s])=>`<div class="setrow"><span class="chip" style="--c:${daysUntil(d)<=14?'var(--bad)':'var(--accent)'}">${ic('calendar')}</span><span class="grow"><b>${esc(t)}</b><span>${dlabel(d)} · ${esc(s)}</span></span></div>`).join('')}</div>
  <button class="btn primary block" data-act="taxToBills">${ic('bell')}Add these to my bills and reminders</button>
  <p class="xs muted">Returns and payments are made on the URA portal (ura.go.ug). Late filing and payment attract penalties and interest.</p>`}
 if(tab==='free'){const e=(t,s)=>`<div class="setrow"><span class="chip" style="--c:var(--good)">${ic('check')}</span><span class="grow"><b>${t}</b><span>${s}</span></span></div>`;
  body=`<div class="sec-head" style="margin-top:0"><h2>For you</h2></div><div class="list">
   ${e('Income up to UGX 335,000 a month','Employment income in the first band (UGX 4.02M a year) is not taxed.')}
   ${e('Medical cover from your employer','Medical benefits an employer provides are not a taxable benefit.')}
   ${e('Employer pension contributions','Employer contributions to a retirement fund (including NSSF) are not taxed as your income.')}
   ${e('Long-service gratuity','25% of gratuity is exempt after 10 years or more with the same employer.')}
   ${e('NSSF and pension payouts','Benefits paid out by NSSF and approved retirement funds are exempt.')}
   ${e('Rent up to UGX 2.82M a year','Individuals pay no rental tax on the first UGX 2,820,000 of rent a year.')}</div>
  <div class="sec-head"><h2>For businesses</h2></div><div class="list">
   ${e('Turnover up to UGX 10M a year','No income tax under the presumptive regime.')}
   ${e('New citizen-owned businesses','Registered from 1 July 2025, capital up to UGX 500M: exempt for 3 years (conditions apply).')}
   ${e('SACCOs','Qualifying SACCO income is exempt until 30 June 2027.')}
   ${e('Exporters','Exporters of finished goods with at least 80% exported may qualify for an exemption.')}
   ${e('VAT threshold UGX 300M','You only register for VAT once turnover passes UGX 300M a year (from 1 July 2026).')}
   ${e('Mobile money and telecom agents','Commission has 10% withheld as a final tax; no further income tax on it.')}</div>
  <p class="xs muted">Most exemptions have conditions. Check with URA or a tax adviser before relying on one.</p>`}
 return `${warn}${tabs}${body}<div class="note" style="margin-top:12px">${ic('shield')}<span class="xs">An estimate to help you plan, based on the Income Tax Act as amended for ${TAX_YEAR}, the VAT (Amendment) Act 2026 and URA guidance. It is not tax advice. Your actual tax depends on your full circumstances.</span></div>`};
ACT.taxTab=k=>{S.ui.taxTab=k;refresh()};
ACT.openTax=a=>{const[k,id]=(a||'me').split('|');S.ui.taxTab=k||'me';go('tax')};
FORMS.taxMe=fd=>{S.taxMe={salary:+fd.get('salary')||0,rent:+fd.get('rent')||0,employer:!!fd.get('employer')};refresh();toast('Estimate updated','check')};
ACT.taxBizQ=id=>{const b=biz(id);const t=b.tax||{};const prof=PROF_SECTORS.includes(b.sector);
 openSheet(`Tax questions · ${esc(b.name)}`,`<form class="stack" data-form="taxBiz" data-id="${id}" style="gap:10px">
  <label class="field"><span>Expected turnover (sales) for the whole year, if you know it</span><input name="turnover" type="number" min="0" step="any" value="${t.turnover||''}" placeholder="Leave empty to use your records"></label>
  <label class="row small" style="gap:8px"><input type="checkbox" name="records" ${b.records?'checked':''}> I keep proper books (sales, expenses, receipts)</label>
  ${b.structure==='partnership'?`<label class="field"><span>Number of partners</span><input name="partners" type="number" min="2" value="${t.partners||2}"></label>`:''}
  ${b.structure==='sole'&&!prof?`<label class="row small" style="gap:8px"><input type="checkbox" name="normal" ${t.normal?'checked':''}> I chose to be taxed on profit, not presumptive tax</label>`:''}
  <label class="row small" style="gap:8px"><input type="checkbox" name="newExempt" ${t.newExempt?'checked':''}> Registered from 1 July 2025, owned by Ugandan citizens, capital under UGX 500M</label>
  <label class="row small" style="gap:8px"><input type="checkbox" name="export" ${t.export?'checked':''}> At least 80% of what we make is exported</label>
  ${b.sector==='other'?`<label class="row small" style="gap:8px"><input type="checkbox" name="sacco" ${t.sacco?'checked':''}> This is a registered SACCO</label>`:''}
  <button class="btn primary">Update estimate</button></form>`)};
FORMS.taxBiz=(fd,f)=>{const b=biz(f.dataset.id);b.records=!!fd.get('records');b.tax={turnover:+fd.get('turnover')||0,partners:+fd.get('partners')||2,normal:!!fd.get('normal'),newExempt:!!fd.get('newExempt'),export:!!fd.get('export'),sacco:!!fd.get('sacco')};closeSheet();refresh();toast('Estimate updated','check')};
ACT.taxToBills=()=>{let n=0;taxDeadlines().forEach(([d,t])=>{if(S.bills.some(x=>x.name===t&&x.due===d))return;S.bills.push({id:nid('b'),name:t,kind:'Other',ic:'calendar',amt:0,due:d,status:'due',note:'Tax deadline'});n++});
 if(typeof scheduleReminders==='function')scheduleReminders();refresh();toast(n?`${n} tax ${n>1?'deadlines':'deadline'} added to Bills`:'Already in your bills','check')};
