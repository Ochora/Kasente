/* ===== Build 3 · registration: about you → accounts and balances → household ===== */
const LANGS=[['en','English'],['sw','Kiswahili'],['fr','Français'],['lg','Luganda (coming soon)']];
const onbSteps=n=>`<div class="steps">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`;
const countryOptions=sel=>COUNTRIES.map(c=>`<option value="${c[0]}" ${c[0]===sel?'selected':''}>${esc(c[1])}</option>`).join('');
const langOptions=sel=>LANGS.map(([k,l])=>`<option value="${k}" ${k===sel?'selected':''} ${k==='lg'?'disabled':''}>${l}</option>`).join('');
function signInBox(){const acc=S.account;
 return acc?`<div class="card row" style="padding:12px 14px"><span class="avatar">${initials(acc.name||acc.email)}</span><div class="grow"><b>Signed in</b><div class="small muted" style="overflow-wrap:anywhere">${esc(acc.email)}</div></div><span class="pill good">${ic('check',12)} OneDrive</span></div>`
 :`<div class="card stack" style="gap:10px"><b>Your account</b><p class="small muted">Sign in with your Microsoft email so your data is kept in your own OneDrive and comes back if you change phones.</p><button type="button" class="btn block" style="background:var(--surface);border:1px solid var(--line)" data-act="signIn" ${cloudReady()?'':'disabled'}>${MS_ICON}Sign in with Microsoft</button><button type="button" class="btn block" disabled>Google Drive · coming soon</button><p class="xs muted">${cloudReady()?'Or skip this and keep everything on this phone only.':"Sign-in isn't switched on in this test build yet. Your data stays on this phone for now."}</p></div>`}
ACT.onbSetup=()=>{const o=$('#onb');o.hidden=false;const st=S.settings||{};const acc=S.account;
 o.innerHTML=`<div class="between"><span class="logo-mark">K</span><span class="xs muted">Step 1 of 3</span></div><div style="flex:1;overflow:auto;padding-top:14px">${onbSteps(1)}<h2>About you</h2><p>So Kasente uses your currency, language and pay cycle.</p>
 <form class="stack" data-form="setup" style="margin-top:18px">
  ${signInBox()}
  <label class="field"><span>Your name</span><input id="setupName" name="name" required autocomplete="name" placeholder="Your first name" value="${esc(acc&&acc.name?acc.name.split(/\s+/)[0]:'')}"></label>
  <div class="grid2"><label class="field"><span>Country</span><select name="country" data-live="onbCountry">${countryOptions(st.country||'UG')}</select></label><label class="field"><span>Currency</span><select name="currency" id="onbCur">${curOptions(st.currency||'UGX')}</select></label></div>
  <div class="grid2"><label class="field"><span>Language</span><select name="lang" data-live="onbLang">${langOptions(st.lang||'en')}</select></label><label class="field"><span>Usually paid on</span><select name="payday">${Array.from({length:31},(_,i)=>`<option value="${i+1}" ${i===24?'selected':''}>The ${ordinal(i+1)}</option>`).join('')}</select></label></div>
  <div class="field"><span>Start with</span>
   <label class="card row" style="padding:12px 14px;cursor:pointer"><input type="radio" name="mode" value="fresh" checked style="accent-color:var(--accent);width:20px;height:20px"><span class="grow"><b>My own money</b><br><span class="small muted">Set up your accounts next. Kasente reads your mobile money messages.</span></span></label>
   <label class="card row" style="padding:12px 14px;cursor:pointer"><input type="radio" name="mode" value="sample" style="accent-color:var(--accent);width:20px;height:20px"><span class="grow"><b>Sample data</b><br><span class="small muted">Explore with Sarah's example month in Uganda.</span></span></label></div>
  <button class="btn primary block">Continue</button></form></div>`};
LIVE.onbCountry=el=>{const c=COUNTRIES.find(x=>x[0]===el.value);if(!c)return;$('#onbCur').value=c[2];const l=el.form.querySelector('[name=lang]');if(l&&l.value==='en'&&c[3]!=='en'){l.value=c[3];LIVE.onbLang(l)}};
LIVE.onbLang=el=>{S.settings.lang=el.value;if(window.i18nApply)i18nApply(document.getElementById('phone'))};
FORMS.setup=fd=>{const name=(fd.get('name')||'').trim()||'Friend',pdy=+fd.get('payday')||25,cc=fd.get('country')||'UG',cur=fd.get('currency')||'UGX',lang=fd.get('lang')||'en';
 if(fd.get('mode')==='sample'){Object.assign(S,JSON.parse(SAMPLE_SNAPSHOT));S.mode='sample';S.settings={...S.settings,pin:hashPin('2580'),lock:false,payday:25,sms:false,lang};S.user={...S.user};kasenteMigrate(true);tick();$('#onb').hidden=true;stack=['home'];render();toast('Sample data loaded. Switch to your own data in Settings.','sparkle');return}
 startFresh(name,pdy);Object.assign(S.settings,{country:cc,currency:cur,lang});S.since=Date.now();
 S.accounts=[];tick();onbAccounts()};
function onbAccounts(){const o=$('#onb');const cc=country()[0];const list=providersFor(cc).filter(p=>p.kind!=='invest');
 const pre=new Set([list.find(p=>p.kind==='momo')?.id,'cash'].filter(Boolean));
 const sorted=[...list.filter(p=>p.kind==='momo'&&!p.id.endsWith('other')),...list.filter(p=>p.kind==='bank'&&!p.id.endsWith('other')),...list.filter(p=>['sacco','cash'].includes(p.kind)),...list.filter(p=>p.id.endsWith('other'))];
 o.innerHTML=`<div class="between"><button class="link" data-act="onbSetup">Back</button><span class="xs muted">Step 2 of 3</span></div><div style="flex:1;overflow:auto;padding-top:14px">${onbSteps(2)}<h2>Your accounts</h2><p>Tick the accounts you use and enter what's in them today. You can skip this and add them later.</p>
 <form data-form="onbAccounts" style="margin-top:16px" class="stack"><div class="list">${sorted.map(p=>`<label class="chk"><input type="checkbox" name="p" value="${p.id}" ${pre.has(p.id)?'checked':''} data-live="onbChk">${acctBadge({provider:p.id,name:p.name},34)}<span class="grow"><b>${esc(p.id.endsWith('other')?p.name+'…':p.name)}</b><span>${KIND_LABEL[p.kind]}</span></span></label>
  <div class="balin" data-for="${p.id}" ${pre.has(p.id)?'':'hidden'}>${p.id.endsWith('other')||p.kind==='sacco'?`<label class="field" style="grid-column:1/-1"><span>Name</span><input name="n_${p.id}" placeholder="${p.kind==='sacco'?'e.g. Teachers SACCO':'Name'}"></label>`:''}<label class="field"><span>Balance (${CUR()})</span><input name="b_${p.id}" type="number" inputmode="decimal" step="any" placeholder="0"></label>${p.kind==='momo'||p.kind==='bank'?`<label class="field"><span>${p.kind==='momo'?'Advance used now':'Loan owed now'}</span><input name="d_${p.id}" type="number" inputmode="decimal" step="any" placeholder="0"></label><label class="field"><span>${p.kind==='momo'?'Advance limit':'Overdraft / loan limit'}</span><input name="l_${p.id}" type="number" inputmode="decimal" step="any" placeholder="0"></label><label class="field"><span>${p.kind==='momo'?'Loan owed (e.g. MoKash)':'Other loan owed'}</span><input name="o_${p.id}" type="number" inputmode="decimal" step="any" placeholder="0"></label>`:'<span></span>'}</div>`).join('')}</div>
  <p class="xs muted">Balances update from your messages once SMS access is on. An account in another currency can be added later under Accounts.</p>
  <button class="btn primary block">Continue</button><button type="button" class="btn block" style="background:transparent" data-act="onbSkipAccounts">Skip for now</button></form></div>`}
LIVE.onbChk=el=>{const b=document.querySelector(`.balin[data-for="${el.value}"]`);if(b)b.hidden=!el.checked};
FORMS.onbAccounts=(fd,f)=>{const ids=fd.getAll('p');S.accounts=[];ids.forEach(pid=>{const p=provider(pid);const nm=(fd.get('n_'+pid)||'').trim();
  const a=newAccount(pid,{name:nm||p.name,bal:+fd.get('b_'+pid)||0,currency:CUR()});if(p.kind==='momo'){a.advUsed=+fd.get('d_'+pid)||0;a.advLimit=+fd.get('l_'+pid)||0;a.loanOwed=+fd.get('o_'+pid)||0}else if(p.kind==='bank'){a.loanOwed=(+fd.get('d_'+pid)||0)+(+fd.get('o_'+pid)||0);a.loanLimit=+fd.get('l_'+pid)||0}});
 ensureDefaults();onbFamily()};
ACT.onbSkipAccounts=()=>{ensureDefaults();onbFamily()};
function ensureDefaults(){if(!S.accounts.some(a=>a.kind==='cash'))newAccount('cash',{name:'Cash on hand'});if(!S.accounts.some(a=>a.kind==='momo')){const m=providersFor(country()[0]).find(p=>p.kind==='momo');if(m)newAccount(m.id)}}
function onbFamily(){const o=$('#onb');o.innerHTML=`<div class="between"><span class="logo-mark">K</span><span class="xs muted">Step 3 of 3</span></div><div style="flex:1;overflow:auto;padding-top:14px">${onbSteps(3)}<h2>Your household</h2><p>Do you manage money for a family? Kasente can keep personal and household spending apart and track allowances for children.</p>
 <div class="stack" style="margin-top:18px" id="famChoice"><button class="btn primary block" data-act="onbFamYes">${ic('people')}Yes, set up my household</button><button class="btn block" data-act="onbNextStep" data-arg="done">Not now, just me</button><p class="xs muted">You can switch this on later under More → Family.</p></div></div>`}
ACT.onbFamYes=()=>{$('#famChoice').outerHTML=`<div style="margin-top:14px">${householdForm(null,true)}</div>`};
FORMS.onbFamily=(fd,f)=>{S.household=readHousehold(f);ACT.onbNextStep('done')};
ACT.onbNextStep=()=>{const o=$('#onb');o.hidden=true;stack=['home'];render();gameOpen();
 toast(`Welcome, ${esc(S.user.name)}. Set your budget limits under More → Budgets.`,'sparkle');
 if(S.account){S.updatedAt=Date.now();setTimeout(()=>pushCloud(false),1500)}
 if(NATIVE)setTimeout(()=>{try{if(NATIVE.hasSmsPermission()){smsSync(true);NATIVE.requestNotifications()}else{S.askNotif=true;NATIVE.requestSmsPermission()}}catch(e){}},600)};
/* signing in during step 1 keeps the form */
