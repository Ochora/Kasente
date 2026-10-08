/* ===== Build 4 · profile photo, where businesses and tax live, sample business, translations ===== */
/* ---------- profile photo ---------- */
const avatarHtml=(size,fs)=>{const u=S.user||{};return u.photo?`<span class="avatar" style="width:${size}px;height:${size}px;padding:0;overflow:hidden"><img src="${u.photo}" alt="" style="width:100%;height:100%;object-fit:cover"></span>`:`<span class="avatar" style="width:${size}px;height:${size}px;font-size:${fs}px">${initials(u.name)}</span>`};
const baseEditProfile=ACT.editProfile;
ACT.editProfile=()=>{baseEditProfile();const f=document.querySelector('[data-form=profile]');if(!f)return;const u=S.user||{};
 f.insertAdjacentHTML('afterbegin',`<div class="row" style="gap:14px;align-items:center"><span id="pfPrev">${avatarHtml(72,24)}</span><div class="stack" style="gap:6px"><label class="btn sm" style="cursor:pointer">${ic('camera',16)}${u.photo?'Change photo':'Add a photo'}<input type="file" accept="image/*" data-live="pfPhoto" hidden></label>${u.photo?'<button type="button" class="link small" data-act="pfPhotoClear">Remove photo</button>':''}</div><input type="hidden" name="photo" id="pfPhotoVal" value="${u.photo?'keep':''}"></div>
 <label class="field"><span>Full name</span><input name="full" value="${esc(u.full||u.name||'')}"></label>
 <label class="field"><span>What you do</span><input name="role" value="${esc(u.role||'')}" placeholder="e.g. Advocate · Kampala"></label>`)};
LIVE.pfPhoto=el=>{const f=el.files[0];if(!f)return;shrinkImage(f,320,u=>{window._pfPhoto=u;$('#pfPhotoVal').value='new';$('#pfPrev').innerHTML=`<span class="avatar" style="width:72px;height:72px;padding:0;overflow:hidden"><img src="${u}" alt="" style="width:100%;height:100%;object-fit:cover"></span>`})};
ACT.pfPhotoClear=()=>{window._pfPhoto=null;$('#pfPhotoVal').value='clear';$('#pfPrev').innerHTML=`<span class="avatar" style="width:72px;height:72px;font-size:24px">${initials(S.user.name)}</span>`};
const baseFormProfile=FORMS.profile;
FORMS.profile=(fd,f)=>{const ph=fd.get('photo'),full=(fd.get('full')||'').trim(),role=fd.get('role');baseFormProfile(fd,f);
 if(ph==='new'&&window._pfPhoto)S.user.photo=window._pfPhoto;else if(ph==='clear')delete S.user.photo;
 if(full)S.user.full=full;if(role!=null)S.user.role=role.trim();window._pfPhoto=null;refresh()};
const avatarSwap=h=>h.replace(/<span class="avatar" style="width:(5[26])px;height:5[26]px;font-size:(1[79])px">[^<]*<\/span>/,(m,s,fs)=>avatarHtml(+s,+fs));

/* ---------- profile: photo, role, and businesses shown apart from net worth ---------- */
const baseProfile4=SCREENS.profile;
SCREENS.profile=()=>{let h=avatarSwap(baseProfile4());const u=S.user||{};
 if(u.role)h=h.replace(/(<div class="small muted">)/,`<div class="small">${esc(u.role)}</div>$1`);
 const L=S.businesses||[];const i=h.indexOf('<div class="kpi">');if(i<0)return h;
 const card=L.length?`<div class="sec-head"><h2>Your businesses</h2><b class="tnum small">${ugx(L.reduce((s,b)=>s+bizBalance(b).E,0))}</b></div>
 <div class="list">${L.map(b=>{const bs=bizBalance(b);return `<button class="setrow" data-act="openBiz" data-arg="${b.id}" style="padding:10px 14px"><span class="lg" style="width:32px;height:32px;border-radius:9px;background:${b.color};color:${inkOn(b.color)};display:grid;place-items:center;font-weight:800;overflow:hidden;flex:none">${bizLogo(b)}</span><span class="grow"><b style="font-size:14px">${esc(b.name)}</b><span>Owner's equity · assets ${kf(bs.A)}, owes ${kf(bs.L)}</span></span><span class="tnum" style="font-weight:700">${signedNum(bs.E,b.currency)}</span></button>`}).join('')}</div>
 <p class="xs muted" style="margin:6px 4px 0">Business money is kept apart and is not counted in your net worth above. Moving money with "Pay yourself" shows up in both.</p>`
 :`<button class="note" data-act="addBiz" style="text-align:left">${ic('bag')}<span class="small grow"><b>Run a business?</b> Add it to keep its money, invoices and tax separate from yours.</span></button>`;
 return h.slice(0,i)+card+h.slice(i)};
/* settings and the home top bar use the photo too */
if(SCREENS.settings){const baseSettings4=SCREENS.settings;SCREENS.settings=()=>avatarSwap(baseSettings4())}
const baseTopbar4=topbar;topbar=function(c){let h=baseTopbar4(c);const p=S.user&&S.user.photo;if(p&&c==='home')h=h.replace(/(<button class="icon-btn" data-go="profile"[^>]*?)style="[^"]*">[^<]*<\/button>/,`$1style="padding:0;overflow:hidden"><img src="${p}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></button>`);return h};

/* ---------- More: a Business and tax section ---------- */
const baseMore4=SCREENS.more;
SCREENS.more=()=>{let h=baseMore4();const L=S.businesses||[];const od=L.reduce((s,b)=>s+b.invoices.filter(i=>invStatus(i)==='overdue').length,0);
 const T=(go,icn,t,s,em,act,arg)=>`<button class="tile" ${act?`data-act="${act}" data-arg="${arg||''}"`:`data-go="${go}"`}><span class="tile-ic">${ic(icn)}</span><b>${t}</b><span>${s}</span>${em?`<em>${em}</em>`:''}</button>`;
 const sec=`<div class="sec-head"><h2>Business and tax</h2></div><div class="tiles">${T('businesses','bag','My businesses',L.length?`${L.length} ${L.length>1?'businesses':'business'} · invoices, books`:'Invoices, receipts, balance sheet',od?`${od} overdue`:'')}${T('','receipt','Tax guide','What you may owe, exemptions, deadlines','','openTax','me')}</div>`;
 const i=h.indexOf('<div class="sec-head"><h2>Money</h2>');return i<0?h+sec:h.slice(0,i)+sec+h.slice(i)};
/* ---------- home: a short business line ---------- */
const baseHome5=SCREENS.home;
SCREENS.home=()=>{let h=baseHome5();const L=S.businesses||[];if(!L.length)return h;const i=h.indexOf('<div class="sec-head"><h2>Accounts</h2>');if(i<0)return h;
 const due=L.reduce((s,b)=>s+receivables(b),0),od=L.reduce((s,b)=>s+b.invoices.filter(x=>invStatus(x)==='overdue').length,0);const ms=monthStart(),now=plusDays(TODAY0,1);const prof=L.reduce((s,b)=>s+bizPeriod(b,ms,now).profit,0);
 const card=`<button class="card row" data-go="businesses" style="gap:12px;text-align:left;width:100%;margin-bottom:12px"><span class="chip" style="--c:${L[0].color}">${ic('bag')}</span><span class="grow"><b>${L.length>1?L.length+' businesses':esc(L[0].name)}</b><span class="xs muted" style="display:block">Profit this month ${signedNum(prof)} · owed to you ${kf(due)}</span></span>${od?`<span class="pill bad">${od} overdue</span>`:ic('chev',16)}</button>`;
 return h.slice(0,i)+card+h.slice(i)};
/* ---------- badge ---------- */
if(typeof BADGES!=='undefined'&&!BADGES.some(b=>b[0]==='business'))BADGES.push(['business','Entrepreneur','Set up a business in Kasente','bag'],['invoice-paid','Paid on time','Recorded a payment on an invoice','check']);
const basePayInv4=FORMS.payInv;FORMS.payInv=(fd,f)=>{basePayInv4(fd,f);if(window.gameBadge)gameBadge('invoice-paid')};

/* ---------- sample business for the demo data ---------- */
(function sampleBiz(){const S0=JSON.parse(SAMPLE_SNAPSHOT);if(S0.businesses)return;
 const b={id:'bz1',name:'Bright Minds Tuition',sector:'education',sells:'services',structure:'sole',tin:'1001234567',vat:false,vatNo:'',records:true,color:'#2E5BBA',logo:null,invoiceStyle:'classic',docTitle:'',currency:'UGX',phone:'0700 000 000',email:'brightminds@example.com',address:'Ntinda, Kampala',
  pay:{momoName:'Sarah Nambi',momoNumber:'0770 000 000',merchant:'',bank:'Stanbic Bank',accName:'Bright Minds Tuition',accNo:'90300000000'},terms:14,footer:'Thank you for trusting us with your child\'s learning.',
  open:{cash:150000,momo:320000,bank:900000,stock:0,loans:0},assets:[{id:'ba1',name:'Whiteboards, desks and chairs',value:1800000}],payables:[{id:'bp1',name:'Printing at Ntinda Stationers',value:85000}],
  clients:[{id:'cl1',name:'Mr. and Mrs. Okello',phone:'0772 111 222',email:'',address:'Kiwatule',tin:''},{id:'cl2',name:'Grace Achieng',phone:'0701 333 444',email:'',address:'Ntinda',tin:''},{id:'cl3',name:'Kampala Parents School PTA',phone:'',email:'pta@example.com',address:'Kololo',tin:''}],
  items:[{name:'Holiday tuition, S.4 Maths and Physics (per term)',price:450000},{name:'Weekend revision class (per month)',price:120000},{name:'Mock exam pack',price:35000}],
  txns:[{id:'bt1',kind:'sale',amt:450000,d:'2026-09-05 10:00',title:'Mr. and Mrs. Okello · INV-0001',method:'momo',invId:'iv1',payId:'py1'},{id:'bt2',kind:'expense',amt:180000,d:'2026-09-06 09:00',title:'Classroom rent, September',method:'momo',cat:'Rent'},{id:'bt3',kind:'sale',amt:240000,d:'2026-09-12 16:00',title:'Weekend class, walk-in pupils',method:'cash'},{id:'bt4',kind:'expense',amt:60000,d:'2026-09-14 12:00',title:'Revision papers printing',method:'cash',cat:'Teaching materials'},{id:'bt5',kind:'expense',amt:35000,d:'2026-09-20 18:00',title:'Airtime and data for class group',method:'momo',cat:'Airtime & internet'},{id:'bt6',kind:'owner_out',amt:200000,d:'2026-09-28 19:00',title:'Paid to Sarah',method:'momo'},{id:'bt7',kind:'sale',amt:120000,d:'2026-10-01 17:00',title:'Grace Achieng · INV-0002 (part)',method:'momo',invId:'iv2',payId:'py2'}],
  invoices:[{id:'iv1',no:'INV-0001',clientId:'cl1',client:{name:'Mr. and Mrs. Okello',phone:'0772 111 222',email:'',address:'Kiwatule',tin:''},date:'2026-08-28',due:'2026-09-11',items:[{desc:'Holiday tuition, S.4 Maths and Physics (per term)',qty:1,price:450000}],discount:0,vat:false,notes:'For Daniel Okello, Term 3.',ref:'',status:'sent',payments:[{id:'py1',d:'2026-09-05',amt:450000,method:'momo',rctNo:'RCT-0001'}],created:1},
   {id:'iv2',no:'INV-0002',clientId:'cl2',client:{name:'Grace Achieng',phone:'0701 333 444',email:'',address:'Ntinda',tin:''},date:'2026-09-10',due:'2026-09-24',items:[{desc:'Weekend revision class (per month)',qty:2,price:120000},{desc:'Mock exam pack',qty:1,price:35000}],discount:15000,vat:false,notes:'Two children, September.',ref:'',status:'sent',payments:[{id:'py2',d:'2026-10-01',amt:120000,method:'momo',rctNo:'RCT-0002'}],created:2},
   {id:'iv3',no:'INV-0003',clientId:'cl3',client:{name:'Kampala Parents School PTA',phone:'',email:'pta@example.com',address:'Kololo',tin:''},date:'2026-09-29',due:'2026-10-13',items:[{desc:'Saturday Maths clinic for S.3 (4 sessions)',qty:4,price:150000}],discount:0,vat:false,notes:'',ref:'PTA/2026/41',status:'sent',payments:[],created:3}],
  nextInv:4,nextRct:3,created:1};
 S0.businesses=[b];S0.taxMe={salary:1450000,rent:0,employer:false};SAMPLE_SNAPSHOT=JSON.stringify(S0)})();
/* make sure saved data has the business fields */
const baseMigrate5=window.kasenteMigrate;
window.kasenteMigrate=function(had){baseMigrate5(had);S.businesses=Array.isArray(S.businesses)?S.businesses:[];S.businesses.forEach(b=>{const d=blankBiz();for(const k in d)if(b[k]==null)b[k]=d[k];b.pay={...d.pay,...b.pay};b.open={...d.open,...b.open}})};

/* ---------- translations for the new screens ---------- */
Object.assign(T_DICT,{
'My businesses':['Biashara zangu','Mes entreprises'],'Business':['Biashara','Entreprise'],'Business and tax':['Biashara na kodi','Entreprise et impôts'],'Tax guide':['Mwongozo wa kodi','Guide fiscal'],
'Add a business':['Ongeza biashara','Ajouter une entreprise'],'Add another business':['Ongeza biashara nyingine','Ajouter une autre entreprise'],'Set up a business':['Anzisha biashara','Créer une entreprise'],
'Overview':['Muhtasari','Aperçu'],'Money':['Pesa','Argent'],'Invoices':['Ankara','Factures'],'Clients':['Wateja','Clients'],'Books':['Hesabu','Comptes'],
'Invoice':['Ankara','Facture'],'Receipt':['Risiti','Reçu'],'Receipts':['Risiti','Reçus'],'Unpaid':['Haijalipwa','Impayé'],'Paid':['Imelipwa','Payé'],'Drafts':['Rasimu','Brouillons'],'Overdue':['Imechelewa','En retard'],
'Record sale':['Rekodi mauzo','Enregistrer une vente'],'Record expense':['Rekodi gharama','Enregistrer une dépense'],'Pay yourself':['Jilipe','Vous payer'],'Put money in':['Weka pesa','Apporter de l\'argent'],
'Money owed to you':['Pesa unazodai','Argent qu\'on vous doit'],'This month':['Mwezi huu','Ce mois-ci'],'Sales':['Mauzo','Ventes'],'Expenses':['Gharama','Dépenses'],'Profit':['Faida','Bénéfice'],'Loss':['Hasara','Perte'],
'Profit and loss':['Faida na hasara','Compte de résultat'],'Balance sheet · today':['Mizania · leo','Bilan · aujourd\'hui'],'Total assets':['Jumla ya mali','Total de l\'actif'],'Total liabilities':['Jumla ya madeni','Total du passif'],"Owner's equity":['Mtaji wa mmiliki','Capitaux propres'],
'Add a client':['Ongeza mteja','Ajouter un client'],'Record a payment':['Rekodi malipo','Enregistrer un paiement'],'Send reminder':['Tuma kikumbusho','Envoyer un rappel'],
'Personal':['Binafsi','Personnel'],'Deadlines':['Tarehe za mwisho','Échéances'],'Exemptions':['Misamaha','Exonérations'],'Your income':['Mapato yako','Vos revenus'],'Work it out':['Hesabu','Calculer'],
'For you':['Kwako','Pour vous'],'For businesses':['Kwa biashara','Pour les entreprises'],'Your businesses':['Biashara zako','Vos entreprises'],'Add a photo':['Ongeza picha','Ajouter une photo'],'Change photo':['Badilisha picha','Changer la photo'],
'Full name':['Jina kamili','Nom complet'],'What you do':['Unachofanya','Votre activité'],'Money you can use now':['Pesa unayoweza kutumia sasa','Argent disponible maintenant'],'Left this cycle':['Iliyobaki mzunguko huu','Reste ce cycle'],'Spent today':['Umetumia leo','Dépensé aujourd\'hui']});
/* a fresh start keeps none of the sample business or tax figures */
const baseStartFresh5=startFresh;startFresh=function(name,pdy){baseStartFresh5(name,pdy);S.businesses=[];delete S.taxMe;S.ui.biz=null};
