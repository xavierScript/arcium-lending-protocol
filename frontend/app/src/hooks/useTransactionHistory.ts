import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { TransactionHistory } from "../types";

export function useTransactionHistory() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactionHistory = useCallback(async () => {
    if (!wallet.publicKey) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch signatures for transactions involving the user's wallet
      const signatures = await connection.getSignaturesForAddress(
        wallet.publicKey,
        { limit: 100 }
      );

      // Fetch parsed transaction details
      const txPromises = signatures.map((sig) =>
        connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
      );

      const transactions = await Promise.all(txPromises);

      // Parse transactions and filter for our program
      const history: TransactionHistory[] = [];

      transactions.forEach((tx, index) => {
        if (!tx || !tx.meta) return;

        const signature = signatures[index].signature;
        const timestamp = signatures[index].blockTime
          ? new Date(signatures[index].blockTime! * 1000)
          : new Date();

        // Check if transaction involves our program
        const involvesProgramId = tx.transaction.message.accountKeys.some(
          (key) => key.pubkey.equals(PROGRAM_ID)
        );

        if (!involvesProgramId) return;

        // Parse instruction data to determine transaction type
        const instructions = tx.transaction.message.instructions;

        instructions.forEach((ix: any) => {
          if (!ix.programId?.equals(PROGRAM_ID)) return;

          let type: "deposit" | "withdraw" | "borrow" | "repay" | undefined;
          let amount = 0;

          // Try to parse instruction data
          // This is simplified - you may need to decode the actual instruction data
          const ixName = getInstructionName(ix);

          if (ixName.includes("deposit")) {
            type = "deposit";
          } else if (ixName.includes("withdraw")) {
            type = "withdraw";
          } else if (ixName.includes("borrow")) {
            type = "borrow";
          } else if (ixName.includes("repay")) {
            type = "repay";
          }

          // Extract amount from pre/post balances
          if (tx.meta && type) {
            const preBalance = tx.meta.preBalances[0] || 0;
            const postBalance = tx.meta.postBalances[0] || 0;
            amount = Math.abs(postBalance - preBalance) / 1e9; // Convert to SOL
          }

          if (type) {
            history.push({
              signature,
              type,
              amount,
              timestamp,
              status: tx.meta?.err ? "failed" : "confirmed",
              user: wallet.publicKey!,
            });
          }
        });
      });

      // Sort by timestamp (most recent first)
      history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setTransactions(history);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  return {
    transactions,
    loading,
    refetch: fetchTransactionHistory,
  };
}

// Helper function to parse instruction name from instruction data
function getInstructionName(instruction: any): string {
  // This is a simplified approach - in production, you'd decode the instruction data properly
  // For Anchor programs, the first 8 bytes are the discriminator
  if (instruction.parsed) {
    return instruction.parsed.type || "";
  }

  // For unparsed instructions, we'd need to decode the data
  // For now, return empty string and rely on transaction metadata
  return "";
}
