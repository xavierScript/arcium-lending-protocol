//////////////////// Utility functions for the ZKredit Lending Protocol ////////////////////////

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Format a number as USD currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}


// Shorten a Solana address for display - Example: "7x9K...mP4L"
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}


// Get Solana Explorer URL for a transaction 
export function getExplorerUrl(
  signature: string,
  network: 'mainnet-beta' | 'devnet' | 'testnet' = 'devnet'
): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}


//Format a large number with K, M, B suffixes
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}


// Format a timestamp to a readable date 
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}


//  Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}


// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}


// Format number with commas
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}


// Format percentage
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}



// Calculate health factor
export function calculateHealthFactor(
  collateral: number,
  borrowed: number,
  liquidationThreshold: number = 75
): number {
  if (borrowed === 0) return 999; // Max safe value
  return (collateral * (liquidationThreshold / 100)) / borrowed;
}


// Get health factor status
export function getHealthFactorStatus(healthFactor: number): {
  status: 'safe' | 'warning' | 'danger' | 'critical';
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
} {
  if (healthFactor >= 1.5) {
    return {
      status: 'safe',
      color: '#10b981',
      bgColor: 'bg-green-500',
      textColor: 'text-green-500',
      label: 'Safe',
    };
  } else if (healthFactor >= 1.2) {
    return {
      status: 'warning',
      color: '#f59e0b',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      label: 'Warning',
    };
  } else if (healthFactor >= 1.0) {
    return {
      status: 'danger',
      color: '#ef4444',
      bgColor: 'bg-red-500',
      textColor: 'text-red-500',
      label: 'Danger',
    };
  } else {
    return {
      status: 'critical',
      color: '#dc2626',
      bgColor: 'bg-red-600',
      textColor: 'text-red-600',
      label: 'Critical',
    };
  }
}

//Calculate maximum borrow amount
export function calculateMaxBorrow(
  collateral: number,
  currentBorrowed: number,
  liquidationThreshold: number = 75
): number {
  return Math.max(0, (collateral * (liquidationThreshold / 100)) - currentBorrowed);
}


//Calculate loan-to-value ratio
export function calculateLTV(borrowed: number, collateral: number): number {
  if (collateral === 0) return 0;
  return (borrowed / collateral) * 100;
}


// Format time ago
export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(seconds) + ' seconds ago';
}


// Validate amount input
export function validateAmount(
  amount: string,
  max?: number,
  min: number = 0
): { valid: boolean; error?: string } {
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (numAmount < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }

  if (max !== undefined && numAmount > max) {
    return { valid: false, error: `Amount exceeds maximum of ${max}` };
  }

  return { valid: true };
}


///Calculate interest accrued
export function calculateInterest(
  principal: number,
  rateAPY: number,
  daysElapsed: number
): number {
  const dailyRate = rateAPY / 365 / 100;
  return principal * dailyRate * daysElapsed;
}


// Calculate APY from utilization
export function calculateAPYFromUtilization(
  utilizationRate: number,
  baseRate: number = 2,
  multiplier: number = 0.1
): number {
  return baseRate + (utilizationRate * multiplier);
}


// Get risk level from health factor
export function getRiskLevel(healthFactor: number): {
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
} {
  if (healthFactor >= 1.5) {
    return { level: 'low', description: 'Your position is safe' };
  } else if (healthFactor >= 1.2) {
    return { level: 'medium', description: 'Monitor your position' };
  } else if (healthFactor >= 1.0) {
    return { level: 'high', description: 'Add collateral or repay debt' };
  } else {
    return { level: 'critical', description: 'Immediate action required' };
  }
}


// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}


//Generate mock transaction signature
export function generateMockSignature(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let signature = '';
  for (let i = 0; i < 88; i++) {
    signature += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return signature;
}


// Sleep/delay function
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//Format token amount (from lamports)
export function fromLamports(lamports: number, decimals: number = 6): number {
  return lamports / Math.pow(10, decimals);
}


// Convert to lamports (smallest unit)
export function toLamports(amount: number, decimals: number = 6): number {
  return Math.floor(amount * Math.pow(10, decimals));
}


// Check if browser has wallet extension
export function hasWalletExtension(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).solana || !!(window as any).phantom;
}


// Get explorer URL for address
export function getExplorerAddressUrl(
  address: string,
  network: 'mainnet-beta' | 'devnet' | 'testnet' = 'devnet'
): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}


// Local storage helpers (with error handling)
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
};


// Generate random color for charts
export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}


// Calculate percentage change
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Format large numbers (1K, 1M, 1B)
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}


// Check if value is in range
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}



// Parse error message from Anchor/Solana
export function parseErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    // Extract custom program error
    const match = error.message.match(/custom program error: (0x[0-9a-f]+)/i);
    if (match) return `Program error: ${match[1]}`;
    
    return error.message;
  }
  
  return 'An unknown error occurred';
}

// Export all utilities
export default {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  shortenAddress,
  calculateHealthFactor,
  getHealthFactorStatus,
  calculateMaxBorrow,
  calculateLTV,
  timeAgo,
  validateAmount,
  calculateInterest,
  calculateAPYFromUtilization,
  getRiskLevel,
  copyToClipboard,
  generateMockSignature,
  sleep,
  fromLamports,
  toLamports,
  hasWalletExtension,
  getExplorerUrl,
  getExplorerAddressUrl,
  debounce,
  throttle,
  storage,
  generateRandomColor,
  calculatePercentageChange,
  formatLargeNumber,
  isInRange,
  clamp,
  parseErrorMessage,
};