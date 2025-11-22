// Type definitions for the application

import { PublicKey } from '@solana/web3.js';

export interface UserPosition {
  owner: PublicKey;
  collateralAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  interestRate: number;
  liquidationThreshold: number;
  lastUpdate: Date;
}

export interface PoolStats {
  totalLiquidity: number;
  totalBorrowed: number;
  utilizationRate: number;
  avgAPY: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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
}

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export interface AnalyticsData {
  healthFactorHistory: Array<{ time: string; value: number }>;
  borrowRateHistory: Array<{ time: string; rate: number }>;
  utilizationHistory: Array<{ time: string; rate: number }>;
  riskDistribution: Array<{ category: string; count: number; percentage: number }>;
}