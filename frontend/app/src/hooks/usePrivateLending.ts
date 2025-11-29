import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import type { UserPosition, TransactionResult, UserAccount } from "../types";
import {
  PROGRAM_ID,
  ARCIUM_PROGRAM_ID,
  ARCIUM_CLOCK_ACCOUNT,
  ARCIUM_FEE_POOL_ACCOUNT,
  LIQUIDATION_THRESHOLD,
  ARCIUM_CLUSTER_OFFSET,
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
  compDefOffsetToU32,
  EncryptionKeys,
} from "@/lib/arcium";

import IDL from "@/components/idl/lending_protocol.json";
export function usePrivateLending() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKeys | null>(
    null
  );

  // Fetch serialization/debounce refs
  const fetchMutexRef = useRef(false);
  const pendingFetchRef = useRef(false);
  const fetchDebounceRef = useRef<number | null>(null);

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
    // console.log("🔍 Deriving PDA with:");
    // console.log("  Program ID:", PROGRAM_ID.toString());
    // console.log("  User Pubkey:", userPubkey.toString());
    const [userAccountPDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), userPubkey.toBuffer()],
      PROGRAM_ID
    );
    // console.log("Derived PDA:", userAccountPDA.toString(), "Bump:", bump);
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

        const program = new Program(IDL as any, provider);
        setProgram(program);

        console.log("✅ Anchor program initialized");
        console.log("Program ID from IDL:", program.programId.toString());
        console.log("Expected Program ID:", PROGRAM_ID.toString());

        // Encryption initialization is currently disabled (commented out).
        // If you want to enable it again, uncomment the block below.
        // try {
        //   const keys = await initializeEncryption(provider, PROGRAM_ID);
        //   setEncryptionKeys(keys);
        //   console.log("✅ Encryption initialized");
        // } catch (encError) {
        //   console.warn(
        //     "⚠️ Encryption initialization failed (will initialize on borrow):",
        //     encError
        //   );
        // }
        console.log("ℹ️ Encryption initialization skipped (disabled in code)");
      } catch (error) {
        console.error("Error initializing program:", error);
      }
    };

    initProgram();
  }, [wallet.publicKey, connection]);

  // Fetch user position
  const fetchUserPosition = useCallback(async () => {
    // Skip if wallet/program not ready
    if (!wallet.publicKey || !program) return;

    // Pause fetches when the document/tab is hidden
    if (typeof document !== "undefined" && document.hidden) return;

    // If a fetch is already running, mark a pending fetch and return (coalesce)
    if (fetchMutexRef.current) {
      pendingFetchRef.current = true;
      return;
    }

    fetchMutexRef.current = true;
    try {
      setLoading(true);
      const userAccountPDA = getUserAccountPDA(wallet.publicKey);

      // Fetch account using program.account with proper typing
      if (!program.account || !(program.account as any).userAccount) {
        throw new Error("Program accounts not initialized");
      }

      const userAccount = (await (program.account as any).userAccount.fetch(
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
      // Account doesn't exist yet or other fetch error
      setUserPosition(null);
    } finally {
      setLoading(false);
      fetchMutexRef.current = false;

      // If another fetch was requested while this one was running, coalesce and run after a short debounce
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        if (fetchDebounceRef.current) {
          clearTimeout(fetchDebounceRef.current as any);
        }
        fetchDebounceRef.current = window.setTimeout(() => {
          fetchUserPosition();
        }, 150) as unknown as number;
      }
    }
  }, [wallet.publicKey, program, getUserAccountPDA]);

  // Check if computation definitions are initialized
  const checkCompDefsInitialized = useCallback(async (): Promise<boolean> => {
    if (!program) return false;

    try {
      const {
        getCompDefAccOffset,
        getArciumAccountBaseSeed,
        getArciumProgAddress,
      } = await import("@arcium-hq/client");

      const arciumProgramId = getArciumProgAddress();
      const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
      const healthCheckOffsetBytes = getCompDefAccOffset("check_health_factor");

      const [healthCheckCompDefAccount] = PublicKey.findProgramAddressSync(
        [baseSeed, PROGRAM_ID.toBuffer(), healthCheckOffsetBytes],
        arciumProgramId
      );

      // Try to fetch the comp def account - if it exists, it's initialized
      const accountInfo = await connection.getAccountInfo(
        healthCheckCompDefAccount
      );
      return accountInfo !== null;
    } catch (error) {
      console.log("Comp defs not initialized:", error);
      return false;
    }
  }, [program, connection]);

  // Initialize Arcium computation definitions (MXE setup)
  const initializeArciumCompDefs =
    useCallback(async (): Promise<TransactionResult> => {
      if (!wallet.publicKey || !program) {
        return { success: false, error: "Wallet not connected" };
      }

      // Check if already initialized
      const isInitialized = await checkCompDefsInitialized();
      if (isInitialized) {
        // console.log("✅ Computation definitions already initialized");
        // console.log("Using cluster account:", clusterAccount.toString());
        // console.log(
        //   "Cluster offset:",
        //   ARCIUM_CLUSTER_OFFSET || "localnet (no offset)"
        // );
        // console.log(
        //   "Health check comp def account:",
        //   healthCheckCompDefAccount.toString()
        // );
        // console.log(
        //   "Liquidation comp def account:",
        //   liquidationCompDefAccount.toString()
        // );
        // console.log(
        //   "Comp def PDA (health):",
        //   healthCheckCompDefAccount.toString()
        // );
        // console.log("MXE account:", mxeAccount.toString());
        // console.log("Payer:", wallet.publicKey.toString());
        // console.log("Initializing health check computation definition...");
        return {
          success: true,
          signature: "Already initialized",
        };
      }

      setLoading(true);
      try {
        const provider = program.provider as AnchorProvider;
        const {
          getMXEAccAddress,
          getCompDefAccOffset,
          getArciumAccountBaseSeed,
          getArciumProgAddress,
          getClusterAccAddress,
          getArciumEnv,
        } = await import("@arcium-hq/client");

        const mxeAccount = getMXEAccAddress(PROGRAM_ID);
        const arciumProgramId = getArciumProgAddress();

        // Determine cluster account based on environment
        const clusterAccount =
          ARCIUM_CLUSTER_OFFSET !== null
            ? getClusterAccAddress(ARCIUM_CLUSTER_OFFSET)
            : getArciumEnv().arciumClusterPubkey;

        console.log("Using cluster account:", clusterAccount.toString());
        console.log(
          "Cluster offset:",
          ARCIUM_CLUSTER_OFFSET || "localnet (no offset)"
        );

        // Get comp def offsets using Arcium's function
        const healthCheckOffsetBytes = getCompDefAccOffset(
          "check_health_factor"
        );
        const liquidationOffsetBytes = getCompDefAccOffset("check_liquidation");

        // Derive comp def accounts from Arcium program, not lending program
        const baseSeed = getArciumAccountBaseSeed(
          "ComputationDefinitionAccount"
        );

        const [healthCheckCompDefAccount] = PublicKey.findProgramAddressSync(
          [baseSeed, PROGRAM_ID.toBuffer(), healthCheckOffsetBytes],
          arciumProgramId
        );

        const [liquidationCompDefAccount] = PublicKey.findProgramAddressSync(
          [baseSeed, PROGRAM_ID.toBuffer(), liquidationOffsetBytes],
          arciumProgramId
        );

        // console.log(
        //   "Derived health check comp def account:",
        //   healthCheckCompDefAccount.toString()
        // );
        // console.log(
        //   "Derived liquidation comp def account:",
        //   liquidationCompDefAccount.toString()
        // );

        const healthCheckSig = await program.methods
          .initHealthCheckCompDef()
          .accounts({
            compDefAccount: healthCheckCompDefAccount,
            payer: wallet.publicKey,
            mxeAccount,
          })
          .rpc({
            commitment: "confirmed",
            skipPreflight: false,
          });

        // console.log("✅ Health check comp def initialized:", healthCheckSig);

        // Finalize the comp def (required step)
        // console.log("Finalizing health check computation definition...");
        const { buildFinalizeCompDefTx } = await import("@arcium-hq/client");
        const healthCheckOffset = compDefOffsetToU32(healthCheckOffsetBytes);
        const finalizeTx = await buildFinalizeCompDefTx(
          provider,
          healthCheckOffset,
          PROGRAM_ID
        );

        const latestBlockhash = await connection.getLatestBlockhash();
        finalizeTx.recentBlockhash = latestBlockhash.blockhash;
        finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

        await provider.sendAndConfirm(finalizeTx);
        // console.log("✅ Health check comp def finalized");

        // console.log("Initializing liquidation computation definition...");
        const liquidationSig = await program.methods
          .initLiquidationCompDef()
          .accounts({
            compDefAccount: liquidationCompDefAccount,
            payer: wallet.publicKey,
            mxeAccount,
          })
          .rpc({
            commitment: "confirmed",
            skipPreflight: false,
          });

        // console.log("✅ Liquidation comp def initialized:", liquidationSig);

        // Finalize the liquidation comp def
        // console.log("Finalizing liquidation computation definition...");
        const liquidationOffset = compDefOffsetToU32(liquidationOffsetBytes);
        const finalizeLiqTx = await buildFinalizeCompDefTx(
          provider,
          liquidationOffset,
          PROGRAM_ID
        );

        const latestBlockhash2 = await connection.getLatestBlockhash();
        finalizeLiqTx.recentBlockhash = latestBlockhash2.blockhash;
        finalizeLiqTx.lastValidBlockHeight =
          latestBlockhash2.lastValidBlockHeight;

        await provider.sendAndConfirm(finalizeLiqTx);
        // console.log("✅ Liquidation comp def finalized");

        // console.log("✅ Liquidation comp def initialized:", liquidationSig);

        // Encryption initialization after MXE setup is currently disabled.
        // To re-enable, uncomment the block below.
        // try {
        //   const keys = await initializeEncryption(provider, PROGRAM_ID);
        //   setEncryptionKeys(keys);
        // } catch (encError) {
        //   console.warn("⚠️ Encryption still failed after MXE setup:", encError);
        // }
        console.log(
          "ℹ️ Encryption initialization after MXE setup skipped (disabled in code)"
        );

        return {
          success: true,
          signature: `Health: ${healthCheckSig}, Liquidation: ${liquidationSig}`,
        };
      } catch (error: any) {
        console.error("Error initializing computation definitions:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    }, [wallet.publicKey, program]);

  // Initialize user account
  const initializeUser = useCallback(async (): Promise<TransactionResult> => {
    if (!wallet.publicKey || !program) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      setLoading(true);
      const userAccountPDA = getUserAccountPDA(wallet.publicKey);

      // Check if account already exists by fetching account info directly
      const accountInfo = await connection.getAccountInfo(userAccountPDA);

      if (accountInfo !== null) {
        // console.log("✅ User account already exists");
        await fetchUserPosition();
        return {
          success: true,
          signature: "Account already initialized",
        };
      }

      // Account doesn't exist, proceed with initialization
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

      // Check if error is because account already exists
      if (
        error.message?.includes("already in use") ||
        error.message?.includes("0x0")
      ) {
        // console.log("✅ User account was already initialized");
        await fetchUserPosition();
        return {
          success: true,
          signature: "Account already initialized",
        };
      }

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
          .rpc({
            commitment: "confirmed",
            skipPreflight: false,
            maxRetries: 3,
          });

        // console.log("✅ Deposit successful:", tx);

        // Wait a bit for on-chain confirmation before fetching
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await fetchUserPosition();

        return { success: true, signature: tx };
      } catch (error: any) {
        console.error("❌ Error depositing collateral:", error);

        // Better error messages
        let errorMessage = error.message;
        if (error.message?.includes("429")) {
          errorMessage =
            "RPC rate limit reached. Please try again in a moment.";
        } else if (error.message?.includes("insufficient")) {
          errorMessage = "Insufficient SOL balance for transaction fees.";
        }

        return { success: false, error: errorMessage };
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
      if (!wallet.publicKey || !program || !userPosition) {
        return {
          success: false,
          error: "Wallet not connected or user position not found",
        };
      }

      // Initialize encryption if not already done
      let keys = encryptionKeys;
      if (!keys) {
        try {
          const provider = new AnchorProvider(connection, wallet as any, {
            commitment: "confirmed",
          });
          keys = await initializeEncryption(provider, PROGRAM_ID);
          setEncryptionKeys(keys);
        } catch (error: any) {
          return {
            success: false,
            error: `Encryption initialization failed: ${error.message}. Make sure Arcium localnet is running.`,
          };
        }
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

        // Encrypt values (matching template pattern)
        const nonce = generateNonce();
        const ciphertext = encryptValues(
          keys.cipher,
          collateralLamports,
          totalBorrowLamports,
          nonce
        );

        // Generate computation offset (matching template)
        const computationOffset = new BN(
          crypto.getRandomValues(new Uint8Array(8))
        );

        // Import Arcium helpers
        const {
          getComputationAccAddress,
          getMXEAccAddress,
          getMempoolAccAddress,
          getExecutingPoolAccAddress,
          getCompDefAccAddress,
          getCompDefAccOffset,
          getClusterAccAddress,
          getArciumEnv,
          deserializeLE,
        } = await import("@arcium-hq/client");

        // Determine cluster account based on environment
        const clusterAccount =
          ARCIUM_CLUSTER_OFFSET !== null
            ? getClusterAccAddress(ARCIUM_CLUSTER_OFFSET)
            : getArciumEnv().arciumClusterPubkey;

        // Get comp def offset for health check
        const healthCheckOffset = getCompDefAccOffset("check_health_factor");
        const healthCheckOffsetU32 =
          Buffer.from(healthCheckOffset).readUInt32LE();

        const tx = await program.methods
          .borrow(
            computationOffset,
            new BN(borrowAmountLamports.toString()),
            Array.from(ciphertext[0]),
            Array.from(ciphertext[1]),
            Array.from(keys.publicKey),
            new BN(deserializeLE(nonce).toString())
          )
          .accountsPartial({
            payer: wallet.publicKey,
            userAccount: userAccountPDA,
            signPdaAccount: signerPDA,
            computationAccount: getComputationAccAddress(
              PROGRAM_ID,
              computationOffset
            ),
            clusterAccount,
            mxeAccount: getMXEAccAddress(PROGRAM_ID),
            mempoolAccount: getMempoolAccAddress(PROGRAM_ID),
            executingPool: getExecutingPoolAccAddress(PROGRAM_ID),
            compDefAccount: getCompDefAccAddress(
              PROGRAM_ID,
              healthCheckOffsetU32
            ),
            poolAccount: ARCIUM_FEE_POOL_ACCOUNT,
            clockAccount: ARCIUM_CLOCK_ACCOUNT,
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

  // Subscribe to account changes via WebSocket to avoid aggressive polling.
  // When the user account changes on-chain, coalesced `fetchUserPosition` will run.
  useEffect(() => {
    if (!wallet.publicKey || !program) return;

    const userAccountPDA = getUserAccountPDA(wallet.publicKey);

    try {
      const listenerId = connection.onAccountChange(
        userAccountPDA,
        () => {
          // Debounce rapid account-change events
          if (fetchDebounceRef.current) {
            clearTimeout(fetchDebounceRef.current as any);
          }
          fetchDebounceRef.current = window.setTimeout(() => {
            fetchUserPosition();
          }, 100) as unknown as number;
        },
        "confirmed"
      );

      return () => {
        try {
          connection.removeAccountChangeListener(listenerId);
        } catch (e) {
          // ignore
        }
        if (fetchDebounceRef.current) {
          clearTimeout(fetchDebounceRef.current as any);
          fetchDebounceRef.current = null;
        }
      };
    } catch (error) {
      // If subscriptions aren't supported by the RPC endpoint, silently continue
      return;
    }
  }, [
    wallet.publicKey,
    program,
    connection,
    getUserAccountPDA,
    fetchUserPosition,
  ]);

  return {
    // State
    loading,
    userPosition,
    poolStats: null, // Pool stats not implemented in current contract
    program,

    // Actions
    initializeArciumCompDefs,
    checkCompDefsInitialized,
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
