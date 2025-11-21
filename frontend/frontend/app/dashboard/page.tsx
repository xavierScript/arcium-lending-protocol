
"use client";
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Shield, Lock } from 'lucide-react';
import usePrivateLending from '@/app/src/hooks/usePrivateLending';
import { useNotification } from '@/app/src/contexts/NotificationContext';
import { getExplorerUrl } from '@/lib/utils';

// Import components
import { LendingTab } from '@/components/dApp-components/tabs/LendingTab';
import { Header } from '@/components/dApp-components/layout/Header';
import { AnalyticsTab } from '@/components/dApp-components/tabs/AnalyticsTab';
import { AchievementsTab } from '@/components/dApp-components/tabs/AchivementsTab';


const ArciumPrivateLending = () => {
  // Wallet and hooks
  const { publicKey, connected } = useWallet();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  const {
    loading,
    userPosition,
    poolStats,
    program,
    depositCollateral,
    borrow,
    repay,
    withdrawCollateral,
    fetchUserPosition,
    fetchPoolStats,
  } = usePrivateLending();
  
  // UI State
  const [activeTab, setActiveTab] = useState('lending');
  const [showPrivateInfo, setShowPrivateInfo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userStats, setUserStats] = useState({
    level: 5,
    xp: 1250,
    streak: 12,
    currentXP: 1250,
    nextLevelXP: 1500
  });

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (connected && program) {
      const interval = setInterval(() => {
        fetchUserPosition();
        fetchPoolStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [connected, program, fetchUserPosition, fetchPoolStats]);

  // Utility Functions
  const calculateHealthFactor = (collateral: number, borrowed: number, threshold = 75) => {
    if (borrowed === 0) return 999;
    return (collateral * (threshold / 100)) / borrowed;
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf >= 1.5) return 'text-green-500';
    if (hf >= 1.2) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthFactorBg = (hf: number) => {
    if (hf >= 1.5) return 'bg-green-500';
    if (hf >= 1.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Transaction Handlers
  const handleDeposit = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid deposit amount');
      return;
    }

    if (!connected) {
      showError('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      showInfo('Processing', 'Sending transaction...');
      const result = await depositCollateral(amount);
      
      if (result.success) {
        showSuccess('Deposit Successful!', `Deposited ${amount} USDC to your private position`);
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, 'devnet');
          console.log('View transaction:', explorerUrl);
        }
        setUserStats(prev => ({ ...prev, xp: prev.xp + 10 }));
      } else {
        showError('Deposit Failed', result.error || 'Transaction failed');
      }
    } catch (error: any) {
      showError('Error', error.message || 'An unexpected error occurred');
    }
  };

  const handleBorrow = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid borrow amount');
      return;
    }

    if (!connected) {
      showError('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    if (!userPosition) {
      showError('No Position', 'Please deposit collateral first');
      return;
    }

    const maxBorrow = (userPosition.collateralAmount * 0.75) - userPosition.borrowedAmount;
    if (amount > maxBorrow) {
      showError('Insufficient Collateral', `Maximum borrow: $${maxBorrow.toFixed(2)}`);
      return;
    }

    try {
      showInfo('Processing', 'Checking health factor and sending transaction...');
      const result = await borrow(amount);
      
      if (result.success) {
        showSuccess('Borrow Successful!', `Borrowed ${amount} USDC`);
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, 'devnet');
          console.log('View transaction:', explorerUrl);
        }
        setUserStats(prev => ({ ...prev, xp: prev.xp + 20 }));
      } else {
        showError('Borrow Failed', result.error || 'Transaction failed');
      }
    } catch (error: any) {
      showError('Error', error.message || 'An unexpected error occurred');
    }
  };

  const handleRepay = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid repay amount');
      return;
    }

    if (!connected) {
      showError('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    if (!userPosition || userPosition.borrowedAmount === 0) {
      showError('No Debt', 'You have no outstanding loans');
      return;
    }

    try {
      showInfo('Processing', 'Sending repayment transaction...');
      const result = await repay(amount);
      
      if (result.success) {
        showSuccess('Repayment Successful!', `Repaid ${amount} USDC`);
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, 'devnet');
          console.log('View transaction:', explorerUrl);
        }
        setUserStats(prev => ({ ...prev, xp: prev.xp + 15 }));
      } else {
        showError('Repayment Failed', result.error || 'Transaction failed');
      }
    } catch (error: any) {
      showError('Error', error.message || 'An unexpected error occurred');
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid withdrawal amount');
      return;
    }

    if (!connected) {
      showError('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    if (!userPosition) {
      showError('No Position', 'No collateral to withdraw');
      return;
    }

    if (userPosition.borrowedAmount > 0) {
      const newCollateral = userPosition.collateralAmount - amount;
      const newHealthFactor = calculateHealthFactor(newCollateral, userPosition.borrowedAmount);
      
      if (newHealthFactor < 1.2) {
        showError('Unsafe Withdrawal', 'This withdrawal would put your position at risk of liquidation');
        return;
      }
    }

    try {
      showInfo('Processing', 'Sending withdrawal transaction...');
      const result = await withdrawCollateral(amount);
      
      if (result.success) {
        showSuccess('Withdrawal Successful!', `Withdrew ${amount} USDC`);
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, 'devnet');
          console.log('View transaction:', explorerUrl);
        }
        setUserStats(prev => ({ ...prev, xp: prev.xp + 5 }));
      } else {
        showError('Withdrawal Failed', result.error || 'Transaction failed');
      }
    } catch (error: any) {
      showError('Error', error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-[#00ff9d]/30 relative overflow-hidden">
      <div className="ambient-glow-blue" />

      <div className="container mx-auto px-6 py-6 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showPrivateInfo={showPrivateInfo}
          setShowPrivateInfo={setShowPrivateInfo}
          userStats={userStats}
          mounted={mounted}
        />

        <div className="flex-1 relative z-10">
          {/* Privacy Notice */}
          <div className="px-6 pt-6">
            <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-xl p-4 flex items-start space-x-3">
              <Lock className="w-5 h-5 text-[#00ff9d] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-[#00ff9d] mb-1">
                  End-to-End Privacy via Arcium MPC
                </h3>
                <p className="text-sm text-gray-400">
                  All positions, health factors, and calculations are encrypted. No single party can see your private data.
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {!connected ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-[#00ff9d]" />
                <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6">
                  Connect your Solana wallet to access private lending features
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'lending' && (
                  <LendingTab
                    userPosition={userPosition}
                    poolStats={poolStats}
                    loading={loading}
                    showPrivateInfo={showPrivateInfo}
                    calculateHealthFactor={calculateHealthFactor}
                    getHealthFactorColor={getHealthFactorColor}
                    getHealthFactorBg={getHealthFactorBg}
                    onDeposit={handleDeposit}
                    onBorrow={handleBorrow}
                    onRepay={handleRepay}
                    onWithdraw={handleWithdraw}
                  />
                )}
                {activeTab === 'analytics' && <AnalyticsTab poolStats={poolStats} />}
                {activeTab === 'achievements' && <AchievementsTab userStats={userStats} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArciumPrivateLending;