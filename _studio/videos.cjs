// UMBRA videos (frame-exact, 1920x1080, 30fps).  node _studio/videos.cjs [name]
// hype, proof, notes, anchor, ath. (The app demo is recorded from the real app by _studio/demo.cjs.)
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process'), { open, sleep } = require('./cdp.cjs');
const B = path.join(__dirname, '..', 'brand'), K = path.join(__dirname, 'kit'), FPS = 30, url = (f) => 'file:///' + f.split(path.sep).join('/');
fs.mkdirSync(K, { recursive: true });
const FOOT = 'umbrachainl1.net · @UmbraChainL1 · <b>$UMBRA</b>';
const HEAD = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{width:1920px;height:1080px;background:#07050c;color:#ece6ff;overflow:hidden;position:relative;font:400 26px 'JetBrains Mono',monospace}
#cv{position:absolute;left:0;top:0;width:1920px;height:1080px}.s{position:absolute;opacity:0}
.h{font:500 120px/1 'Unbounded',sans-serif;letter-spacing:-.04em;color:#e2d9ff}.h b,b.v{font-weight:500;color:#a970ff}.v{color:#a970ff}.mu{color:#9a8fb5}
.cap{font-size:20px;letter-spacing:.24em;text-transform:uppercase;color:#9a8fb5}.cap b{color:#a970ff;font-weight:400}
.foot{position:absolute;left:90px;right:90px;bottom:60px;display:flex;justify-content:space-between;font-size:18px;letter-spacing:.2em;text-transform:uppercase;color:#9a8fb5}.foot b{color:#a970ff;font-weight:400}
.box{border:1px solid rgba(206,184,255,.32);background:rgba(14,10,23,.9);padding:30px 36px}.l{display:flex;justify-content:space-between;gap:30px;padding:16px 0;border-bottom:1px solid rgba(169,112,255,.16)}
</style></head><body><canvas id="cv" width="1920" height="1080"></canvas>`;
// deterministic helpers + a lattice renderer (32x32 serpentine trace, a lit head, optional opened steps and an umbra disc)
const JS = `const $=(i)=>document.getElementById(i),cl=(v)=>Math.max(0,Math.min(1,v)),e=(v)=>1-Math.pow(1-cl(v),3),win=(t,a,b,f=.45)=>cl(Math.min((t-a)/f,(b-t)/f));
const show=(id,t,a,b)=>{const o=win(t,a,b),el=$(id);el.style.opacity=o;el.style.transform='translateY('+((1-o)*18).toFixed(1)+'px)';el.style.filter='blur('+((1-o)*8).toFixed(1)+'px)'};
const g=$('cv').getContext('2d');const RND=[];{let s=7;for(let i=0;i<4096;i++){s=(s*16807)%2147483647;RND.push(s/2147483647)}}
function bg(){g.fillStyle='#07050c';g.fillRect(0,0,1920,1080);const r=g.createRadialGradient(1500,-80,0,1500,-80,1100);r.addColorStop(0,'rgba(169,112,255,.16)');r.addColorStop(1,'rgba(169,112,255,0)');g.fillStyle=r;g.fillRect(0,0,1920,1080)}
function lattice(o){const n=o.n||32,c=o.cell,ox=o.x,oy=o.y,head=o.head,um=o.um,al=o.alpha??1;const pos=(i)=>{const r=Math.floor(i/n),k=r%2?n-1-(i%n):i%n;return[ox+k*c+c/2,oy+r*c+c/2]};
 for(let i=0;i<n*n;i++){const[x,y]=pos(i),d=head-i,lit=d>=0&&d<140?1-d/140:0,done=d>=140?.45:0;if(um&&Math.hypot(x-um.x,y-um.y)<um.r)continue;
  const a=Math.min(1,(.13+RND[i]*.15+lit*.87+done*.5+(o.flash||0)*.6))*al,z=c*(.13+lit*.2+done*.05);g.fillStyle=lit>.8?'rgba(236,230,255,'+a+')':'rgba(169,112,255,'+a+')';g.fillRect(x-z/2,y-z/2,z,z)}
 if(o.open)for(let k=0;k<32*o.open;k++){const i=Math.floor(RND[k*7+3]*(n*n-1)),[x,y]=pos(i);if(um&&Math.hypot(x-um.x,y-um.y)<um.r+c)continue;g.strokeStyle='rgba(212,184,255,'+(.85*al)+')';g.lineWidth=1.5;g.strokeRect(x-c*.38,y-c*.38,c*.76,c*.76)}
 if(um){const gl=g.createRadialGradient(um.x,um.y,um.r*.95,um.x,um.y,um.r*1.9);gl.addColorStop(0,'rgba(169,112,255,'+(.35*al)+')');gl.addColorStop(1,'rgba(169,112,255,0)');g.fillStyle=gl;g.beginPath();g.arc(um.x,um.y,um.r*1.9,0,7);g.fill();
  g.fillStyle='#07050c';g.beginPath();g.arc(um.x,um.y,um.r,0,7);g.fill();g.strokeStyle='rgba(212,184,255,'+al+')';g.lineWidth=3;g.stroke()}}`;
const page = (body, script) => HEAD + body + `<div class="foot" id="ft"><span>UMBRA</span><span>${FOOT}</span></div><script>${JS}\nwindow.__seek=(t)=>{bg();${script}};</script></body></html>`;

async function render(c, name, html, dur) { const FR = path.join(os.tmpdir(), 'umbra-frames-' + name); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const f = path.join(K, name + '.html'); fs.writeFileSync(f, html);
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }); await c.send('Page.navigate', { url: url(f) }); await sleep(3000); await c.ev('document.fonts.ready.then(()=>1)');
  const N = Math.round(dur * FPS); for (let i = 0; i < N; i++) { await c.ev('__seek(' + (i / FPS).toFixed(4) + ')'); await c.shot(path.join(FR, 'f_' + String(i).padStart(4, '0') + '.jpg'), 'jpeg'); }
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FR, 'f_%04d.jpg'), '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', path.join(B, name + '.mp4')]);
  fs.rmSync(FR, { recursive: true, force: true }); console.log('OK', name + '.mp4'); }

const L = (id, x, y, inner, w) => `<div class="s" id="${id}" style="left:${x}px;top:${y}px;${w ? 'width:' + w + 'px' : ''}">${inner}</div>`;
const V = {
  // 18s: the trace runs, the umbra slides in, four beats, end card
  'umbra-hype-18s': [18, () => page(
    L('a', 110, 380, `<div class="cap">hash grinding proves</div><div class="h" style="margin-top:26px;font-size:96px">you burned<br>power.</div>`) +
    L('b', 110, 380, `<div class="cap">umbra's miners prove</div><div class="h" style="margin-top:26px;font-size:96px">they ran the<br><b>program.</b></div>`) +
    L('c', 110, 380, `<div class="cap">every note</div><div class="h" style="margin-top:26px;font-size:96px">sender. receiver.<br>amount. <b>dark.</b></div>`) +
    L('d', 110, 380, `<div class="cap">every 100 blocks</div><div class="h" style="margin-top:26px;font-size:96px"><b>pinned</b><br>to Solana.</div>`) +
    L('z', 110, 360, `<div class="h" style="font-size:170px">UMBRA</div><div class="cap" style="margin-top:34px">the proof is the <b>work</b> · the note is <b>dark</b></div>`),
    `const head=t*90,um=t<3?null:{x:1420+(1-e((t-3)/2.2))*600,y:540,r:170};lattice({cell:24,x:1000,y:156,head,um,open:t>6?Math.min(1,(t-6)/1.5):0,flash:t>15?Math.max(0,1-(t-15)*2):0});
     show('a',t,.4,3.8);show('b',t,4.1,7.6);show('c',t,7.9,11.2);show('d',t,11.5,14.8);show('z',t,15.1,99);$('ft').style.opacity=cl((t-15.4)/.6)`)],
  // 15s: seed → run → commit → target → open 32
  'umbra-proof-15s': [15, () => page(
    L('t', 110, 120, `<div class="cap">01 · proof of proof</div><div class="h" style="font-size:84px;margin-top:22px">How a block<br>is <b>won</b>.</div>`) +
    ['seed', 'run 1,023 rounds', 'merkle the trace', 'beat the target', 'open 32 steps'].map((x, i) => L('p' + i, 110, 470 + i * 84, `<span class="v">0${i + 1}</span>&nbsp;&nbsp;${x}`)).join('') +
    L('f', 110, 470, `<div class="box" style="width:700px;font-size:24px"><div class="l"><span class="mu">a' =</span><span>(a + b)⁷ + cᵢ</span></div><div class="l"><span class="mu">b' =</span><span>a</span></div><div class="l" style="border:0"><span class="mu">mod</span><span>2⁶⁴ − 2³² + 1</span></div></div>`) +
    L('ok', 110, 900, `<span class="v" style="font:500 40px Unbounded">✓ verified in 4 ms</span>`),
    `const head=cl((t-2.2)/5)*1024+(t>7.2?200:0);lattice({cell:24,x:1000,y:156,head,open:t>10.5?Math.min(1,(t-10.5)/1.6):0,flash:t>9&&t<10?1-(t-9):0});
     show('t',t,.3,99);for(let i=0;i<5;i++){const a=[1.2,2.4,7.4,9.0,10.6][i];$('p'+i).style.opacity=t<12?cl((t-a)/.4)*(t>12?0:1):0;}
     show('f',t,12.2,99);show('ok',t,13.2,99);for(let i=0;i<5;i++)if(t>=12)$('p'+i).style.opacity=0;$('ft').style.opacity=cl((t-12.6)/.6)`)],
  // 14s: a transfer's fields redact one by one
  'umbra-notes-14s': [14, () => page(
    L('t', 110, 110, `<div class="cap">02 · private notes</div><div class="h" style="font-size:84px;margin-top:22px">What the ledger <b>sees</b>.</div>`) +
    L('bx', 110, 370, `<div class="box" style="width:1100px;font-size:28px">${[['sender', 'alice · umb1q8…', '1 of 16, unknown'], ['receiver', 'bob · umbq1k3…', 'never written'], ['amount', '420 UMBRA', 'commitment only'], ['quantum ciphertext', '', '1,088 bytes'], ['fee', '', '0.01 UMBRA, public']].map(([a, b, c2], i) => `<div class="l"><span class="mu">${a}</span><span><span id="o${i}">${b}</span><span id="n${i}" class="v" style="opacity:0">${c2}</span></span></div>`).join('')}</div>`) +
    L('z', 110, 900, `<span class="mu" style="font-size:24px">press <span class="v">verify in your browser</span> on any tx</span>`),
    `lattice({cell:20,x:1260,y:340,head:400+t*40,um:{x:1580,y:520,r:110},alpha:.8});show('t',t,.3,99);show('bx',t,.8,99);
     for(let i=0;i<5;i++){const a=2.2+i*1.6,o=cl((t-a)/.5);$('o'+i).style.opacity=1-o;$('o'+i).style.display=o>=1?'none':'inline';$('n'+i).style.opacity=o;$('n'+i).style.display=o>0?'inline':'none';$('o'+i).style.filter='blur('+(o*8)+'px)'}
     show('z',t,10.6,99);$('ft').style.opacity=cl((t-11)/.6)`)],
  // 12s: blocks tick by, every 100th lights, the memo types out
  'umbra-anchor-12s': [12, () => page(
    L('t', 110, 110, `<div class="cap">04 · solana</div><div class="h" style="font-size:84px;margin-top:22px">Proved on UMBRA.<br><b>Pinned</b> to Solana.</div>`) +
    L('m', 110, 820, `<div class="box" style="font-size:30px;display:inline-block">memo → <span class="v" id="memo"></span><span class="v">▍</span></div>`),
    `const n=Math.floor(cl((t-1)/7)*200);for(let i=0;i<200;i++){const x=110+(i%50)*34,y=420+Math.floor(i/50)*62;if(i>=n){g.strokeStyle='rgba(206,184,255,.12)';g.strokeRect(x,y,26,26);continue}
      const an=i%100===0;g.fillStyle=an?'#a970ff':'rgba(169,112,255,.28)';if(an){g.shadowColor='#a970ff';g.shadowBlur=24}g.fillRect(x,y,26,26);g.shadowBlur=0}
     show('t',t,.3,99);show('m',t,7.6,99);const s='umbra-1:100:597431d6b27e0d02…';$('memo').textContent=s.slice(0,Math.floor(cl((t-7.9)/2)*s.length));$('ft').style.opacity=cl((t-10)/.6)`)],
  // 12s: ATH bars grow, UMBRA row lands
  'umbra-ath-12s': [12, () => page(
    L('t', 110, 100, `<div class="cap">privacy is a sector</div><div class="h" style="font-size:84px;margin-top:22px">What privacy chains<br>have been <b>worth</b>.</div>`) +
    [['Zcash', 21.7, 'Nov 2026'], ['Monero', 13.4, 'Jan 2026'], ['Dash', 11.6, 'Dec 2017'], ['Secret', 1.8, '2021']].map(([nm, v, d], i) => L('r' + i, 110, 400 + i * 104, `<div style="display:grid;grid-template-columns:260px 1300px 200px;align-items:center;gap:20px"><span style="font:500 34px Unbounded">${nm}</span><div style="height:54px;background:rgba(169,112,255,.08)"><div id="b${i}" style="height:100%;width:0;background:linear-gradient(90deg,#3a2d55,#7b55c8)" data-w="${(v / 21.7 * 100).toFixed(1)}"></div></div><span style="font:500 36px Unbounded;text-align:right">$${v}B<div class="mu" style="font:400 15px 'JetBrains Mono'">peak · ${d}</div></span></div>`)).join('') +
    L('u', 110, 840, `<div style="display:grid;grid-template-columns:260px 1300px 200px;align-items:center;gap:20px"><span class="v" style="font:500 34px Unbounded">UMBRA</span><div style="height:54px;border:1px dashed #a970ff;display:flex;align-items:center;padding-left:20px;color:#d4b8ff;font-size:22px">Monero's privacy + quantum receive + proved blocks + Solana anchors</div><span class="v" style="font:500 36px Unbounded;text-align:right">$UMBRA</span></div>`),
    `show('t',t,.3,99);for(let i=0;i<4;i++){show('r'+i,t,1+i*.35,99);const el=$('b'+i);el.style.width=(e((t-1.4-i*.35)/1.6)*el.dataset.w)+'%'}show('u',t,6.2,99);$('ft').style.opacity=cl((t-8)/.6)`)],
};
(async () => {
  const only = process.argv[2]; const c = await open('about:blank', 1920, 1080, 9600 + Math.floor(Math.random() * 90));
  for (const [name, [dur, html]] of Object.entries(V)) { if (only && !name.includes(only)) continue; await render(c, name, html(), dur); }
  c.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
