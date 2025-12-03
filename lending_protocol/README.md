# 🔐 Private Lending Protocol

A confidential DeFi lending protocol on Solana using Arcium MPC for privacy-preserving health checks.

**Program ID:** `AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA` (Devnet)

## Features

- Deposit SOL collateral
- Borrow against collateral (80% LTV)
- Private health factor checks via Arcium MPC
- Private liquidation checks
- All sensitive calculations encrypted

## Architecture

**Public Layer (Solana/Anchor):**

- Account management
- Deposit/withdraw/borrow/repay instructions
- Orchestrates encrypted computations

**Private Layer (Arcium MPC):**

- `check_health_factor`: Verifies `collateral × 0.8 ≥ borrow_amount`
- `check_liquidation`: Checks if `debt > collateral × 0.8`
- All computations on encrypted data

## Program Structure

```
programs/lending_protocol/src/
├── lib.rs                     # Entrypoint
├── state.rs                   # UserAccount PDA
├── errors.rs                  # Custom errors
└── instructions/
    ├── initialize_user.rs     # Create account
    ├── deposit_collateral.rs  # Deposit SOL
    ├── borrow.rs              # Queue health check
    ├── finalize_borrow.rs     # Process result
    ├── repay.rs               # Repay loan
    ├── withdraw.rs            # Withdraw collateral
    └── check_liquidation.rs   # Queue liquidation check

encrypted-ixs/src/lib.rs
├── check_health_factor()      # Private health check
└── check_liquidation()        # Private liquidation check
```

## Instructions

**Public (Anchor):**

- `initialize_user`: Create user lending account (PDA)
- `deposit_collateral`: Deposit SOL
- `borrow`: Queue encrypted health check, set `pending_borrow`
- `finalize_borrow`: Process health check result, transfer funds or reject
- `repay`: Repay borrowed amount
- `withdraw`: Withdraw excess collateral
- `check_liquidation`: Queue liquidation check

**Private (Arcium MPC):**

- `check_health_factor`: Returns `borrow_amount <= collateral × 0.8`
- `check_liquidation`: Returns `debt > collateral × 0.8`

---

## Quick Start

**Prerequisites:** Rust, Solana CLI, Node.js, Arcium CLI

```bash
# Install & build
npm install
anchor build
cargo build-sbf --manifest-path=encrypted-ixs/Cargo.toml

# Test on localnet
arcium localnet start
anchor test
```

## Deployment

**Devnet:** `AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA`

```bash
anchor build
anchor deploy --provider.cluster devnet
ts-node migrations/init-arcium.ts
```

---

## ⚠️ Current Limitations

### Encrypted Computation Status

**Issue:** Arcium devnet clusters have not completed Distributed Key Generation (DKG) ceremony  
**Error Code:** `0x1772` (MxeKeysNotSet)  
**Impact:** Encrypted borrow and liquidation checks cannot execute on devnet

**Tested Clusters:**

- Cluster offset `768109697` (v0.4.0) - MXE keys not set
- Cluster offset `3726127828` (v0.3.0) - MXE keys not set
- Cluster offset `1078779259` (v0.3.0) - MXE keys not set

**Root Cause:**
The Arcium MPC network requires active operators to complete a DKG ceremony, generating the MXE (Multi-party Execution) public key used for encrypted computations. Currently, no devnet clusters have active operators running this ceremony.

**Verification:**

- MXE account data shows all zeros for public key (bytes 8-40)
- Error occurs when submitting computation: "MxeKeysNotSet"
- Code implementation is correct per Arcium documentation

---

## Resources

- [Arcium Docs](https://docs.arcium.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Solana Cookbook](https://solanacookbook.com)

---

**MIT License** | Built with Arcium for confidential computing on Solana
