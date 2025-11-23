import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import type { UserPosition, TransactionResult, UserAccount } from "../types";
import {
  PROGRAM_ID,
  ARCIUM_PROGRAM_ID,
  ARCIUM_CLOCK_ACCOUNT,
  ARCIUM_FEE_POOL_ACCOUNT,
  LIQUIDATION_THRESHOLD,
} from "@/lib/constants";
import {
  initializeEncryption,
  encryptValues,
  generateNonce,
  nonceToU128,
  getArciumAccounts,
  getCompDefAccount,
  getClusterAccount,
  generateComputationOffset,
  lamportsToSol,
  solToLamports,
  calculateHealthFactor,
  EncryptionKeys,
} from "@/lib/arcium";
import idl from "@/components/idl/lending_protocol.json";

export function usePrivateLending() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKeys | null>(
    null
  );

  // Derive vault PDA
  const getVaultPDA = useCallback(() => {
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      PROGRAM_ID
    );
    return vaultPDA;
  }, []);

  // Derive user account PDA
  const getUserAccountPDA = useCallback((userPubkey: PublicKey) => {
    const [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), userPubkey.toBuffer()],
      PROGRAM_ID
    );
    return userAccountPDA;
  }, []);

  // Derive signer PDA
  const getSignerPDA = useCallback(() => {
    const [signerPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("SignerAccount")],
      PROGRAM_ID
    );
    return signerPDA;
  }, []);

  // Initialize Anchor program
  useEffect(() => {
    if (!wallet.publicKey) return;

    const initProgram = async () => {
      try {
        const provider = new AnchorProvider(connection, wallet as any, {
          commitment: "confirmed",
        });

        const program = new Program(idl as Idl, PROGRAM_ID, provider);
        setProgram(program);

        // Initialize encryption keys
        const keys = await initializeEncryption(provider, PROGRAM_ID);
        setEncryptionKeys(keys);

        console.log("✅ Anchor program and encryption initialized");
      } catch (error) {
        console.error("Error initializing program:", error);
      }
    };

    initProgram();
  }, [wallet.publicKey, connection]);

  // Fetch user position
  const fetchUserPosition = useCallback(async () => {
    if (!wallet.publicKey || !program) return;

    try {
      setLoading(true);
      const userAccountPDA = getUserAccountPDA(wallet.publicKey);

      const userAccount = (await program.account.userAccount.fetch(
        userAccountPDA
      )) as UserAccount;

      // Convert BN to numbers for UI
      const collateral = lamportsToSol(
        userAccount.depositedCollateral.toNumber()
      );
      const borrowed = lamportsToSol(userAccount.borrowedAmount.toNumber());
      const pending = lamportsToSol(userAccount.pendingBorrow.toNumber());

      const healthFactor = calculateHealthFactor(
        BigInt(userAccount.depositedCollateral.toString()),
        BigInt(userAccount.borrowedAmount.toString()),
        LIQUIDATION_THRESHOLD
      );

      const position: UserPosition = {
        owner: userAccount.owner,
        collateralAmount: collateral,
        borrowedAmount: borrowed,
        pendingBorrow: pending,
        healthFactor,
        isHealthy: userAccount.isHealthy,
        liquidationThreshold: LIQUIDATION_THRESHOLD,
        lastUpdate: new Date(),
      };

      setUserPosition(position);
    } catch (error: any) {
      // Account doesn't exist yet
      console.log("User account not initialized:", error.message);
      setUserPosition(null);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, program, getUserAccountPDA]);

  // Initialize user account
  const initializeUser = useCallback(async (): Promise<TransactionResult> => {
    if (!wallet.publicKey || !program) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      setLoading(true);
      const userAccountPDA = getUserAccountPDA(wallet.publicKey);

      const tx = await program.methods
        .initializeUser()
        .accounts({
          owner: wallet.publicKey,
          userAccount: userAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });

      await fetchUserPosition();

      return { success: true, signature: tx };
    } catch (error: any) {
      console.error("Error initializing user:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, program, getUserAccountPDA, fetchUserPosition]);

  // Deposit collateral
  const depositCollateral = useCallback(
    async (amount: number): Promise<TransactionResult> => {
      if (!wallet.publicKey || !program) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        setLoading(true);
        const userAccountPDA = getUserAccountPDA(wallet.publicKey);
        const vaultPDA = getVaultPDA();

        // Convert SOL to lamports
        const amountLamports = new BN(solToLamports(amount).toString());

        const tx = await program.methods
          .depositCollateral(amountLamports)
          .accounts({
            owner: wallet.publicKey,
            userAccount: userAccountPDA,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        await fetchUserPosition();

        return { success: true, signature: tx };
      } catch (error: any) {
        console.error("Error depositing collateral:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [
      wallet.publicKey,
      program,
      getUserAccountPDA,
      getVaultPDA,
      fetchUserPosition,
    ]
  );

  // Borrow funds with encrypted health check
  const borrow = useCallback(
    async (amount: number): Promise<TransactionResult> => {
      if (!wallet.publicKey || !program || !encryptionKeys || !userPosition) {
        return {
          success: false,
          error: "Wallet not connected or encryption not initialized",
        };
      }

      try {
        setLoading(true);
        const userAccountPDA = getUserAccountPDA(wallet.publicKey);
        const signerPDA = getSignerPDA();

        // Convert to lamports
        const borrowAmountLamports = solToLamports(amount);
        const collateralLamports = solToLamports(userPosition.collateralAmount);
        const totalBorrowLamports =
          solToLamports(userPosition.borrowedAmount) + borrowAmountLamports;

        // Encrypt values
        const nonce = generateNonce();
        const [encryptedCollateral, encryptedBorrow] = encryptValues(
          encryptionKeys.cipher,
          collateralLamports,
          totalBorrowLamports,
          nonce
        );

        // Generate computation offset
        const computationOffset = generateComputationOffset();

        // Get Arcium accounts
        const arciumAccounts = getArciumAccounts(PROGRAM_ID, computationOffset);
        const compDefAccount = getCompDefAccount(
          PROGRAM_ID,
          "check_health_factor"
        );
        const clusterAccount = getClusterAccount();

        const tx = await program.methods
          .borrow(
            new BN(computationOffset.toString()),
            new BN(borrowAmountLamports.toString()),
            Array.from(encryptedCollateral),
            Array.from(encryptedBorrow),
            Array.from(encryptionKeys.publicKey),
            new BN(nonceToU128(nonce).toString())
          )
          .accounts({
            payer: wallet.publicKey,
            userAccount: userAccountPDA,
            signPdaAccount: signerPDA,
            mxeAccount: arciumAccounts.mxeAccount,
            mempoolAccount: arciumAccounts.mempoolAccount,
            executingPool: arciumAccounts.executingPool,
            computationAccount: arciumAccounts.computationAccount,
            compDefAccount,
            clusterAccount,
            poolAccount: ARCIUM_FEE_POOL_ACCOUNT,
            clockAccount: ARCIUM_CLOCK_ACCOUNT,
            systemProgram: SystemProgram.programId,
            arciumProgram: ARCIUM_PROGRAM_ID,
          })
          .rpc({ skipPreflight: true, commitment: "confirmed" });

        // Wait for computation to complete (in production, poll for callback event)
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await fetchUserPosition();

        return { success: true, signature: tx };
      } catch (error: any) {
        console.error("Error borrowing:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [
      wallet.publicKey,
      program,
      encryptionKeys,
      userPosition,
      getUserAccountPDA,
      getSignerPDA,
      fetchUserPosition,
    ]
  );

  // Repay loan
  const repay = useCallback(
    async (amount: number): Promise<TransactionResult> => {
      if (!wallet.publicKey || !program) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        setLoading(true);
        const userAccountPDA = getUserAccountPDA(wallet.publicKey);
        const vaultPDA = getVaultPDA();

        const amountLamports = new BN(solToLamports(amount).toString());

        const tx = await program.methods
          .repay(amountLamports)
          .accounts({
            owner: wallet.publicKey,
            userAccount: userAccountPDA,
            vault: vaultPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        await fetchUserPosition();

        return { success: true, signature: tx };
      } catch (error: any) {
        console.error("Error repaying:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [
      wallet.publicKey,
      program,
      getUserAccountPDA,
      getVaultPDA,
      fetchUserPosition,
    ]
  );

  // Request airdrop (for testing on devnet)
  const requestAirdrop = useCallback(async (): Promise<TransactionResult> => {
    if (!wallet.publicKey) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      setLoading(true);
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );

      await connection.confirmTransaction(signature);

      return { success: true, signature };
    } catch (error: any) {
      console.error("Error requesting airdrop:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection]);

  // Fetch data on wallet connection
  useEffect(() => {
    if (wallet.publicKey && program) {
      fetchUserPosition();
    }
  }, [wallet.publicKey, program, fetchUserPosition]);

  return {
    // State
    loading,
    userPosition,
    poolStats: null, // Pool stats not implemented in current contract
    program,

    // Actions
    initializeUser,
    depositCollateral,
    borrow,
    repay,
    requestAirdrop,

    // Utils
    fetchUserPosition,
    fetchPoolStats: () => {}, // No-op for now
  };
}

export default usePrivateLending;
