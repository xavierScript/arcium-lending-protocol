# Private Lending & Borrowing Protocol (Powered by Arcium)

A confidential lending protocol built on Solana using Arcium's encrypted computation network. This protocol ensures that sensitive financial data like collateral amounts, borrow positions, and health factors remain private while still enforcing protocol solvency.

## 🔐 Key Features

- **Private Collateral**: Deposit amounts remain confidential
- **Encrypted Health Checks**: Loan-to-value ratios calculated in encrypted state
- **Private Liquidation Checks**: Liquidation thresholds verified without revealing user positions
- **On-chain Enforcement**: Protocol solvency maintained through encrypted computations

## 📋 How It Works

### Architecture

The protocol uses Arcium's confidential computing network as a co-processor:

1. **Public Layer (Anchor Program)**: Handles account management, deposits, and repayments
2. **Private Layer (Encrypted Instructions)**: Performs sensitive calculations:
   - Health factor checks (collateral × LTV ≥ borrowed amount)
   - Liquidation checks (debt > liquidation threshold)

### Key Constants

- **Liquidation Threshold**: 80% LTV (Loan-to-Value)
- **Collateral Factor**: 100%

### Protocol Flow

```
1. User deposits collateral (public transaction)
   └─> Amount stored in user account

2. User requests to borrow
   └─> Encrypted health check triggered
       └─> Arcium network verifies: collateral * 0.8 >= borrow_amount
           └─> Result returned encrypted

3. Liquidation monitoring
   └─> Encrypted liquidation check
       └─> Arcium verifies: debt > (collateral * 0.8)
           └─> Result returned encrypted
```

## 🏗️ Project Structure

```
lending_protocol/
├── programs/lending_protocol/src/lib.rs    # Main Anchor program
│   ├── Instructions:
│   │   ├── initialize_user()               # Create user account
│   │   ├── deposit_collateral()            # Deposit SOL as collateral
│   │   ├── borrow()                        # Borrow with encrypted health check
│   │   ├── repay()                         # Repay borrowed funds
│   │   └── check_liquidation()             # Check if liquidation needed
│   └── Encrypted Computation Callbacks:
│       ├── health_check_callback()
│       └── liquidation_callback()
│
├── encrypted-ixs/src/lib.rs                # Arcium encrypted instructions
│   ├── check_health_factor()               # Private health calculation
│   └── check_liquidation()                 # Private liquidation check
│
└── tests/lending_protocol.ts               # Integration tests
```

## 🚀 Getting Started

### Prerequisites

- Rust & Cargo
- Solana CLI tools
- Node.js & npm/yarn
- Arcium CLI

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the Anchor program:
```bash
anchor build
```

3. Build encrypted instructions:
```bash
cargo build-sbf --manifest-path=encrypted-ixs/Cargo.toml
```

### Testing

1. Start Arcium localnet:
```bash
arcium localnet start
```

2. Deploy and test:
```bash
anchor test
```

The tests demonstrate:
- ✅ Initializing computation definitions
- ✅ Creating user accounts
- ✅ Depositing collateral
- ✅ Borrowing with encrypted health checks
- ✅ Checking liquidation status privately
- ✅ Repaying loans

## 📊 Key Components

### UserAccount

```rust
pub struct UserAccount {
    pub owner: Pubkey,
    pub deposited_collateral: u64,    // Public: total collateral
    pub borrowed_amount: u64,          // Public: total borrowed
    pub pending_borrow: u64,           // Pending borrow request
    pub is_healthy: bool,              // Health status flag
    pub bump: u8,
}
```

### Encrypted Health Check

```rust
pub fn check_health_factor(input_ctxt: Enc<Shared, HealthCheckInput>) -> Enc<Shared, bool> {
    let input = input_ctxt.to_arcis();
    let max_borrow = (input.collateral * 80) / 100;
    let is_healthy = input.borrow_amount <= max_borrow;
    input_ctxt.owner.from_arcis(is_healthy)
}
```

### Encrypted Liquidation Check

```rust
pub fn check_liquidation(input_ctxt: Enc<Shared, LiquidationInput>) -> Enc<Shared, bool> {
    let input = input_ctxt.to_arcis();
    let liquidation_threshold = (input.collateral * 80) / 100;
    let needs_liquidation = input.debt > liquidation_threshold;
    input_ctxt.owner.from_arcis(needs_liquidation)
}
```

## 🔑 Privacy Guarantees

1. **Collateral & Debt Amounts**: Encrypted during computation
2. **Health Factor**: Calculated privately, result encrypted
3. **Liquidation Status**: Checked without revealing position details
4. **Interest Calculations**: Can be extended to work privately

## 🎯 Use Cases

- **Private Lending**: Users can borrow without revealing their financial position
- **Institutional Trading**: Large players can maintain position privacy
- **Credit Scoring**: Build credit history without exposing details
- **Cross-chain Collateral**: Future expansion for private cross-chain lending

## 🛡️ Security Considerations

- All sensitive calculations performed in Arcium's encrypted environment
- Protocol solvency enforced through encrypted state transitions
- Only authorized parties can decrypt results (key holders)
- On-chain data shows only encrypted ciphertexts

## 📝 Events

The protocol emits encrypted events:

```rust
pub struct HealthCheckEvent {
    pub is_healthy_encrypted: [u8; 32],  // Encrypted boolean
    pub nonce: [u8; 16],
}

pub struct LiquidationCheckEvent {
    pub needs_liquidation_encrypted: [u8; 32],  // Encrypted boolean
    pub nonce: [u8; 16],
}
```

## 🔄 Future Enhancements

- [ ] Interest rate calculations in encrypted state
- [ ] Multi-asset collateral support
- [ ] Flash loan functionality
- [ ] Governance for parameter updates
- [ ] Oracle integration for price feeds
- [ ] Frontend UI for user interaction

## 📚 Resources

- [Arcium Documentation](https://docs.arcium.com)
- [Anchor Framework](https://www.anchor-lang.com)
- [Solana Docs](https://docs.solana.com)

## 📄 License

MIT

## 🤝 Contributing

This is a hackathon/demo project. Feel free to fork and extend!

---

**Built with Arcium for confidential computing on Solana** 🚀🔐
