// UMBRA app demo: records the real app end to end against a fresh local node:
// create keys → faucet → prove a block in the browser → send privately to a quantum address → explorer re-verifies the tx and the block proof.
// node _studio/demo.cjs  → brand/umbra-app-demo.mp4
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, execFileSync } = require('child_process'), { open, sleep } = require('./cdp.cjs');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'brand', 'umbra-app-demo.mp4'), FR = path.join(os.tmpdir(), 'umbra-demo-frames'), W = 1280, H = 720, PORT = 8281;
const CAP = `(() => { if (document.getElementById('__cap')) return; const d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;padding:13px 24px;background:#07050c;border:1px solid rgba(169,112,255,.8);box-shadow:0 0 40px rgba(169,112,255,.3);border-radius:999px;font:400 15px "JetBrains Mono",monospace;letter-spacing:.04em;color:#ece6ff;white-space:nowrap;opacity:0;transition:opacity .3s';
  const c=document.createElement('div');c.id='__cur';c.style.cssText='position:fixed;z-index:99998;width:22px;height:22px;border-radius:50%;border:2px solid #a970ff;background:rgba(169,112,255,.2);pointer-events:none;transform:translate(-50%,-50%);transition:left .55s cubic-bezier(.3,.7,.3,1),top .55s cubic-bezier(.3,.7,.3,1);left:800px;top:450px';
  document.body.append(d,c); })();`;

(async () => {
  fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const srv = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], { stdio: 'ignore', env: { ...process.env, PORT: String(PORT), DATA_PATH: path.join(os.tmpdir(), 'umbra-demo-' + Date.now() + '.json'), BLOCK_SEC: '4', NODE_PAUSE: '0', SOLANA_KEY: '' } });
  const stats = async () => { try { return await (await fetch(`http://127.0.0.1:${PORT}/api/stats`)).json(); } catch { return null; } };
  for (let i = 0; i < 400; i++) { const s = await stats(); if (s && s.height >= 10) break; await sleep(500); }   // warm up: mature coins for the faucet and decoys for rings
  const c = await open('about:blank', W, H, 9500 + Math.floor(Math.random() * 90));
  const frames = []; let rec = false;
  c.on('Page.screencastFrame', (p) => { if (rec) { const f = path.join(FR, 'f' + String(frames.length).padStart(5, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({ f, t: p.metadata.timestamp * 1000 }); } c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {}); });
  const go = async (p) => { await c.send('Page.navigate', { url: `http://127.0.0.1:${PORT}${p}` }); await sleep(2600); await c.ev('document.fonts.ready.then(()=>1)'); await c.ev(CAP); };
  const cap = (s) => c.ev(`(()=>{const d=document.getElementById('__cap');d.innerHTML=${JSON.stringify(s)};d.style.opacity=1})()`);
  const at = async (sel) => { await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.scrollIntoView({block:'center',behavior:'smooth'})})()`); await sleep(700); await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const r=e.getBoundingClientRect();const k=document.getElementById('__cur');k.style.left=(r.left+r.width/2)+'px';k.style.top=(r.top+r.height/2)+'px'})()`); await sleep(650); };
  const click = async (sel) => { await at(sel); await c.ev(`(()=>{const k=document.getElementById('__cur');k.style.background='rgba(169,112,255,.8)';setTimeout(()=>k.style.background='rgba(169,112,255,.2)',180);document.querySelector(${JSON.stringify(sel)}).click()})()`); await sleep(350); };
  const type = async (sel, txt, fast) => { await click(sel); const step = fast ? Math.ceil(txt.length / 18) : 1; for (let i = step; i < txt.length + step; i += step) { await c.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(txt)}.slice(0,${i});e.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(fast ? 40 : 110); } await sleep(400); };
  const until = async (js, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await c.ev(js)) return true; await sleep(500); } return false; };

  await go('/');
  await c.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 }); rec = true;
  await cap('umbrachainl1.net · <b style="color:#a970ff">a private chain mined by proof of proof</b>'); await sleep(4200);
  await go('/wallet'); await cap('1 · create UMBRA keys · made in your browser, never sent anywhere'); await sleep(1200); await click('#mk'); await sleep(2400);
  const addr = await c.ev(`document.querySelector('#a1 code').textContent`);
  await cap('2 · faucet · 25 UMBRA arrives as a private transaction'); await click('#drip');
  await until(`parseFloat(document.getElementById('bal').textContent) >= 25`, 90000); await at('#bal'); await sleep(2000);
  // prove a block in the browser while the faucet coins mature; the node's own prover rests so the tab can win
  await go('/mine'); await cap('3 · prove a block in your browser · the reward pays your own address');
  await c.ev(`(()=>{const a=document.getElementById('addr');a.value=${JSON.stringify(addr)};a.dispatchEvent(new Event('change'))})()`); await sleep(800); await click('#go');
  await until(`+document.getElementById('mine').textContent >= 1`, 120000); await at('#log'); await sleep(2800); await click('#go'); await sleep(600);
  await go('/wallet'); await until(`!document.getElementById('pend').textContent && parseFloat(document.getElementById('bal').textContent) >= 25`, 90000);
  await cap('4 · send 10 UMBRA privately to a quantum address · ring of 16, hidden amount');
  const { wallet } = await import('../client/rct.js'); const BOB = wallet().qaddress;
  await type('#to', BOB, true); await type('#amt', '10'); await click('#send');
  await until(`/sent/.test(document.getElementById('prog').textContent)`, 60000); await sleep(2600);
  const txid = await c.ev(`(document.querySelector('#prog a')||{}).href`);
  await until(`false`, 9000);   // let it land in a block
  await go('/explorer#/tx/' + txid.split('/tx/')[1]); await cap('5 · the explorer: rings of 16, key images, commitments · no sender, receiver or amount'); await sleep(3800);
  await cap('6 · verify it yourself · your browser re-runs every ring signature and range proof'); await click('#vf');
  await until(`/verified|failed/.test((document.getElementById('vout')||{}).textContent||'')`, 30000); await at('#vout'); await sleep(3200);
  const h = await c.ev(`fetch('/api/stats').then(r=>r.json()).then(s=>s.height)`);
  await go('/explorer#/block/' + h); await cap('7 · every block carries a proof · re-check it in milliseconds'); await sleep(1800); await click('#vp');
  await until(`/verified|rejected/.test((document.getElementById('pout')||{}).textContent||'')`, 20000); await at('#pout'); await sleep(3400);
  await go('/'); await cap('umbrachainl1.net · @UmbraChainL1 · <b style="color:#a970ff">$UMBRA</b>'); await sleep(3800);
  rec = false; await c.send('Page.stopScreencast');
  frames.sort((a, b) => a.t - b.t);
  const list = frames.map((x, i) => `file '${x.f.split(path.sep).join('/')}'\nduration ${Math.min(0.5, Math.max(0.01, ((frames[i + 1] || x).t - x.t) / 1000 || 0.05)).toFixed(3)}`).join('\n') + `\nfile '${frames[frames.length - 1].f.split(path.sep).join('/')}'`;
  fs.writeFileSync(path.join(FR, 'list.txt'), list);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(FR, 'list.txt'), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', OUT]);
  const s = await stats();
  console.log('OK', OUT, frames.length, 'frames', ((frames.at(-1).t - frames[0].t) / 1000).toFixed(1) + 's', JSON.stringify({ height: s.height, privateTxs: s.privateTxs, publicBlocks: s.publicBlocks }));
  c.close(); srv.kill(); fs.rmSync(FR, { recursive: true, force: true }); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
