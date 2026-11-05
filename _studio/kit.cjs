// UMBRA brand kit: pfp, banner, og + 8 graphics in the trace-lattice look.  node _studio/kit.cjs [name]
'use strict';
const fs = require('fs'), path = require('path'), { open, sleep } = require('./cdp.cjs');
const OUT = path.join(__dirname, '..', 'brand'), SRC = path.join(__dirname, 'kit'); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SRC, { recursive: true });
const SITE = 'umbra.network', X = '@UmbraOnSolana';
const url = (f) => 'file:///' + f.split(path.sep).join('/');

const HEAD = (W, H) => `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{width:${W}px;height:${H}px;overflow:hidden;position:relative;background:radial-gradient(900px 500px at 85% -10%,rgba(169,112,255,.16),transparent 60%),#07050c;color:#ece6ff;font:400 22px/1.5 'JetBrains Mono',monospace}
.h{font:500 86px/1 'Unbounded',sans-serif;letter-spacing:-.04em;color:#e2d9ff}.h b,b.v{font-weight:500;color:#a970ff}
.cap{font:400 15px 'JetBrains Mono';letter-spacing:.2em;text-transform:uppercase;color:#9a8fb5}.cap b{color:#a970ff;font-weight:400}.mu{color:#9a8fb5}.v{color:#a970ff}
.eb{display:flex;align-items:center;gap:14px}.eb i{width:34px;height:1px;background:#a970ff}
.foot{position:absolute;left:70px;right:70px;bottom:50px;display:flex;justify-content:space-between;align-items:center}
.mark{display:flex;align-items:center;gap:14px;font:600 24px 'Unbounded';letter-spacing:.02em}
.box{border:1px solid rgba(206,184,255,.32);background:rgba(14,10,23,.85);position:relative}.box:before{content:'';position:absolute;left:-1px;top:20px;width:3px;height:34px;background:#a970ff}
.box:after{content:'';position:absolute;right:16px;top:-5px;width:9px;height:9px;background:#07050c;border:1px solid #a970ff;transform:rotate(45deg)}
.l{display:flex;justify-content:space-between;gap:20px;padding:14px 0;border-bottom:1px solid rgba(169,112,255,.16)}.l:last-child{border:0}
canvas{position:absolute;left:0;top:0;width:100%;height:100%}
</style></head><body>`;
const MARK = (s = 30) => { let d = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = 3.5 + c * 5.7, y = 3.5 + r * 5.7; if (Math.hypot(x - 17, y - 7) >= 7.5) d += `<circle cx="${x}" cy="${y}" r="1.55" fill="#a970ff"/>`; } return `<svg width="${s}" height="${s}" viewBox="0 0 24 24">${d}<circle cx="17" cy="7" r="5.4" fill="none" stroke="#d4b8ff" stroke-width="1.3"/></svg>`; };
const FOOT = () => `<div class="foot"><span class="mark">${MARK()}UMBRA</span><span class="cap">${SITE} · ${X} · <b>$UMBRA</b></span></div>`;
// signature: a 32×32 trace lattice (serpentine), a lit wave of steps, opened steps ringed, an umbra disc eclipsing part of it
const LAT = `<script>
function lattice(o) { const cv = document.getElementById(o.id || 'cv'), W = cv.width = cv.clientWidth, H = cv.height = cv.clientHeight, g = cv.getContext('2d'); let s = o.seed || 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = o.n || 32, cell = o.cell, ox = o.x, oy = o.y, head = o.head ?? 620, um = o.umbra;
  const pos = (i) => { const row = Math.floor(i / n), c = row % 2 ? n - 1 - (i % n) : i % n; return [ox + c * cell + cell / 2, oy + row * cell + cell / 2]; };
  if (o.path) { g.strokeStyle = 'rgba(169,112,255,.10)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < n * n; i++) { const [x, y] = pos(i); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  for (let i = 0; i < n * n; i++) { const [x, y] = pos(i), d = head - i, lit = d >= 0 && d < 140 ? 1 - d / 140 : 0, done = d >= 140 ? .5 : 0;
    if (um && Math.hypot(x - um.x, y - um.y) < um.r) continue;
    const a = Math.min(1, .14 + r() * .16 + lit * .86 + done * .5), z = cell * (.13 + lit * .2 + done * .05);
    g.fillStyle = lit > .8 ? 'rgba(236,230,255,' + a + ')' : 'rgba(169,112,255,' + a + ')'; g.fillRect(x - z / 2, y - z / 2, z, z); }
  if (o.open) { for (let k = 0; k < 32; k++) { const i = Math.floor(r() * (n * n - 1)), [x, y] = pos(i); if (um && Math.hypot(x - um.x, y - um.y) < um.r + cell) continue; g.strokeStyle = 'rgba(212,184,255,.85)'; g.lineWidth = 1.2; g.strokeRect(x - cell * .38, y - cell * .38, cell * .76, cell * .76); } }
  if (um) { const gl = g.createRadialGradient(um.x, um.y, um.r * .95, um.x, um.y, um.r * 1.9); gl.addColorStop(0, 'rgba(169,112,255,.35)'); gl.addColorStop(1, 'rgba(169,112,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(um.x, um.y, um.r * 1.9, 0, 7); g.fill();
    g.fillStyle = '#07050c'; g.beginPath(); g.arc(um.x, um.y, um.r, 0, 7); g.fill(); g.strokeStyle = '#d4b8ff'; g.lineWidth = Math.max(1.5, um.r * .02); g.stroke(); } }
</script>`;
const RUN = (js) => `<script>document.fonts.ready.then(()=>{${js}})</script></body></html>`;
const head = (lab, title, top = 90) => `<div style="position:absolute;left:70px;right:70px;top:${top}px"><div class="cap eb"><i></i>${lab}</div><div class="h" style="margin-top:26px">${title}</div></div>`;

const G = {
  'umbra-pfp': [1000, 1000, () => HEAD(1000, 1000) + '<canvas id="cv"></canvas>' + LAT + RUN(`lattice({n:12,cell:70,x:80,y:80,head:999,seed:5,umbra:{x:640,y:350,r:240}})`)],
  'umbra-banner': [1500, 500, () => HEAD(1500, 500) + `<canvas id="cv"></canvas><div style="position:absolute;left:70px;top:120px"><div class="cap eb"><i></i>proof of proof · private notes · anchored to solana</div><div class="h" style="font-size:66px;margin-top:22px">The proof is the <b>work</b>.<br>The note is <b>dark</b>.</div></div>` + LAT + RUN(`lattice({n:32,cell:14.5,x:1020,y:18,head:640,open:true,path:true,umbra:{x:1340,y:150,r:92}})`)],
  'umbra-og': [1200, 630, () => HEAD(1200, 630) + `<canvas id="cv"></canvas>${head('umbra-1 · $UMBRA', 'The proof<br>is the <b>work</b>.<br>The note is<br><b>dark</b>.')}${FOOT()}` + LAT + RUN(`lattice({n:32,cell:15,x:690,y:50,head:700,open:true,umbra:{x:1000,y:200,r:86}})`)],
  'umbra-g01-keyart': [1600, 900, () => HEAD(1600, 900) + `<canvas id="cv"></canvas>${head('umbra · a private chain mined by proof of proof', 'Mining<br>means<br><b>proving</b>.')}<p class="mu" style="position:absolute;left:70px;top:560px;width:560px;font-size:21px;line-height:1.65">Every block proves a 1,024-step Goldilocks computation. Every note hides sender, receiver and amount. Every 100 blocks, Solana keeps the receipt.</p>${FOOT()}` + LAT + RUN(`lattice({n:32,cell:23,x:780,y:76,head:760,open:true,path:true,umbra:{x:1250,y:260,r:140}})`)],
  'umbra-g02-proof': [1600, 900, () => HEAD(1600, 900) + `${head('01 · proof of proof', 'How a block is <b>won</b>.')}
    <div style="position:absolute;left:70px;right:70px;top:330px;display:grid;grid-template-columns:repeat(5,1fr);border:1px solid rgba(169,112,255,.2)">${[['01 · seed', 'header + nonce', '→ two Goldilocks elements (a₀, b₀)'], ['02 · run', '1,023 rounds', "a' = (a+b)⁷ + cᵢ\nb' = a  ·  mod 2⁶⁴−2³²+1"], ['03 · commit', 'Merkle the trace', 'all 1,024 states → one root'], ['04 · target', 'beat the difficulty', 'sha256(root‖hdr‖nonce) × diff < 2²⁵⁶'], ['05 · prove', 'open 32 steps', 'Fiat–Shamir picks them;\nnodes check in ~4 ms']].map(([a, b, c], i) => `<div style="padding:30px 26px;min-height:330px;${i < 4 ? 'border-right:1px solid rgba(169,112,255,.2)' : ''}"><div class="v" style="font-size:15px;letter-spacing:.14em">${a}</div><div style="font:500 30px/1.2 Unbounded;margin:26px 0 18px">${b}</div><div class="mu" style="font-size:18px;line-height:1.6;white-space:pre-line">${c}</div></div>`).join('')}</div>
    <p class="mu" style="position:absolute;left:70px;top:720px;font-size:20px">No proof, no block. Skip a fifth of the work and you're caught 99.9% of the time.</p>${FOOT()}</body></html>`],
  'umbra-g03-nock': [1600, 900, () => HEAD(1600, 900) + `${head('the model', 'Nockchain proved it.<br>UMBRA <b>hides</b> it.')}
    <div style="position:absolute;left:70px;right:70px;top:400px;display:grid;grid-template-columns:1fr 1fr;gap:34px">
    <div class="box" style="padding:30px 34px"><div class="cap">from nockchain</div>${['proof-of-proof consensus', 'Goldilocks field', '2³² supply', 'no premine', 'UTXO notes'].map((x) => `<div class="l"><span>${x}</span><span class="v">✓</span></div>`).join('')}</div>
    <div class="box" style="padding:30px 34px"><div class="cap"><b>added by umbra</b></div>${['ring of 16 on every spend', 'stealth notes + hidden amounts', 'ML-KEM-768 quantum receive', 'prover in a browser tab', 'history anchored to Solana'].map((x) => `<div class="l"><span>${x}</span><span class="v">+</span></div>`).join('')}</div></div>${FOOT()}</body></html>`],
  'umbra-g04-launch': [1600, 900, () => HEAD(1600, 900) + `<canvas id="cv"></canvas>${head('03 · fair launch', '2³² coins.<br>Every one <b>proved</b>.')}
    <div style="position:absolute;left:70px;right:70px;top:480px;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(169,112,255,.2);border:1px solid rgba(169,112,255,.2)">${[['max supply', '4,294,967,296'], ['premine', '0'], ['reward', 'left ÷ 2¹⁹'], ['tail', '2 UMBRA']].map(([a, b]) => `<div style="background:#0e0a17;padding:30px 28px"><div class="cap">${a}</div><div style="font:500 38px Unbounded;margin-top:18px;letter-spacing:-.02em">${b}</div></div>`).join('')}</div>
    <p class="mu" style="position:absolute;left:70px;top:700px;font-size:20px">No presale. No team allocation. Every UMBRA came out of a block someone proved.</p>${FOOT()}</body></html>`],
  'umbra-g05-notes': [1600, 900, () => HEAD(1600, 900) + `${head('02 · private notes', 'What the ledger<br><b>sees</b>.')}
    <div class="box" style="position:absolute;right:70px;top:110px;width:720px;padding:30px 36px;font-size:21px"><div class="cap" style="margin-bottom:10px"><b>one umbra transfer</b></div>${[['real note spent', '1 of 16, unknown', 1], ['receiver address', 'never written', 1], ['amounts', 'commitments only', 1], ['range proofs', '48 bits each'], ['key images', '32 bytes each'], ['ML-KEM ciphertext', '1,088 bytes'], ['fee', '0.01 UMBRA, public']].map(([a, b, h]) => `<div class="l"><span class="mu">${a}</span><span class="${h ? 'v' : ''}">${b}</span></div>`).join('')}</div>
    <p class="mu" style="position:absolute;left:70px;top:520px;width:640px;font-size:20px;line-height:1.7">Press "verify in your browser" on any transaction. Your machine re-runs the ring signatures and range proofs itself.</p>${FOOT()}</body></html>`],
  'umbra-g06-solana': [1600, 900, () => HEAD(1600, 900) + `${head('04 · solana', 'Proved on UMBRA.<br><b>Pinned</b> to Solana.')}
    <div style="position:absolute;left:70px;right:70px;top:440px;display:flex;gap:9px;flex-wrap:wrap">${Array.from({ length: 84 }, (_, i) => `<i style="width:34px;height:34px;border:1px solid ${i % 21 === 0 ? '#a970ff' : 'rgba(206,184,255,.3)'};${i % 21 === 0 ? 'background:#a970ff;box-shadow:0 0 18px rgba(169,112,255,.7)' : ''}"></i>`).join('')}</div>
    <div class="box" style="position:absolute;left:70px;top:640px;padding:20px 26px;font-size:21px"><span class="mu">memo on solana →</span> <span class="v">umbra-1:&lt;height&gt;:&lt;block hash&gt;</span> <span class="mu">· every 100 blocks</span></div>${FOOT()}</body></html>`],
  'umbra-g07-compare': [1600, 900, () => HEAD(1600, 900) + `${head('05 · where it sits', 'Prove like Nock. Hide like <b>Monero</b>.', 80)}
    <div style="position:absolute;left:70px;right:70px;top:250px;font-size:20px">${[['', 'UMBRA', 'Nockchain', 'Monero', 'Zcash'], ['mining', 'proof of proof', 'proof of proof', 'hashing', 'hashing'], ['premine', 'none', 'none', 'none', 'founders'], ['supply', '2³²', '2³²', 'tail', '21M'], ['hidden sender', 'ring 16', 'no', 'ring 16', 'pool'], ['hidden amount', 'yes', 'no', 'yes', 'pool'], ['quantum receive', 'ML-KEM-768', 'no', 'no', 'no'], ['browser prover', 'yes', 'no', 'no', 'no'], ['anchored to', 'Solana', 'none', 'none', 'none']].map((r, i) => `<div style="display:grid;grid-template-columns:1.3fr 1.2fr 1fr 1fr 1fr;padding:13px 0;border-bottom:1px solid rgba(169,112,255,.16)">${r.map((c, k) => `<span style="${k === 1 ? 'color:#a970ff' : i === 0 || k === 0 ? 'color:#9a8fb5' : ''};${i === 0 ? 'font-size:14px;letter-spacing:.16em;text-transform:uppercase' : ''}">${c}</span>`).join('')}</div>`).join('')}</div>${FOOT()}</body></html>`],
  'umbra-g08-roadmap': [1600, 900, () => HEAD(1600, 900) + `${head('06 · roadmap', 'From proofs of work<br>to proofs of <b>everything</b>.')}
    <div style="position:absolute;left:70px;right:70px;top:420px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px">${[['phase i · live', ['proof-of-proof blocks', 'private notes, ring 16', 'ML-KEM quantum addresses', 'browser + CLI provers'], 1], ['phase ii · live', ['Solana anchors', 'in-browser proof checks', 'prover leaderboard', '$UMBRA on Solana'], 1], ['phase iii', ['full STARK per block', 'proof aggregation', 'peer-to-peer nodes']], ['phase iv', ['UMBRA ⇄ Solana bridge', 'useful puzzles', 'light clients']]].map(([p, xs, d]) => `<div class="box" style="padding:24px 24px 14px"><div class="v" style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:12px">${p}</div>${xs.map((x) => `<div style="padding:9px 0;border-top:1px solid rgba(169,112,255,.16);font-size:18px;${d ? '' : 'color:#9a8fb5'}">${d ? '<span class="v">✓ </span>' : ''}${x}</div>`).join('')}</div>`).join('')}</div>${FOOT()}</body></html>`],
};
(async () => {
  const only = process.argv[2]; const c = await open('about:blank', 1600, 900, 9700 + Math.floor(Math.random() * 90));
  for (const [name, [W, H, html]] of Object.entries(G)) { if (only && !name.includes(only)) continue;
    const f = path.join(SRC, name + '.html'); fs.writeFileSync(f, html());
    await c.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false }); await c.send('Page.navigate', { url: url(f) }); await sleep(1800); await c.ev('document.fonts.ready.then(()=>1)'); await sleep(500);
    await c.shot(path.join(OUT, name + '.png')); console.log('ok', name); }
  fs.copyFileSync(path.join(OUT, 'umbra-og.png'), path.join(__dirname, '..', 'client', 'og.png')); c.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
