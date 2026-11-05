// one mining thread: runs the UMBRA trace program, commits it, and proves it when the commitment meets the target.
// The node re-checks every proof (client/pop.js verify) before it accepts the block.
import { attempt } from '/pop-w.js';
let job = null, run = false;
onmessage = (e) => { if (e.data.job) job = e.data.job; if ('run' in e.data) { const was = run; run = e.data.run; if (run && !was) loop(); } };
async function loop() {
  let n = 0, t = Date.now();
  while (run) {
    if (!job) { await new Promise((r) => setTimeout(r, 500)); continue; }
    const j = job, nonce = Math.floor(Math.random() * 2 ** 47), pf = attempt(j.hdr, nonce, j.diff);
    n++; if (Date.now() - t > 1000) { postMessage({ hashes: n }); n = 0; t = Date.now(); await new Promise((r) => setTimeout(r, 0)); }
    if (pf && j === job) { postMessage({ found: { id: j.id, proof: pf } }); job = null; }
  }
}
