
import React, { useState } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { ActionButton } from "../common/ActionButton";
import type { UserPosition } from '@/app/src/types';

interface WithdrawFormProps {
  userPosition: UserPosition | null;
  loading: boolean;
  onWithdraw: (amount: number) => Promise<void>;
  calculateHealthFactor: (collateral: number, borrowed: number) => number;
  getHealthFactorColor: (hf: number) => string;
}

export const WithdrawForm: React.FC<WithdrawFormProps> = ({
  userPosition,
  loading,
  onWithdraw,
  calculateHealthFactor,
  getHealthFactorColor
}) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    await onWithdraw(parseFloat(amount));
    setAmount('');
  };

  const newCollateral = Math.max(0, (userPosition?.collateralAmount || 0) - (parseFloat(amount) || 0));
  const newHealthFactor = calculateHealthFactor(
    newCollateral,
    userPosition?.borrowedAmount || 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Withdraw Collateral</h3>
        <p className="text-gray-400 text-sm">
          Withdraw your collateral. Must maintain healthy position if you have an active loan.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Amount (USDC)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-lg focus:outline-none focus:border-[#00ff9d]/50 text-white placeholder-gray-600 backdrop-blur-sm transition-all"
          />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-400">Total collateral</span>
          <span className="font-semibold text-[#00ff9d]">
            ${(userPosition?.collateralAmount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {amount && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">New Collateral</span>
            <span className="font-semibold text-white">
              ${newCollateral.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">New Health Factor</span>
            <span className={`font-semibold ${getHealthFactorColor(newHealthFactor)}`}>
              {newHealthFactor.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {(userPosition?.borrowedAmount || 0) > 0 && (
        <div className="flex items-start space-x-2 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-200">
            Withdrawing collateral will decrease your health factor. Ensure it stays above 1.0 to avoid liquidation.
          </p>
        </div>
      )}

      <ActionButton
        onClick={handleSubmit}
        disabled={
          loading || 
          !amount || 
          parseFloat(amount) <= 0 || 
          (userPosition?.collateralAmount || 0) === 0
        }
        loading={loading}
        label="Withdraw Collateral"
      />
    </div>
  );
};