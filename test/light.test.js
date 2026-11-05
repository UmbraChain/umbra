// Light client against a running node: rebuild every header, re-check proofs, and catch a tampered header.
//   API=http://localhost:8274 node test/light.test.js
import * as L from '../client/light.js';
const B = process.env.API || 'http://localhost:8274';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };
const r = await (await fetch(B + '/api/headers?from=0&limit=2000')).json(), list = r.headers.map(L.unpack);
const c = L.checkHeaders(list); ok(c.ok && c.next === list.length, `rebuilt ${list.length} block hashes from genesis, every link intact`);
const tipH = list[list.length - 1], p = await (await fetch(B + '/api/proof/' + tipH.height)).json(); ok(L.checkProof(tipH, p.proof) === null, 'tip proof re-verifies against the locally rebuilt header');
const t1 = list.map((h) => ({ ...h })); t1[Math.floor(t1.length / 2)].ts += 1; ok(!L.checkHeaders(t1).ok, 'a header with one changed field is caught');
const t2 = list.map((h) => ({ ...h })); t2.splice(2, 1); ok(!L.checkHeaders(t2).ok, 'a missing block is caught');
ok(L.checkProof({ ...tipH, diff: tipH.diff + 1e9 }, p.proof) !== null, 'a proof does not pass for a header claiming more work');
const hs = c.hashes; ok(L.checkAnchor('umbra-1:1:' + hs.get(1), hs).ok, 'matching anchor memo accepted'); ok(!L.checkAnchor('umbra-1:1:' + 'f'.repeat(64), hs).ok, 'anchor with a different hash rejected');
// watchtowers
const sk = L.newKey(), post = (d) => fetch(B + '/api/attest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.json());
ok((await post(L.attest(sk, { height: 1, hash: 'f'.repeat(64), proofs: 1, anchors: 0, kind: 'node' }))).error, 'attestation for a hash that is not on the chain is refused');
const good = L.attest(sk, { height: tipH.height, hash: c.hashes.get(tipH.height), proofs: 1, anchors: 0, kind: 'node' });
ok((await post({ ...good, proofs: 99 })).error, 'attestation whose signed fields were changed is refused');
ok((await post(good)).ok, 'valid signed attestation accepted');
const board = await (await fetch(B + '/api/attest')).json(); ok(board.watchtowers >= 1 && board.recent.some((w) => w.height === tipH.height), 'watchtower board lists it');
console.log(`\n${fail ? 'FAILED' : 'ALL PASS'} (${pass}/${pass + fail})`); process.exit(fail ? 1 : 0);
