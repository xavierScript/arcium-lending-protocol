import React, { useState } from "react";
import { DollarSign, Clock, AlertCircle } from "lucide-react";
import { ActionButton } from "../common/ActionButton";
import type { UserPosition } from "@/app/src/types";

interface BorrowFormProps {
  userPosition: UserPosition | null;
  loading: boolean;
  onBorrow: (amount: number) => Promise<void>;
  onFinalizeBorrow?: () => Promise<void>;
  calculateHealthFactor: (collateral: number, borrowed: number) => number;
  getHealthFactorColor: (hf: number) => string;
}

export const BorrowForm: React.FC<BorrowFormProps> = ({
  userPosition,
  loading,
  onBorrow,
  onFinalizeBorrow,
  calculateHealthFactor,
  getHealthFactorColor,
}) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onBorrow(parseFloat(amount));
      setAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!onFinalizeBorrow || finalizing) return;
    setFinalizing(true);
    try {
      await onFinalizeBorrow();
    } finally {
      setFinalizing(false);
    }
  };

  const maxBorrow =
    (userPosition?.collateralAmount || 0) * 0.75 -
    (userPosition?.borrowedAmount || 0);
  const newDebt =
    (userPosition?.borrowedAmount || 0) + (parseFloat(amount) || 0);
  const newHealthFactor = calculateHealthFactor(
    userPosition?.collateralAmount || 0,
    newDebt
  );

  const hasPendingBorrow = (userPosition?.pendingBorrow || 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Borrow Funds</h3>
        <p className="text-gray-400 text-sm">
          Borrow against your collateral. Loan details remain private via Arcium
          MPC.
        </p>
      </div>

      {!hasPendingBorrow && (
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-400 mb-1">
                Two-Step Borrow Process
              </h4>
              <p className="text-sm text-gray-300">
                <strong>Step 1:</strong> Submit borrow request → encrypted
                health check runs
                <br />
                <strong>Step 2:</strong> Click "Finalize" to receive funds after
                computation
              </p>
            </div>
          </div>
        </div>
      )}

      {hasPendingBorrow && (
        <div className="bg-gradient-to-r from-yellow-900/20 to-green-900/20 border border-yellow-500/30 rounded-xl p-4 shadow-lg">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-400 mb-1">
                Pending Borrow: {(userPosition?.pendingBorrow || 0).toFixed(4)}{" "}
                SOL
              </h4>
              <p className="text-sm text-gray-300 mb-1">
                ✅ Health check computation submitted
              </p>
              <p className="text-sm text-gray-400 mb-3">
                Wait a few seconds for the encrypted computation to complete,
                then click below to receive your funds.
              </p>
              {onFinalizeBorrow && (
                <ActionButton
                  onClick={handleFinalize}
                  disabled={finalizing || loading}
                  loading={finalizing}
                  label={
                    finalizing ? "Finalizing..." : "Finalize & Receive Funds"
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}

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
          <span className="text-gray-400">Available to borrow</span>
          <span className="font-semibold text-[#00ff9d]">
            {maxBorrow.toFixed(4)} SOL
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
        <span className="text-sm text-gray-300">Interest Rate</span>
        <span className="font-semibold text-white">
          {/* {userPosition?.interestRate || 0}% APY */}
        </span>
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
        disabled={submitting || loading || !amount || parseFloat(amount) <= 0}
        loading={submitting || loading}
        label="Borrow Funds"
      />
    </div>
  );
};
