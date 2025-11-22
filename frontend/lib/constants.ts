import { PublicKey } from '@solana/web3.js';

// Network Configuration
export const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'testnet' | 'mainnet-beta') || 'devnet';

export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Program IDs
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111111'
);

export const POOL_AUTHORITY = new PublicKey(
  process.env.NEXT_PUBLIC_POOL_AUTHORITY || '11111111111111111111111111111111'
);

// Token Mints
export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Devnet USDC
);

export const SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112' // Wrapped SOL
);

// Arcium MPC Configuration
export const ARCIUM_MPC_URL = process.env.NEXT_PUBLIC_ARCIUM_MPC_URL || 'https://mpc.arcium.com';

export const ARCIUM_MPC_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ARCIUM_MPC_PROGRAM_ID || '11111111111111111111111111111111'
);

// Protocol Parameters
export const DEFAULT_LIQUIDATION_THRESHOLD = 75; // 75%
export const DEFAULT_BASE_INTEREST_RATE = 500; // 5% in basis points
export const MIN_HEALTH_FACTOR = 1.0;
export const SAFE_HEALTH_FACTOR = 1.5;
export const WARNING_HEALTH_FACTOR = 1.2;

// Token Decimals
export const USDC_DECIMALS = 6;
export const SOL_DECIMALS = 9;

// UI Constants
export const SIDEBAR_WIDTH_OPEN = 256; // 16rem in pixels
export const SIDEBAR_WIDTH_CLOSED = 80; // 5rem in pixels

// Animations
export const ANIMATION_DURATION = 300; // milliseconds

// Polling Intervals
export const POSITION_POLL_INTERVAL = 10000; // 10 seconds
export const POOL_STATS_POLL_INTERVAL = 15000; // 15 seconds
export const PRICE_POLL_INTERVAL = 30000; // 30 seconds

// Transaction Confirmation
export const COMMITMENT = 'confirmed';
export const PREFLIGHT_COMMITMENT = 'processed';

// Pagination
export const ITEMS_PER_PAGE = 10;
export const MAX_LEADERBOARD_ENTRIES = 100;

// Achievements
export const ACHIEVEMENTS_CONFIG = {
  FIRST_DEPOSIT: {
    id: 'first_deposit',
    title: '🎯 First Steps',
    description: 'Make your first deposit',
    points: 10,
    requirement: 1,
  },
  WHALE: {
    id: 'whale',
    title: '🐋 Whale Status',
    description: 'Deposit over $100,000',
    points: 500,
    requirement: 100000,
  },
  DIAMOND_HANDS: {
    id: 'diamond_hands',
    title: '💎 Diamond Hands',
    description: 'Maintain healthy position for 30 days',
    points: 200,
    requirement: 30,
  },
  STREAK_MASTER: {
    id: 'streak_master',
    title: '🔥 On Fire',
    description: 'Maintain 7-day healthy streak',
    points: 250,
    requirement: 7,
  },
  RESPONSIBLE: {
    id: 'responsible',
    title: '🎓 Responsible Borrower',
    description: 'Keep health factor above 2.0',
    points: 400,
    requirement: 1,
  },
} as const;

// XP and Levels
export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 50;

export const XP_REWARDS = {
  DEPOSIT: 10,
  BORROW: 20,
  REPAY: 15,
  WITHDRAW: 5,
  MAINTAIN_HEALTHY: 5, // Per day
  LIQUIDATION_AVOIDED: 50,
} as const;

// Risk Levels
export const RISK_LEVELS = {
  LOW: {
    threshold: 1.5,
    color: '#10b981',
    label: 'Low Risk',
  },
  MEDIUM: {
    threshold: 1.2,
    color: '#f59e0b',
    label: 'Medium Risk',
  },
  HIGH: {
    threshold: 1.0,
    color: '#ef4444',
    label: 'High Risk',
  },
  CRITICAL: {
    threshold: 0,
    color: '#dc2626',
    label: 'Critical',
  },
} as const;

// Chart Colors
export const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
} as const;

// Time Ranges for Analytics
export const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
] as const;

// Supported Wallets
export const SUPPORTED_WALLETS = [
  'Phantom',
  'Solflare',
  'Backpack',
  'Glow',
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INSUFFICIENT_COLLATERAL: 'Insufficient collateral for this borrow',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_AMOUNT: 'Invalid amount entered',
  POSITION_NOT_FOUND: 'Position not found',
  POOL_NOT_INITIALIZED: 'Pool not initialized',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DEPOSIT_SUCCESS: 'Collateral deposited successfully',
  BORROW_SUCCESS: 'Funds borrowed successfully',
  REPAY_SUCCESS: 'Loan repaid successfully',
  WITHDRAW_SUCCESS: 'Collateral withdrawn successfully',
  POSITION_CREATED: 'Position created successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'arcium_theme',
  SIDEBAR_STATE: 'arcium_sidebar',
  PRIVACY_MODE: 'arcium_privacy_mode',
  ACHIEVEMENTS: 'arcium_achievements',
  USER_STATS: 'arcium_user_stats',
  LAST_VISIT: 'arcium_last_visit',
} as const;

// API Endpoints (when backend is ready)
export const API_ENDPOINTS = {
  USER_STATS: '/api/user/stats',
  LEADERBOARD: '/api/leaderboard',
  ANALYTICS: '/api/analytics',
  ACHIEVEMENTS: '/api/achievements',
} as const;

// Social Links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/ArciumHQ',
  DISCORD: 'https://discord.com/invite/arcium',
  GITHUB: 'https://github.com/arcium-hq',
  DOCS: 'https://docs.arcium.com',
} as const;

// Feature Flags
export const FEATURES = {
  ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  GAMIFICATION_ENABLED: true,
  NOTIFICATIONS_ENABLED: true,
  ACHIEVEMENTS_ENABLED: true,
  LEADERBOARD_ENABLED: true,
} as const;

// Export all constants
export default {
  NETWORK,
  RPC_ENDPOINT,
  PROGRAM_ID,
  POOL_AUTHORITY,
  USDC_MINT,
  SOL_MINT,
  ARCIUM_MPC_URL,
  ARCIUM_MPC_PROGRAM_ID,
  DEFAULT_LIQUIDATION_THRESHOLD,
  DEFAULT_BASE_INTEREST_RATE,
  MIN_HEALTH_FACTOR,
  SAFE_HEALTH_FACTOR,
  WARNING_HEALTH_FACTOR,
  USDC_DECIMALS,
  SOL_DECIMALS,
  SIDEBAR_WIDTH_OPEN,
  SIDEBAR_WIDTH_CLOSED,
  ANIMATION_DURATION,
  POSITION_POLL_INTERVAL,
  POOL_STATS_POLL_INTERVAL,
  PRICE_POLL_INTERVAL,
  COMMITMENT,
  PREFLIGHT_COMMITMENT,
  ITEMS_PER_PAGE,
  MAX_LEADERBOARD_ENTRIES,
  ACHIEVEMENTS_CONFIG,
  XP_PER_LEVEL,
  MAX_LEVEL,
  XP_REWARDS,
  RISK_LEVELS,
  CHART_COLORS,
  TIME_RANGES,
  SUPPORTED_WALLETS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  API_ENDPOINTS,
  SOCIAL_LINKS,
  FEATURES,
};