import React from "react";
import { History, ExternalLink } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "@/lib/constants";

interface TransactionHistoryCardProps {
  network?: "devnet" | "mainnet-beta" | "localnet";
}

export const TransactionHistoryCard: React.FC<TransactionHistoryCardProps> = ({
  network = "devnet",
}) => {
  const { publicKey } = useWallet();

  // Generate Solana Explorer URLs based on network and wallet/program
  const getExplorerUrl = () => {
    const baseUrl = "https://explorer.solana.com";
    const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;

    if (publicKey) {
      // Link to user's wallet transaction history
      return `${baseUrl}/address/${publicKey.toBase58()}${cluster}`;
    }

    return null;
  };

  const getProgramExplorerUrl = () => {
    const baseUrl = "https://explorer.solana.com";
    const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;

    // Link to program's transaction history
    return `${baseUrl}/address/${PROGRAM_ID.toBase58()}${cluster}`;
  };

  const walletUrl = getExplorerUrl();
  const programUrl = getProgramExplorerUrl();

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center text-white">
          <History className="w-5 h-5 mr-2 text-[#00ff9d]" />
          Transaction History
        </h2>
      </div>

      <div className="space-y-4">
        {publicKey ? (
          <>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-[#00ff9d]/10 mt-1">
                  <History className="w-5 h-5 text-[#00ff9d]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Your Wallet Transactions
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    View all transactions from your wallet including deposits,
                    withdrawals, borrows, and repayments.
                  </p>
                  <a
                    href={walletUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 text-[#00ff9d] rounded-lg transition-colors border border-[#00ff9d]/30"
                  >
                    <span className="font-medium">View on Solana Explorer</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/10 mt-1">
                  <History className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Protocol Activity
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    View all protocol transactions to see global activity and
                    other users' interactions.
                  </p>
                  <a
                    href={programUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors border border-purple-500/30"
                  >
                    <span className="font-medium">View Program Activity</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Connect your wallet to view transactions</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <div className="flex items-start space-x-2">
          <div className="text-blue-400 text-sm mt-0.5">ℹ️</div>
          <p className="text-xs text-gray-400">
            Transaction history is provided by Solana Explorer to avoid rate
            limiting. Click the links above to view detailed transaction
            information.
          </p>
        </div>
      </div>
    </div>
  );
};
