#!/bin/bash

# Private Lending Protocol - Build & Test Script

echo "🏗️  Building Private Lending Protocol..."
echo ""

# Step 1: Build Anchor program
echo "📦 Step 1: Building Anchor program..."
anchor build
if [ $? -ne 0 ]; then
    echo "❌ Anchor build failed"
    exit 1
fi
echo "✅ Anchor build successful"
echo ""

# Step 2: Build encrypted instructions
echo "🔐 Step 2: Building encrypted instructions..."
cargo build-sbf --manifest-path=encrypted-ixs/Cargo.toml
if [ $? -ne 0 ]; then
    echo "❌ Encrypted instructions build failed"
    exit 1
fi
echo "✅ Encrypted instructions built"
echo ""

# Step 3: Check if Arcium localnet is running
echo "🔍 Step 3: Checking Arcium localnet..."
if ! pgrep -f "arcium" > /dev/null; then
    echo "⚠️  Arcium localnet not running. Starting it..."
    echo "Run: arcium localnet start"
    echo ""
    echo "After localnet starts, run: anchor test"
else
    echo "✅ Arcium localnet is running"
    echo ""
    
    # Step 4: Run tests
    echo "🧪 Step 4: Running tests..."
    anchor test --skip-local-validator
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed"
        exit 1
    fi
    echo "✅ All tests passed!"
fi

echo ""
echo "🎉 Build complete! Your private lending protocol is ready."
echo ""
echo "Next steps:"
echo "1. If localnet isn't running: arcium localnet start"
echo "2. Run tests: anchor test --skip-local-validator"
echo "3. Start building the frontend!"
