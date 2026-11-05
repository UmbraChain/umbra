// UMBRA CPU miner. Proves blocks on any node and pays the reward to your own address.
//   node miner/miner.js <umb1… or umbq1… address> [--node https://umbrachainl1.net] [--threads N]
import os from 'node:os'; import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { attempt } from '../client/pop.js';

if (!isMainThread) {   // a proving thread: runs attempts on whatever job the main thread hands it
  let job = workerData.job; parentPort.on('message', (j) => (job = j));
  for (let n = 0; ; n++) { if (!job) { await new Promise((r) => setTimeout(r, 500)); continue; } const j = job, pf = attempt(j.hdr, Math.floor(Math.random() * 2 ** 47), j.diff);
    if (n % 50 === 0) { parentPort.postMessage({ hashes: 50 }); await new Promise((r) => setImmediate(r)); } if (pf && j === job) { parentPort.postMessage({ found: { id: j.id, proof: pf }, reward: j.reward }); job = null; } }
} else {
  const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const ADDR = args.find((a) => /^umbq?1/.test(a)), NODE = opt('--node', 'https://umbrachainl1.net').replace(/\/$/, ''), THREADS = +opt('--threads', Math.max(1, os.availableParallelism() - 1));
  if (!ADDR) { console.log('usage: node miner/miner.js <your umb1/umbq1 address> [--node URL] [--threads N]'); process.exit(1); }
  const get = (p) => fetch(NODE + p).then((r) => r.json()), post = (p, d) => fetch(NODE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.json());
  let job = null, hashes = 0, found = 0; const t0 = Date.now(), W = [];
  async function refresh() { try { const j = await get('/api/work?address=' + encodeURIComponent(ADDR)); if (j.error) throw new Error(j.error); if (!job || j.id !== job.id) { job = j; W.forEach((w) => w.postMessage(job)); } } catch (e) { console.log('work:', e.message); } }
  console.log(`UMBRA miner · ${NODE} · ${THREADS} threads · paying ${ADDR.slice(0, 18)}…`);
  await refresh();
  for (let i = 0; i < THREADS; i++) { const w = new Worker(new URL(import.meta.url), { workerData: { job } }); W.push(w);
    w.on('message', async (m) => { if (m.hashes) hashes += m.hashes; if (m.found) { job = null; W.forEach((x) => x.postMessage(null)); const r = await post('/api/work', m.found);
      if (r.ok) { found++; console.log(`★ block ${r.height} proved · reward ${(Number(m.reward) / 1e6).toFixed(4)} UMBRA → your wallet`); } else console.log('submit:', r.error); await refresh(); } }); }
  setInterval(refresh, 5000);
  setInterval(() => { const s = (Date.now() - t0) / 1000; console.log(`${(hashes / s).toFixed(1)} proofs/s · height ${job ? job.height : '?'} · diff ${job ? job.diff : '?'} · blocks ${found}`); }, 15000);
}
