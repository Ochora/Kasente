/* ===== Build 4 · businesses: books, balance sheet, clients, invoices and receipts ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
.bizwrap{display:flex;flex-direction:column;gap:14px}
.bizhead{border-radius:24px;padding:18px;background:linear-gradient(150deg,var(--b),color-mix(in srgb,var(--b) 72%,#000));color:var(--bi);display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden}
.bizhead .lg{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.92);display:grid;place-items:center;overflow:hidden;flex:none;color:var(--b);font-family:var(--f-display);font-weight:800;font-size:22px}
.bizhead .lg img{width:100%;height:100%;object-fit:contain}
.bizhead .kv3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border-top:1px solid color-mix(in srgb,var(--bi) 22%,transparent);padding-top:12px}
.bizhead .kv3 span{display:block;font-size:11px;opacity:.75}
.bizhead .kv3 b{font-size:15px;font-variant-numeric:tabular-nums}
.bizwrap .btn.primary{background:var(--b);color:var(--bi)}
.bizwrap .tabbar button.on{color:var(--b)}
.bizcard{display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:20px;background:var(--surface);border:1px solid var(--line);border-left:6px solid var(--b);text-align:left;width:100%}
.bizcard .lg{width:52px;height:52px;border-radius:14px;background:var(--surface-2);display:grid;place-items:center;overflow:hidden;color:var(--b);font-family:var(--f-display);font-weight:800;font-size:22px}
.bizcard .lg img{width:100%;height:100%;object-fit:contain}
.sectors{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sectors label{cursor:pointer}
.sectors input{position:absolute;opacity:0;pointer-events:none}
.sectors span{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:10px 12px;font-size:13.5px;font-weight:600;background:var(--surface);min-height:52px}
.sectors input:checked+span{border-color:var(--accent);background:var(--accent-soft)}
.swatches{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.swatches button{width:38px;height:38px;border-radius:50%;border:3px solid var(--surface);box-shadow:0 0 0 1px var(--line)}
.swatches button.on{box-shadow:0 0 0 3px var(--ink)}
.styles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.styles button{border:2px solid var(--line);border-radius:12px;padding:6px;background:var(--surface);display:flex;flex-direction:column;gap:6px;align-items:center;font-size:12px;font-weight:600}
.styles button.on{border-color:var(--ink)}
.mini{width:100%;aspect-ratio:.72;border-radius:6px;background:#fff;position:relative;overflow:hidden;border:1px solid #e3e3e3}
.mini i{position:absolute;display:block;border-radius:2px}
.invframe{width:100%;border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;position:relative}
.invframe iframe{border:0;transform-origin:0 0;width:794px;display:block;pointer-events:none}
.stamp{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:6px}
.lrow{display:grid;grid-template-columns:1fr 64px 96px 30px;gap:6px;align-items:center}
.lrow input{min-height:40px;border-radius:10px;border:1px solid var(--line);background:var(--bg);padding:6px 9px;width:100%;min-width:0;font-size:14px}
.bs td{padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}
.bs td.r{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.bs tr.t td{font-weight:800;border-bottom:2px solid var(--ink)}
.bs .h td{padding-top:14px;font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
</style>`);

/* ---------- colours ---------- */
const hexRgb=h=>{h=(h||'#0E6B66').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]};
const lum=h=>{const c=hexRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const inkOn=h=>lum(h)>.42?'#141414':'#FFFFFF';
const bizVars=b=>`--b:${b.color};--bi:${inkOn(b.color)};--accent:${b.color};--accent-ink:${inkOn(b.color)};--accent-soft:color-mix(in srgb,${b.color} 16%,var(--surface))`;
const BIZ_COLORS=['#0E6B66','#1F4E8C','#7A3E9D','#B0283A','#D97706','#2F8A3B','#1A1A1A','#C2185B','#00838F','#6D4C41'];

/* ---------- what kinds of business, and what follows from each ---------- */
const SECTORS={
 retail:{n:'Shop or retail',sells:'goods',ic:'bag',x:['Stock for resale'],items:['']},
 wholesale:{n:'Wholesale or supply',sells:'goods',ic:'house',x:['Stock for resale','Loading & delivery']},
 food:{n:'Restaurant, café or food',sells:'goods',ic:'bowl',x:['Food ingredients','Gas & charcoal']},
 salon:{n:'Salon, barber or beauty',sells:'services',ic:'scissors',x:['Hair & beauty products']},
 professional:{n:'Consulting or accounting',sells:'services',ic:'book',prof:true,hours:true,x:['Office supplies','Subscriptions & certificates']},
 legal:{n:'Law firm or legal services',sells:'services',ic:'book',prof:true,hours:true,doc:'Fee note',x:['Court & filing fees','Practising certificate & subscriptions','Office supplies']},
 health:{n:'Clinic, pharmacy or health',sells:'both',ic:'cross',x:['Medicines & medical supplies']},
 education:{n:'School, tuition or training',sells:'services',ic:'book',x:['Teaching materials']},
 transport:{n:'Transport, boda or delivery',sells:'services',ic:'bike',x:['Fuel','Vehicle repairs','Driver payments']},
 farming:{n:'Farming or agribusiness',sells:'goods',ic:'sun',x:['Seeds & fertiliser','Animal feeds & vet','Farm labour']},
 construction:{n:'Construction or hardware',sells:'both',ic:'house',x:['Building materials','Casual labour']},
 tech:{n:'Tech, online or digital',sells:'services',ic:'signal',hours:true,x:['Software & hosting']},
 events:{n:'Events, photography or media',sells:'services',ic:'camera',x:['Equipment hire']},
 rental:{n:'Rental property',sells:'services',ic:'house',x:['Repairs & maintenance','Property rates']},
 manufacturing:{n:'Manufacturing or crafts',sells:'goods',ic:'gear',x:['Raw materials','Machine maintenance']},
 other:{n:'Something else',sells:'both',ic:'dots',x:[]}};
const BIZ_EXP=['Rent','Salaries & wages','Transport & delivery','Utilities','Airtime & internet','Marketing','Equipment & repairs','Licences & taxes','Bank & mobile money fees','Professional services','Other'];
const expCats=b=>[...(SECTORS[b.sector]||{x:[]}).x,...BIZ_EXP];
const STRUCT={sole:'Sole proprietor (just me)',partnership:'Partnership',company:'Company (limited)'};
const docTitle=b=>b.docTitle||(SECTORS[b.sector]||{}).doc||'Invoice';
const biz=id=>(S.businesses||[]).find(b=>b.id===id);
const curBiz=()=>biz(S.ui.biz)||(S.businesses||[])[0];

/* ---------- the numbers ---------- */
const BT_IN=['sale','owner_in','loan_in'],BT_OUT=['expense','owner_out','loan_repay','asset_buy'];
const btSign=t=>BT_IN.includes(t.kind)?1:-1;
function bizCashBy(b){const m={cash:+b.open.cash||0,momo:+b.open.momo||0,bank:+b.open.bank||0};b.txns.forEach(t=>{m[t.method||'cash']=(m[t.method||'cash']||0)+btSign(t)*t.amt});return m}
const bizCash=b=>{const m=bizCashBy(b);return m.cash+m.momo+m.bank};
const invSum=i=>{const sub=i.items.reduce((s,x)=>s+(+x.qty||0)*(+x.price||0),0);const disc=Math.min(sub,+i.discount||0);const base=sub-disc;const vat=i.vat?Math.round(base*.18):0;return{sub,disc,base,vat,total:base+vat}};
const invPaid=i=>(i.payments||[]).reduce((s,p)=>s+p.amt,0);
const invBal=i=>Math.max(0,invSum(i).total-invPaid(i));
const invStatus=i=>{if(i.status==='void')return'void';if(i.status==='draft')return'draft';const bal=invBal(i);if(bal<=0)return'paid';if(daysUntil(i.due)<0)return'overdue';return invPaid(i)>0?'part':'sent'};
const ST_LABEL={draft:['Draft',''],sent:['Unpaid','warn'],part:['Part paid','warn'],paid:['Paid','good'],overdue:['Overdue','bad'],void:['Cancelled','']};
const receivables=b=>b.invoices.filter(i=>!['draft','void'].includes(i.status)).reduce((s,i)=>s+invBal(i),0);
function bizPeriod(b,from,to){const l=b.txns.filter(t=>{const d=pd(t.d);return d>=from&&d<to});const sales=sumAmt(l.filter(t=>t.kind==='sale')),exp=sumAmt(l.filter(t=>t.kind==='expense'));return{l,sales,exp,profit:sales-exp,byCat:groupSum(l.filter(t=>t.kind==='expense'),t=>t.cat)}}
const taxYearStart=()=>{const y=TODAY0.getMonth()>=6?TODAY0.getFullYear():TODAY0.getFullYear()-1;return new Date(y,6,1)};
const monthStart=()=>new Date(TODAY0.getFullYear(),TODAY0.getMonth(),1);
function bizBalance(b){const m=bizCashBy(b);const rec=receivables(b);const stock=+b.open.stock||0;const fixed=(b.assets||[]).reduce((s,x)=>s+(+x.value||0),0)+sumAmt(b.txns.filter(t=>t.kind==='asset_buy'));
 const loans=Math.max(0,(+b.open.loans||0)+sumAmt(b.txns.filter(t=>t.kind==='loan_in'))-sumAmt(b.txns.filter(t=>t.kind==='loan_repay')));const pay=(b.payables||[]).reduce((s,x)=>s+(+x.amount||0),0);
 const A=Math.max(0,m.cash)+Math.max(0,m.momo)+Math.max(0,m.bank)+rec+stock+fixed,L=loans+pay+Math.max(0,-m.cash)+Math.max(0,-m.momo)+Math.max(0,-m.bank);return{m,rec,stock,fixed,loans,pay,A,L,E:A-L}}
const nextNo=(b,kind)=>{const k=kind==='rct'?'nextRct':'nextInv';const n=b[k]||1;b[k]=n+1;return `${kind==='rct'?(b.rctPrefix||'RCT'):(b.invPrefix||(docTitle(b)==='Fee note'?'FN':'INV'))}-${String(n).padStart(4,'0')}`};

/* ---------- amounts in words, as on Ugandan fee notes ---------- */
function words(n){n=Math.floor(Math.abs(n));if(!n)return'zero';const a='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' '),t='  twenty thirty forty fifty sixty seventy eighty ninety'.split(' ');
 const h=x=>{let s='';if(x>=100){s+=a[Math.floor(x/100)]+' hundred';x%=100;if(x)s+=' and '}if(x>=20){s+=t[Math.floor(x/10)];if(x%10)s+='-'+a[x%10]}else if(x)s+=a[x];return s};
 const parts=[[1e9,'billion'],[1e6,'million'],[1e3,'thousand']];let out=[];for(const[v,l]of parts){if(n>=v){out.push(h(Math.floor(n/v))+' '+l);n%=v}}if(n)out.push((out.length&&n<100?'and ':'')+h(n));return out.join(' ').replace(/\s+/g,' ')}
const curWords=c=>({UGX:'Uganda Shillings',KES:'Kenya Shillings',TZS:'Tanzania Shillings',RWF:'Rwanda Francs',USD:'US Dollars'}[c]||(CURRENCIES[c]||[c])[0]+'s');

/* ---------- the invoice and receipt page (used for preview and PDF) ---------- */
function docHtml(b,i,kind,pay){const t=invSum(i);const c=b.color,ink=inkOn(c);const cur=b.currency||CUR();const f=n=>fmtNum(n,cur);const st=b.invoiceStyle||'classic';
 const title=kind==='receipt'?'Receipt':docTitle(b);const no=kind==='receipt'?pay.rctNo:i.no;const sec=SECTORS[b.sector]||{};const hrs=sec.hours;
 const logo=b.logo?`<img src="${b.logo}" style="max-height:74px;max-width:180px;object-fit:contain">`:`<div style="width:64px;height:64px;border-radius:16px;background:${st==='bold'?'#fff':c};color:${st==='bold'?c:ink};display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800">${esc(initials(b.name))}</div>`;
 const contact=[b.address,b.phone,b.email,b.tin?'TIN '+b.tin:'',b.vat&&b.vatNo?'VAT '+b.vatNo:''].filter(Boolean).map(esc).join('<br>');
 const head=st==='bold'?`<div style="background:${c};color:${ink};padding:34px 44px;display:flex;justify-content:space-between;align-items:center;gap:20px"><div style="display:flex;gap:16px;align-items:center">${logo}<div><div style="font-size:24px;font-weight:800">${esc(b.name)}</div><div style="opacity:.85;font-size:12.5px;line-height:1.5;margin-top:4px">${contact}</div></div></div><div style="text-align:right"><div style="font-size:34px;font-weight:800;letter-spacing:-.5px">${title.toUpperCase()}</div><div style="font-size:14px;opacity:.9">${esc(no)}</div></div></div>`
  :st==='minimal'?`<div style="padding:40px 44px 10px;display:flex;justify-content:space-between;gap:20px;border-top:8px solid ${c}"><div>${logo}<div style="font-size:20px;font-weight:800;margin-top:10px">${esc(b.name)}</div><div style="color:#555;font-size:12.5px;line-height:1.5;margin-top:2px">${contact}</div></div><div style="text-align:right"><div style="font-size:30px;font-weight:300;letter-spacing:2px;color:${c}">${title.toUpperCase()}</div><div style="font-size:14px;color:#555">${esc(no)}</div></div></div>`
  :`<div style="height:14px;background:${c}"></div><div style="padding:30px 44px 10px;display:flex;justify-content:space-between;gap:20px"><div style="display:flex;gap:16px;align-items:center">${logo}<div><div style="font-size:22px;font-weight:800;color:${c}">${esc(b.name)}</div><div style="color:#555;font-size:12.5px;line-height:1.5;margin-top:3px">${contact}</div></div></div><div style="text-align:right"><div style="font-size:30px;font-weight:800;color:#222">${title}</div><div style="font-size:14px;color:#555">${esc(no)}</div></div></div>`;
 const cl=i.client||{};
 const meta=kind==='receipt'?[['Date paid',shortDate(pay.d)],['For',`${docTitle(b)} ${i.no}`],['Paid by',pay.method==='momo'?'Mobile money':pay.method==='bank'?'Bank':'Cash']]:[['Date',shortDate(i.date)],['Due',shortDate(i.due)],...(i.ref?[['Reference',i.ref]]:[])];
 const rows=i.items.filter(x=>x.desc||+x.price).map(x=>`<tr><td style="padding:10px 8px;border-bottom:1px solid #eee">${esc(x.desc)}</td><td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">${esc(x.qty)}</td><td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">${f(+x.price||0)}</td><td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${f((+x.qty||0)*(+x.price||0))}</td></tr>`).join('');
 const paidSoFar=invPaid(i),bal=invBal(i);
 const pm=b.pay||{};const howToPay=[pm.momoNumber?`Mobile money: <b>${esc(pm.momoNumber)}</b>${pm.momoName?' ('+esc(pm.momoName)+')':''}`:'',pm.merchant?`Merchant code: <b>${esc(pm.merchant)}</b>`:'',pm.bank?`Bank: <b>${esc(pm.bank)}</b>${pm.accName?', '+esc(pm.accName):''}${pm.accNo?', A/C '+esc(pm.accNo):''}`:''].filter(Boolean).join('<br>');
 const amtShown=kind==='receipt'?pay.amt:t.total;
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=794"><style>*{box-sizing:border-box}body{margin:0;width:794px;min-height:1123px;font-family:-apple-system,Roboto,"Segoe UI",Helvetica,Arial,sans-serif;color:#1d1d1d;font-size:13.5px;background:#fff;position:relative}table{border-collapse:collapse;width:100%}</style></head><body>
 ${head}
 <div style="padding:20px 44px;display:flex;justify-content:space-between;gap:24px">
  <div><div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${st==='minimal'?c:'#888'}">${kind==='receipt'?'Received from':'Bill to'}</div><div style="font-size:16px;font-weight:700;margin-top:4px">${esc(cl.name||'')}</div><div style="color:#555;line-height:1.5;font-size:12.5px">${[cl.address,cl.phone,cl.email,cl.tin?'TIN '+cl.tin:''].filter(Boolean).map(esc).join('<br>')}</div></div>
  <table style="width:auto">${meta.map(([k,v])=>`<tr><td style="color:#888;padding:3px 14px 3px 0">${k}</td><td style="font-weight:600;text-align:right">${esc(v)}</td></tr>`).join('')}</table></div>
 ${kind==='receipt'?`<div style="margin:6px 44px 0;padding:22px;border-radius:14px;background:${c}14;border:1px solid ${c}55;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:700">Amount received</div><div style="font-size:30px;font-weight:800;color:${c}">${cur} ${f(pay.amt)}</div><div style="color:#555;margin-top:2px">${esc(cap(words(pay.amt)))} ${curWords(cur)} only</div></div><div style="border:3px solid ${c};color:${c};font-weight:900;font-size:22px;padding:6px 16px;border-radius:10px;transform:rotate(-8deg);letter-spacing:2px">PAID</div></div>`:''}
 <div style="padding:16px 44px 0"><table><thead><tr style="background:${st==='minimal'?'#fff':c+'14'};color:${st==='minimal'?c:'#333'}"><th style="text-align:left;padding:10px 8px;font-size:11.5px;letter-spacing:.8px;text-transform:uppercase;${st==='minimal'?`border-bottom:2px solid ${c}`:''}">Description</th><th style="text-align:right;padding:10px 8px;font-size:11.5px;letter-spacing:.8px;text-transform:uppercase;width:70px">${hrs?'Hours':'Qty'}</th><th style="text-align:right;padding:10px 8px;font-size:11.5px;letter-spacing:.8px;text-transform:uppercase;width:120px">${hrs?'Rate':'Unit price'}</th><th style="text-align:right;padding:10px 8px;font-size:11.5px;letter-spacing:.8px;text-transform:uppercase;width:130px">Amount</th></tr></thead><tbody>${rows}</tbody></table>
 <div style="display:flex;justify-content:flex-end;margin-top:14px"><table style="width:300px">
  <tr><td style="padding:5px 0;color:#666">Subtotal</td><td style="text-align:right">${f(t.sub)}</td></tr>
  ${t.disc?`<tr><td style="padding:5px 0;color:#666">Discount</td><td style="text-align:right">−${f(t.disc)}</td></tr>`:''}
  ${i.vat?`<tr><td style="padding:5px 0;color:#666">VAT 18%</td><td style="text-align:right">${f(t.vat)}</td></tr>`:''}
  <tr><td style="padding:9px 0;font-weight:800;font-size:16px;border-top:2px solid #222">Total</td><td style="text-align:right;font-weight:800;font-size:16px;border-top:2px solid #222">${cur} ${f(t.total)}</td></tr>
  ${paidSoFar&&kind!=='receipt'?`<tr><td style="padding:5px 0;color:#666">Paid</td><td style="text-align:right">−${f(paidSoFar)}</td></tr><tr><td style="padding:7px 0;font-weight:800;color:${c}">Balance due</td><td style="text-align:right;font-weight:800;color:${c}">${cur} ${f(bal)}</td></tr>`:''}
  ${kind==='receipt'?`<tr><td style="padding:5px 0;color:#666">Balance remaining</td><td style="text-align:right">${cur} ${f(bal)}</td></tr>`:''}
 </table></div>
 ${kind!=='receipt'?`<div style="margin-top:10px;color:#555;font-size:12.5px"><b>Amount in words:</b> ${esc(cap(words(t.total)))} ${curWords(cur)} only.</div>`:''}</div>
 <div style="padding:26px 44px 0;display:flex;gap:30px;flex-wrap:wrap">
  ${howToPay&&kind!=='receipt'?`<div style="flex:1;min-width:240px"><div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#888;margin-bottom:6px">How to pay</div><div style="line-height:1.7">${howToPay}</div></div>`:''}
  ${i.notes?`<div style="flex:1;min-width:240px"><div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#888;margin-bottom:6px">Notes</div><div style="line-height:1.6;white-space:pre-wrap">${esc(i.notes)}</div></div>`:''}</div>
 <div style="position:absolute;left:44px;right:44px;bottom:34px;border-top:1px solid #e6e6e6;padding-top:12px;display:flex;justify-content:space-between;color:#888;font-size:11.5px"><span>${esc(b.footer||'Thank you for your business.')}</span><span>Made with Kasente</span></div>
 </body></html>`}
function reportHtmlBiz(b,from,to,label){const p=bizPeriod(b,from,to),bs=bizBalance(b),c=b.color,cur=b.currency||CUR(),f=n=>fmtNum(n,cur);const row=(l,v,s)=>`<tr><td style="padding:7px 0;border-bottom:1px solid #eee;${s||''}">${esc(l)}</td><td style="padding:7px 0;border-bottom:1px solid #eee;text-align:right;${s||''}">${v<0?'−':''}${f(v)}</td></tr>`;
 return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;width:794px;min-height:1123px;font-family:-apple-system,Roboto,Arial,sans-serif;color:#1d1d1d;font-size:13.5px}table{border-collapse:collapse;width:100%}h2{font-size:15px;color:${c};margin:26px 0 8px;text-transform:uppercase;letter-spacing:1px}</style></head><body>
 <div style="height:12px;background:${c}"></div><div style="padding:30px 44px"><div style="display:flex;align-items:center;gap:14px">${b.logo?`<img src="${b.logo}" style="max-height:60px;max-width:150px">`:''}<div><div style="font-size:22px;font-weight:800">${esc(b.name)}</div><div style="color:#666">Financial report · ${esc(label)} · ${cur}</div></div></div>
 <h2>Profit and loss</h2><table>${row('Sales',p.sales,'font-weight:700')}${p.byCat.map(([k,v])=>row('  '+k,-v)).join('')}${row('Total expenses',-p.exp,'font-weight:700')}${row(p.profit>=0?'Profit':'Loss',p.profit,'font-weight:800;font-size:15px;border-top:2px solid #222')}</table>
 <h2>Balance sheet today</h2><table>${row('Cash',bs.m.cash)}${row('Mobile money',bs.m.momo)}${row('Bank',bs.m.bank)}${row('Owed by clients',bs.rec)}${row('Stock',bs.stock)}${row('Equipment and other assets',bs.fixed)}${row('Total assets',bs.A,'font-weight:700')}${row('Loans',bs.loans)}${row('Bills to pay',bs.pay)}${row('Total liabilities',bs.L,'font-weight:700')}${row("Owner's equity",bs.E,'font-weight:800;font-size:15px;border-top:2px solid #222')}</table>
 <p style="color:#888;margin-top:30px">Prepared with Kasente on ${new Date().toLocaleDateString()}. Figures come from records kept in the app.</p></div></body></html>`}

/* ---------- making and sharing PDFs ---------- */
function makePdf(name,html){return new Promise(res=>{if(!NATIVE||!NATIVE.makePdf)return res({ok:false,status:0,text:'no_native'});const id='pdf'+Date.now().toString(36);cloudWait[id]=res;try{NATIVE.makePdf(name,html,id)}catch(e){delete cloudWait[id];res({ok:false,text:String(e)})}setTimeout(()=>{if(cloudWait[id]){delete cloudWait[id];res({ok:false,text:'timeout'})}},30000)})}
async function sharePdf(name,html,shareText){if(!NATIVE||!NATIVE.makePdf){openSheet('Preview',`<div style="max-height:64vh;overflow:auto;border-radius:12px"><div class="invframe"><iframe title="Preview" srcdoc="${esc(html)}"></iframe></div></div><p class="xs muted" style="margin-top:8px">In the Android app this becomes a PDF file you can send on WhatsApp or email.</p>`);setTimeout(fitInvoice,30);return}
 toast('Making the PDF…','down');const r=await makePdf(name,html);
 if(!r.ok){toast("Couldn't make the PDF here. Opening the print screen instead.",'alert');try{NATIVE.printHtml(name,html)}catch(e){}return}
 window._lastFile={uri:r.text,mime:'application/pdf',name};
 openSheet('PDF ready',`<div class="stack"><div class="note">${ic('check')}<span class="small"><b>${esc(name)}</b> is saved in Downloads › Kasente.</span></div><button class="btn primary" data-act="fileShare">${ic('send',18)}Send it (WhatsApp, email…)</button><button class="btn" data-act="fileOpen">${ic('receipt',18)}Open it</button>${shareText?`<button class="btn" data-act="shareMsg">${ic('sms',18)}Send a message with it</button>`:''}</div>`);window._shareText=shareText||''}
ACT.shareMsg=()=>{try{NATIVE.share(window._shareText,'Message')}catch(e){}};

/* ---------- setup: questions that shape the business side ---------- */
TITLES.businesses='My businesses';TITLES.biz='Business';TITLES.bizSetup='Set up a business';TITLES.invoice='Invoice';TITLES.invEdit='New invoice';
function blankBiz(){return{id:nid('bz'),name:'',sector:'retail',sells:'goods',structure:'sole',tin:'',vat:false,vatNo:'',records:true,color:BIZ_COLORS[0],logo:null,invoiceStyle:'classic',docTitle:'',currency:CUR(),phone:'',email:'',address:'',pay:{momoName:'',momoNumber:'',merchant:'',bank:'',accName:'',accNo:''},terms:14,footer:'Thank you for your business.',open:{cash:0,momo:0,bank:0,stock:0,loans:0},assets:[],payables:[],clients:[],items:[],txns:[],invoices:[],nextInv:1,nextRct:1,created:Date.now()}}
ACT.addBiz=()=>{S.ui.wiz={step:1,b:blankBiz(),isNew:true};go('bizSetup')};
ACT.editBiz=id=>{S.ui.wiz={step:1,b:JSON.parse(JSON.stringify(biz(id))),isNew:false};go('bizSetup')};
const WSTEPS=5;
SCREENS.bizSetup=()=>{const w=S.ui.wiz;if(!w)return '<div class="card">Nothing to set up.</div>';const b=w.b;const st=w.step;
 const steps=`<div class="steps">${Array.from({length:WSTEPS},(_,i)=>`<i class="${i<st?'on':''}"></i>`).join('')}</div>`;
 const nav=(next,label)=>`<div class="row" style="margin-top:6px">${st>1?`<button type="button" class="btn grow" data-act="wizBack">Back</button>`:''}<button class="btn primary grow">${label||'Continue'}</button></div>`;
 let body='';
 if(st===1)body=`<h2 style="font-size:22px">What's your business?</h2><p class="small muted">Kasente shapes the invoices, expense types and tax guidance around your answers.</p>
  <label class="field"><span>Business name</span><input name="name" value="${esc(b.name)}" required placeholder="e.g. Ochora & Co. Advocates"></label>
  <div class="field"><span>What does it do?</span><div class="sectors">${Object.entries(SECTORS).map(([k,s])=>`<label><input type="radio" name="sector" value="${k}" ${b.sector===k?'checked':''} data-live="wizSector"><span>${ic(s.ic,18)}${s.n}</span></label>`).join('')}</div></div>
  <div class="field"><span>What do you sell?</span><div class="seg" id="sellsSeg">${[['goods','Goods'],['services','Services'],['both','Both']].map(([k,l])=>`<label style="flex:1"><input type="radio" name="sells" value="${k}" ${b.sells===k?'checked':''} hidden><span class="btn sm block" style="background:${b.sells===k?'var(--surface)':'transparent'}">${l}</span></label>`).join('')}</div></div>`;
 if(st===2)body=`<h2 style="font-size:22px">How is it set up?</h2><p class="small muted">This decides which tax rules apply. You can leave anything you're unsure of and add it later.</p>
  <label class="field"><span>Legal form</span><select name="structure">${Object.entries(STRUCT).map(([k,l])=>`<option value="${k}" ${b.structure===k?'selected':''}>${l}</option>`).join('')}</select></label>
  <label class="field"><span>URA TIN (optional)</span><input name="tin" value="${esc(b.tin)}" inputmode="numeric" placeholder="10-digit TIN"></label>
  <div class="setrow" style="padding:6px 0;border:0"><span class="grow"><b>Registered for VAT</b><span>Adds 18% VAT to invoices</span></span><input type="checkbox" name="vat" ${b.vat?'checked':''} style="width:22px;height:22px;accent-color:var(--accent)"></div>
  <label class="field"><span>VAT number (if registered)</span><input name="vatNo" value="${esc(b.vatNo)}"></label>
  <div class="setrow" style="padding:6px 0;border:0"><span class="grow"><b>I keep records of sales and costs</b><span>Recording them in Kasente counts. It usually means less small-business tax.</span></span><input type="checkbox" name="records" ${b.records?'checked':''} style="width:22px;height:22px;accent-color:var(--accent)"></div>
  <label class="field"><span>Currency</span><select name="currency">${curOptions(b.currency)}</select></label>`;
 if(st===3)body=`<h2 style="font-size:22px">Make it yours</h2><p class="small muted">Your logo and colour appear on the business screens, invoices and receipts.</p>
  <div class="field"><span>Logo</span><div class="thumbrow"><span class="lg" style="width:72px;height:72px;border-radius:16px;background:var(--surface-2);display:grid;place-items:center;overflow:hidden;color:${b.color};font-family:var(--f-display);font-weight:800;font-size:28px" id="logoPrev">${b.logo?`<img src="${b.logo}" style="width:100%;height:100%;object-fit:contain">`:esc(initials(b.name||'B'))}</span><label class="btn sm" for="logoIn">${ic('camera',16)}${b.logo?'Change':'Upload'} logo</label>${b.logo?`<button type="button" class="btn sm" data-act="logoClear">Remove</button>`:''}</div><input id="logoIn" type="file" accept="image/*" hidden data-live="logoIn"></div>
  <div class="field"><span>Brand colour</span><div class="swatches">${BIZ_COLORS.map(c=>`<button type="button" style="background:${c}" class="${b.color===c?'on':''}" data-act="wizColor" data-arg="${c}" aria-label="Colour ${c}"></button>`).join('')}<label class="btn sm" style="position:relative">Custom<input type="color" value="${b.color}" data-live="wizColorIn" style="position:absolute;inset:0;opacity:0;width:100%;height:100%"></label></div></div>
  <div class="field"><span>Invoice style</span><div class="styles">${[['classic','Classic'],['bold','Bold'],['minimal','Minimal']].map(([k,l])=>`<button type="button" class="${b.invoiceStyle===k?'on':''}" data-act="wizStyle" data-arg="${k}"><span class="mini">${k==='bold'?`<i style="left:0;right:0;top:0;height:24%;background:${b.color}"></i>`:k==='minimal'?`<i style="left:0;right:0;top:0;height:4%;background:${b.color}"></i><i style="right:10%;top:10%;width:34%;height:5%;background:${b.color};opacity:.5"></i>`:`<i style="left:0;right:0;top:0;height:6%;background:${b.color}"></i><i style="left:10%;top:12%;width:30%;height:6%;background:${b.color}"></i>`}<i style="left:10%;right:10%;top:44%;height:4%;background:#ddd"></i><i style="left:10%;right:10%;top:54%;height:4%;background:#eee"></i><i style="left:10%;right:10%;top:62%;height:4%;background:#eee"></i><i style="right:10%;top:76%;width:36%;height:6%;background:#333"></i></span>${l}</button>`).join('')}</div></div>
  <label class="field"><span>Name on your bills</span><select name="docTitle">${['Invoice','Fee note','Bill','Pro forma invoice'].map(x=>`<option ${docTitle(b)===x?'selected':''}>${x}</option>`).join('')}</select></label>
  <button type="button" class="link small" style="align-self:flex-start" data-act="wizPreview">Preview an invoice →</button>`;
 if(st===4)body=`<h2 style="font-size:22px">Getting paid</h2><p class="small muted">These details print on every invoice so clients know how to pay you.</p>
  <div class="grid2"><label class="field"><span>Business phone</span><input name="phone" value="${esc(b.phone)}" inputmode="tel"></label><label class="field"><span>Email</span><input name="email" value="${esc(b.email)}" inputmode="email"></label></div>
  <label class="field"><span>Address</span><input name="address" value="${esc(b.address)}" placeholder="Plot, street, town"></label>
  <div class="grid2"><label class="field"><span>Mobile money number</span><input name="momoNumber" value="${esc(b.pay.momoNumber)}" inputmode="tel"></label><label class="field"><span>Registered name</span><input name="momoName" value="${esc(b.pay.momoName)}"></label></div>
  <label class="field"><span>Merchant / pay code (optional)</span><input name="merchant" value="${esc(b.pay.merchant)}"></label>
  <div class="grid2"><label class="field"><span>Bank</span><input name="bank" value="${esc(b.pay.bank)}"></label><label class="field"><span>Account number</span><input name="accNo" value="${esc(b.pay.accNo)}" inputmode="numeric"></label></div>
  <label class="field"><span>Account name</span><input name="accName" value="${esc(b.pay.accName)}"></label>
  <label class="field"><span>Clients usually pay within</span><select name="terms">${[[0,'On receipt'],[7,'7 days'],[14,'14 days'],[30,'30 days'],[60,'60 days']].map(([v,l])=>`<option value="${v}" ${+b.terms===v?'selected':''}>${l}</option>`).join('')}</select></label>
  <label class="field"><span>Line at the bottom of invoices</span><input name="footer" value="${esc(b.footer)}"></label>`;
 if(st===5)body=`<h2 style="font-size:22px">Where the business stands today</h2><p class="small muted">Optional. These starting figures make the balance sheet right from day one.</p>
  <div class="grid2"><label class="field"><span>Cash in the till</span><input name="o_cash" type="number" inputmode="decimal" step="any" value="${b.open.cash||''}" placeholder="0"></label><label class="field"><span>Business mobile money</span><input name="o_momo" type="number" inputmode="decimal" step="any" value="${b.open.momo||''}" placeholder="0"></label></div>
  <div class="grid2"><label class="field"><span>Business bank</span><input name="o_bank" type="number" inputmode="decimal" step="any" value="${b.open.bank||''}" placeholder="0"></label><label class="field"><span>Stock value</span><input name="o_stock" type="number" inputmode="decimal" step="any" value="${b.open.stock||''}" placeholder="0"></label></div>
  <div class="grid2"><label class="field"><span>Equipment value</span><input name="o_equip" type="number" inputmode="decimal" step="any" value="${(b.assets.find(a=>a.opening)||{}).value||''}" placeholder="0"></label><label class="field"><span>Loans the business owes</span><input name="o_loans" type="number" inputmode="decimal" step="any" value="${b.open.loans||''}" placeholder="0"></label></div>`;
 return `<div class="bizwrap" style="${bizVars(b)}"><form class="card stack" data-form="wiz">${steps}${body}${nav(st<WSTEPS,st<WSTEPS?'Continue':(w.isNew?'Create business':'Save changes'))}</form>${!w.isNew&&st===1?`<button class="btn danger" data-act="delBizAsk" data-arg="${b.id}">Delete this business</button>`:''}</div>`};
function wizRead(f){const w=S.ui.wiz,b=w.b,fd=new FormData(f);const g=k=>fd.get(k);
 if(w.step===1){b.name=(g('name')||'').trim();b.sector=g('sector')||b.sector;b.sells=g('sells')||b.sells}
 if(w.step===2){b.structure=g('structure');b.tin=(g('tin')||'').trim();b.vat=!!g('vat');b.vatNo=(g('vatNo')||'').trim();b.records=!!g('records');b.currency=g('currency')||b.currency}
 if(w.step===3){b.docTitle=g('docTitle')}
 if(w.step===4){Object.assign(b,{phone:g('phone').trim(),email:g('email').trim(),address:g('address').trim(),terms:+g('terms'),footer:g('footer').trim()});Object.assign(b.pay,{momoNumber:g('momoNumber').trim(),momoName:g('momoName').trim(),merchant:g('merchant').trim(),bank:g('bank').trim(),accNo:g('accNo').trim(),accName:g('accName').trim()})}
 if(w.step===5){b.open={cash:+g('o_cash')||0,momo:+g('o_momo')||0,bank:+g('o_bank')||0,stock:+g('o_stock')||0,loans:+g('o_loans')||0};const eq=+g('o_equip')||0;b.assets=b.assets.filter(a=>!a.opening);if(eq)b.assets.push({id:nid('ba'),name:'Equipment at start',value:eq,opening:true})}}
FORMS.wiz=(fd,f)=>{wizRead(f);const w=S.ui.wiz;if(w.step===1&&!w.b.name){toast('Give the business a name first.','alert');return}
 if(w.step<WSTEPS){w.step++;refresh();$('#view').scrollTop=0;return}
 S.businesses=S.businesses||[];const i=S.businesses.findIndex(x=>x.id===w.b.id);if(i>=0)S.businesses[i]=w.b;else S.businesses.push(w.b);
 S.ui.biz=w.b.id;S.ui.bizTab='overview';S.ui.wiz=null;stack=stack.filter(s=>s!=='bizSetup');if(!stack.includes('businesses'))stack.push('businesses');go('biz');toast(i>=0?'Business saved':`${w.b.name} is set up. Create your first ${docTitle(w.b).toLowerCase()} from here.`,'check');if(window.gameBadge)gameBadge('business')};
ACT.wizBack=()=>{const f=document.querySelector('[data-form=wiz]');if(f)wizRead(f);S.ui.wiz.step--;refresh()};
LIVE.wizSector=el=>{const s=SECTORS[el.value];const b=S.ui.wiz.b;b.sector=el.value;b.sells=s.sells;document.querySelectorAll('#sellsSeg input').forEach(x=>{x.checked=x.value===s.sells;x.nextElementSibling.style.background=x.checked?'var(--surface)':'transparent'})};
document.addEventListener('change',e=>{if(e.target.name==='sells'&&e.target.closest('#sellsSeg'))document.querySelectorAll('#sellsSeg input').forEach(x=>x.nextElementSibling.style.background=x.checked?'var(--surface)':'transparent')});
ACT.wizColor=c=>{const f=document.querySelector('[data-form=wiz]');if(f)wizRead(f);S.ui.wiz.b.color=c;refresh()};
LIVE.wizColorIn=el=>ACT.wizColor(el.value);
ACT.wizStyle=k=>{const f=document.querySelector('[data-form=wiz]');if(f)wizRead(f);S.ui.wiz.b.invoiceStyle=k;refresh()};
LIVE.logoIn=el=>{const f=el.files[0];if(!f)return;shrinkImage(f,320,u=>{S.ui.wiz.b.logo=u;const form=document.querySelector('[data-form=wiz]');if(form)wizRead(form);refresh()})};
ACT.logoClear=()=>{S.ui.wiz.b.logo=null;refresh()};
ACT.wizPreview=()=>{const f=document.querySelector('[data-form=wiz]');if(f)wizRead(f);const b=S.ui.wiz.b;const demo={no:'INV-0001',date:ymd(TODAY0),due:ymd(plusDays(TODAY0,b.terms||14)),client:{name:'Example Client Ltd',address:'Kampala'},items:[{desc:SECTORS[b.sector].hours?'Consultation and advice':'Sample item',qty:2,price:50000},{desc:SECTORS[b.sector].hours?'Drafting of documents':'Delivery',qty:1,price:30000}],discount:0,vat:b.vat,notes:'Example only.',payments:[]};
 openSheet('Invoice preview',`<div class="invframe" id="invPrev"><iframe title="Invoice preview" srcdoc="${esc(docHtml({...b,name:b.name||'Your business'},demo,'invoice'))}"></iframe></div>`,fitInvoice)};
function fitInvoice(){document.querySelectorAll('.invframe').forEach(fr=>{const ifr=fr.querySelector('iframe');const fit=()=>{const s=fr.clientWidth/794;let h=1123;try{h=Math.max(1123,ifr.contentDocument.documentElement.scrollHeight)}catch(e){}ifr.style.transform=`scale(${s})`;ifr.style.height=h+'px';fr.style.height=Math.round(h*s)+'px'};fit();if(!ifr._fit){ifr._fit=1;ifr.addEventListener('load',fit)}})}
ACT.delBizAsk=id=>openSheet('Delete this business?',`<div class="stack"><p>All its records, clients and invoices will be removed from this phone. Save a backup first if you may need them.</p><button class="btn danger" data-act="delBiz" data-arg="${id}">Delete business</button><button class="btn" data-act="close">Keep it</button></div>`);
ACT.delBiz=id=>{S.businesses=S.businesses.filter(b=>b.id!==id);closeSheet();S.ui.wiz=null;go('businesses');toast('Business deleted')};

/* ---------- list of businesses ---------- */
const bizLogo=(b,size)=>b.logo?`<img src="${b.logo}" alt="">`:esc(initials(b.name));
SCREENS.businesses=()=>{const L=S.businesses||[];
 if(!L.length)return `<div class="card stack" style="gap:12px"><span class="chip" style="--c:var(--accent);width:56px;height:56px">${ic('bag',28)}</span><b style="font-size:19px">Run your business from Kasente</b><p class="small muted">Keep each business's money apart from your own: sales, costs, clients, invoices and receipts with your logo, a balance sheet, and what tax you may owe. Add as many businesses as you run.</p><button class="btn primary" data-act="addBiz">${ic('plus')}Add a business</button></div>
 <div class="note">${ic('info')}<span class="small">A few quick questions about what you do shape the invoices, expense types and tax guidance.</span></div>`;
 const ms=monthStart(),now=plusDays(TODAY0,1);
 return `<div class="stack">${L.map(b=>{const p=bizPeriod(b,ms,now);const due=receivables(b);const od=b.invoices.filter(i=>invStatus(i)==='overdue').length;return `<button class="bizcard" style="--b:${b.color}" data-act="openBiz" data-arg="${b.id}"><span class="lg">${bizLogo(b)}</span><span class="tx-main"><span class="tx-title" style="font-size:16px">${esc(b.name)}</span><span class="tx-sub">${esc(SECTORS[b.sector]?.n||'')}</span><span class="xs" style="margin-top:4px">${od?`<span class="pill bad">${od} overdue</span> `:''}${due?`<span class="pill warn">${kf(due)} unpaid</span>`:''}</span></span><span class="tx-amt">${kf(p.sales)}<small>sales this month</small></span></button>`}).join('')}</div>
 <button class="btn block" data-act="addBiz">${ic('plus')}Add another business</button>
 <div class="note">${ic('shield')}<span class="small">Business money is kept separate from your personal money and net worth. Use "Pay yourself" in a business to move money across properly.</span></div>`};
ACT.openBiz=id=>{S.ui.biz=id;S.ui.bizTab=S.ui.bizTab||'overview';TITLES.biz=biz(id).name;go('biz')};

/* ---------- one business ---------- */
const BTXN_LABEL={sale:['Sale','in','var(--good)'],expense:['Expense','bag','var(--bad)'],owner_in:['Money put in','in','var(--accent)'],owner_out:['Paid to owner','hand','var(--muted)'],loan_in:['Loan received','hand','var(--warn)'],loan_repay:['Loan repaid','hand','var(--muted)'],asset_buy:['Equipment bought','gear','var(--muted)']};
const btxRow=(b,t)=>{const l=BTXN_LABEL[t.kind]||['','dots','var(--muted)'];const pos=btSign(t)>0;return `<button class="tx" data-act="btx" data-arg="${t.id}"><span class="chip" style="--c:${l[2]}">${ic(l[1])}</span><span class="tx-main"><span class="tx-title">${esc(t.title)}</span><span class="tx-sub">${esc(t.kind==='expense'?t.cat:l[0])} · ${t.method==='momo'?'Mobile money':t.method==='bank'?'Bank':'Cash'}</span></span><span class="tx-amt ${pos?'pos':''}">${pos?'+':'−'}${fmtNum(t.amt,b.currency)}<small>${dlabel(t.d)}</small></span></button>`};
const invRow=(b,i)=>{const s=invStatus(i);const[lbl,k]=ST_LABEL[s];return `<button class="tx" data-act="openInv" data-arg="${i.id}"><span class="chip" style="--c:${b.color}">${ic('receipt')}</span><span class="tx-main"><span class="tx-title">${esc(i.client.name||'No client')}</span><span class="tx-sub">${esc(i.no)} · ${s==='paid'?'paid':'due '+dlabel(i.due)}</span></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="tx-amt">${fmtNum(invSum(i).total,b.currency)}</span><span class="pill ${k}">${lbl}</span></span></button>`};
SCREENS.biz=()=>{const b=curBiz();if(!b)return SCREENS.businesses();TITLES.biz=b.name;const tab=S.ui.bizTab||'overview';const ms=monthStart(),now=plusDays(TODAY0,1);const p=bizPeriod(b,ms,now);const cash=bizCash(b);const due=receivables(b);
 const head=`<div class="bizhead"><div class="row" style="gap:14px"><span class="lg">${bizLogo(b)}</span><div class="grow" style="min-width:0"><div style="font-family:var(--f-display);font-weight:800;font-size:20px;line-height:1.15">${esc(b.name)}</div><div class="xs" style="opacity:.8">${esc(SECTORS[b.sector]?.n||'')} · ${esc(STRUCT[b.structure]||'')}</div></div><button class="icon-btn" data-act="editBiz" data-arg="${b.id}" aria-label="Business settings" style="background:rgba(255,255,255,.18);border:0;color:inherit">${ic('gear')}</button></div>
  <div class="kv3"><div><span>Sales this month</span><b>${kf(p.sales)}</b></div><div><span>Profit this month</span><b>${p.profit<0?'−':''}${kf(Math.abs(p.profit))}</b></div><div><span>Cash and bank</span><b>${cash<0?'−':''}${kf(Math.abs(cash))}</b></div></div></div>`;
 const tabs=`<div class="tabbar">${[['overview','Overview'],['money','Money'],['invoices','Invoices'],['clients','Clients'],['books','Books']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="bizTab" data-arg="${k}">${l}</button>`).join('')}</div>`;
 let body='';
 if(tab==='overview'){const od=b.invoices.filter(i=>invStatus(i)==='overdue');const open=b.invoices.filter(i=>['sent','part','overdue'].includes(invStatus(i)));
  body=`<div class="quick">${[['newInv','receipt','New '+docTitle(b).toLowerCase()],['bizSale','in','Record sale'],['bizExpense','bag','Record expense'],['bizPayMe','hand','Pay yourself']].map(([a,i,l])=>`<button class="qa" data-act="${a}"><span class="qi" style="color:var(--b)">${ic(i,22)}</span>${l}</button>`).join('')}</div>
  ${od.length?`<button class="note bad" data-act="bizTab" data-arg="invoices" style="text-align:left">${ic('alert')}<span class="small grow"><b>${od.length} overdue ${od.length>1?'invoices':'invoice'}: ${fmtNum(od.reduce((s,i)=>s+invBal(i),0),b.currency)}.</b> Tap to send reminders.</span></button>`:''}
  <div class="card stack" style="gap:8px"><div class="between"><b>Money owed to you</b><b class="tnum">${money(due,b.currency)}</b></div><span class="xs muted">${open.length} unpaid ${open.length===1?'invoice':'invoices'}</span></div>
  <div class="card stack" style="gap:8px"><div class="between"><b>This month</b><span class="xs muted">${MONTH_FULL[TODAY0.getMonth()]}</span></div><div class="between small"><span>Sales</span><span class="tnum">${fmtNum(p.sales,b.currency)}</span></div><div class="between small"><span>Expenses</span><span class="tnum">${p.exp?"−":""}${fmtNum(p.exp,b.currency)}</span></div><div class="between" style="border-top:1px solid var(--line);padding-top:6px"><b>${p.profit>=0?'Profit':'Loss'}</b><b class="tnum" style="color:${p.profit>=0?'var(--good)':'var(--bad)'}">${signedNum(p.profit,b.currency)}</b></div>${p.byCat.slice(0,4).map(([k,v])=>`<div class="between xs muted"><span>${esc(k)}</span><span class="tnum">${fmtNum(v,b.currency)}</span></div>`).join('')}</div>
  ${window.bizTaxCard?bizTaxCard(b):''}
  <div class="sec-head"><h2>Recent</h2><button class="link" data-act="bizTab" data-arg="money">All</button></div>
  <div class="list">${[...b.txns].sort((x,y)=>pd(y.d)-pd(x.d)).slice(0,5).map(t=>btxRow(b,t)).join('')||'<div class="setrow muted small">No business records yet. Record a sale or an expense.</div>'}</div>`}
 if(tab==='money'){const l=[...b.txns].sort((x,y)=>pd(y.d)-pd(x.d));const m=bizCashBy(b);
  body=`<div class="stat3"><div class="stat"><span>Cash</span><b>${kf(m.cash)}</b></div><div class="stat"><span>Mobile money</span><b>${kf(m.momo)}</b></div><div class="stat"><span>Bank</span><b>${kf(m.bank)}</b></div></div>
  <div class="row wrap">${[['bizSale','Sale'],['bizExpense','Expense'],['bizPayMe','Pay yourself'],['bizPutIn','Put money in'],['bizLoan','Loan'],['bizAsset','Buy equipment']].map(([a,l])=>`<button class="chipbtn" data-act="${a}">${l}</button>`).join('')}</div>
  <div class="list">${l.map(t=>btxRow(b,t)).join('')||'<div class="setrow muted small">Nothing recorded yet.</div>'}</div>`}
 if(tab==='invoices'){const f=S.ui.invF||'open';const all=[...b.invoices].sort((x,y)=>y.date.localeCompare(x.date)||y.no.localeCompare(x.no));const l=all.filter(i=>{const s=invStatus(i);return f==='all'||(f==='open'&&['sent','part','overdue'].includes(s))||(f==='paid'&&s==='paid')||(f==='draft'&&s==='draft')});
  const rcts=all.flatMap(i=>(i.payments||[]).map(p=>({i,p}))).sort((x,y)=>y.p.d.localeCompare(x.p.d));
  body=`<button class="btn primary block" data-act="newInv">${ic('plus')}New ${docTitle(b).toLowerCase()}</button>
  <div class="chips">${[['open','Unpaid'],['paid','Paid'],['draft','Drafts'],['all','All'],['rct','Receipts']].map(([k,lb])=>`<button class="chipbtn ${f===k?'on':''}" data-act="invF" data-arg="${k}">${lb}</button>`).join('')}</div>
  ${f==='rct'?`<div class="list">${rcts.map(({i,p})=>`<button class="tx" data-act="openRct" data-arg="${i.id}|${p.id}"><span class="chip" style="--c:var(--good)">${ic('check')}</span><span class="tx-main"><span class="tx-title">${esc(i.client.name)}</span><span class="tx-sub">${esc(p.rctNo)} · for ${esc(i.no)}</span></span><span class="tx-amt pos">${fmtNum(p.amt,b.currency)}<small>${dlabel(p.d)}</small></span></button>`).join('')||'<div class="setrow muted small">Receipts appear when you record a payment on an invoice.</div>'}</div>`
  :`<div class="list">${l.map(i=>invRow(b,i)).join('')||`<div class="setrow muted small">${f==='open'?'Nothing unpaid. Nice.':'Nothing here yet.'}</div>`}</div>`}`}
 if(tab==='clients'){body=`<button class="btn block" data-act="addClient">${ic('plus')}Add a client</button><div class="list">${b.clients.map(c=>{const owed=b.invoices.filter(i=>i.clientId===c.id&&!['draft','void'].includes(i.status)).reduce((s,i)=>s+invBal(i),0);return `<button class="tx" data-act="editClient" data-arg="${c.id}"><span class="avatar">${esc(initials(c.name))}</span><span class="tx-main"><span class="tx-title">${esc(c.name)}</span><span class="tx-sub">${esc(c.phone||c.email||'')}</span></span><span class="tx-amt">${owed?fmtNum(owed,b.currency):'—'}<small>${owed?'owes you':'nothing owed'}</small></span></button>`}).join('')||'<div class="setrow muted small">Clients are added when you create an invoice, or here.</div>'}</div>`}
 if(tab==='books'){const per=S.ui.bizPer||'month';const[from,label]=per==='year'?[taxYearStart(),'Tax year from 1 July']:per==='all'?[new Date(2000,0,1),'All time']:[ms,MONTH_FULL[TODAY0.getMonth()]];const pp=bizPeriod(b,from,now);const bs=bizBalance(b);
  const r=(l,v,cls)=>`<tr class="${cls||''}"><td>${l}</td><td class="r">${signedNum(v,b.currency)}</td></tr>`;
  body=`<div class="seg">${[['month','This month'],['year','Tax year'],['all','All time']].map(([k,l])=>`<button class="${per===k?'on':''}" data-act="bizPer" data-arg="${k}">${l}</button>`).join('')}</div>
  <div class="card"><b>Profit and loss · ${esc(label)}</b><table class="bs" style="width:100%;border-collapse:collapse;margin-top:6px">${r('Sales',pp.sales)}${pp.byCat.map(([k,v])=>r('&nbsp;&nbsp;'+esc(k),-v)).join('')}${r('Total expenses',-pp.exp)}${r(pp.profit>=0?'Profit':'Loss',pp.profit,'t')}</table></div>
  <div class="card"><div class="between"><b>Balance sheet · today</b><button class="link small" data-act="bizOpening">Edit figures</button></div><table class="bs" style="width:100%;border-collapse:collapse;margin-top:6px">
   <tr class="h"><td colspan="2">What the business has</td></tr>${r('Cash',bs.m.cash)}${r('Mobile money',bs.m.momo)}${r('Bank',bs.m.bank)}${r('Owed by clients',bs.rec)}${r('Stock',bs.stock)}${r('Equipment and other assets',bs.fixed)}${r('Total assets',bs.A,'t')}
   <tr class="h"><td colspan="2">What it owes</td></tr>${r('Loans',bs.loans)}${r('Bills to pay',bs.pay)}${r('Total liabilities',bs.L,'t')}
   <tr class="h"><td colspan="2">Owner's share</td></tr>${r("Owner's equity",bs.E,'t')}</table>
   <p class="xs muted" style="margin-top:8px">Equity is what would be left for you if the business sold everything and paid all it owes. It is not part of your personal net worth.</p></div>
  <button class="btn block" data-act="bizReport">${ic('down')}Share this report as a PDF</button>`}
 return `<div class="bizwrap" style="${bizVars(b)}">${head}${tabs}${body}</div>`};
ACT.bizTab=k=>{S.ui.bizTab=k;refresh()};ACT.invF=k=>{S.ui.invF=k;refresh()};ACT.bizPer=k=>{S.ui.bizPer=k;refresh()};

/* ---------- business records ---------- */
const methodSel=sel=>`<label class="field"><span>Paid in or out through</span><select name="method">${[['cash','Cash'],['momo','Mobile money'],['bank','Bank']].map(([k,l])=>`<option value="${k}" ${sel===k?'selected':''}>${l}</option>`).join('')}</select></label>`;
function btxForm(kind,t){const b=curBiz();const L=BTXN_LABEL[kind][0];t=t||{};
 return `<form class="stack bizwrap" style="${bizVars(b)}" data-form="btx" data-kind="${kind}" ${t.id?`data-id="${t.id}"`:''}>
  <div class="grid2"><label class="field"><span>Amount (${b.currency})</span><input name="amt" type="number" inputmode="decimal" step="any" value="${t.amt||''}" required></label><label class="field"><span>Date</span><input name="date" type="date" value="${(t.d||stamp()).slice(0,10)}"></label></div>
  <label class="field"><span>${kind==='sale'?'What was sold':kind==='expense'?'What it was for':'Description'}</span><input name="title" value="${esc(t.title||'')}" placeholder="${kind==='sale'?'e.g. 2 bags of cement':kind==='expense'?'e.g. Shop rent October':''}" list="bizItems"></label>
  ${kind==='expense'?`<label class="field"><span>Type of expense</span><select name="cat">${expCats(b).map(c=>`<option ${t.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>`:''}
  ${methodSel(t.method||'cash')}
  ${kind==='owner_out'&&!t.id?`<label class="field"><span>Into your personal account</span><select name="pacct"><option value="">Don't record personally</option>${acctOptions((S.accounts.find(a=>a.kind==='momo')||{}).id)}</select></label><p class="xs muted">Pay yourself a set amount instead of taking money when you need it. It keeps the business books clean.</p>`:''}
  ${kind==='owner_in'&&!t.id?`<label class="field"><span>From your personal account</span><select name="pacct"><option value="">Don't record personally</option>${acctOptions((S.accounts.find(a=>a.kind==='momo')||{}).id)}</select></label>`:''}
  <datalist id="bizItems">${(b.items||[]).map(x=>`<option value="${esc(x.name)}">`).join('')}</datalist>
  <button class="btn primary">${t.id?'Save':'Record '+L.toLowerCase()}</button>${t.id?`<button type="button" class="btn danger" data-act="btxDel" data-arg="${t.id}">Delete</button>`:''}</form>`}
ACT.bizSale=()=>openSheet('Record a sale',btxForm('sale'));ACT.bizExpense=()=>openSheet('Record an expense',btxForm('expense'));ACT.bizPayMe=()=>openSheet('Pay yourself',btxForm('owner_out'));
ACT.bizPutIn=()=>openSheet('Put money into the business',btxForm('owner_in'));ACT.bizAsset=()=>openSheet('Buy equipment',btxForm('asset_buy'));
ACT.bizLoan=()=>openSheet('Business loan',`<div class="stack"><button class="btn block" data-act="bizLoanIn">The business received a loan</button><button class="btn block" data-act="bizLoanOut">The business repaid a loan</button></div>`);
ACT.bizLoanIn=()=>openSheet('Loan received',btxForm('loan_in'));ACT.bizLoanOut=()=>openSheet('Loan repaid',btxForm('loan_repay'));
ACT.btx=id=>{const b=curBiz();const t=b.txns.find(x=>x.id===id);if(!t)return;if(t.invId){openSheet('Payment',`<div class="stack"><p class="small">This sale came from a payment on ${esc((b.invoices.find(i=>i.id===t.invId)||{}).no||'an invoice')}. Open the invoice to change it.</p><button class="btn primary" data-act="openInv" data-arg="${t.invId}">Open invoice</button></div>`);return}openSheet('Edit record',btxForm(t.kind,t))};
FORMS.btx=(fd,f)=>{const b=curBiz();const kind=f.dataset.kind;const amt=+fd.get('amt');if(!amt)return;const v={amt,d:fd.get('date')+' '+stamp().slice(11),title:(fd.get('title')||BTXN_LABEL[kind][0]).trim(),method:fd.get('method'),cat:fd.get('cat')||null,kind};
 if(f.dataset.id){Object.assign(b.txns.find(x=>x.id===f.dataset.id),v)}else{b.txns.push({id:nid('bt'),...v});
  if(kind==='sale'&&v.title&&!b.items.some(x=>x.name.toLowerCase()===v.title.toLowerCase()))b.items.push({name:v.title,price:amt});
  const pa=fd.get('pacct');if(pa&&(kind==='owner_out'||kind==='owner_in')){const acc=acct(pa);addTxn({acct:pa,kind:kind==='owner_out'?'in':'out',amt:kind==='owner_out'?amt:amt,cat:kind==='owner_out'?'income':'business',sub:kind==='owner_in'?'Other business costs':null,title:kind==='owner_out'?`From ${b.name}`:`Into ${b.name}`,src:'manual'},true)}}
 closeSheet();refresh();toast('Saved','check')};
ACT.btxDel=id=>{const b=curBiz();b.txns=b.txns.filter(x=>x.id!==id);closeSheet();refresh()};
ACT.bizOpening=()=>{const b=curBiz();openSheet('Balance sheet figures',`<form class="stack" data-form="bizOpen"><p class="small muted">Starting figures, and things the records can't know.</p>
 <div class="grid2"><label class="field"><span>Starting cash</span><input name="cash" type="number" step="any" value="${b.open.cash||''}"></label><label class="field"><span>Starting mobile money</span><input name="momo" type="number" step="any" value="${b.open.momo||''}"></label></div>
 <div class="grid2"><label class="field"><span>Starting bank</span><input name="bank" type="number" step="any" value="${b.open.bank||''}"></label><label class="field"><span>Stock value now</span><input name="stock" type="number" step="any" value="${b.open.stock||''}"></label></div>
 <label class="field"><span>Loans at the start</span><input name="loans" type="number" step="any" value="${b.open.loans||''}"></label>
 <div class="field"><span>Equipment and other assets</span><div class="stack" id="bAssets" style="gap:6px">${(b.assets.length?b.assets:[{name:'',value:''}]).map(a=>`<div class="grid2 ba"><input class="input" name="an" value="${esc(a.name)}" placeholder="e.g. Laptop"><input class="input" name="av" type="number" step="any" value="${a.value}" placeholder="Value"></div>`).join('')}</div><button type="button" class="link small" style="align-self:flex-start" data-act="addRowBA">+ Add</button></div>
 <div class="field"><span>Bills the business has to pay</span><div class="stack" id="bPay" style="gap:6px">${(b.payables.length?b.payables:[{name:'',amount:''}]).map(a=>`<div class="grid2 bp"><input class="input" name="pn" value="${esc(a.name)}" placeholder="e.g. Supplier balance"><input class="input" name="pv" type="number" step="any" value="${a.amount}" placeholder="Amount"></div>`).join('')}</div><button type="button" class="link small" style="align-self:flex-start" data-act="addRowBP">+ Add</button></div>
 <button class="btn primary">Save</button></form>`)};
ACT.addRowBA=()=>$('#bAssets').insertAdjacentHTML('beforeend','<div class="grid2 ba"><input class="input" name="an" placeholder="Item"><input class="input" name="av" type="number" step="any" placeholder="Value"></div>');
ACT.addRowBP=()=>$('#bPay').insertAdjacentHTML('beforeend','<div class="grid2 bp"><input class="input" name="pn" placeholder="Who"><input class="input" name="pv" type="number" step="any" placeholder="Amount"></div>');
FORMS.bizOpen=(fd,f)=>{const b=curBiz();b.open={cash:+fd.get('cash')||0,momo:+fd.get('momo')||0,bank:+fd.get('bank')||0,stock:+fd.get('stock')||0,loans:+fd.get('loans')||0};
 b.assets=[...f.querySelectorAll('.ba')].map(r=>({id:nid('ba'),name:r.querySelector('[name=an]').value.trim(),value:+r.querySelector('[name=av]').value||0})).filter(a=>a.name||a.value);
 b.payables=[...f.querySelectorAll('.bp')].map(r=>({name:r.querySelector('[name=pn]').value.trim(),amount:+r.querySelector('[name=pv]').value||0})).filter(a=>a.name||a.amount);closeSheet();refresh();toast('Balance sheet updated')};
ACT.bizReport=()=>{const b=curBiz();const per=S.ui.bizPer||'month';const ms=monthStart();const[from,label]=per==='year'?[taxYearStart(),'Tax year from 1 July '+taxYearStart().getFullYear()]:per==='all'?[new Date(2000,0,1),'All time']:[ms,MONTH_FULL[TODAY0.getMonth()]+' '+TODAY0.getFullYear()];
 sharePdf(`${b.name.replace(/[^\w ]+/g,'').trim()} report ${ymd(TODAY0)}.pdf`,reportHtmlBiz(b,from,plusDays(TODAY0,1),label))};

/* ---------- clients ---------- */
const clientForm=c=>{c=c||{};return `<form class="stack" data-form="client" ${c.id?`data-id="${c.id}"`:''}><label class="field"><span>Client name</span><input name="name" value="${esc(c.name||'')}" required></label><div class="grid2"><label class="field"><span>Phone</span><input name="phone" value="${esc(c.phone||'')}" inputmode="tel"></label><label class="field"><span>Email</span><input name="email" value="${esc(c.email||'')}" inputmode="email"></label></div><label class="field"><span>Address</span><input name="address" value="${esc(c.address||'')}"></label><label class="field"><span>TIN (for business clients)</span><input name="tin" value="${esc(c.tin||'')}"></label><button class="btn primary">Save client</button></form>`};
ACT.addClient=()=>openSheet('New client',clientForm());ACT.editClient=id=>openSheet('Client',clientForm(curBiz().clients.find(c=>c.id===id)));
FORMS.client=(fd,f)=>{const b=curBiz();const v={name:fd.get('name').trim(),phone:fd.get('phone').trim(),email:fd.get('email').trim(),address:fd.get('address').trim(),tin:fd.get('tin').trim()};if(f.dataset.id)Object.assign(b.clients.find(c=>c.id===f.dataset.id),v);else b.clients.push({id:nid('cl'),...v});closeSheet();refresh()};

/* ---------- invoice editor ---------- */
ACT.newInv=()=>{const b=curBiz();S.ui.invDraft={id:null,clientId:'',client:{name:'',phone:'',email:'',address:'',tin:''},date:ymd(TODAY0),due:ymd(plusDays(TODAY0,+b.terms||0)),items:[{desc:'',qty:1,price:''}],discount:0,vat:!!b.vat,notes:'',ref:''};TITLES.invEdit='New '+docTitle(b).toLowerCase();go('invEdit')};
ACT.editInv=id=>{const b=curBiz();const i=b.invoices.find(x=>x.id===id);S.ui.invDraft=JSON.parse(JSON.stringify(i));TITLES.invEdit='Edit '+i.no;go('invEdit')};
SCREENS.invEdit=()=>{const b=curBiz(),d=S.ui.invDraft;if(!b||!d)return '';const hrs=(SECTORS[b.sector]||{}).hours;const t=invSum(d);
 return `<form class="bizwrap stack" style="${bizVars(b)}" data-form="invSave">
 <div class="card stack"><b>Client</b>
  <label class="field"><span>Choose a client</span><select name="clientId" data-live="invClient"><option value="">New client…</option>${b.clients.map(c=>`<option value="${c.id}" ${d.clientId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
  <div id="newClient" class="stack" ${d.clientId?'hidden':''}><label class="field"><span>Client name</span><input name="cname" value="${esc(d.client.name)}" data-live="invField"></label><div class="grid2"><label class="field"><span>Phone</span><input name="cphone" value="${esc(d.client.phone)}" inputmode="tel" data-live="invField"></label><label class="field"><span>Email</span><input name="cemail" value="${esc(d.client.email)}" data-live="invField"></label></div><label class="field"><span>Address</span><input name="caddress" value="${esc(d.client.address)}" data-live="invField"></label></div></div>
 <div class="card stack"><div class="grid2"><label class="field"><span>Date</span><input name="date" type="date" value="${d.date}" data-live="invField"></label><label class="field"><span>Due</span><input name="due" type="date" value="${d.due}" data-live="invField"></label></div><label class="field"><span>Reference (optional)</span><input name="ref" value="${esc(d.ref||'')}" placeholder="${b.sector==='legal'?'e.g. Civil Suit No. 561 of 2026':'e.g. Order 23'}" data-live="invField"></label></div>
 <div class="card stack"><b>${hrs?'Work done':'Items'}</b><div class="lrow xs muted" style="font-weight:600"><span>Description</span><span>${hrs?'Hours':'Qty'}</span><span>${hrs?'Rate':'Price'}</span><span></span></div>
  <div class="stack" id="lines" style="gap:6px">${d.items.map((x,i)=>`<div class="lrow"><input value="${esc(x.desc)}" data-i="${i}" data-k="desc" data-live="invLine" list="itemList" placeholder="${hrs?'e.g. Legal consultation':'Item'}" aria-label="Description"><input type="number" step="any" value="${x.qty}" data-i="${i}" data-k="qty" data-live="invLine" aria-label="Quantity"><input type="number" step="any" value="${x.price}" data-i="${i}" data-k="price" data-live="invLine" aria-label="Price"><button type="button" class="icon-btn" style="width:30px;height:30px;border:0;background:none" data-act="invRm" data-arg="${i}" aria-label="Remove line">${ic('x',16)}</button></div>`).join('')}</div>
  <datalist id="itemList">${(b.items||[]).map(x=>`<option value="${esc(x.name)}">`).join('')}</datalist>
  <button type="button" class="link small" style="align-self:flex-start" data-act="invAdd">+ Add line</button>
  <div class="grid2"><label class="field"><span>Discount (${b.currency})</span><input name="discount" type="number" step="any" value="${d.discount||''}" placeholder="0" data-live="invField"></label>${b.vat?`<div class="setrow" style="border:0;padding:20px 0 0"><span class="grow"><b>Add VAT 18%</b></span><input type="checkbox" name="vat" ${d.vat?'checked':''} data-live="invField" style="width:22px;height:22px;accent-color:var(--accent)"></div>`:'<span></span>'}</div>
  <div id="invTot" class="stack" style="gap:4px;border-top:1px solid var(--line);padding-top:8px">${invTotHtml(b,d)}</div></div>
 <div class="card stack"><label class="field"><span>Notes for the client</span><textarea name="notes" data-live="invField" placeholder="Thank you for your business. Payment within ${b.terms||14} days.">${esc(d.notes)}</textarea></label></div>
 <div class="row"><button type="button" class="btn grow" data-act="invSaveDraft">Save draft</button><button class="btn primary grow">Save and share PDF</button></div></form>`};
const invTotHtml=(b,d)=>{const t=invSum(d);return `<div class="between small"><span>Subtotal</span><span class="tnum">${fmtNum(t.sub,b.currency)}</span></div>${t.disc?`<div class="between small"><span>Discount</span><span class="tnum">−${fmtNum(t.disc,b.currency)}</span></div>`:''}${d.vat?`<div class="between small"><span>VAT 18%</span><span class="tnum">${fmtNum(t.vat,b.currency)}</span></div>`:''}<div class="between"><b>Total</b><b class="tnum" style="font-size:18px">${money(t.total,b.currency)}</b></div>`};
function invSync(){const f=document.querySelector('[data-form=invSave]');if(!f)return;const d=S.ui.invDraft;const g=n=>f.querySelector(`[name=${n}]`);
 d.clientId=g('clientId').value;d.client={...d.client,name:g('cname').value,phone:g('cphone').value,email:g('cemail').value,address:g('caddress').value};d.date=g('date').value;d.due=g('due').value;d.ref=g('ref').value;d.discount=+g('discount').value||0;d.notes=g('notes').value;if(g('vat'))d.vat=g('vat').checked;$('#invTot').innerHTML=invTotHtml(curBiz(),d)}
LIVE.invField=invSync;
LIVE.invLine=el=>{const d=S.ui.invDraft,i=+el.dataset.i,k=el.dataset.k;d.items[i][k]=k==='desc'?el.value:el.value;if(k==='desc'){const it=(curBiz().items||[]).find(x=>x.name===el.value);if(it&&!d.items[i].price){d.items[i].price=it.price;el.parentElement.querySelector('[data-k=price]').value=it.price}}$('#invTot').innerHTML=invTotHtml(curBiz(),d)};
LIVE.invClient=el=>{$('#newClient').hidden=!!el.value;invSync()};
ACT.invAdd=()=>{invSync();S.ui.invDraft.items.push({desc:'',qty:1,price:''});refresh()};
ACT.invRm=i=>{invSync();S.ui.invDraft.items.splice(+i,1);if(!S.ui.invDraft.items.length)S.ui.invDraft.items.push({desc:'',qty:1,price:''});refresh()};
function invCommit(status){invSync();const b=curBiz(),d=S.ui.invDraft;d.items=d.items.filter(x=>x.desc||+x.price);if(!d.items.length){toast('Add at least one line with a price.','alert');d.items=[{desc:'',qty:1,price:''}];return null}
 let c=d.clientId?b.clients.find(x=>x.id===d.clientId):null;if(!c){if(!d.client.name.trim()){toast('Add the client\'s name.','alert');return null}c={id:nid('cl'),name:d.client.name.trim(),phone:d.client.phone.trim(),email:d.client.email.trim(),address:d.client.address.trim(),tin:''};b.clients.push(c)}
 d.clientId=c.id;d.client={name:c.name,phone:c.phone,email:c.email,address:c.address,tin:c.tin};
 d.items.forEach(x=>{if(x.desc&&!b.items.some(y=>y.name.toLowerCase()===x.desc.toLowerCase()))b.items.push({name:x.desc,price:+x.price||0})});
 let inv=d.id?b.invoices.find(x=>x.id===d.id):null;if(inv){Object.assign(inv,d,{status:inv.status==='draft'?status:inv.status})}else{inv={...d,id:nid('iv'),no:nextNo(b,'inv'),status,payments:[],created:Date.now()};b.invoices.push(inv)}
 S.ui.invDraft=null;S.ui.invId=inv.id;return inv}
ACT.invSaveDraft=()=>{const inv=invCommit('draft');if(!inv)return;stack=stack.filter(s=>s!=='invEdit');go('invoice');toast('Draft saved')};
FORMS.invSave=()=>{const inv=invCommit('sent');if(!inv)return;inv.sentAt=Date.now();stack=stack.filter(s=>s!=='invEdit');go('invoice');shareInv(inv.id)};

/* ---------- invoice view ---------- */
ACT.openInv=id=>{closeSheet();S.ui.invId=id;const b=curBiz(),i=b&&b.invoices.find(x=>x.id===id);if(i)TITLES.invoice=i.no;go('invoice')};
SCREENS.invoice=()=>{const b=curBiz();const i=b&&b.invoices.find(x=>x.id===S.ui.invId);if(!i)return '<div class="card">Invoice not found.</div>';TITLES.invoice=i.no;const s=invStatus(i);const[lbl,k]=ST_LABEL[s];const t=invSum(i);
 return `<div class="bizwrap" style="${bizVars(b)}">
 <div class="card stack" style="gap:8px"><div class="between"><div><b style="font-size:17px">${esc(i.client.name)}</b><div class="xs muted">${esc(i.no)} · ${shortDate(i.date)}</div></div><span class="pill ${k}">${lbl}</span></div>
  <div class="between"><span class="muted small">Total</span><b class="tnum" style="font-size:20px">${money(t.total,b.currency)}</b></div>
  ${invPaid(i)?`<div class="between small"><span class="muted">Paid so far</span><span class="tnum">${fmtNum(invPaid(i),b.currency)}</span></div>`:''}
  ${s!=='paid'&&s!=='void'?`<div class="between small"><span class="muted">${s==='overdue'?`Overdue by ${-daysUntil(i.due)} day${daysUntil(i.due)===-1?'':'s'}`:'Due '+dlabel(i.due)}</span><b class="tnum" style="color:${s==='overdue'?'var(--bad)':'inherit'}">${fmtNum(invBal(i),b.currency)} left</b></div>`:''}</div>
 <div class="quick">${s==='draft'?`<button class="qa" data-act="markSent"><span class="qi" style="color:var(--b)">${ic('send',22)}</span>Mark as sent</button>`:''}<button class="qa" data-act="shareInv" data-arg="${i.id}"><span class="qi" style="color:var(--b)">${ic('down',22)}</span>Share PDF</button>${s!=='paid'&&s!=='void'&&s!=='draft'?`<button class="qa" data-act="payInv" data-arg="${i.id}"><span class="qi" style="color:var(--b)">${ic('check',22)}</span>Record payment</button><button class="qa" data-act="remindInv" data-arg="${i.id}"><span class="qi" style="color:var(--b)">${ic('bell',22)}</span>Remind client</button>`:''}${s!=='void'?`<button class="qa" data-act="editInv" data-arg="${i.id}"><span class="qi" style="color:var(--b)">${ic('gear',22)}</span>Edit</button>`:''}</div>
 <div class="invframe"><iframe title="${esc(i.no)}" srcdoc="${esc(docHtml(b,i,'invoice'))}"></iframe></div>
 ${(i.payments||[]).length?`<div class="sec-head"><h2>Payments and receipts</h2></div><div class="list">${i.payments.map(p=>`<button class="tx" data-act="openRct" data-arg="${i.id}|${p.id}"><span class="chip" style="--c:var(--good)">${ic('check')}</span><span class="tx-main"><span class="tx-title">${esc(p.rctNo)}</span><span class="tx-sub">${p.method==='momo'?'Mobile money':p.method==='bank'?'Bank':'Cash'} · ${shortDate(p.d)}</span></span><span class="tx-amt pos">${fmtNum(p.amt,b.currency)}</span></button>`).join('')}</div>`:''}
 <div class="row"><button class="btn sm grow" data-act="dupInv" data-arg="${i.id}">Duplicate</button>${s!=='void'&&!invPaid(i)?`<button class="btn sm grow" data-act="voidInv" data-arg="${i.id}">Cancel invoice</button>`:''}</div></div>`};
MOUNT.invoice=()=>fitInvoice();
ACT.markSent=()=>{const i=curBiz().invoices.find(x=>x.id===S.ui.invId);i.status='sent';i.sentAt=Date.now();refresh()};
const invName=(b,i,kind)=>`${kind==='receipt'?'Receipt':docTitle(b)} ${kind==='receipt'?i:i.no} ${b.name}`.replace(/[^\w\- ]+/g,'').replace(/\s+/g,' ').trim()+'.pdf';
ACT.shareInv=id=>shareInv(id);
function shareInv(id){const b=curBiz();const i=b.invoices.find(x=>x.id===id);if(i.status==='draft'){i.status='sent';i.sentAt=Date.now()}const t=invSum(i);
 const msg=`Dear ${i.client.name}, please find ${docTitle(b).toLowerCase()} ${i.no} for ${money(t.total,b.currency)}, due ${shortDate(i.due)}.${b.pay.momoNumber?` Mobile money: ${b.pay.momoNumber}${b.pay.momoName?' ('+b.pay.momoName+')':''}.`:''}${b.pay.bank?` Bank: ${b.pay.bank}${b.pay.accNo?', A/C '+b.pay.accNo:''}.`:''} Thank you. ${b.name}`;
 refresh();sharePdf(invName(b,i,'invoice'),docHtml(b,i,'invoice'),msg)}
ACT.remindInv=id=>{const b=curBiz();const i=b.invoices.find(x=>x.id===id);const late=daysUntil(i.due)<0;
 const msg=`Dear ${i.client.name}, a friendly reminder that ${docTitle(b).toLowerCase()} ${i.no} for ${money(invBal(i),b.currency)} ${late?`was due on ${shortDate(i.due)}`:`is due on ${shortDate(i.due)}`}.${b.pay.momoNumber?` You can pay by mobile money to ${b.pay.momoNumber}${b.pay.momoName?' ('+b.pay.momoName+')':''}.`:''} Thank you. ${b.name}${b.phone?', '+b.phone:''}`;
 i.reminded=(i.reminded||0)+1;i.lastReminder=Date.now();
 openSheet('Remind your client',`<div class="stack"><textarea id="remTxt" class="input" style="min-height:140px;width:100%">${esc(msg)}</textarea><button class="btn primary" data-act="remSend">${ic('send',18)}Send the message</button><button class="btn" data-act="remSendPdf" data-arg="${id}">${ic('down',18)}Send with the PDF</button></div>`)};
ACT.remSend=()=>{const t=$('#remTxt').value;if(NATIVE&&NATIVE.share){try{NATIVE.share(t,'Reminder')}catch(e){}}else{navigator.clipboard.writeText(t).then(()=>toast('Message copied')).catch(()=>{})}closeSheet()};
ACT.remSendPdf=id=>{const t=$('#remTxt').value;const b=curBiz();const i=b.invoices.find(x=>x.id===id);closeSheet();sharePdf(invName(b,i,'invoice'),docHtml(b,i,'invoice'),t)};
ACT.payInv=id=>{const b=curBiz();const i=b.invoices.find(x=>x.id===id);openSheet('Record a payment',`<form class="stack bizwrap" style="${bizVars(b)}" data-form="payInv" data-id="${id}"><div class="grid2"><label class="field"><span>Amount received</span><input name="amt" type="number" step="any" value="${invBal(i)}" required></label><label class="field"><span>Date</span><input name="date" type="date" value="${ymd(TODAY0)}"></label></div>${methodSel('momo')}<button class="btn primary">Save and make receipt</button></form>`)};
FORMS.payInv=(fd,f)=>{const b=curBiz();const i=b.invoices.find(x=>x.id===f.dataset.id);const amt=+fd.get('amt');if(!amt)return;const p={id:nid('py'),d:fd.get('date'),amt,method:fd.get('method'),rctNo:nextNo(b,'rct')};
 i.payments=i.payments||[];i.payments.push(p);if(i.status==='draft')i.status='sent';
 b.txns.push({id:nid('bt'),kind:'sale',amt,d:p.d+' '+stamp().slice(11),title:`${i.client.name} · ${i.no}`,method:p.method,invId:i.id,payId:p.id});
 closeSheet();refresh();toast(invBal(i)<=0?`${i.no} is fully paid`:`${money(invBal(i),b.currency)} still due on ${i.no}`,'check');
 openSheet('Receipt ready',`<div class="stack"><p class="small">Receipt <b>${esc(p.rctNo)}</b> for ${money(amt,b.currency)} is ready.</p><button class="btn primary" data-act="openRct" data-arg="${i.id}|${p.id}">${ic('receipt',18)}View and send receipt</button></div>`)};
ACT.openRct=arg=>{closeSheet();const[iid,pid]=arg.split('|');const b=curBiz();const i=b.invoices.find(x=>x.id===iid);const p=i.payments.find(x=>x.id===pid);
 openSheet(`Receipt ${esc(p.rctNo)}`,`<div class="stack"><div class="invframe"><iframe title="Receipt" srcdoc="${esc(docHtml(b,i,'receipt',p))}"></iframe></div><button class="btn primary" data-act="shareRct" data-arg="${arg}">${ic('send',18)}Share receipt PDF</button><button class="btn danger" data-act="delPay" data-arg="${arg}">Delete this payment</button></div>`,fitInvoice)};
ACT.shareRct=arg=>{const[iid,pid]=arg.split('|');const b=curBiz();const i=b.invoices.find(x=>x.id===iid);const p=i.payments.find(x=>x.id===pid);closeSheet();
 sharePdf(invName(b,p.rctNo,'receipt'),docHtml(b,i,'receipt',p),`Dear ${i.client.name}, thank you for your payment of ${money(p.amt,b.currency)}. Receipt ${p.rctNo} is attached. ${b.name}`)};
ACT.delPay=(arg,el)=>{if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent='Tap again to delete';return}const[iid,pid]=arg.split('|');const b=curBiz();const i=b.invoices.find(x=>x.id===iid);i.payments=i.payments.filter(x=>x.id!==pid);b.txns=b.txns.filter(t=>t.payId!==pid);closeSheet();refresh()};
ACT.dupInv=id=>{const b=curBiz();const i=b.invoices.find(x=>x.id===id);S.ui.invDraft={...JSON.parse(JSON.stringify(i)),id:null,date:ymd(TODAY0),due:ymd(plusDays(TODAY0,+b.terms||0)),payments:[],status:'draft'};delete S.ui.invDraft.no;TITLES.invEdit='New '+docTitle(b).toLowerCase();go('invEdit')};
ACT.voidInv=id=>{const i=curBiz().invoices.find(x=>x.id===id);i.status='void';refresh();toast('Invoice cancelled')};

/* ---------- reminders and alerts for unpaid invoices ---------- */
const baseSched4=scheduleReminders;
scheduleReminders=function(){baseSched4();if(!NATIVE||!NATIVE.schedule||!isFresh()||!S.settings.push)return;const extra=[];const now=Date.now();
 (S.businesses||[]).forEach(b=>b.invoices.forEach(i=>{const s=invStatus(i);if(!['sent','part','overdue'].includes(s))return;const due=pd(i.due+' 09:00').getTime();
  [[-DAY,`${i.no} to ${i.client.name} is due tomorrow`],[0,`${i.no} to ${i.client.name} is due today`],[3*DAY,`${i.no} from ${i.client.name} is 3 days overdue`]].forEach(([off,title])=>{const at=due+off;if(at>now)extra.push({title,body:`${money(invBal(i),b.currency)} unpaid · ${b.name}. Tap to send a reminder.`,at})})}));
 if(!extra.length)return;try{const cur=JSON.parse(lastSched||'[]');const all=[...cur,...extra].sort((a,b)=>a.at-b.at).slice(0,64);const j=JSON.stringify(all);if(j!==lastSched){lastSched=j;NATIVE.schedule(j)}}catch(e){}};
const baseCompute4=computeNotifs;
computeNotifs=function(){const out=baseCompute4();const rd=S.readN||[];(S.businesses||[]).forEach(b=>b.invoices.forEach(i=>{if(invStatus(i)!=='overdue')return;const id=`inv-${i.id}-${i.due}`;out.unshift({id,t:'bad',ic:'receipt',title:`${i.no} from ${i.client.name} is overdue`,body:`${money(invBal(i),b.currency)} unpaid since ${dlabel(i.due)} · ${b.name}`,when:dlabel(i.due),go:'businesses',read:rd.includes(id)})}));return out};
