# 🔐 Arcium Private Lending Protocol - Frontend

A confidential lending and borrowing dApp built on Solana using **Arcium's Multi-Party Computation (MPC)** network for private financial operations.

## ✨ Features

- 🔒 **Private Collateral & Borrowing** - Your financial data stays encrypted
- 🧮 **Encrypted Health Factor Checks** - Computed in Arcium MXE without revealing amounts
- 📊 **Real-time Position Monitoring** - Track your lending position
- 🎮 **Gamified Experience** - Earn XP and achievements
- 🌐 **Modern UI** - Built with Next.js 16, React 19, and Tailwind CSS

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

Before running the frontend, ensure you have:

1. **Arcium Localnet Running**:

   ```bash
   cd "../smart contract"
   arcium localnet start
   ```

2. **Solana Test Validator** with Arcium accounts:

   ```bash
   cd "../smart contract"
   anchor test
   ```

3. **Wallet Extension**:
   - Phantom, Solflare, or any Solana wallet

## 🔑 Environment Variables

| Variable                            | Description         | Default                 |
| ----------------------------------- | ------------------- | ----------------------- |
| `NEXT_PUBLIC_SOLANA_NETWORK`        | Solana network      | `devnet`                |
| `NEXT_PUBLIC_SOLANA_RPC_URL`        | RPC endpoint        | `http://localhost:8899` |
| `NEXT_PUBLIC_PROGRAM_ID`            | Deployed program ID | `2TP41Kqc...`           |
| `NEXT_PUBLIC_ARCIUM_PROGRAM_ID`     | Arcium MPC program  | `Bv3Fb9Vj...`           |
| `NEXT_PUBLIC_LIQUIDATION_THRESHOLD` | LTV threshold       | `80`                    |

See [`.env.example`](./.env.example) for complete configuration.

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

### How Privacy Works

1. **Key Exchange**: Generate ephemeral x25519 keypair
2. **Shared Secret**: Derive secret with Arcium MXE public key
3. **Encryption**: Use Rescue cipher to encrypt collateral & borrow amounts
4. **MPC Computation**: Arcium network computes: `collateral * 0.8 >= borrowed`
5. **Callback**: Result returns to program without revealing amounts
6. **Approval**: Transaction approved/rejected based on encrypted result

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Blockchain**: Solana Web3.js, Anchor
- **Privacy**: Arcium MPC, x25519, Rescue Cipher
- **Wallet**: Solana Wallet Adapter

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding Features

1. **New Transaction**: Add method in `usePrivateLending.ts`
2. **UI Component**: Create in `components/dApp-components/`
3. **Update IDL**: Copy new IDL from smart contract
4. **Test**: Verify with localnet

## 🧪 Testing

### Manual Testing Flow

1. ✅ Connect wallet
2. ✅ Request airdrop (2 SOL)
3. ✅ Initialize user account
4. ✅ Deposit 1 SOL collateral
5. ✅ Borrow 0.5 SOL (triggers MPC)
6. ✅ Check health factor display
7. ✅ Repay 0.25 SOL
8. ✅ Verify updated position

### Automated Tests

```bash
# Run smart contract tests to verify backend
cd "../smart contract"
anchor test
```

## 🐛 Troubleshooting

**"Account does not exist"**

- Initialize your account first
- Ensure you have SOL for fees

**"Program account not found"**

- Check Solana validator is running
- Verify program ID in `.env.local`

**"Encryption failed"**

- Ensure Arcium localnet is running
- Check MXE account exists

**"Transaction simulation failed"**

- Check collateral is sufficient
- Verify health factor would remain >1.0

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed troubleshooting.

## 📚 Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Complete integration walkthrough
- [Smart Contract README](../smart%20contract/README.md) - Backend documentation
- [Arcium Docs](https://docs.arcium.com) - MPC network documentation

## 🔐 Security Considerations

### What's Private

- ✅ Collateral amounts (encrypted on-chain)
- ✅ Borrow amounts (encrypted on-chain)
- ✅ Health factor calculations (computed in MXE)

### What's Public

- ❌ Wallet addresses
- ❌ Transaction signatures
- ❌ Transaction metadata

### Best Practices

- Never share your private keys
- Verify contract addresses before interacting
- Test on localnet/devnet first
- Monitor your health factor regularly

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
