# 🔐 Arcium Private Lending Protocol - Frontend dApp

**A confidential DeFi lending interface on Solana with privacy-preserving health checks powered by Arcium MPC.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Solana](https://img.shields.io/badge/Solana-Web3.js-purple)](https://solana.com)
[![Arcium](https://img.shields.io/badge/Arcium-v0.4.0-green)](https://arcium.com)

**Frontend:** `https://arcium-lending-protocol-kappa.vercel.app/`
**Smart Contract:** `AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA` (Devnet)

---

## ✨ Features

- 🔒 **Private Collateral & Borrowing** - Your financial data stays encrypted
- 🧮 **Encrypted Health Factor Checks** - Computed in Arcium MXE without revealing amounts
- 📊 **Real-time Position Monitoring** - Track your lending position
- 🌐 **Modern UI** - Built with Next.js 16, React 19, and Tailwind CSS

## 🌐 Deployment Status

### Production (Devnet)

- ✅ **Frontend:** `https://arcium-lending-protocol-kappa.vercel.app/`
- ✅ **Smart Contract:** `AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA`
- ✅ **Public Operations:** Deposit, withdraw, repay fully functional
- ⏳ **Encrypted Borrow:** Pending Arcium devnet DKG completion (see limitations)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local with your configuration
# (defaults work for localnet)
```

### 3. Start Development Server

```bash
npm run dev
# or
./start.ps1  # PowerShell script
```

### 4. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Prerequisites

### For Devnet (Public Operations Only)

1. **Wallet Extension:**

   - [Phantom](https://phantom.app/), [Solflare](https://solflare.com/), or any Solana wallet
   - Switch wallet to Devnet network

2. **Devnet SOL:**
   - Use built-in airdrop button in dApp
   - Or: `solana airdrop 2 <your-address> --url devnet`

## 🔑 Environment Configuration

### Devnet Configuration (Default)

```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA
NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET=768109697
NEXT_PUBLIC_LIQUIDATION_THRESHOLD=80
```

### Localnet Configuration

```bash
NEXT_PUBLIC_SOLANA_NETWORK=localnet
NEXT_PUBLIC_SOLANA_RPC_URL=http://localhost:8899
NEXT_PUBLIC_PROGRAM_ID=<your-deployed-program-id>
NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET=0
NEXT_PUBLIC_LIQUIDATION_THRESHOLD=80
```

### Environment Variables Reference

| Variable                            | Description             | Devnet                | Localnet         |
| ----------------------------------- | ----------------------- | --------------------- | ---------------- |
| `NEXT_PUBLIC_SOLANA_NETWORK`        | Network identifier      | `devnet`              | `localnet`       |
| `NEXT_PUBLIC_SOLANA_RPC_URL`        | RPC endpoint            | Helius/Alchemy devnet | `localhost:8899` |
| `NEXT_PUBLIC_PROGRAM_ID`            | Lending program address | `Ammi...uZMA`         | From deployment  |
| `NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET` | Arcium MPC cluster      | `768109697`           | `0`              |
| `NEXT_PUBLIC_LIQUIDATION_THRESHOLD` | Max LTV %               | `80`                  | `80`             |

## 📖 Usage Guide

### First-Time Setup

1. **Connect Wallet**

   - Click "Connect Wallet" button in navbar
   - Approve connection in your wallet

2. **Get Test SOL** (Devnet only)

   - Click "Request Airdrop"
   - Receive 2 SOL for testing

3. **Initialize Account**
   - Click "Initialize Account"
   - Approve transaction
   - Your on-chain account is created

### Using the Protocol

#### Deposit Collateral

- Go to "Lending" tab
- Enter amount in "Deposit" form
- Click "Deposit Collateral"
- Your SOL is locked as collateral

#### Borrow Funds

- Enter borrow amount (up to 80% of collateral)
- Click "Borrow"
- **MPC Computation**: Arcium network verifies your health factor privately
- If healthy, funds are borrowed

#### Repay Loan

- Enter repayment amount
- Click "Repay"
- Your debt decreases

#### Monitor Health Factor

- Green (>1.5): Safe
- Yellow (1.2-1.5): Moderate risk
- Red (<1.2): High liquidation risk

## 🏗️ Architecture

### Key Components

```
frontend/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # Main dApp interface
│   └── src/
│       ├── hooks/
│       │   └── usePrivateLending.ts   # Core integration hook
│       ├── contexts/
│       │   ├── WalletContextProvider.tsx
│       │   └── NotificationContext.tsx
│       └── types/index.ts          # TypeScript definitions
├── components/
│   ├── dApp-components/            # UI components
│   └── idl/lending_protocol.json   # Program IDL
└── lib/
    ├── arcium.ts                   # Encryption utilities
    ├── constants.ts                # Configuration
    └── utils.ts                    # Helper functions
```

### Privacy Architecture

#### Encryption Flow (Client → Arcium MPC)

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. Generate x25519 keypair
       │ 2. Derive shared secret with MXE pubkey
       │ 3. Encrypt with Rescue cipher
       ▼
┌─────────────────────┐
│  Solana Blockchain  │
│  (Anchor Program)   │
└──────────┬──────────┘
           │ 4. Submit encrypted computation
           ▼
    ┌──────────────┐
    │ Arcium MPC   │
    │   Network    │
    └──────┬───────┘
           │ 5. Compute on encrypted data:
           │    health = (collateral * 0.8) >= borrow
           │ 6. Return encrypted boolean
           ▼
    ┌──────────────┐
    │   Program    │
    │  Callback    │
    └──────┬───────┘
           │ 7. Decrypt result
           │ 8. Approve/reject borrow
           ▼
       [User Wallet]
```

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Blockchain**: Solana Web3.js, Anchor
- **Privacy**: Arcium MPC, x25519, Rescue Cipher
- **Wallet**: Solana Wallet Adapter

### Available Scripts

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint code analysis
npm run type-check   # TypeScript type checking
```

### Project Structure Deep Dive

```
frontend/
├── app/
│   ├── page.tsx                           # Landing page with hero/features
│   ├── dashboard/page.tsx                 # Main dApp interface
│   ├── layout.tsx                         # Root layout with providers
│   ├── globals.css                        # Tailwind + custom styles
│   └── src/
│       ├── hooks/
│       │   └── usePrivateLending.ts       # Core protocol integration
│       ├── contexts/
│       │   ├── WalletContextProvider.tsx  # Solana wallet provider
│       │   └── NotificationContext.tsx    # Toast notifications
│       └── types/
│           └── index.ts                   # TypeScript interfaces
│
├── components/
│   ├── dApp-components/
│   │   ├── cards/
│   │   │   ├── PositionCard.tsx          # User position summary
│   │   │   ├── HealthFactorCard.tsx      # Health indicator
│   │   │   └── StatsCard.tsx             # Protocol statistics
│   │   ├── forms/
│   │   │   ├── DepositForm.tsx           # Deposit collateral UI
│   │   │   ├── BorrowForm.tsx            # Borrow funds UI
│   │   │   └── RepayForm.tsx             # Repay debt UI
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                # Navigation + wallet button
│   │   │   └── Sidebar.tsx               # Dashboard navigation
│   │   └── tabs/
│   │       └── LendingTabs.tsx           # Tab switcher
│   ├── landing-page-components/
│   │   ├── Hero.tsx                      # Landing hero section
│   │   ├── Features.tsx                  # Feature highlights
│   │   ├── Stats.tsx                     # Protocol metrics
│   │   └── FAQ.tsx                       # Frequently asked questions
│   └── idl/
│       └── lending_protocol.json         # Anchor program IDL
│
├── lib/
│   ├── arcium.ts                         # Encryption + MPC utilities
│   ├── constants.ts                      # Config + derived addresses
│   └── utils.ts                          # Helper functions
│
└── public/                                # Static assets
```

## 📚 Documentation

### Project Documentation

- **[Smart Contract README](../lending_protocol/README.md)** - Backend Rust/Anchor documentation
- **[Root README](../README.md)** - Project overview and SDLC documentation

### External Resources

- **[Arcium Documentation](https://docs.arcium.com)** - MPC network and SDK reference
- **[Arcium SDK Reference](https://docs.arcium.com/sdk/overview)** - Client library API
- **[Solana Cookbook](https://solanacookbook.com)** - Solana Web3.js patterns
- **[Anchor Book](https://book.anchor-lang.com)** - Anchor framework guide
- **[Next.js Docs](https://nextjs.org/docs)** - Next.js App Router documentation

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is part of the Arcium lending protocol demonstration.

## 🙏 Acknowledgments

- **Arcium** - For the confidential computing network
- **Solana** - For the fast, low-cost blockchain
- **Anchor** - For the Solana development framework

---

**Built with ❤️ using Arcium's Privacy Technology**
