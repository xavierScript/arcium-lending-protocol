import React from "react";
import { TrendingUp } from "lucide-react";
import type { PoolStats } from "@/app/src/types";

interface ProtocolStatsCardProps {
  poolStats: PoolStats | null;
}

export const ProtocolStatsCard: React.FC<ProtocolStatsCardProps> = ({
  poolStats,
}) => {
  return (
    <div className="glass-card rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-white">
        <TrendingUp className="w-5 h-5 mr-2 text-[#00ff9d]" />
        Protocol Stats
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-white">
              {poolStats?.totalUsers || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Active Depositors</div>
            <div className="text-2xl font-bold text-white">
              {poolStats?.totalDepositors || 0}
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Liquidity</div>
          <div className="text-2xl font-bold text-white">
            {(poolStats?.totalLiquidity || 0).toFixed(4)} SOL
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
          <div className="text-2xl font-bold text-white">
            {(poolStats?.totalBorrowed || 0).toFixed(4)} SOL
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Utilization Rate</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white/10 rounded-full h-2">
              <div
                className="bg-[#00ff9d] h-2 rounded-full shadow-[0_0_10px_rgba(0,255,157,0.3)]"
                style={{ width: `${poolStats?.utilizationRate || 0}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-[#00ff9d]">
              {(poolStats?.utilizationRate || 0).toFixed(1)}%
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Average APY</div>
          <div className="text-2xl font-bold text-[#00ff9d]">
            {poolStats?.avgAPY || 0}%
          </div>
        </div>
      </div>
    </div>
  );
};
