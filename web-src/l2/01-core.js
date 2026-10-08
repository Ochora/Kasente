/* ===== Build 3 · core: countries, currencies, providers, data model ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
.pbadge{display:grid;place-items:center;flex:none;border-radius:12px;font-weight:800;font-family:var(--f-display);letter-spacing:-.02em;line-height:1;overflow:hidden;text-transform:none}
.pbadge img{width:100%;height:100%;object-fit:cover;display:block}
.acct .pbadge{width:30px;height:30px;border-radius:9px}
.kpi{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.kpi .stat b{font-size:16px}
.chk{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--line);cursor:pointer}
.chk:last-child{border-bottom:0}
.chk input[type=checkbox]{width:20px;height:20px;accent-color:var(--accent);flex:none}
.chk .grow b{display:block;font-size:14.5px}
.chk .grow span{display:block;font-size:12px;color:var(--muted)}
.balin{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 12px 46px;border-bottom:1px solid var(--line)}
.balin .field>span{font-size:11.5px}
.balin input{min-height:40px!important;padding:6px 10px!important;font-size:14px!important}
.steps{display:flex;gap:6px;margin:4px 0 14px}
.steps i{flex:1;height:4px;border-radius:4px;background:var(--line)}
.steps i.on{background:var(--accent)}
.lesson{padding:0;overflow:hidden}
.lesson summary{list-style:none;cursor:pointer;padding:14px 16px;display:flex;gap:12px;align-items:center}
.lesson summary::-webkit-details-marker{display:none}
.lesson .body{padding:0 16px 16px;font-size:14px;line-height:1.55}
.lesson .body p{margin:0 0 10px}
.lesson .body ul{margin:0 0 10px;padding-left:20px}
.lesson .body li{margin-bottom:4px}
.streak{display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:14px 16px;text-align:left;width:100%}
.flame{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:var(--sun-soft);color:var(--warn);flex:none}
.week{display:flex;gap:5px;margin-top:6px}
.week i{width:22px;height:22px;border-radius:7px;background:var(--surface-2);display:grid;place-items:center;font-size:10px;font-style:normal;font-weight:700;color:var(--faint)}
.week i.on{background:var(--sun);color:var(--sun-ink)}
.week i.today{outline:2px solid var(--sun);outline-offset:1px}
.badges{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.badge2{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px}
.badge2 .bi{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--sun-soft);color:var(--warn)}
.badge2.locked{opacity:.45}
.badge2.locked .bi{background:var(--surface-2);color:var(--faint)}
.score{position:relative;display:grid;place-items:center}
.subrow{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;padding:6px 0}
.tabbar{display:flex;gap:4px;background:var(--surface-2);border-radius:13px;padding:3px}
.tabbar button{flex:1;min-height:36px;border-radius:10px;font-size:13.5px;font-weight:600;color:var(--muted);text-align:center}
.tabbar button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.liab{color:var(--bad)}
.thumbrow{display:flex;gap:10px;align-items:center}
.thumbrow img{width:64px;height:64px;object-fit:cover;border-radius:12px;border:1px solid var(--line)}
.ocr-line{font-family:var(--f-mono);font-size:11.5px;white-space:pre-wrap;color:var(--muted);max-height:160px;overflow:auto;background:var(--surface-2);border-radius:10px;padding:8px 10px}
</style>`);

/* ---------- countries and currencies ---------- */
const COUNTRIES=[
 ['UG','Uganda','UGX','en'],['KE','Kenya','KES','en'],['TZ','Tanzania','TZS','sw'],['RW','Rwanda','RWF','en'],
 ['BI','Burundi','BIF','fr'],['CD','DR Congo','CDF','fr'],['SS','South Sudan','SSP','en'],['ET','Ethiopia','ETB','en'],
 ['NG','Nigeria','NGN','en'],['GH','Ghana','GHS','en'],['ZA','South Africa','ZAR','en'],['ZM','Zambia','ZMW','en'],
 ['MW','Malawi','MWK','en'],['SN','Senegal','XOF','fr'],['CI',"Côte d'Ivoire",'XOF','fr'],['CM','Cameroon','XAF','fr'],
 ['EG','Egypt','EGP','en'],['MA','Morocco','MAD','fr'],['XX','Another country','USD','en']];
const CURRENCIES={UGX:['Ugandan shilling',0],KES:['Kenyan shilling',0],TZS:['Tanzanian shilling',0],RWF:['Rwandan franc',0],BIF:['Burundian franc',0],CDF:['Congolese franc',0],SSP:['South Sudanese pound',0],ETB:['Ethiopian birr',2],NGN:['Nigerian naira',0],GHS:['Ghanaian cedi',2],ZAR:['South African rand',2],ZMW:['Zambian kwacha',2],MWK:['Malawian kwacha',0],XOF:['West African CFA franc',0],XAF:['Central African CFA franc',0],EGP:['Egyptian pound',2],MAD:['Moroccan dirham',2],USD:['US dollar',2],EUR:['Euro',2],GBP:['British pound',2]};
/* Approximate starting rates per 1 US dollar. Shown as approximate; "Update rates" fetches today's. */
const APPROX_PER_USD={UGX:3700,KES:129,TZS:2600,RWF:1430,BIF:2950,CDF:2850,SSP:0,ETB:135,NGN:1550,GHS:11.5,ZAR:18,ZMW:26,MWK:1740,XOF:570,XAF:570,EGP:49,MAD:9.4,USD:1,EUR:.88,GBP:.76};
const CUR=()=>(S.settings&&S.settings.currency)||'UGX';
const curDec=c=>(CURRENCIES[c]||[0,0])[1];
const country=()=>COUNTRIES.find(c=>c[0]===((S.settings&&S.settings.country)||'UG'))||COUNTRIES[0];
const fmtNum=(n,c)=>{const d=curDec(c||CUR());const v=Math.abs(n);return v.toLocaleString('en-US',{minimumFractionDigits:d&&v%1?d:0,maximumFractionDigits:d})};
num=n=>fmtNum(n);
ugx=n=>(n<0?'−':'')+CUR()+' '+fmtNum(n);
const money=(n,c)=>(n<0?'−':'')+(c||CUR())+' '+fmtNum(n,c);
kf=n=>{const a=Math.abs(n);const d=curDec(CUR());return (n<0?'−':'')+(a>=1e6?(a/1e6).toFixed(a>=1e7?1:2).replace(/\.?0+$/,'')+'M':a>=1e4||(!d&&a>=1e3)?Math.round(a/1e3)+'k':fmtNum(a))};
/* Home-currency value of one unit of currency c */
function rateOf(c){const h=CUR();if(!c||c===h)return 1;const r=(S.rates&&S.rates.perUsd)||APPROX_PER_USD;const a=r[c]||APPROX_PER_USD[c],b=r[h]||APPROX_PER_USD[h];return a&&b?b/a:1}
const acctRate=a=>a&&a.currency&&a.currency!==CUR()?(a.rate||rateOf(a.currency)):1;
const inHome=a=>(a.bal||0)*acctRate(a);

/* ---------- provider catalogue (badge colours only, not company logos) ---------- */
const P=(id,name,short,c,fg,kind,cc)=>({id,name,short,c,fg,kind,cc});
const PROVIDERS=[
 P('mtn-ug','MTN MoMo','MTN','#FFCB05','#1A1A1A','momo','UG'),P('airtel-ug','Airtel Money','A','#E40000','#fff','momo','UG'),
 P('stanbic-ug','Stanbic Bank','SB','#0033A1','#fff','bank','UG'),P('centenary','Centenary Bank','CB','#173B7A','#fff','bank','UG'),
 P('absa-ug','Absa Bank','absa','#AF144B','#fff','bank','UG'),P('dfcu','dfcu Bank','dfcu','#0B6B3A','#fff','bank','UG'),
 P('equity-ug','Equity Bank','EQ','#9E2A2B','#fff','bank','UG'),P('hfb','Housing Finance Bank','HFB','#0A4D8C','#fff','bank','UG'),
 P('stanchart-ug','Standard Chartered','SC','#0072AA','#fff','bank','UG'),P('kcb-ug','KCB Bank','KCB','#00843D','#fff','bank','UG'),
 P('boa-ug','Bank of Africa','BOA','#0093D0','#fff','bank','UG'),P('dtb-ug','Diamond Trust Bank','DTB','#C8102E','#fff','bank','UG'),
 P('postbank','PostBank Uganda','PBU','#004B93','#fff','bank','UG'),P('im-ug','I&M Bank','I&M','#D52B1E','#fff','bank','UG'),
 P('mpesa-ke','M-Pesa','M','#3DAE2B','#fff','momo','KE'),P('airtel-ke','Airtel Money','A','#E40000','#fff','momo','KE'),
 P('tkash','T-Kash','T','#0057A8','#fff','momo','KE'),P('equity-ke','Equity Bank','EQ','#9E2A2B','#fff','bank','KE'),
 P('kcb-ke','KCB Bank','KCB','#00843D','#fff','bank','KE'),P('coop','Co-operative Bank','Co-op','#00753A','#fff','bank','KE'),
 P('ncba','NCBA Bank','NCBA','#1B1B3A','#fff','bank','KE'),P('absa-ke','Absa Bank','absa','#AF144B','#fff','bank','KE'),
 P('stanbic-ke','Stanbic Bank','SB','#0033A1','#fff','bank','KE'),P('family-ke','Family Bank','FB','#5A2D82','#fff','bank','KE'),
 P('mpesa-tz','M-Pesa (Vodacom)','M','#E60000','#fff','momo','TZ'),P('mixx-tz','Mixx by Yas','Yas','#00377B','#fff','momo','TZ'),
 P('airtel-tz','Airtel Money','A','#E40000','#fff','momo','TZ'),P('halopesa','HaloPesa','H','#F58220','#fff','momo','TZ'),
 P('crdb','CRDB Bank','CRDB','#008C45','#fff','bank','TZ'),P('nmb','NMB Bank','NMB','#0B4EA2','#fff','bank','TZ'),P('nbc','NBC Bank','NBC','#003A70','#fff','bank','TZ'),
 P('mtn-rw','MTN MoMo','MTN','#FFCB05','#1A1A1A','momo','RW'),P('airtel-rw','Airtel Money','A','#E40000','#fff','momo','RW'),
 P('bk-rw','Bank of Kigali','BK','#0A3D7A','#fff','bank','RW'),P('equity-rw','Equity Bank','EQ','#9E2A2B','#fff','bank','RW'),
 P('opay','OPay','O','#1DCF9F','#06281F','momo','NG'),P('palmpay','PalmPay','P','#6D28D9','#fff','momo','NG'),P('moniepoint','Moniepoint','M','#0357EE','#fff','bank','NG'),
 P('gtbank','GTBank','GT','#DD4F05','#fff','bank','NG'),P('access','Access Bank','AB','#F37021','#fff','bank','NG'),P('zenith','Zenith Bank','Z','#E30613','#fff','bank','NG'),
 P('firstbank','First Bank','FB','#003B65','#fff','bank','NG'),P('uba','UBA','UBA','#D42E12','#fff','bank','NG'),P('kuda','Kuda','K','#40196D','#fff','bank','NG'),
 P('mtn-gh','MTN MoMo','MTN','#FFCB05','#1A1A1A','momo','GH'),P('telecel-gh','Telecel Cash','T','#E60000','#fff','momo','GH'),P('at-gh','AT Money','AT','#0057B8','#fff','momo','GH'),
 P('gcb','GCB Bank','GCB','#F7B500','#1A1A1A','bank','GH'),P('ecobank-gh','Ecobank','E','#00557F','#fff','bank','GH'),
 P('capitec','Capitec','C','#00A0DF','#fff','bank','ZA'),P('fnb','FNB','FNB','#00A3AD','#fff','bank','ZA'),P('stdbank-za','Standard Bank','SB','#0033A1','#fff','bank','ZA'),
 P('absa-za','Absa','absa','#AF144B','#fff','bank','ZA'),P('nedbank','Nedbank','N','#00634A','#fff','bank','ZA'),P('tyme','TymeBank','T','#F7B500','#1A1A1A','bank','ZA'),
 P('mtn-zm','MTN MoMo','MTN','#FFCB05','#1A1A1A','momo','ZM'),P('airtel-zm','Airtel Money','A','#E40000','#fff','momo','ZM'),
 P('airtel-mw','Airtel Money','A','#E40000','#fff','momo','MW'),P('mpamba','TNM Mpamba','TNM','#00A0E1','#fff','momo','MW'),
 P('wave','Wave','W','#1DC4FF','#062B3B','momo','SN CI'),P('orange-money','Orange Money','OM','#FF7900','#1A1A1A','momo','SN CI CM CD'),
 P('mtn-cm','MTN MoMo','MTN','#FFCB05','#1A1A1A','momo','CM CI'),P('telebirr','telebirr','tb','#0A9CDE','#fff','momo','ET'),P('cbe','Commercial Bank of Ethiopia','CBE','#6B1E74','#fff','bank','ET'),
 P('mpesa-cd','M-Pesa','M','#E60000','#fff','momo','CD'),P('lumicash','Lumicash','L','#0B8F3C','#fff','momo','BI'),P('mgurush','m-Gurush','mG','#00843D','#fff','momo','SS'),
 P('xeno','Xeno','X','#00A3A1','#fff','invest','UG KE'),P('nssf-ug','NSSF Uganda','NSSF','#0B5DA6','#fff','invest','UG'),P('uap-om','UAP Old Mutual','OM','#008A3E','#fff','invest','UG KE'),
 P('britam','Britam','B','#C8102E','#fff','invest','UG KE TZ RW'),P('icea','ICEA LION','IL','#1B365D','#fff','invest','UG KE TZ'),P('sanlam','Sanlam','S','#0075C9','#fff','invest','UG KE ZA'),
 P('cash','Cash','','#2F8A5B','#fff','cash','*'),P('sacco','SACCO','SACCO','#8D6B42','#fff','sacco','*'),P('vsla','Savings group (VSLA)','VSLA','#B5651D','#fff','sacco','*'),
 P('bank-other','Other bank','Bank','#2558B0','#fff','bank','*'),P('momo-other','Other mobile money','MM','#5A6F6B','#fff','momo','*'),P('invest-other','Other investment','Inv','#5B6FD6','#fff','invest','*')];
const provider=id=>PROVIDERS.find(p=>p.id===id);
const providersFor=cc=>PROVIDERS.filter(p=>p.cc==='*'||p.cc.split(' ').includes(cc));
const KIND_LABEL={momo:'Mobile money',bank:'Bank',cash:'Cash',sacco:'SACCO / savings group',invest:'Investment',other:'Other'};
function acctBadge(a,size){size=size||40;const p=provider(a.provider)||{};const r=Math.round(size*.3);
 if(a.img)return `<span class="pbadge" style="width:${size}px;height:${size}px;border-radius:${r}px;background:var(--surface-2)"><img src="${a.img}" alt=""></span>`;
 const short=p.short!=null&&p.short!==''?p.short:(p.kind==='cash'?'':initials(a.name));
 if(!short)return `<span class="pbadge" style="width:${size}px;height:${size}px;border-radius:${r}px;background:${a.c||p.c||'#2F8A5B'};color:#fff">${ic('wallet',Math.round(size*.5))}</span>`;
 const fs=Math.round(size*(short.length<=2?.42:short.length===3?.32:short.length===4?.27:.22));
 return `<span class="pbadge" style="width:${size}px;height:${size}px;border-radius:${r}px;background:${a.c||p.c||'#5A6F6B'};color:${p.fg||'#fff'};font-size:${fs}px">${esc(short)}</span>`}

/* ---------- subcategories ---------- */
const SUBS={
 food:['Groceries & market','Eating out','Snacks & drinks','Household supplies'],
 transport:['Boda boda','Taxi (matatu)','Ride-hailing (Uber, Bolt, SafeBoda)','Fuel','Bus & long distance','Parking & repairs'],
 utilities:['Electricity','Water','Gas & charcoal','Rubbish & security'],
 airtime:['Airtime','Data bundles','Home internet'],
 rent:['Rent','Repairs & maintenance','Furniture & appliances'],
 school:['School fees','Uniforms, books & supplies','School transport & lunch','University & college'],
 health:['Pharmacy & medicine','Clinic & hospital','Lab tests','Dental & eye care','Health insurance'],
 entertainment:['Outings','TV & streaming','Events & parties','Sports & hobbies','Betting & lottery'],
 savings:['SACCO','Goal savings','Investment','Savings group'],
 business:['Stock & supplies','Wages','Business transport','Other business costs'],
 family:['Support to parents','Children','Relatives','Contributions (weddings, funerals)'],
 personal:['Hair & salon','Clothes & shoes','Toiletries','Gym & fitness'],
 other:['Church & giving','Mobile money & bank fees','Other']};
const SUB_WORDS=[
 ['transport','Boda boda',/boda|safe ?rides?/i],['transport','Ride-hailing (Uber, Bolt, SafeBoda)',/uber|bolt|safeboda|faras|little cab/i],['transport','Taxi (matatu)',/\btaxi|matatu|commuter/i],
 ['transport','Fuel',/fuel|petrol|diesel|shell|total ?energies|stabex|rubis|vivo energy/i],['transport','Bus & long distance',/\bbus\b|coach|link bus|gateway|jaguar|y\.?y\. coaches/i],['transport','Parking & repairs',/parking|mechanic|garage|tyre|car wash/i],
 ['food','Eating out',/restaurant|cafe|café|canteen|lunch|supper|dinner|breakfast|rolex|chapati|chips|pizza|kfc|java house|cafe javas|take ?away/i],['food','Snacks & drinks',/soda|snack|drink|juice|water bottle|biscuit/i],['food','Household supplies',/soap|detergent|tissue|toilet paper|omo|nice ?& ?lovely/i],['food','Groceries & market',/market|supermarket|shoppers|fresh mart|carrefour|quality|mega standard|groceries|matooke|posho|beans|sugar|rice|milk|bread/i],
 ['utilities','Electricity',/umeme|yaka|electric|power|kplc|tanesco|luku|prepaid token/i],['utilities','Water',/nwsc|water/i],['utilities','Gas & charcoal',/\bgas\b|charcoal|cylinder/i],['utilities','Rubbish & security',/rubbish|garbage|security|askari/i],
 ['airtime','Data bundles',/data|bundle|\bgb\b|\bmb\b/i],['airtime','Home internet',/internet|wifi|wi-fi|fibre|fiber|starlink|roke|liquid/i],['airtime','Airtime',/airtime|top ?up|recharge/i],
 ['school','University & college',/university|college|makerere|kyambogo|ucu|tuition/i],['school','Uniforms, books & supplies',/uniform|book|stationery|exercise book|pens?\b/i],['school','School transport & lunch',/school (van|bus|lunch)/i],['school','School fees',/school|fees|term/i],
 ['health','Pharmacy & medicine',/pharmacy|chemist|drug|medicine|tablets|syrup/i],['health','Lab tests',/\blab|\btests?\b|\bscan|x-?ray|ultrasound/i],['health','Dental & eye care',/dental|dentist|teeth|optical|eye|glasses|spectacles/i],['health','Health insurance',/insurance|jubilee|aar|medical cover/i],['health','Clinic & hospital',/clinic|hospital|doctor|consult|nakasero|mulago|ibn|medical/i],
 ['entertainment','Betting & lottery',/\bbet(s|ting|way)?\b|sportpesa|fortebet|gal sport|lottery|lotto/i],['entertainment','TV & streaming',/dstv|gotv|startimes|netflix|showmax|azam|zuku|spotify|youtube/i],['entertainment','Events & parties',/party|event|concert|ticket|wedding/i],['entertainment','Outings',/cinema|movie|outing|club|bar\b|beer/i],
 ['personal','Hair & salon',/salon|barber|\bhair|braid|\bnails?\b/i],['personal','Clothes & shoes',/\bcloth|\bshoes?\b|shirt|dress|trouser|owino/i],['personal','Gym & fitness',/gym|fitness/i],['personal','Toiletries',/toilet|lotion|perfume|deodorant|vaseline/i],
 ['family','Support to parents',/\bmum\b|\bmom\b|\bdad\b|mother|father|maama|taata/i],['family','Children',/child|\bkids?\b|\bson\b|daughter|\bbaby\b/i],['family','Contributions (weddings, funerals)',/funeral|burial|wedding|introduction|kwanjula|kukyala|contribution|pledge/i],['family','Relatives',/sister|brother|\baunt|uncle|cousin|\bgrand(ma|pa|mother|father|parents?)\b/i],
 ['savings','SACCO',/sacco/i],['savings','Investment',/xeno|unit trust|money market|treasury|t-?bill|bond|shares|nssf|britam|old mutual|icea|sanlam/i],['savings','Savings group',/vsla|savings group|chama|merry ?go ?round|ekibiina/i],
 ['other','Church & giving',/church|tithe|offering|mosque|zakat|donation|charity/i],['other','Mobile money & bank fees',/\bfee\b|charges?|ledger|commission/i],
 ['rent','Rent',/rent|landlord/i],['rent','Repairs & maintenance',/repair|plumb|paint|fundi|maintenance/i],
 ['business','Stock & supplies',/stock|supplier|wholesale|restock/i],['business','Wages',/wage|salary for|casual worker|staff pay/i]];
function guessSub(c,text){for(const[cc,sub,re]of SUB_WORDS)if(cc===c&&re.test(text))return sub;return null}
function guessCatSub(text){for(const[cc,sub,re]of SUB_WORDS)if(re.test(text))return[cc,sub];return[guessCat(text),null]}
const subOf=t=>t.sub||(t.kind==='out'?guessSub(t.cat,t.title+' '+(t.sms||'')):null);

/* ---------- kinds of transaction ---------- */
/* in: income · out: spending · lend: lent to someone · move: withdrawal to cash
   borrow: loan or advance received (not income) · repay: repaying a loan or advance (not spending) */
const effOf=t=>(t.kind==='in'||t.kind==='borrow')?t.amt:-t.amt;
const baseCatOf=catOf;
catOf=t=>t.kind==='borrow'?{name:t.debt==='advance'?'Advance received':'Loan received',c:'var(--warn)',ic:'hand'}:t.kind==='repay'?{name:t.debt==='advance'?'Advance repaid':'Loan repayment',c:'var(--muted)',ic:'hand'}:baseCatOf(t);
srcTag=s=>({sms:'SMS',receipt:'Receipt',manual:'Manual',whatsapp:'WhatsApp',import:'Import'}[s]||'');

/* ---------- totals that understand currencies, advances and assets ---------- */
acctTotal=()=>S.accounts.reduce((a,x)=>a+inHome(x),0);
let acctDebt=a=>((a.advUsed||0)+(a.loanOwed||0))*acctRate(a);
let providerDebt=()=>S.accounts.reduce((s,a)=>s+acctDebt(a),0);
const assetTotal=()=>(S.assets||[]).reduce((s,x)=>s+(+x.value||0),0);
const loansTaken=()=>S.loans.filter(l=>l.dir==='in').reduce((a,l)=>a+l.amt-l.paid,0);
netWorth=()=>acctTotal()+invTotal()+owedToMe()+assetTotal()-loansTaken()-providerDebt();

/* ---------- moving older saved data to the build 3 shape ---------- */
const OLD_ACCT={mtn:'mtn-ug',airtel:'airtel-ug',bank:'bank-other',cash:'cash',sacco:'sacco'};
function normalizeAccount(a){
 if(!a.provider)a.provider=OLD_ACCT[a.id]||(/sacco/i.test(a.type||'')?'sacco':/bank/i.test(a.type||'')?'bank-other':/mobile/i.test(a.type||'')?'momo-other':/invest/i.test(a.type||'')?'invest-other':/cash/i.test(a.type||'')?'cash':'bank-other');
 const p=provider(a.provider)||{};
 a.kind=a.kind||p.kind||'other';a.currency=a.currency||CUR();
 ['advLimit','advUsed','loanLimit','loanOwed'].forEach(k=>{a[k]=+a[k]||0});
 if(!a.c)a.c=p.c;return a}
window.kasenteMigrate=function(had){
 S.settings.country=S.settings.country||'UG';S.settings.currency=S.settings.currency||'UGX';S.settings.lang=S.settings.lang||'en';
 S.accounts.forEach(normalizeAccount);
 S.assets=S.assets||[];S.alerts=S.alerts||[];
 S.game=S.game||{days:{},points:0,best:0,badges:[],log:[]};
 if(S.mode==='sample'&&!S.household)S.household=sampleHousehold();
 if(S.mode==='sample'&&!S.assets.length)S.assets=[{id:'as1',type:'land',name:'Plot in Mukono (50×100)',value:18000000,note:'Bought 2023'},{id:'as2',type:'vehicle',name:'Boda boda (rented out)',value:3500000,note:'Earns 70k a week'}];
 if(S.mode==='sample')S.accounts.forEach(a=>{if(a.provider==='mtn-ug'&&!a.advLimit){a.advLimit=150000;a.advUsed=0;a.loanLimit=100000}});
};
function sampleHousehold(){return{name:'Nambi household',members:[{id:'m1',name:'Sarah',role:'adult',me:true},{id:'m2',name:'David',role:'adult'},{id:'m3',name:'Grace',role:'child',allowance:300000,note:'Makerere student'},{id:'m4',name:'Ethan',role:'child',allowance:20000,note:'P.4'}],familyBudget:900000}}

/* the sample month gets subcategories and household tags so the new screens have something to show */
(function enrichSample(){const S0=JSON.parse(SAMPLE_SNAPSHOT);const fam=/Mum|Ethan|Rent|Capital Shoppers|market|matooke|Nakasero|UMEME|NWSC/i;
 S0.txns.forEach(t=>{if(t.kind==='out'){t.sub=guessSub(t.cat,t.title)||null;t.for=t.cat==='school'?'m4':fam.test(t.title)?'family':'me'}});
 S0.accounts.forEach(normalizeAccount);S0.household=sampleHousehold();
 S0.assets=[{id:'as1',type:'land',name:'Plot in Mukono (50×100)',value:18000000,note:'Bought 2023'},{id:'as2',type:'vehicle',name:'Boda boda (rented out)',value:3500000,note:'Earns 70k a week'}];
 S0.accounts.forEach(a=>{if(a.provider==='mtn-ug'){a.advLimit=150000;a.loanLimit=100000}});
 S0.game={days:{},points:0,best:0,badges:[],log:[]};S0.alerts=[];
 S0.settings={...S0.settings,country:'UG',currency:'UGX',lang:'en'};
 SAMPLE_SNAPSHOT=JSON.stringify(S0)})();
const baseStartFresh=startFresh;
startFresh=function(name,pdy){baseStartFresh(name,pdy);Object.assign(S,{household:null,assets:[],alerts:[],game:{days:{},points:0,best:0,badges:[],log:[]}});S.accounts.forEach(normalizeAccount)};
