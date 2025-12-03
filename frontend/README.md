# 🔐 Arcium Private Lending Protocol - Frontend dApp

**A confidential DeFi lending interface on Solana with privacy-preserving health checks powered by Arcium MPC.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Solana](https://img.shields.io/badge/Solana-Web3.js-purple)](https://solana.com)
[![Arcium](https://img.shields.io/badge/Arcium-v0.4.0-green)](https://arcium.com)

**Live Demo:** [Insert deployment URL]
**Smart Contract:** `AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA` (Devnet)

---

## ✨ Features

- 🔒 **Private Collateral & Borrowing** - Your financial data stays encrypted
- 🧮 **Encrypted Health Factor Checks** - Computed in Arcium MXE without revealing amounts
- 📊 **Real-time Position Monitoring** - Track your lending position
- 🎮 **Gamified Experience** - Earn XP and achievements
- 🌐 **Modern UI** - Built with Next.js 16, React 19, and Tailwind CSS

## 🌐 Deployment Status

### Production (Devnet)

- ✅ **Frontend:** Deployed and accessible
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

### For Localnet (Full MPC Features)

1. **Node.js & npm:**

   - Node.js v18+ recommended

2. **Arcium Localnet:**

   ```bash
   cd ../lending_protocol
   arcium localnet start
   ```

3. **Solana Test Validator:**

   ```bash
   cd ../lending_protocol
   anchor test  # Deploys program and initializes Arcium
   ```

4. **Wallet Extension:**
   - Configure wallet for localhost:8899
   - Import test wallet or request airdrop

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

**Note:** Arcium Program ID is derived automatically from SDK using cluster offset.

See [`.env.example`](./.env.example) for complete configuration template.

## 📖 Usage Guide

### First-Time Setup

1. **Connect Wallet**

   - Click "Connect Wallet" button in navbar
   - Approve connection in your wallet

2. **Get Test SOL** (Localnet/Devnet only)

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

#### Key Components

**1. Encryption Utilities (`lib/arcium.ts`)**

- `initializeEncryption()`: Sets up x25519 key exchange
- `getMXEPublicKeyWithRetry()`: Fetches MXE pubkey from Arcium account
- `encryptHealthCheckInput()`: Encrypts collateral/borrow data with Rescue cipher
- `waitForDKG()`: Polls for MPC cluster readiness

**2. Core Hook (`usePrivateLending.ts`)**

- `depositCollateral()`: Public SOL transfer to program
- `borrow()`: Two-step encrypted borrow flow
  - Step 1: Queue computation with encrypted input
  - Step 2: Wait for computation completion
- `finalizeBorrow()`: Process computation result
- `repay()`: Repay borrowed amount (public)
- `withdraw()`: Withdraw excess collateral (public)

**3. Account Derivation**

```typescript
// User lending account (PDA)
const [userAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from("user_account"), wallet.publicKey.toBuffer()],
  program.programId
);

// Arcium computation definition (PDA)
const [compDefAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from("comp_def"), program.programId.toBuffer(), compDefName],
  arciumProgramId
);

// Arcium computation account (unique per request)
const [computationAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from("computation"), compDefAccount.toBuffer(), nonce],
  arciumProgramId
);
```

**4. State Management**

- React Context for wallet connection
- Local state for transaction status
- Polling for computation completion
- Toast notifications for user feedback

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

### Adding New Features

#### 1. Add Smart Contract Instruction

```typescript
// In usePrivateLending.ts
const newInstruction = async (param: number) => {
  if (!wallet.publicKey || !program) return;

  const tx = await program.methods
    .newInstruction(new BN(param))
    .accounts({
      userAccount,
      user: wallet.publicKey,
      // ... other accounts
    })
    .rpc();

  console.log("Transaction:", tx);
};
```

#### 2. Create UI Component

```typescript
// In components/dApp-components/forms/NewForm.tsx
export default function NewForm() {
  const { newInstruction } = usePrivateLending();

  const handleSubmit = async () => {
    await newInstruction(value);
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

#### 3. Update IDL

```bash
# After rebuilding smart contract
cp ../lending_protocol/target/idl/lending_protocol.json components/idl/
```

#### 4. Test Locally

```bash
# Terminal 1: Start Arcium localnet
cd ../lending_protocol
arcium localnet start

# Terminal 2: Deploy contracts
anchor test

# Terminal 3: Start frontend
cd ../frontend
npm run dev
```

## 🧪 Testing

### Manual Testing Checklist

#### Localnet (Full Features)

**Setup:**

- [ ] Arcium localnet running (`arcium localnet start`)
- [ ] Solana validator running (`anchor test`)
- [ ] Wallet connected to localhost:8899
- [ ] Test wallet has SOL (airdrop)

**Core Flow:**

1. [ ] Connect Phantom/Solflare wallet
2. [ ] Request airdrop (2 SOL)
3. [ ] Initialize user account
4. [ ] Deposit 1 SOL collateral
5. [ ] Borrow 0.5 SOL
   - [ ] Encryption succeeds
   - [ ] Computation submits to Arcium
   - [ ] Health check completes (~10-30s)
   - [ ] Funds received in wallet
6. [ ] Check health factor display (green)
7. [ ] Repay 0.25 SOL
8. [ ] Withdraw 0.2 SOL collateral
9. [ ] Verify position updates correctly

**Edge Cases:**

- [ ] Try borrowing >80% of collateral (should fail)
- [ ] Try withdrawing too much collateral (should fail)
- [ ] Try borrowing with 0 collateral (should fail)
- [ ] Multiple deposits and withdrawals
- [ ] Full repayment and withdrawal

#### Devnet (Public Operations Only)

**Setup:**

- [ ] Wallet connected to devnet
- [ ] Test wallet has devnet SOL

**Available Tests:**

1. [ ] Connect wallet
2. [ ] Initialize account
3. [ ] Deposit collateral
4. [ ] Withdraw collateral
5. [ ] UI/UX responsiveness
6. [ ] Error handling for MXE operations

**Expected Behavior:**

- ✅ Deposit/withdraw work perfectly
- ❌ Borrow shows "MxeKeysNotSet" error (expected)
- ✅ Error messages are user-friendly

### Automated Testing

#### Smart Contract Tests

```bash
cd ../lending_protocol
anchor test  # Full integration tests
```

#### Frontend Type Checking

```bash
npm run type-check  # Verify TypeScript types
npm run lint        # Check code quality
```

### Performance Testing

**Metrics to Monitor:**

- Page load time: <2s
- Wallet connection: <1s
- Transaction submission: <3s
- MPC computation: 10-30s (expected)
- UI responsiveness: No blocking operations

**Browser DevTools:**

1. Open Console for transaction logs
2. Check Network tab for RPC calls
3. Monitor Performance tab for render times

## ⚠️ Current Limitations

### Devnet MPC Status

**Issue:** Encrypted borrow operations do not work on devnet  
**Error:** `0x1772` (MxeKeysNotSet) - MPC cluster DKG not completed  
**Root Cause:** Arcium devnet clusters lack active operators to complete Distributed Key Generation

**What Works on Devnet:**

- ✅ Wallet connection
- ✅ Account initialization
- ✅ Deposit collateral
- ✅ Withdraw collateral
- ✅ Repay borrows
- ✅ UI/UX and all frontend features

**What Requires Localnet:**

- ⏳ Encrypted health factor checks
- ⏳ Private borrow operations
- ⏳ Liquidation checks

**Workaround:**
All features work perfectly on **Arcium localnet**. The smart contract code is production-ready and will function immediately once Arcium completes devnet DKG ceremony.

**Tested Clusters:**

- Offset `768109697` (v0.4.0) - MXE keys not initialized
- Offset `3726127828` (v0.3.0) - MXE keys not initialized
- Offset `1078779259` (v0.3.0) - MXE keys not initialized

### Browser Compatibility

**Supported Browsers:**

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Brave
- ✅ Edge

**Wallet Extensions:**

- ✅ Phantom (recommended)
- ✅ Solflare
- ✅ Backpack
- ⚠️ Other wallets may work but are untested

---

## 🐛 Troubleshooting

### Common Issues

#### "Account does not exist"

**Cause:** User lending account not initialized  
**Solution:**

1. Click "Initialize Account" button
2. Approve transaction in wallet
3. Wait for confirmation
4. Refresh page if needed

#### "Program account not found"

**Cause:** Wrong program ID or network mismatch  
**Solution:**

1. Verify `NEXT_PUBLIC_PROGRAM_ID` in `.env.local`
2. Ensure wallet is on correct network (devnet/localnet)
3. Check RPC endpoint is accessible
4. For localnet: ensure `anchor test` completed successfully

#### "MxeKeysNotSet" (Error 0x1772)

**Cause:** Arcium devnet DKG not completed (expected)  
**Solution:**

1. Switch to localnet for full functionality
2. Or wait for Arcium devnet DKG completion
3. Public operations (deposit/withdraw/repay) still work

#### "Encryption failed" or "Cannot read MXE public key"

**Cause:** Arcium MPC cluster not initialized  
**Solution:**

1. **Localnet:** Run `arcium localnet start` first
2. **Devnet:** Check cluster offset in `.env.local` (768109697)
3. Verify Arcium SDK version matches: `@arcium-hq/client@^0.4.0`
4. Check browser console for detailed error messages

#### "Transaction simulation failed"

**Cause:** Insufficient collateral or invalid borrow amount  
**Solution:**

1. Ensure collateral > 0
2. Borrow amount ≤ 80% of collateral
3. Account for transaction fees (~0.005 SOL)
4. Check wallet has enough SOL for fees

#### "Wallet connection failed"

**Cause:** Wallet extension not installed or wrong network  
**Solution:**

1. Install Phantom or Solflare wallet
2. Switch wallet to correct network (devnet for production)
3. Refresh page after installing extension
4. Try different wallet adapter if issue persists

#### "Computation timeout"

**Cause:** Arcium computation taking longer than expected  
**Solution:**

1. **Localnet:** Normal (may take 10-30 seconds)
2. Check Arcium localnet logs for errors
3. Verify computation definition initialized: `ls build/*.idarc`
4. Re-run `ts-node migrations/init-arcium.ts` if needed

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed troubleshooting.

## 📚 Documentation

### Project Documentation

- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Complete Arcium integration walkthrough
- **[Smart Contract README](../lending_protocol/README.md)** - Backend Rust/Anchor documentation
- **[Root README](../README.md)** - Project overview and SDLC documentation

### External Resources

- **[Arcium Documentation](https://docs.arcium.com)** - MPC network and SDK reference
- **[Arcium SDK Reference](https://docs.arcium.com/sdk/overview)** - Client library API
- **[Solana Cookbook](https://solanacookbook.com)** - Solana Web3.js patterns
- **[Anchor Book](https://book.anchor-lang.com)** - Anchor framework guide
- **[Next.js Docs](https://nextjs.org/docs)** - Next.js App Router documentation

### Code Examples

- **Encryption:** `lib/arcium.ts` - x25519 + Rescue cipher implementation
- **Protocol Hook:** `app/src/hooks/usePrivateLending.ts` - All transaction logic
- **Account Derivation:** `lib/constants.ts` - PDA and Arcium account addresses

---

## 🚀 Production Deployment

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables:**

- Set all `NEXT_PUBLIC_*` variables in Vercel dashboard
- Use devnet configuration for public demo
- Add custom domain if desired

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

#### Self-Hosted

```bash
# Build production bundle
npm run build

# Start production server
npm run start
# Or use PM2 for process management
pm2 start npm --name "arcium-lending" -- start
```

### Pre-Deployment Checklist

- [ ] Update environment variables for production
- [ ] Verify smart contract deployment on devnet/mainnet
- [ ] Test wallet connection on target network
- [ ] Enable HTTPS (required for wallet extensions)
- [ ] Configure CSP headers
- [ ] Test on mobile devices
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure analytics (optional)
- [ ] Update README with live demo URL

### Post-Deployment Monitoring

**Metrics to Track:**

- Wallet connection success rate
- Transaction success rate
- Average computation time (localnet)
- Error rates by type
- User retention and engagement

**Monitoring Tools:**

- Vercel Analytics (built-in)
- Solana Explorer for on-chain metrics
- RPC provider dashboards (Helius, Alchemy)
- Browser DevTools for client-side errors

## 🔐 Security & Privacy

### Privacy Guarantees

**What Remains Private:**

- ✅ **Collateral Amounts:** Encrypted during health checks
- ✅ **Borrow Amounts:** Encrypted inputs to MPC
- ✅ **Health Factor Calculations:** Computed in Arcium MXE without decryption
- ✅ **Liquidation Thresholds:** Private evaluation in encrypted state

**What Is Public:**

- ❌ **Wallet Addresses:** Visible on-chain (Solana standard)
- ❌ **Transaction Signatures:** Public transaction history
- ❌ **Account Existence:** Can see user has lending account
- ❌ **Computation Requests:** Can see computation was submitted (not the values)

### Security Best Practices

**For Users:**

1. ✅ Never share your wallet private key or seed phrase
2. ✅ Verify contract addresses before first interaction:
   - Program: `AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA`
   - Arcium Program: Derived from SDK (verify in console)
3. ✅ Test with small amounts on devnet first
4. ✅ Monitor your health factor regularly to avoid liquidation
5. ✅ Use hardware wallets for large amounts (Ledger supported)
6. ✅ Keep browser and wallet extensions updated

**For Developers:**

1. ✅ Always derive Arcium addresses from SDK (don't hardcode)
2. ✅ Validate all user inputs before submitting transactions
3. ✅ Use proper error handling for wallet interactions
4. ✅ Never log private keys or sensitive data
5. ✅ Implement rate limiting for RPC calls
6. ✅ Use Content Security Policy (CSP) headers in production

### Trust Model

**Trust Assumptions:**

- **Arcium MPC Network:** Trust distributed across multiple operators (no single party can decrypt)
- **Solana Validators:** Standard Solana consensus security
- **Wallet Extension:** Trust your wallet provider (Phantom, Solflare, etc.)
- **RPC Provider:** Trust Helius/Alchemy for devnet (or run your own)

**No Trust Required:**

- Frontend code is open source and verifiable
- Smart contracts deployed on-chain are immutable
- Encryption happens client-side before transmission

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

For questions or support, check the [Integration Guide](./INTEGRATION_GUIDE.md) or open an issue.
