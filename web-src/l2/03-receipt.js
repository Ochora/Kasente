/* ===== Build 3 · receipts: photo → text (on the phone) → shop, date, items, total ===== */
const RC_SKIP=/\b(sub-?\s?total|total|vat|tax|tin|change|cash|tendered|paid|balance|amount|discount|card|mobile money|momo|m-?pesa|airtel|receipt|invoice|tel|phone|mob|date|time|till|qty|items?\s*(count|sold)?|thank|served|cashier|no\.|served by|customer|efris|fdn|verification|code|plot|p\.?\s?o\.?\s?box|rounding|points|loyalty|www|email|pin)\b/i;
const RC_TOTAL=/\b(grand\s*total|total\s*(amount|due|payable|ugx|kes|tzs)?|amount\s*(due|payable)|net\s*(total|amount)|to\s*pay|total\s*incl)\b/i;
function rcNumber(tok){let s=tok.replace(/\s/g,'');
 if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s))return parseFloat(s.replace(/,/g,''));
 if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))return parseFloat(s.replace(/\./g,'').replace(',','.'));
 if(/^\d+[.,]\d{1,2}$/.test(s))return parseFloat(s.replace(',','.'));
 if(/^\d+$/.test(s))return parseFloat(s);return NaN}
function rcRowAmount(text){const m=text.match(/(\d{1,3}(?:[,.\s]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:\/=|\/-|=|[A-Za-z]{1,3})?\s*$/);if(!m)return null;
 const v=rcNumber(m[1]);if(!(v>0)||v>1e9)return null;const before=text.slice(0,m.index).trim();
 if(/[:]\s*$/.test(before)&&/time|date/i.test(before))return null;return{v,before}}
function rcRows(input){let lines=(input.lines||[]).filter(l=>l.t&&l.t.trim());
 if(!lines.length||lines.every(l=>l.y==null))return String(input.text||'').split(/\n/).map(t=>t.trim()).filter(Boolean);
 const hs=lines.map(l=>l.h||20).sort((a,b)=>a-b);const tol=(hs[Math.floor(hs.length/2)]||20)*.6;
 lines=lines.map(l=>({...l,cy:l.y+(l.h||0)/2})).sort((a,b)=>a.cy-b.cy);const rows=[];
 lines.forEach(l=>{const r=rows.find(r=>Math.abs(r.cy-l.cy)<=tol);if(r){r.items.push(l);r.cy=(r.cy*(r.items.length-1)+l.cy)/r.items.length}else rows.push({cy:l.cy,items:[l]})});
 return rows.sort((a,b)=>a.cy-b.cy).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.t.trim()).join('  '))}
function rcDate(text){const M='jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');let m;
 if((m=text.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/)))return `${m[1]}-${String(+m[2]).padStart(2,'0')}-${String(+m[3]).padStart(2,'0')}`;
 if((m=text.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/))){let d=+m[1],mo=+m[2],y=+m[3];if(y<100)y+=2000;if(mo>12&&d<=12)[d,mo]=[mo,d];if(mo>=1&&mo<=12&&d>=1&&d<=31&&y>2000&&y<2100)return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
 if((m=text.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.-]*(\d{2,4})\b/i))){let y=+m[3];if(y<100)y+=2000;return `${y}-${String(M.indexOf(m[2].toLowerCase())+1).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`}
 if((m=text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2}),?\s*(\d{4})\b/i)))return `${m[3]}-${String(M.indexOf(m[1].toLowerCase())+1).padStart(2,'0')}-${String(+m[2]).padStart(2,'0')}`;
 return null}
function parseReceipt(input){const rows=rcRows(input);const text=rows.join('\n');
 const isJunk=r=>/^\+?\d[\d\s-]{7,}$/.test(r.trim())||/\b(tel|tin|mob|phone|p\.?o\.?\s?box|www\.|@)\b/i.test(r);
 let merchant='';for(const r of rows.slice(0,5)){const letters=(r.match(/[A-Za-z]/g)||[]).length;if(letters>=3&&!isJunk(r)&&!rcDate(r)&&!/^(receipt|invoice|tax invoice|cash sale|sales receipt|welcome)$/i.test(r.trim())&&!/\b(plot|road|rd\.?|street|st\.|avenue|box)\b/i.test(r)){merchant=r.replace(/\s{2,}/g,' ').trim();break}}
 let totalIdx=-1,total=0;rows.forEach((r,i)=>{if(RC_TOTAL.test(r)&&!/sub-?\s?total/i.test(r)){const a=rcRowAmount(r)||rcRowAmount((rows[i+1]||''));if(a&&(/grand|payable|due/i.test(r)||a.v>=total)){total=a.v;totalIdx=i}}});
 const items=[];const end=totalIdx>=0?totalIdx:rows.length;let pending='';
 for(let i=0;i<end;i++){const r=rows[i];if(merchant&&r.replace(/\s{2,}/g,' ').trim()===merchant)continue;if(isJunk(r)||rcDate(r)&&!/[a-z]{4}/i.test(r.replace(rcDate(r)||'','')))continue;
  const a=rcRowAmount(r);const letters=(r.match(/[A-Za-z]/g)||[]).length;
  if(!a){if(letters>=3&&!RC_SKIP.test(r))pending=r;continue}
  let name=a.before.replace(/\s*\d+(?:[.,]\d+)?\s*[x@*×]\s*[\d,.]+\s*$/i,'').replace(/\s*[x@*×]\s*\d+\s*$/i,'').replace(/^\d+\s*[x@*×]?\s+/,'').replace(/\s{2,}/g,' ').trim();
  if((name.match(/[A-Za-z]/g)||[]).length<2){if(pending){name=pending}else continue}
  if(RC_SKIP.test(name))continue;pending='';
  if(a.v>(total||Infinity))continue;items.push([cap(name.toLowerCase()).slice(0,48),a.v])}
 if(!total){const all=rows.filter(r=>!isJunk(r)).map(rcRowAmount).filter(Boolean).map(a=>a.v);total=all.length?Math.max(...all):0}
 const sum=items.reduce((s,x)=>s+x[1],0);
 return{merchant:merchant?titleCase(merchant).slice(0,60):'',date:rcDate(text),items,total,sum,rows}}
window.kasenteTestReceipt=t=>parseReceipt({text:t});

/* ---------- scan screen ---------- */
const SCAN_KEY='kasente.scan';
const saveScan=()=>{try{if(SCAN)localStorage.setItem(SCAN_KEY,JSON.stringify({...SCAN,img:SCAN.img&&SCAN.img.startsWith('data:')&&SCAN.img.length>400000?'':SCAN.img}));else localStorage.removeItem(SCAN_KEY)}catch(e){}};
(function(){try{const j=localStorage.getItem(SCAN_KEY);if(j)SCAN=JSON.parse(j)}catch(e){}})();
const canOcr=()=>!!(NATIVE&&NATIVE.scanReceipt);
SCREENS.scan=()=>{if(SCAN&&SCAN.status==='reading')return `<div class="card stack" style="align-items:center;text-align:center;padding:32px 16px;gap:14px"><span class="chip" style="--c:var(--accent);width:64px;height:64px">${ic('scan',30)}</span><b style="font-size:17px">Reading your receipt…</b><p class="small muted">This happens on your phone and takes a few seconds.</p><div class="typing"><span></span><span></span><span></span></div><button class="btn sm" data-act="scanReset">Cancel</button></div>`;
 if(SCAN)return scanResult2();
 return `${canOcr()?`<button class="drop" data-act="scanCam" style="width:100%">${ic('camera',32)}<b>Take a photo of the receipt</b><span class="small muted">Hold the phone flat above it, in good light, with the whole receipt in view.</span><span class="btn sm primary" style="margin-top:6px">${ic('camera',16)}Open camera</span></button><button class="btn block" data-act="scanGallery">${ic('upload')}Choose a photo you already took</button>`
 :`<label class="drop" for="rcpt">${ic('camera',32)}<b>Choose a receipt photo</b><span class="small muted">In the Android app the text is read automatically. Here you type the items.</span><span class="btn sm primary" style="margin-top:6px">${ic('upload',16)}Choose image</span></label><input id="rcpt" type="file" accept="image/*" hidden data-live="rcpt">`}
 <button class="btn block" data-act="sampleReceipt">${ic('receipt')}Try a sample receipt</button>
 <div class="card stack" style="gap:8px"><b>No receipt? Type it.</b><p class="small muted">"beans and posho from Grace's stall, 12,000/=" works fine. Kasente picks out the amount and suggests a category.</p><button class="btn sm" data-act="add">Write a quick note</button></div>
 <div class="note">${ic('shield')}<span class="small">Receipts are read on your phone with no internet needed. A smaller copy of the photo is kept inside Kasente with the expense.</span></div>`};
function scanResult2(){const s=SCAN;const sum=s.items.reduce((a,x)=>a+(+x[1]||0),0);const tot=+s.total||sum;
 const guess=guessCatSub(s.merchant+' '+s.items.map(x=>x[0]).join(' '));const hh=S.household;
 const match=s.total&&sum?Math.abs(sum-s.total)<=Math.max(1,s.total*.01):false;
 return `
 ${s.img?`<img class="thumb" src="${s.img}" alt="Your receipt">`:s.sample?`<div class="receipt" aria-label="Sample receipt"><div class="c"><b>KISAASI FRESH MART</b><br>Kisaasi Rd, Kampala<br>02/10/2026 18:42</div><hr>${SAMPLE_RECEIPT.items.map(x=>`<div class="r"><span>${x[0]}</span><span>${num(x[1])}</span></div>`).join('')}<hr><div class="r"><b>TOTAL</b><b>${num(52000)}</b></div><div class="c" style="margin-top:6px">Cash · Thank you!</div></div>`:''}
 ${s.error?`<div class="note warn">${ic('alert')}<span class="small">${esc(s.error)} Type the details below instead.</span></div>`
  :s.manual?`<div class="note">${ic('info')}<span class="small">Type the shop, items and amounts from your photo.</span></div>`
  :`<div class="note ${match?'':'warn'}">${ic(match?'check':'alert')}<span class="small">${s.items.length?`<b>Read ${s.items.length} item${s.items.length>1?'s':''}.</b> `:'<b>No items found.</b> '}${match?'They add up to the receipt total.':s.total?`Items add up to ${num(sum)} but the receipt total says ${num(s.total)}. Check for missed or misread lines.`:'Check the amounts before saving.'}</span></div>`}
 <form class="card stack" data-form="scan">
  <div class="grid2"><label class="field"><span>Shop</span><input name="merchant" value="${esc(s.merchant)}" placeholder="Shop name"></label><label class="field"><span>Date</span><input name="date" type="date" value="${s.date||ymd(TODAY0)}"></label></div>
  <div class="field"><span>Items</span><div class="stack" id="items" style="gap:6px">${s.items.map((x,i)=>`<div class="itemrow"><input value="${esc(x[0])}" data-i="${i}" data-k="0" data-live="item" aria-label="Item name" placeholder="Item"><input class="tnum" type="number" inputmode="decimal" step="any" value="${x[1]||''}" data-i="${i}" data-k="1" data-live="item" aria-label="Item amount" placeholder="0"><button type="button" class="icon-btn" style="width:30px;height:30px;border:0;background:none" data-act="rmItem" data-arg="${i}" aria-label="Remove item">${ic('x',16)}</button></div>`).join('')}</div><button type="button" class="link small" style="align-self:flex-start" data-act="addItem">+ Add item</button></div>
  <div class="grid2"><label class="field"><span>Category</span><select name="cat" data-live="catSub">${catOptions(guess[0]==='income'?'food':guess[0])}</select></label><label class="field"><span>Detail</span><select name="sub">${subOptions(guess[0],guess[1])}</select></label></div>
  <div class="grid2"><label class="field"><span>Paid with</span><select name="acct">${acctOptions((S.accounts.find(a=>a.kind==='cash')||S.accounts[0]||{}).id)}</select></label>${hh?`<label class="field"><span>For</span><select name="for">${forOptions('me')}</select></label>`:'<span></span>'}</div>
  <label class="field"><span>Total to save</span><input name="total" id="scanTotalIn" type="number" inputmode="decimal" step="any" value="${tot||''}"></label>
  <div class="between xs muted"><span>Items add up to <b class="tnum" id="scanTotal">${ugx(sum)}</b></span><button type="button" class="link xs" data-act="useSum">Use this</button></div>
  ${s.rows&&s.rows.length?`<details><summary class="xs muted" style="cursor:pointer">Text read from the receipt</summary><div class="ocr-line" style="margin-top:6px">${esc(s.rows.join('\n'))}</div></details>`:''}
  <button class="btn primary">Save expense</button><button type="button" class="btn" data-act="scanReset">Scan another</button>
 </form>`}
ACT.scanCam=()=>{try{NATIVE.scanReceipt(true)}catch(e){toast("Couldn't open the camera.",'alert')}};
ACT.scanGallery=()=>{try{NATIVE.scanReceipt(false)}catch(e){toast("Couldn't open your photos.",'alert')}};
window.kasenteReceiptReading=()=>{SCAN={status:'reading'};saveScan();if(cur()!=='scan')go('scan');else refresh()};
window.kasenteReceiptReady=()=>{let raw='';try{raw=NATIVE.takeReceipt()}catch(e){}if(!raw)return;let r;try{r=JSON.parse(raw)}catch(e){return}
 if(!r.ok&&r.error==='cancelled'){if(SCAN&&SCAN.status==='reading'){SCAN=null;saveScan()}if(cur()==='scan')refresh();return}
 const p=r.ok?parseReceipt(r):{merchant:'',date:null,items:[],total:0,rows:[]};
 SCAN={merchant:p.merchant,date:p.date||ymd(TODAY0),items:p.items.length?p.items:[['',0]],total:p.total||0,rows:p.rows,img:r.img||'',error:r.ok?null:(r.error||"The text couldn't be read."),source:'ocr'};
 saveScan();if(cur()!=='scan')go('scan');else refresh();
 if(r.ok)toast(p.items.length?`Read ${p.items.length} item${p.items.length>1?'s':''} from the receipt. Check before saving.`:'Receipt read. Add the items if any are missing.','receipt')};
ACT.sampleReceipt=()=>{SCAN={...SAMPLE_RECEIPT,items:SAMPLE_RECEIPT.items.map(x=>[...x]),total:52000,sample:true,date:ymd(TODAY0)};saveScan();refresh()};
ACT.scanReset=()=>{if(SCAN&&SCAN.img&&SCAN.img.startsWith('receipts/')&&!SCAN.saved&&NATIVE&&NATIVE.deleteReceipt)try{NATIVE.deleteReceipt(SCAN.img)}catch(e){}SCAN=null;saveScan();refresh()};
ACT.rmItem=i=>{SCAN.items.splice(+i,1);if(!SCAN.items.length)SCAN.items.push(['',0]);saveScan();refresh()};
ACT.addItem=()=>{SCAN.items.push(['',0]);saveScan();refresh()};
ACT.useSum=()=>{const s=SCAN.items.reduce((a,x)=>a+(+x[1]||0),0);SCAN.total=s;$('#scanTotalIn').value=s};
LIVE.item=el=>{SCAN.items[+el.dataset.i][+el.dataset.k]=el.dataset.k==='1'?+el.value:el.value;$('#scanTotal').textContent=ugx(SCAN.items.reduce((a,x)=>a+(+x[1]||0),0));saveScan()};
LIVE.rcpt=el=>{const f=el.files[0];if(!f)return;shrinkImage(f,1000,u=>{SCAN={merchant:'',date:ymd(TODAY0),items:[['',0]],img:u,manual:true,total:0};saveScan();refresh()})};
FORMS.scan=fd=>{const items=SCAN.items.filter(x=>(x[0]||'').trim()||+x[1]).map(x=>[(x[0]||'Item').trim(),+x[1]||0]);
 const sum=items.reduce((a,x)=>a+x[1],0);const tot=+fd.get('total')||sum;
 if(!tot){toast('Add the amounts or a total first.','alert');return}
 addTxn({acct:fd.get('acct'),kind:'out',amt:tot,cat:fd.get('cat'),sub:fd.get('sub')||null,for:fd.get('for')||'me',title:(fd.get('merchant')||'Receipt').trim(),src:'receipt',d:fd.get('date')+' '+stamp().slice(11),items,receipt:SCAN.img&&SCAN.img.startsWith('receipts/')?SCAN.img:null});
 SCAN.saved=true;SCAN=null;saveScan();refresh()};
