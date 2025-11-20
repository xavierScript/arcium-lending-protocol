import React from 'react';
import { TrendingUp, Lock, AlertCircle } from 'lucide-react';

interface StatsProps {
  poolStats: {
    totalLiquidity: number;
    totalBorrowed: number;
    utilizationRate: number;
    avgAPY: number;
  } | null;
  userPosition: {
    collateralAmount: number;
    borrowedAmount: number;
    healthFactor: number;
    interestRate: number;
  } | null;
  showPrivateInfo: boolean;
  getHealthFactorColor: (hf: number) => string;
  getHealthFactorBg: (hf: number) => string;
}

export const Stats: React.FC<StatsProps> = ({
  poolStats,
  userPosition,
  showPrivateInfo,
  getHealthFactorColor,
  getHealthFactorBg,
}) => {
  return (
    <div className="space-y-6">
      {/* Protocol Stats */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center text-white">
          <TrendingUp className="w-5 h-5 mr-2 text-[#00ff9d]" />
          Protocol Stats
        </h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Liquidity</div>
            <div className="text-2xl font-bold text-white">${(poolStats?.totalLiquidity || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
            <div className="text-2xl font-bold text-white">${(poolStats?.totalBorrowed || 0).toLocaleString()}</div>
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
              <span className="text-sm font-semibold text-[#00ff9d]">{(poolStats?.utilizationRate || 0).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Average APY</div>
            <div className="text-2xl font-bold text-[#00ff9d]">{poolStats?.avgAPY || 0}%</div>
          </div>
        </div>
      </div>

      {/* User Position */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center text-white">
            <Lock className="w-5 h-5 mr-2 text-[#00ff9d]" />
            Your Position
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Collateral Deposited</div>
            <div className="text-2xl font-bold">
              {showPrivateInfo ? `$${(userPosition?.collateralAmount || 0).toLocaleString()}` : '••••••'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Amount Borrowed</div>
            <div className="text-2xl font-bold">
              {showPrivateInfo ? `$${(userPosition?.borrowedAmount || 0).toLocaleString()}` : '••••••'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Health Factor</div>
            <div className={`text-2xl font-bold ${getHealthFactorColor(userPosition?.healthFactor || 0)}`}>
              {showPrivateInfo ? (userPosition?.healthFactor || 0).toFixed(2) : '•••'}
            </div>
            {showPrivateInfo && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Safe</span>
                  <span>At Risk</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getHealthFactorBg(userPosition?.healthFactor || 0)}`}
                    style={{ width: `${Math.min(100, ((userPosition?.healthFactor || 0) / 2) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Interest Rate</div>
            <div className="text-xl font-bold">
              {showPrivateInfo ? `${(userPosition?.interestRate || 0)}% APY` : '••••'}
            </div>
          </div>
        </div>

        {(userPosition?.healthFactor || 0) < 1.3 && (userPosition?.borrowedAmount || 0) > 0 && showPrivateInfo && (
          <div className="mt-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-300 font-semibold">Warning: Low Health Factor</p>
              <p className="text-xs text-gray-300 mt-1">
                Consider adding collateral or repaying debt
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};