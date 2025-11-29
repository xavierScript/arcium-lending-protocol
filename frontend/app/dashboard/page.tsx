"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Shield, Lock } from "lucide-react";
import usePrivateLending from "@/app/src/hooks/usePrivateLending";
import { useNotification } from "@/app/src/contexts/NotificationContext";
import { getExplorerUrl } from "@/lib/utils";
import type { UserPosition, PoolStats } from "@/app/src/types";

// Import components
import { LendingTab } from "@/components/dApp-components/tabs/LendingTab";
import { Header } from "@/components/dApp-components/layout/Header";
import { AnalyticsTab } from "@/components/dApp-components/tabs/AnalyticsTab";
import { AchievementsTab } from "@/components/dApp-components/tabs/AchivementsTab";

const ArciumPrivateLending = () => {
  // Wallet and hooks
  const { publicKey, connected } = useWallet();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const {
    loading,
    userPosition,
    poolStats,
    program,
    checkCompDefsInitialized,
    initializeUser,
    depositCollateral,
    borrow,
    repay,
    requestAirdrop,
    fetchUserPosition,
    fetchPoolStats,
  } = usePrivateLending();

  // UI State
  const [activeTab, setActiveTab] = useState("lending");
  const [showPrivateInfo, setShowPrivateInfo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [compDefsInitialized, setCompDefsInitialized] = useState<
    boolean | null
  >(null);
  const [userStats, setUserStats] = useState({
    level: 5,
    xp: 1250,
    streak: 12,
    currentXP: 1250,
    nextLevelXP: 1500,
  });

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check comp defs initialization status
  useEffect(() => {
    const checkStatus = async () => {
      if (program) {
        const isInitialized = await checkCompDefsInitialized();
        setCompDefsInitialized(isInitialized);
      }
    };
    checkStatus();
  }, [program, checkCompDefsInitialized]);

  // Initial fetch and auto-refresh data (reduced frequency)
  useEffect(() => {
    if (connected && program) {
      fetchUserPosition();
      fetchPoolStats();
      // Poll every 60 seconds (not 10s/30s)
      const interval = setInterval(() => {
        fetchUserPosition();
        fetchPoolStats();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [connected, program, fetchUserPosition, fetchPoolStats]);

  // Utility Functions
  const calculateHealthFactor = (
    collateral: number,
    borrowed: number,
    threshold = 75
  ) => {
    if (borrowed === 0) return 999;
    return (collateral * (threshold / 100)) / borrowed;
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf >= 1.5) return "text-green-500";
    if (hf >= 1.2) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthFactorBg = (hf: number) => {
    if (hf >= 1.5) return "bg-green-500";
    if (hf >= 1.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Transaction Handlers
  const handleDeposit = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning("Invalid Amount", "Please enter a valid deposit amount");
      return;
    }

    if (!connected) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    try {
      showInfo("Processing", "Sending transaction...");
      const result = await depositCollateral(amount);
      if (result.success) {
        showSuccess(
          "Deposit Successful!",
          `Deposited ${amount} USDC to your private position`
        );
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, "devnet");
          // explorerUrl retained for debugging if needed
        }
        setUserStats((prev) => ({ ...prev, xp: prev.xp + 10 }));
      } else {
        showError("Deposit Failed", result.error || "Transaction failed");
      }
    } catch (error: any) {
      showError("Error", error.message || "An unexpected error occurred");
    }
  };

  const handleBorrow = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning("Invalid Amount", "Please enter a valid borrow amount");
      return;
    }

    if (!connected) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    if (!userPosition) {
      showError("No Position", "Please deposit collateral first");
      return;
    }

    const maxBorrow =
      userPosition.collateralAmount * 0.75 - userPosition.borrowedAmount;
    if (amount > maxBorrow) {
      showError(
        "Insufficient Collateral",
        `Maximum borrow: $${maxBorrow.toFixed(2)}`
      );
      return;
    }

    try {
      showInfo(
        "Processing",
        "Checking health factor and sending transaction..."
      );
      const result = await borrow(amount);
      if (result.success) {
        showSuccess("Borrow Successful!", `Borrowed ${amount} USDC`);
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, "devnet");
          // explorerUrl retained for debugging if needed
        }
        setUserStats((prev) => ({ ...prev, xp: prev.xp + 20 }));
      } else {
        showError("Borrow Failed", result.error || "Transaction failed");
      }
    } catch (error: any) {
      showError("Error", error.message || "An unexpected error occurred");
    }
  };

  const handleRepay = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning("Invalid Amount", "Please enter a valid repay amount");
      return;
    }

    if (!connected) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    if (!userPosition || userPosition.borrowedAmount === 0) {
      showError("No Debt", "You have no outstanding loans");
      return;
    }

    try {
      showInfo("Processing", "Sending repayment transaction...");
      const result = await repay(amount);
      if (result.success) {
        showSuccess("Repayment Successful!", `Repaid ${amount} USDC`);
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, "devnet");
          // explorerUrl retained for debugging if needed
        }
        setUserStats((prev) => ({ ...prev, xp: prev.xp + 15 }));
      } else {
        showError("Repayment Failed", result.error || "Transaction failed");
      }
    } catch (error: any) {
      showError("Error", error.message || "An unexpected error occurred");
    }
  };

  const handleInitialize = async () => {
    if (!connected) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    try {
      showInfo("Initializing", "Creating your account...");
      const result = await initializeUser();

      if (result.success) {
        showSuccess(
          "Account Created!",
          "Your lending account has been initialized"
        );
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, "devnet");
          console.log("View transaction:", explorerUrl);
        }
        // Force immediate refresh - initializeUser already calls fetchUserPosition
        // No need for additional delay
      } else {
        showError(
          "Initialization Failed",
          result.error || "Transaction failed"
        );
      }
    } catch (error: any) {
      showError("Error", error.message || "An unexpected error occurred");
    }
  };

  const handleAirdrop = async () => {
    if (!connected) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    try {
      showInfo("Requesting", "Requesting 2 SOL airdrop...");
      const result = await requestAirdrop();

      if (result.success) {
        showSuccess("Airdrop Successful!", "Received 2 SOL");
        if (result.signature) {
          const explorerUrl = getExplorerUrl(result.signature, "devnet");
          console.log("View transaction:", explorerUrl);
        }
      } else {
        showError("Airdrop Failed", result.error || "Transaction failed");
      }
    } catch (error: any) {
      showError("Error", error.message || "An unexpected error occurred");
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!amount || amount <= 0) {
      showWarning("Invalid Amount", "Please enter a valid withdrawal amount");
      return;
    }

    if (!connected) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    if (!userPosition) {
      showError("No Position", "No collateral to withdraw");
      return;
    }

    if (userPosition.borrowedAmount > 0) {
      const newCollateral = userPosition.collateralAmount - amount;
      const newHealthFactor = calculateHealthFactor(
        newCollateral,
        userPosition.borrowedAmount
      );

      if (newHealthFactor < 1.2) {
        showError(
          "Unsafe Withdrawal",
          "This withdrawal would put your position at risk of liquidation"
        );
        return;
      }
    }

    // Withdrawal not implemented in current contract
    showWarning("Not Implemented", "Withdrawal feature coming soon");
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
                  All positions, health factors, and calculations are encrypted.
                  No single party can see your private data.
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {!connected ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-[#00ff9d]" />
                <h2 className="text-2xl font-bold mb-2 text-white">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-400 mb-6">
                  Connect your Solana wallet to access private lending features
                </p>
              </div>
            ) : !userPosition ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-[#00ff9d]" />
                <h2 className="text-2xl font-bold mb-2 text-white">
                  Initialize Your Account
                </h2>
                <p className="text-gray-400 mb-6">
                  Set up Arcium MXE and create your private lending account
                </p>
                <div className="space-y-4 max-w-2xl mx-auto">
                  {/* Show MXE initialization warning if not initialized */}
                  {compDefsInitialized === false && (
                    <div className="bg-white/[0.05] border border-amber-500/30 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-500 font-bold">⚠</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Arcium MXE Not Initialized
                          </h3>
                          <p className="text-sm text-gray-400 mb-3">
                            The protocol deployer needs to run the
                            initialization script first:
                          </p>
                          <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-gray-300 border border-white/10">
                            <code>cd smart\ contract</code>
                            <br />
                            <code>npx ts-node scripts/init-arcium.ts</code>
                          </div>
                          <p className="text-xs text-gray-500 mt-3">
                            This is a one-time setup that requires the
                            deployer's keypair.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show success message if initialized */}
                  {compDefsInitialized === true && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-500">✓</span>
                        </div>
                        <p className="text-sm text-green-400">
                          Arcium MXE is initialized and ready for private
                          computations
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#00ff9d]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00ff9d] font-bold">
                          {compDefsInitialized ? "1" : "2"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          Create Your Account
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Initialize your personal lending account to start
                          depositing and borrowing.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleInitialize}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-[#00ff9d] text-black font-semibold rounded-lg hover:bg-[#00ff9d]/90 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Initializing..." : "Initialize Account"}
                      </button>
                      <button
                        onClick={handleAirdrop}
                        disabled={loading}
                        className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Requesting..." : "Airdrop 2 SOL"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "lending" && (
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
                {activeTab === "analytics" && (
                  <AnalyticsTab poolStats={poolStats} />
                )}
                {activeTab === "achievements" && (
                  <AchievementsTab userStats={userStats} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArciumPrivateLending;
