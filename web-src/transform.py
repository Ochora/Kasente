"""Turn the published prototype (kasente.html) into the Android test build's index.html."""
import re, sys
src = open('/home/claude/kasente.html', encoding='utf-8').read()
layer = open('/home/claude/build/layer.js', encoding='utf-8').read()

def rep(old, new, count=1):
    global src
    n = src.count(old)
    if n < 1:
        sys.exit(f'NOT FOUND: {old[:90]!r}')
    if count == 1 and n > 1:
        sys.exit(f'AMBIGUOUS ({n}): {old[:90]!r}')
    src = src.replace(old, new)

FONTS = ''.join(
    f"@font-face{{font-family:'{fam}';src:url(fonts/{f}-latin-{w}-normal.woff2) format('woff2');font-weight:{w};font-display:swap}}\n"
    for fam, f, ws in [('Bricolage Grotesque', 'bricolage-grotesque', [500, 700, 800]),
                       ('Figtree', 'figtree', [400, 500, 600, 700]),
                       ('JetBrains Mono', 'jetbrains-mono', [400, 500])]
    for w in ws)

# --- document head: full page, local fonts, no network ---
head_end = src.index('<style>')
src = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
       '<meta name="theme-color" content="#F2F6F5">\n<title>Kasente</title>\n'
       + src[head_end:])
rep('<style>\n', '<style>\n' + FONTS, 1)
rep('</style>\n\n<div class="stage">', '''/* test build: full-screen app, no desktop rail */
.guide{display:none!important}
.stage{padding:0}
.phone{max-width:none;max-height:none;border:0;border-radius:0;box-shadow:none}
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
.onb form .card input[type=radio]{flex:none}
</style>
</head>
<body>
<div class="stage">''')

# --- real clock and pay cycle ---
rep("""const TODAY=pd('2026-10-02 20:06');
const TODAY0=pd('2026-10-02 00:00');
const CYCLE_START=pd('2026-09-25 00:00');
const CYCLE_END=pd('2026-10-24 23:59');
const CYCLE_DAYS=30;
const DAY_OF_CYCLE=Math.floor((TODAY-CYCLE_START)/DAY)+1;
const DAYS_LEFT=CYCLE_DAYS-DAY_OF_CYCLE;""",
"""let TODAY,TODAY0,CYCLE_START,CYCLE_END,CYCLE_DAYS,DAY_OF_CYCLE,DAYS_LEFT,PREV_START;
function tick(){TODAY=new Date();TODAY0=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());
 const pdy=S.settings.payday||25;const dIn=(y,m)=>Math.min(pdy,new Date(y,m+1,0).getDate());
 let y=TODAY0.getFullYear(),m=TODAY0.getMonth();if(TODAY0.getDate()<dIn(y,m)){m--;if(m<0){m=11;y--}}
 CYCLE_START=new Date(y,m,dIn(y,m));let ny=y,nm=m+1;if(nm>11){nm=0;ny++}const next=new Date(ny,nm,dIn(ny,nm));
 let py=y,pm=m-1;if(pm<0){pm=11;py--}PREV_START=new Date(py,pm,dIn(py,pm));
 CYCLE_END=new Date(next.getTime()-60000);CYCLE_DAYS=Math.round((next-CYCLE_START)/DAY);
 DAY_OF_CYCLE=Math.floor((TODAY0-CYCLE_START)/DAY)+1;DAYS_LEFT=CYCLE_DAYS-DAY_OF_CYCLE}""")
rep("const stamp=()=>{const n=new Date();return `2026-10-02 ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`};",
    "const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;\n"
    "const stamp=()=>{const n=new Date();return `${ymd(n)} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`};")
rep("settings:{lock:true,bio:true,sms:true,ai:true,backup:false,push:true,wa:true,threshold:80,theme:'system',lang:'en'},",
    "settings:{lock:false,bio:true,sms:true,ai:true,backup:false,push:true,wa:true,threshold:80,theme:'system',lang:'en',payday:25,pin:null},")
rep("/* transactions: [date, acct, kind, amount, cat, title, src, extra] */", "tick();\n/* transactions: [date, acct, kind, amount, cat, title, src, extra] */")

# --- chart guards for small or empty data ---
rep("function spark(vals,w,h,color,fill){\n", "function spark(vals,w,h,color,fill){\n if(!vals||vals.length<2)vals=[(vals&&vals[0])||0,(vals&&vals[0])||0];\n")
rep("const W=340,H=190,L=34,B=22,T=8,mx=Math.ceil(Math.max(...a,...b)/500000)*500000,ih=H-B-T,gw=(W-L)/labels.length,bw=Math.min(10,gw/3.2);",
    "const raw=Math.max(...a,...b,1),step=raw>2e6?1e6:raw>8e5?5e5:raw>2e5?1e5:5e4;const W=340,H=190,L=34,B=22,T=8,mx=Math.ceil(raw/step)*step,ih=H-B-T,gw=(W-L)/labels.length,bw=Math.min(10,gw/3.2);")
rep("for(let v=0;v<=mx;v+=500000)g+=", "for(let v=0;v<=mx;v+=step)g+=")
rep("function lineChart(labels,vals){\n", "function lineChart(labels,vals){\n if(vals.length<2)vals=[vals[0]||0,vals[0]||0];labels=labels.slice(-vals.length);while(labels.length<vals.length)labels.unshift('');\n")
rep("const W=340,H=170,L=36,B=22,T=12;const mn=Math.floor(Math.min(...vals)*2)/2,mx=Math.ceil(Math.max(...vals)*2)/2,",
    "const W=340,H=170,L=36,B=22,T=12;const mn=Math.floor(Math.min(...vals)*2)/2;let mx=Math.ceil(Math.max(...vals)*2)/2;if(mx-mn<.5)mx=mn+.5;const ")
rep(" seed=23;for(let d=new Date(CYCLE_START-1*DAY);", " if(S.mode!=='fresh'){seed=23;for(let d=new Date(CYCLE_START-1*DAY);")
rep("m[k]=r<.12?0:Math.round((r<.85?8000+rnd()*45000:90000+rnd()*160000)/500)*500}\n return m;",
    "m[k]=r<.12?0:Math.round((r<.85?8000+rnd()*45000:90000+rnd()*160000)/500)*500}}\n return m;")

# --- dates and wording that were fixed to the demo day ---
rep('<span class="eyebrow">25 Sep – 24 Oct</span>', '<span class="eyebrow">${cycleLabel()}</span>')
rep("${DOW[TODAY.getDay()]==='Fri'?'Friday':DOW[TODAY.getDay()]}", "${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][TODAY.getDay()]}")
rep("const labels=HIST.labels.slice(-R),inc=HIST.inc.slice(-R),exp=HIST.exp.slice(-R);", "const labels=H().labels.slice(-R),inc=H().inc.slice(-R),exp=H().exp.slice(-R);")
rep("${kf(netWorth()-HIST.nw[0]*1e6)} in 12 months</span></div>${lineChart(HIST.labels,[...HIST.nw,netWorth()/1e6])}",
    "${kf(netWorth()-(H().nw.length?H().nw[0]*1e6:netWorth()))} ${S.mode==='fresh'?'since you started':'in 12 months'}</span></div>${lineChart(H().nwLabels,[...H().nw,netWorth()/1e6])}")
rep("due:'2026-10-31',note:'Detected from SMS',auto:true", "due:ymd(new Date(TODAY0.getTime()+30*DAY)),note:'Detected from SMS',auto:true")
rep("let y=2026;if(mi<=TODAY.getMonth())y=2027;", "let y=TODAY.getFullYear();if(mi<=TODAY.getMonth())y++;")
rep("const due=`${mi<9?2026:2026}-", "const due=`${mi<TODAY.getMonth()?TODAY.getFullYear()+1:TODAY.getFullYear()}-")
rep("cycle:'2026-09-25/2026-10-24'", "cycle:`${ymd(CYCLE_START)}/${ymd(CYCLE_END)}`")
rep("b.status='paid';b.paidOn='2026-10-02';closeSheet()", "b.status='paid';b.paidOn=ymd(TODAY0);closeSheet()")
rep('<input name="date" type="date" value="2026-10-02">', '<input name="date" type="date" value="${ymd(TODAY0)}">')
rep("paid:0,date:'2026-10-02',due:fd.get('due')", "paid:0,date:ymd(TODAY0),due:fd.get('due')")
rep("const T={monthly:'Monthly summary · Oct cycle',annual:'Annual overview · 2026',custom:'Custom range'}[k];",
    "const T={monthly:'Monthly summary · '+cycleLabel(),annual:'Annual overview · '+TODAY.getFullYear(),custom:'Custom range'}[k];")
src = re.sub(r" const body=k==='custom'\?`<div class=\"grid2\">.*?</span></div>`\n",
    " const body=k==='custom'?(()=>{const a=ymd(PREV_START),b=ymd(TODAY0);const ts=S.txns.filter(t=>t.d.slice(0,10)>=a&&t.d.slice(0,10)<=b);const sp=ts.filter(t=>t.kind==='out').reduce((x,t)=>x+t.amt,0);return `<div class=\"grid2\"><label class=\"field\"><span>From</span><input type=\"date\" value=\"${a}\"></label><label class=\"field\"><span>To</span><input type=\"date\" value=\"${b}\"></label></div><div class=\"note\">${ic('info')}<span class=\"small\">Covers ${Math.round((TODAY0-PREV_START)/DAY)+1} days · ${ts.length} transactions · ${ugx(sp)} spent</span></div>`})()\n",
    src, count=1, flags=re.S)
assert "Covers ${Math.round((TODAY0-PREV_START)" in src, 'custom report not replaced'
rep("HIST.inc.reduce((a,b)=>a+b,0)", "H().inc.reduce((a,b)=>a+b,0)", count=2)
rep("HIST.exp.reduce((a,b)=>a+b,0)", "H().exp.reduce((a,b)=>a+b,0)", count=2)
rep("<dt>Net worth change</dt><dd>${ugx(netWorth()-HIST.nw[0]*1e6)}</dd>", "<dt>Net worth change</dt><dd>${ugx(netWorth()-(H().nw.length?H().nw[0]*1e6:netWorth()))}</dd>")
rep("Your best year on record. December and June were the expensive months; both had school fees plus family events.",
    "${S.mode==='fresh'?'Totals cover the months you have logged in Kasente so far.':'Your best year on record. December and June were the expensive months; both had school fees plus family events.'}")
rep("<b>Commentary.</b> The fixed costs are paid early, which is good. Food and airtime are the two categories to watch for the rest of the cycle.",
    "<b>Commentary.</b> ${S.mode==='fresh'?(S.cats.filter(c=>c.budget&&catSpent(c.id)>c.budget).map(c=>c.name).join(', ')||'Every category')+(S.cats.some(c=>c.budget&&catSpent(c.id)>c.budget)?' went over its limit.':' is within its limit so far.'):'The fixed costs are paid early, which is good. Food and airtime are the two categories to watch for the rest of the cycle.'}")

rep("const catOf=t=>t.kind==='in'?", "const catOf=t=>t.kind==='move'?{name:'Withdrawal to cash',c:'var(--muted)',ic:'wallet'}:t.kind==='in'?")
rep("${p.kind==='in'?'Income':p.isLoan?'Lending ledger':cat(p.cat).name}", "${p.kind==='in'?'Income':p.isLoan?'Lending ledger':(cat(p.cat)||{name:p.kind==='move'?'Withdrawal to cash':'Other'}).name}")
# --- account balances can be set by hand in your own data ---
rep("${id==='cash'||id==='bank'||id==='sacco'?", "${S.mode==='fresh'||id==='cash'||id==='bank'||id==='sacco'?")
# --- receipt photo: honest manual entry until OCR is built ---
rep("<div class=\"note\">${ic('check')}<span class=\"small\"><b>Read ${s.items.length} items.</b> Check them and fix anything the camera got wrong before saving.</span></div>",
    "${s.manual?`<div class=\"note\">${ic('info')}<span class=\"small\">Type the shop, items and amounts from your photo. Automatic receipt reading is planned for the next phase.</span></div>`:`<div class=\"note\">${ic('check')}<span class=\"small\"><b>Example receipt.</b> Edit anything before saving.</span></div>`}")
# --- advisor honesty line ---
rep("Names, phone numbers and individual transactions stay on your phone.",
    "Names, phone numbers and individual transactions stay on your phone. In this test build the answers are worked out on the phone itself.")

# --- hand over start-up to the test-build layer ---
rep("document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});\nrender();\n</script>",
    "document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});\n</script>\n<script>\n" + layer + "\n</script>\n<script>\n" + open('/home/claude/build/i18n.js',encoding='utf-8').read() + "\n</script>\n<script>\n" + '\n'.join(open(f,encoding='utf-8').read() for f in sorted(__import__('glob').glob('/home/claude/build/l2/*.js'))) + "\nkasenteBoot();\n</script>\n</body>\n</html>")

# helpers that build 3 replaces (currencies, new transaction kinds)
src = re.sub(r'^const (num|ugx|kf|cat|acct|catOf|expenses|catSpent|cycleSpent|cycleIncome|totalBudget|todaySpent|owedToMe|iOwe|invTotal|acctTotal|netWorth|guessCat|srcTag|status)=', r'let \1=', src, flags=re.M)
leftover = [l for l in src.splitlines() if 'HIST.' in l and 'const HIST' not in l and 'baseAdvise' not in l]
open('/home/claude/kasente-android/app/src/main/assets/index.html', 'w', encoding='utf-8').write(src)
print('ok, bytes', len(src.encode()), '| HIST lines left (sample-only advisor):', len(leftover))
