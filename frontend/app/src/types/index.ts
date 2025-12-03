// Type definitions for the application

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// On-chain account structure (matches Rust state)
export interface UserAccount {
  owner: PublicKey;
  depositedCollateral: BN;
  borrowedAmount: BN;
  pendingBorrow: BN;
  isHealthy: boolean;
  bump: number;
}

// UI-friendly user position
export interface UserPosition {
  owner: PublicKey;
  collateralAmount: number; // in SOL
  borrowedAmount: number; // in SOL
  pendingBorrow: number; // in SOL
  healthFactor: number;
  isHealthy: boolean;
  liquidationThreshold: number;
  lastUpdate: Date;
}

export interface PoolStats {
  totalLiquidity: number;
  totalBorrowed: number;
  utilizationRate: number;
  avgAPY: number;
  totalUsers: number;
  totalDepositors: number;
}

export interface TransactionHistory {
  signature: string;
  type: "deposit" | "withdraw" | "borrow" | "repay";
  amount: number; // in SOL
  timestamp: Date;
  status: "confirmed" | "failed" | "pending";
  user: PublicKey;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
  unlocked: boolean;
  progress: number;
  requirement: number;
}

export interface UserStats {
  level: number;
  xp: number;
  totalDeposited: number;
  totalBorrowed: number;
  totalRepaid: number;
  daysActive: number;
  healthyDays: number;
  achievements: Achievement[];
  streak: number;
  rank: string;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  message?: string; // Additional info message for successful operations
}

export interface NotificationData {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

export interface AnalyticsData {
  healthFactorHistory: Array<{ time: string; value: number }>;
  borrowRateHistory: Array<{ time: string; rate: number }>;
  utilizationHistory: Array<{ time: string; rate: number }>;
  riskDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}
