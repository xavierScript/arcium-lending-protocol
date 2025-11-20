
import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { ActionButton } from "../common/ActionButton";

interface DepositFormProps {
  userPosition: any;
  loading: boolean;
  onDeposit: (amount: number) => Promise<void>;
  calculateHealthFactor: (collateral: number, borrowed: number) => number;
  getHealthFactorColor: (hf: number) => string;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  userPosition,
  loading,
  onDeposit,
  calculateHealthFactor,
  getHealthFactorColor
}) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    await onDeposit(parseFloat(amount));
    setAmount('');
  };

  const newCollateral = (userPosition?.collateralAmount || 0) + (parseFloat(amount) || 0);
  const newHealthFactor = calculateHealthFactor(
    newCollateral,
    userPosition?.borrowedAmount || 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2 text-white">Deposit Collateral</h3>
        <p className="text-gray-400 text-sm">
          Add collateral to your private position. Amount is encrypted via Arcium MPC.
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
      </div>

      <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">New Collateral</span>
          <span className="font-semibold text-white">
            ${newCollateral.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">New Health Factor</span>
          <span className={`font-semibold ${getHealthFactorColor(newHealthFactor)}`}>
            {newHealthFactor.toFixed(2)}
          </span>
        </div>
      </div>

      <ActionButton
        onClick={handleSubmit}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        loading={loading}
        label="Deposit Collateral"
      />
    </div>
  );
};