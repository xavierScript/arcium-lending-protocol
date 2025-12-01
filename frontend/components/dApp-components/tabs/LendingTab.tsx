// ============================================
// FILE: components/tabs/LendingTab.tsx
// ============================================
import React, { useState } from "react";
import { ProtocolStatsCard } from "../cards/ProtocolStatsCard";
import { UserPositionCard } from "../cards/UserPositionCard";
import { DepositForm } from "../forms/DepositForm";
import { BorrowForm } from "../forms/BorrowForm";
import { RepayForm } from "../forms/RepayForm";
import { WithdrawForm } from "../forms/WithdrawForm";
import type { UserPosition, PoolStats } from "@/app/src/types";

interface LendingTabProps {
  userPosition: UserPosition | null;
  poolStats: PoolStats | null;
  loading: boolean;
  showPrivateInfo: boolean;
  calculateHealthFactor: (collateral: number, borrowed: number) => number;
  getHealthFactorColor: (hf: number) => string;
  getHealthFactorBg: (hf: number) => string;
  onDeposit: (amount: number) => Promise<any>;
  onBorrow: (amount: number) => Promise<any>;
  onFinalizeBorrow?: () => Promise<any>;
  onRepay: (amount: number) => Promise<any>;
  onWithdraw: (amount: number) => Promise<any>;
}

export const LendingTab: React.FC<LendingTabProps> = ({
  userPosition,
  poolStats,
  loading,
  showPrivateInfo,
  calculateHealthFactor,
  getHealthFactorColor,
  getHealthFactorBg,
  onDeposit,
  onBorrow,
  onFinalizeBorrow,
  onRepay,
  onWithdraw,
}) => {
  const [activeTab, setActiveTab] = useState("deposit");

  const tabs = [
    { id: "deposit", label: "Deposit" },
    { id: "borrow", label: "Borrow" },
    { id: "repay", label: "Repay" },
    { id: "withdraw", label: "Withdraw" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Stats */}
      <div className="space-y-6">
        <ProtocolStatsCard poolStats={poolStats} />
        <UserPositionCard
          userPosition={userPosition}
          showPrivateInfo={showPrivateInfo}
          getHealthFactorColor={getHealthFactorColor}
          getHealthFactorBg={getHealthFactorBg}
        />
      </div>

      {/* Right Column - Actions */}
      <div className="lg:col-span-2">
        <div className="glass-card rounded-3xl">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 font-semibold capitalize transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#00ff9d]/10 text-[#00ff9d] border-b-2 border-[#00ff9d]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "deposit" && (
              <DepositForm
                userPosition={userPosition}
                loading={loading}
                onDeposit={onDeposit}
                calculateHealthFactor={calculateHealthFactor}
                getHealthFactorColor={getHealthFactorColor}
              />
            )}

            {activeTab === "borrow" && (
              <BorrowForm
                userPosition={userPosition}
                loading={loading}
                onBorrow={onBorrow}
                onFinalizeBorrow={onFinalizeBorrow}
                calculateHealthFactor={calculateHealthFactor}
                getHealthFactorColor={getHealthFactorColor}
              />
            )}

            {activeTab === "repay" && (
              <RepayForm
                userPosition={userPosition}
                loading={loading}
                onRepay={onRepay}
                calculateHealthFactor={calculateHealthFactor}
                getHealthFactorColor={getHealthFactorColor}
              />
            )}

            {activeTab === "withdraw" && (
              <WithdrawForm
                userPosition={userPosition}
                loading={loading}
                onWithdraw={onWithdraw}
                calculateHealthFactor={calculateHealthFactor}
                getHealthFactorColor={getHealthFactorColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
