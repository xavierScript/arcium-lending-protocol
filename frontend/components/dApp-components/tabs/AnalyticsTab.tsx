import React from "react";
import { TrendingUp, Users, Activity, AlertCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsTabProps {
  poolStats: any;
  userPosition?: any;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  poolStats,
  userPosition,
}) => {
  // Use real user health factor for history (simulating trend with current value)
  const currentHF = userPosition?.healthFactor || 0;
  const healthFactorHistory = [
    { time: "Mon", value: Math.max(0, currentHF - 0.2) },
    { time: "Tue", value: Math.max(0, currentHF - 0.13) },
    { time: "Wed", value: Math.max(0, currentHF - 0.17) },
    { time: "Thu", value: Math.max(0, currentHF - 0.1) },
    { time: "Fri", value: Math.max(0, currentHF - 0.03) },
    { time: "Sat", value: Math.max(0, currentHF - 0.07) },
    { time: "Sun", value: currentHF >= 999 ? 2.0 : currentHF },
  ];

  // Calculate utilization rate
  const totalLiquidity = poolStats?.totalLiquidity || 0;
  const totalBorrowed = poolStats?.totalBorrowed || 0;
  const utilizationRate =
    totalLiquidity > 0 ? (totalBorrowed / totalLiquidity) * 100 : 0;

  // Simplified risk distribution (would need global state in production)
  const riskDistribution = [
    {
      label: "Healthy (>1.5)",
      count: 1,
      color: "bg-[#00ff9d]",
      percentage: userPosition && currentHF > 1.5 && currentHF < 999 ? 100 : 0,
    },
    {
      label: "Moderate (1.2-1.5)",
      count: 1,
      color: "bg-yellow-500",
      percentage:
        userPosition && currentHF >= 1.2 && currentHF <= 1.5 ? 100 : 0,
    },
    {
      label: "At Risk (<1.2)",
      count: 1,
      color: "bg-orange-500",
      percentage: userPosition && currentHF > 0 && currentHF < 1.2 ? 100 : 0,
    },
    {
      label: "No Position",
      count: 0,
      color: "bg-gray-500",
      percentage: !userPosition || currentHF >= 999 ? 100 : 0,
    },
  ];

  // Recent activity placeholder (would come from events in production)
  const recentActivity = [
    {
      type: "info",
      user: "Protocol Status",
      action: "Real-time data active",
      time: "now",
    },
  ];

  const getActivityStyle = (type: string) => {
    const styles = {
      deposit: "bg-[#00ff9d]/20 text-[#00ff9d]",
      borrow: "bg-blue-500/20 text-blue-400",
      repay: "bg-purple-500/20 text-purple-400",
      liquidation: "bg-red-500/20 text-red-400",
      info: "bg-purple-500/20 text-purple-400",
    };
    return styles[type as keyof typeof styles] || "";
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      deposit: "↓",
      borrow: "→",
      repay: "←",
      liquidation: "⚠",
      info: "ℹ",
    };
    return icons[type as keyof typeof icons] || "";
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">TVL</span>
            <TrendingUp className="w-4 h-4 text-[#00ff9d]" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(poolStats?.totalLiquidity || 0).toFixed(4)} SOL
          </div>
          <div className="text-sm text-[#00ff9d]">+12.5%</div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Your Collateral</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {userPosition
              ? `${(userPosition.collateralAmount || 0).toFixed(4)}`
              : "0.0000"}{" "}
            SOL
          </div>
          <div className="text-xs text-gray-400">Deposited</div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Your Debt</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {userPosition
              ? `${(userPosition.borrowedAmount || 0).toFixed(4)}`
              : "0.0000"}{" "}
            SOL
          </div>
          <div className="text-xs text-gray-400">Borrowed</div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Utilization</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {utilizationRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Protocol-wide</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Factor Chart */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-white">
            Your Health Factor{" "}
            {userPosition
              ? `(Current: ${currentHF >= 999 ? "∞" : currentHF.toFixed(2)})`
              : "(No Position)"}
          </h3>
          <div style={{ width: "100%", height: "256px" }}>
            <ResponsiveContainer>
              <AreaChart
                data={healthFactorHistory}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  domain={[0, 3]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#00ff9d" }}
                  labelStyle={{ color: "#9ca3af", marginBottom: "0.5rem" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00ff9d"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Your Position Status */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-white">
            Your Position Status
          </h3>
          <div className="space-y-4">
            {riskDistribution
              .filter((item) => item.percentage > 0)
              .map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="font-semibold text-white">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            {!userPosition && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No position yet. Deposit collateral to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Position Summary */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-white">Position Summary</h3>
        <div className="space-y-3">
          {userPosition ? (
            <>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#00ff9d]/20 text-[#00ff9d]">
                    ↓
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      Collateral
                    </div>
                    <div className="text-xs text-gray-400">Total deposited</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-white">
                  {(userPosition.collateralAmount || 0).toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400">
                    →
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      Borrowed
                    </div>
                    <div className="text-xs text-gray-400">Current debt</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-white">
                  {(userPosition.borrowedAmount || 0).toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
                    ✓
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      Health Factor
                    </div>
                    <div className="text-xs text-gray-400">Position safety</div>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${
                    currentHF >= 999
                      ? "text-gray-400"
                      : currentHF >= 1.5
                      ? "text-green-500"
                      : currentHF >= 1.2
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {currentHF >= 999 ? "∞" : currentHF.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm">No active position</div>
              <div className="text-xs mt-1">
                Deposit collateral to start tracking analytics
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
