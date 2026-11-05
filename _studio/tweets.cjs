// writes brand/X-KIT.md and checks every tweet is ≤245 characters.  node _studio/tweets.cjs
'use strict';
const fs = require('fs'), path = require('path'), len = (s) => [...s].length;
const SITE = 'https://umbrachainl1.net', HANDLE = '@UmbraChainL1';
const BIO = 'A private chain mined by proof of proof. Miners prove a Goldilocks-field trace, every note hides sender, receiver and amount, history anchored to Solana. $UMBRA';
const DEX = 'UMBRA is a private blockchain mined by proof of proof, the Nockchain model: miners win blocks by proving a 1,024-step computation over the Goldilocks field, and every node checks the proof in milliseconds. 2^32 supply, no premine. Every transaction hides the sender (ring of 16), the receiver (stealth notes) and the amount (Pedersen commitments + range proofs), with ML-KEM-768 quantum-safe addresses. Every 100 blocks the chain writes its block hash to Solana. Prove blocks in your browser at umbrachainl1.net/mine.';
const T = [
['Hype (video)', 'umbra-hype-18s.mp4', `The proof is the work.
The note is dark.

UMBRA: a private chain where miners prove a computation, every transfer hides who and how much, and Solana keeps the receipts.

${SITE}

$UMBRA`],
['App demo (video)', 'umbra-app-demo.mp4', `The whole UMBRA app, start to finish:

create keys → faucet → prove a block in your browser → send privately to a quantum address → verify the tx and the block proof yourself

${SITE}/wallet

$UMBRA`],
['ATH comparison', 'umbra-g09-ath.png', `Privacy is a sector, not a niche.

Zcash peaked near $21.7B.
Monero near $13.4B.
Dash near $11.6B.

UMBRA brings Monero-grade privacy, quantum-safe receive, proved blocks and Solana anchors.

$UMBRA`],
['ATH comparison (video)', 'umbra-ath-12s.mp4', `Zcash, Monero, Dash: billions in peak market cap, all mined by hashing.

UMBRA is the first private chain mined by proof of proof, pinned to Solana.

${SITE}

$UMBRA`],
['Live network', 'umbra-g10-live.png', `umbra-1 is live.

Blocks every ~20s, each carrying a proof.
Proof check: ~4 ms on any machine.
Browser prover at /mine.
Solana anchors every 100 blocks.

${SITE}/explorer

$UMBRA`],
['Proof (video)', 'umbra-proof-15s.mp4', `Seed. Run. Commit. Beat the target. Open 32 steps.

That's an UMBRA block. No proof, no block.

${SITE}/mine

$UMBRA`],
['Notes (video)', 'umbra-notes-14s.mp4', `Sender: 1 of 16, unknown.
Receiver: never written.
Amount: a commitment.

That's every UMBRA transfer, and you can verify one yourself in your browser.

$UMBRA`],
['Anchors (video)', 'umbra-anchor-12s.mp4', `Every 100 blocks UMBRA writes its fingerprint onto Solana. One Memo tx, open on Solscan.

Proved on UMBRA. Pinned to Solana.

${SITE}/explorer#/anchors

$UMBRA`],
['Pinned · intro', 'umbra-g01-keyart.png', `Hash grinding proves you burned power.
UMBRA's miners prove they ran the program.

Proof-of-proof blocks, Nockchain-style. Every note private. History anchored to Solana.

Prove a block in your browser:
${SITE}/mine

$UMBRA`],
['Proof of proof', 'umbra-g02-proof.png', `How an UMBRA block is won:

1. seed from header + nonce
2. 1,023 rounds of (a+b)⁷ + c over Goldilocks
3. Merkle the whole trace
4. root beats the difficulty
5. open 32 Fiat–Shamir steps

Nodes check it in ~4 ms.

$UMBRA`],
['Nockchain model', 'umbra-g03-nock.png', `Nockchain showed proof of work can be proof of proof.

UMBRA keeps the model: Goldilocks field, 2³² supply, no premine, notes.

And adds what it lacks: rings of 16, hidden amounts, ML-KEM addresses, Solana anchors.

$UMBRA`],
['Fair launch', 'umbra-g04-launch.png', `4,294,967,296 UMBRA. That's 2³².

Premine: 0
Presale: 0
Team allocation: 0

Every coin comes out of a block somebody proved. The reward is what's left ÷ 2¹⁹, with a 2 UMBRA tail forever.

$UMBRA`],
['Private notes', 'umbra-g05-notes.png', `What the ledger sees in an UMBRA transfer:

which note was spent: 1 of 16, unknown
receiver address: never written
amounts: commitments only

What you can do: press "verify in your browser" and re-check it yourself.

$UMBRA`],
['Solana anchors', 'umbra-g06-solana.png', `Every 100 blocks, UMBRA writes its own fingerprint onto Solana:

umbra-1:<height>:<block hash>

One Memo tx per anchor, open on Solscan. Rewriting UMBRA's history would mean contradicting Solana.

$UMBRA`],
['Comparison', 'umbra-g07-compare.png', `Nockchain: proof of proof, public notes.
Monero: private notes, hash mining.
Zcash: shielded pool, founders' reward.

UMBRA: proof of proof + ring-16 private notes + ML-KEM receive + Solana anchors. No premine.

$UMBRA`],
['Browser prover', 'umbra-g01-keyart.png', `No rig. No pool. No download.

Open ${SITE}/mine, paste your address, press start. Each thread runs the same program and proof the node runs, and blocks pay straight to your private address.

$UMBRA`],
['Verify the proof', 'umbra-g02-proof.png', `Don't trust the node.

Open any block on the UMBRA explorer and press "verify proof in your browser": your machine re-derives the seed, the commitment and all 32 challenges, then re-checks every opened step.

$UMBRA`],
['Quantum', 'umbra-g05-notes.png', `Record a chain today, break it with a quantum computer later.

UMBRA's umbq1 addresses find payments with ML-KEM-768, NIST's lattice standard. That recording stays unlinkable after Q-day.

$UMBRA`],
['Roadmap', 'umbra-g08-roadmap.png', `UMBRA roadmap:

✓ proof-of-proof blocks
✓ private notes, ring 16, ML-KEM
✓ browser + CLI provers
✓ Solana anchors
→ full STARK per block
→ proof aggregation, p2p nodes
→ UMBRA ⇄ Solana bridge

$UMBRA`],
['Launch', 'umbra-og.png', `$UMBRA is live on Solana.

The proof is the work. The note is dark.

CA: Cz2YM1CaVm8FDbET2fZ33hLkhSrUyJJMtCgQxmbhpump

${SITE}`],
];
let bad = 0, md = `# UMBRA X kit\n\n## Handle\n\`\`\`\n${HANDLE}\n\`\`\`\n\n## Display name\n\`\`\`\nUMBRA | $UMBRA\n\`\`\`\n\n## Bio (${len(BIO)}/160)\n\`\`\`\n${BIO}\n\`\`\`\n\n## Website\n\`\`\`\n${SITE}\n\`\`\`\n\n## DexScreener description\n\`\`\`\n${DEX}\n\`\`\`\n\n## Profile images\n- Avatar: \`umbra-pfp.png\`\n- Header: \`umbra-banner.png\`\n\n## Tweets (all ≤245)\n`;
T.forEach(([name, media, text], i) => { const n = len(text); if (n > 245) { bad++; console.log('TOO LONG', i + 1, n); } console.log(i + 1, n, name); md += `\n### ${i + 1}. ${name} · ${n} chars · media: \`${media}\`\n\`\`\`\n${text}\n\`\`\`\n`; });
if (len(BIO) > 160) { bad++; console.log('BIO TOO LONG', len(BIO)); }
fs.writeFileSync(path.join(__dirname, '..', 'brand', 'X-KIT.md'), md); console.log(bad ? 'FIX' : 'all fit', 'bio', len(BIO));
