import React, { useState } from "react";
import { DollarSign } from "lucide-react";
import { ActionButton } from "../common/ActionButton";
import type { UserPosition } from "@/app/src/types";

interface RepayFormProps {
  userPosition: UserPosition | null;
  loading: boolean;
  onRepay: (amount: number) => Promise<void>;
  calculateHealthFactor: (collateral: number, borrowed: number) => number;
  getHealthFactorColor: (hf: number) => string;
}

export const RepayForm: React.FC<RepayFormProps> = ({
  userPosition,
  loading,
  onRepay,
  calculateHealthFactor,
  getHealthFactorColor,
}) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onRepay(parseFloat(amount));
      setAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const newDebt = Math.max(
    0,
    (userPosition?.borrowedAmount || 0) - (parseFloat(amount) || 0)
  );
  const newHealthFactor = calculateHealthFactor(
    userPosition?.collateralAmount || 0,
    newDebt
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Repay Loan</h3>
        <p className="text-gray-400 text-sm">
          Repay your borrowed amount to improve your health factor.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Amount (SOL)
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
          <span className="text-gray-400">Current Debt</span>
          <span className="font-semibold text-red-400">
            {(userPosition?.borrowedAmount || 0).toFixed(4)} SOL
          </span>
        </div>
      </div>

      {amount && (
        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">New Debt</span>
            <span className="font-semibold text-white">
              {newDebt.toFixed(4)} SOL
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">New Health Factor</span>
            <span
              className={`font-semibold ${
                newHealthFactor >= 999
                  ? "text-gray-400"
                  : getHealthFactorColor(newHealthFactor)
              }`}
            >
              {newHealthFactor >= 999 ? "∞" : newHealthFactor.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <ActionButton
        onClick={handleSubmit}
        disabled={
          submitting ||
          loading ||
          !amount ||
          parseFloat(amount) <= 0 ||
          (userPosition?.borrowedAmount || 0) === 0
        }
        loading={submitting || loading}
        label="Repay Loan"
      />
    </div>
  );
};
