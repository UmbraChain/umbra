# UMBRA

**The proof is the work. The note is dark.** UMBRA is a private chain mined by proof of proof. Miners win blocks by proving a computation over the Goldilocks field, the model Nockchain introduced. Every transaction hides the sender, the receiver and the amount, and the chain's history is anchored to Solana every 100 blocks.

[![tests](https://github.com/UmbraChain/umbra/actions/workflows/test.yml/badge.svg)](https://github.com/UmbraChain/umbra/actions/workflows/test.yml)

- Network, explorer, wallet, prover: https://umbra.network
- X: [@UmbraOnSolana](https://x.com/UmbraOnSolana)
- Token: $UMBRA on Solana

## What runs today

One Node.js process is the node, the explorer, the browser wallet and the browser prover.

| Piece | How it works | Code |
|---|---|---|
| Proof of proof | From `sha256(header, nonce)` the miner derives `(a₀, b₀)` in Goldilocks (p = 2⁶⁴ − 2³² + 1) and runs 1,023 rounds of `a' = (a+b)⁷ + cᵢ, b' = a`. All 1,024 states are Merkle-committed; a block is valid when `sha256(pow‖root‖header‖nonce) × diff < 2²⁵⁶` | `client/pop.js` `trace`, `attempt` |
| Block proof | First state, final state and 32 Fiat–Shamir-chosen steps, each opened with its successor and Merkle paths. Nodes verify in ~4 ms. Faking a fraction f of the trace survives with probability (1 − f)³² | `client/pop.js` `verify` |
| Fair launch | 2³² UMBRA max, no premine. Reward = (2³² − mined) / 2¹⁹, 2 UMBRA tail | `server/index.js` `reward` |
| Hidden sender | Each input signs with 16 notes (15 decoys) via a two-row MLSAG over ristretto255; key images stop double spends | `client/rct.js` `mlsagSign` / `mlsagVerify` |
| Hidden receiver | One-time stealth outputs `P = Hs(secret, i)·G + A` | `makeOutput`, `scan` |
| Hidden amount | Pedersen commitments + 48-bit range proofs; inputs = outputs + fee checked on curve points | `rangeProve`, `verifyTx` |
| Quantum receive | `umbq1` addresses carry an ML-KEM-768 key; the 1,088-byte ciphertext rides with the output | `makeOutput`, `scan` |
| Solana anchors | Every 100 blocks: Memo tx `umbra-1:<height>:<hash>` signed by `SOLANA_KEY` | `server/solana.js` |
| Verify yourself | Explorer re-runs block proofs (`/api/proof/:h`) and transaction proofs (`/api/rawtx/:id`) in your browser | `client/explorer.html` |
| Open proving | `GET /api/work?address=` → template; `POST /api/work {id, proof}` → node re-verifies, pays the coinbase to you | `client/mine.html`, `miner/miner.js` |

## Run

```bash
npm i
npm start                  # http://localhost:8274
npm test                   # crypto unit tests
npm run test:e2e           # boots a node: proves blocks, faucet, private send, public prover wins a block
node miner/miner.js <umb1 address> --node http://localhost:8274 --threads 4
```

Environment: `PORT`, `DATA_PATH`, `BLOCK_SEC` (default 20), `NODE_PAUSE` (ms the node's own prover rests between attempts, leaving room for public provers), `UMBRA_MINT` ($UMBRA address shown on the site), `SOLANA_KEY` (anchor signer: base58 secret or JSON array; fund it with a little SOL), `SOLANA_RPC`, `ANCHOR_EVERY`.

## Roadmap

- Full STARK per block: a low-degree test over the whole trace, so a single wrong step is caught
- Proof aggregation: one proof per anchor window
- Peer-to-peer nodes
- UMBRA ⇄ Solana bridge
