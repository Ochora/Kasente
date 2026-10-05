/* ===== Build 3 · streaks, points and badges ===== */
TITLES.rewards='Streaks & rewards';
const BADGES=[['first-log','First entry','Logged your first expense','plus'],['streak3','3-day streak','Opened Kasente 3 days in a row','bolt'],['streak7','Full week','7 days in a row','bolt'],['streak14','Two weeks','14 days in a row','bolt'],['streak30','Habit formed','30 days in a row','sun'],
 ['budget','Budget set','Set a limit on a category','chart'],['goal','Goal setter','Created a savings goal','target'],['learner','Learner','Read 3 lessons','book'],['assets','Owner','Recorded something you own','house'],['buffer','Safety first','One month of spending saved','shield'],['clean','Debt free','No advances or loans owed','check']];
const G=()=>{S.game=S.game||{days:{},points:0,best:0,badges:[],log:[]};return S.game};
function gameStreak(){const g=G();let n=0;for(let d=new Date(TODAY0);;d=plusDays(d,-1)){const k=ymd(d);if(g.days[k]&&g.days[k].o)n++;else if(k===ymd(TODAY0))continue;else break;if(n>3650)break}return n}
window.gamePoints=(n,why)=>{const g=G();g.points+=n;g.log.unshift({d:Date.now(),p:n,why});g.log=g.log.slice(0,60)};
window.gameBadge=id=>{const g=G();if(g.badges.includes(id))return;g.badges.push(id);const b=BADGES.find(x=>x[0]===id);gamePoints(20,'Badge: '+(b?b[1]:id));if(b)setTimeout(()=>toast(`New badge: ${b[1]} · +20 points`,'sparkle'),900)};
window.gameOpen=()=>{if(!S.mode)return;const g=G();const k=ymd(TODAY0);g.days[k]=g.days[k]||{};if(g.days[k].o)return;g.days[k].o=1;
 const s=gameStreak();g.streak=s;g.best=Math.max(g.best||0,s);gamePoints(5,'Opened Kasente');
 const bonus={7:25,14:50,30:100}[s];if(bonus)gamePoints(bonus,`${s}-day streak bonus`);
 if(s>=3)gameBadge('streak3');if(s>=7)gameBadge('streak7');if(s>=14)gameBadge('streak14');if(s>=30)gameBadge('streak30');
 if(s>1)setTimeout(()=>toast(`Day ${s} of your streak · +${5+(bonus||0)} points`,'bolt'),1200);
 const k2=Object.keys(g.days).sort();if(k2.length>120)k2.slice(0,k2.length-120).forEach(x=>delete g.days[x])};
window.gameLog=()=>{const g=G();const k=ymd(TODAY0);g.days[k]=g.days[k]||{};g.days[k].l=(g.days[k].l||0)+1;if(g.days[k].l<=5)gamePoints(2,'Logged an expense');gameBadge('first-log')};
function gameChecks(){if(!S.mode)return;const g=G();if(S.cats.some(c=>c.budget)&&isFresh()&&S.cats.some(c=>c.budgetSet))gameBadge('budget');if(S.goals.length&&isFresh())gameBadge('goal');if((S.assets||[]).length&&isFresh())gameBadge('assets');
 const w=isFresh()?wellness():null;if(w&&w.out&&liquidNow()>=w.out)gameBadge('buffer');if(isFresh()&&S.txns.length>10&&!providerDebt()&&!loansTaken())gameBadge('clean');g.streak=gameStreak()}
const weekDots=()=>{const g=G();let h='';for(let i=6;i>=0;i--){const d=plusDays(TODAY0,-i);const on=g.days[ymd(d)]&&g.days[ymd(d)].o;h+=`<i class="${on?'on':''} ${i===0?'today':''}">${'SMTWTFS'[d.getDay()]}</i>`}return `<div class="week">${h}</div>`};
const streakCard=()=>{const g=G();const s=g.streak||gameStreak();return `<button class="streak" data-go="rewards"><span class="flame">${ic('bolt',24)}</span><span class="grow"><b style="font-size:15px">${s?`${s}-day streak`:'Start a streak today'}</b><span class="xs muted" style="display:block">${g.points} points · ${g.badges.length} badge${g.badges.length===1?'':'s'}</span>${weekDots()}</span>${ic('chev',16)}</button>`};
SCREENS.rewards=()=>{const g=G();const s=g.streak||gameStreak();
 return `<div class="card stack" style="align-items:center;text-align:center;gap:8px;padding:22px 16px"><span class="flame" style="width:72px;height:72px;border-radius:24px">${ic('bolt',38)}</span><div style="font-family:var(--f-display);font-weight:800;font-size:34px">${s} day${s===1?'':'s'}</div><span class="small muted">Current streak · best ${g.best||s}</span>${weekDots()}</div>
 <div class="kpi"><div class="stat"><span>Points</span><b>${g.points}</b></div><div class="stat"><span>Badges</span><b>${g.badges.length} of ${BADGES.length}</b></div></div>
 <div class="card stack" style="gap:6px"><b>Earn points</b>${[['Open Kasente each day',5],['Log an expense (up to 5 a day)',2],['Read a lesson',10],['Earn a badge',20],['7-day streak bonus',25],['14-day streak bonus',50],['30-day streak bonus',100]].map(([l,p])=>`<div class="between small"><span>${l}</span><span class="pill sun">+${p}</span></div>`).join('')}</div>
 <div class="sec-head"><h2>Badges</h2></div>
 <div class="badges">${BADGES.map(([id,n,d,i])=>`<div class="badge2 ${g.badges.includes(id)?'':'locked'}" title="${d}"><span class="bi">${ic(i,20)}</span><b>${n}</b><span class="xs muted">${d}</span></div>`).join('')}</div>
 <div class="card stack" style="gap:8px;border:1px dashed var(--line)"><b>Prizes are coming</b><p class="small muted">Points you earn now are kept. Prizes and partner rewards will be announced later; the aim for now is building healthy money habits.</p></div>
 ${g.log.length?`<div class="sec-head"><h2>Recent points</h2></div><div class="list">${g.log.slice(0,10).map(x=>`<div class="setrow" style="padding:9px 14px"><span class="grow"><b style="font-size:13.5px">${esc(x.why)}</b><span>${dlabel(new Date(x.d))}</span></span><span class="pill sun">+${x.p}</span></div>`).join('')}</div>`:''}`};
/* badges from actions */
const baseBudgetForm=FORMS.budget;FORMS.budget=(fd,f)=>{const c=cat(f.dataset.id);if(c)c.budgetSet=true;baseBudgetForm(fd,f);gameBadge('budget')};
const baseGoalForm=FORMS.addGoal;FORMS.addGoal=(fd,f)=>{baseGoalForm(fd,f);gameBadge('goal')};
