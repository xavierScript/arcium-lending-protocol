# Quick Start Script for Arcium Private Lending Frontend

Write-Host "🚀 Starting Arcium Private Lending Frontend..." -ForegroundColor Cyan

# Check if we're in the frontend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the frontend directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found, copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Created .env.local - Please update with your configuration" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Arcium Private Lending Protocol" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "  1. Arcium localnet running (in smart contract dir): arcium localnet start" -ForegroundColor Gray
Write-Host "  2. Solana test validator running with Arcium accounts" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host ""

npm run dev
