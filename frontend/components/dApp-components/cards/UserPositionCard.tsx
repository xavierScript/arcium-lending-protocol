import React from "react";
import { Lock, AlertCircle } from "lucide-react";
import type { UserPosition } from "@/app/src/types";

interface UserPositionCardProps {
  userPosition: UserPosition | null;
  showPrivateInfo: boolean;
  getHealthFactorColor: (hf: number) => string;
  getHealthFactorBg: (hf: number) => string;
}

export const UserPositionCard: React.FC<UserPositionCardProps> = ({
  userPosition,
  showPrivateInfo,
  getHealthFactorColor,
  getHealthFactorBg,
}) => {
  return (
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
            {showPrivateInfo
              ? `$${(userPosition?.collateralAmount || 0).toLocaleString()}`
              : "••••••"}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Amount Borrowed</div>
          <div className="text-2xl font-bold">
            {showPrivateInfo
              ? `$${(userPosition?.borrowedAmount || 0).toLocaleString()}`
              : "••••••"}
          </div>
        </div>
        {userPosition && userPosition.pendingBorrow > 0 && (
          <div>
            <div className="text-sm text-gray-400 mb-1">Pending Borrow</div>
            <div className="text-2xl font-bold text-yellow-400">
              {showPrivateInfo
                ? `$${(userPosition?.pendingBorrow || 0).toLocaleString()}`
                : "••••••"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Awaiting finalization
            </div>
          </div>
        )}
        <div>
          <div className="text-sm text-gray-400 mb-1">Health Factor</div>
          <div
            className={`text-2xl font-bold ${getHealthFactorColor(
              userPosition?.healthFactor || 0
            )}`}
          >
            {showPrivateInfo
              ? (userPosition?.healthFactor || 0).toFixed(2)
              : "•••"}
          </div>
          {showPrivateInfo && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Safe</span>
                <span>At Risk</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getHealthFactorBg(
                    userPosition?.healthFactor || 0
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((userPosition?.healthFactor || 0) / 2) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {/* Interest Rate display removed - not tracked in current contract */}
      </div>

      {(userPosition?.healthFactor || 0) < 1.3 &&
        (userPosition?.borrowedAmount || 0) > 0 &&
        showPrivateInfo && (
          <div className="mt-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-300 font-semibold">
                Warning: Low Health Factor
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Consider adding collateral or repaying debt
              </p>
            </div>
          </div>
        )}
    </div>
  );
};
