

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// Types
export interface UserPosition {
  owner: PublicKey;
  collateralAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  interestRate: number;
  liquidationThreshold: number;
  lastUpdate: Date;
}

export interface PoolStats {
  totalLiquidity: number;
  totalBorrowed: number;
  utilizationRate: number;
  avgAPY: number;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function usePrivateLending() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [program, setProgram] = useState<Program | null>(null);


  // Program configuration
  const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111111'
  );
  
  const POOL_AUTHORITY = new PublicKey(
    process.env.NEXT_PUBLIC_POOL_AUTHORITY || '11111111111111111111111111111112'
  );
  
  const USDC_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  );

  // Initialize Anchor program
  useEffect(() => {
    if (!wallet.publicKey) return;

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Load your IDL here when available
      // const idl = await Program.fetchIdl(PROGRAM_ID, provider);
      // const program = new Program(idl, PROGRAM_ID, provider);
      // setProgram(program);
      
      console.log('Anchor provider initialized');
    } catch (error) {
      console.error('Error initializing program:', error);
    }
  }, [wallet.publicKey, connection]);

  // Get PDAs
  const getPositionPDA = useCallback(async (userPubkey: PublicKey) => {
    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), POOL_AUTHORITY.toBuffer()],
      PROGRAM_ID
    );

    const [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), userPubkey.toBuffer(), poolPDA.toBuffer()],
      PROGRAM_ID
    );

    return { poolPDA, positionPDA };
  }, [PROGRAM_ID, POOL_AUTHORITY]);

  // Fetch user position
  const fetchUserPosition = useCallback(async () => {
    if (!wallet.publicKey || !program) return;

    try {
      setLoading(true);
      const { positionPDA } = await getPositionPDA(wallet.publicKey);

      // Fetch position account
      const positionAccount = await program.account.userPosition.fetch(positionPDA);

      // Decrypt values here (with Arcium MPC in production)
      const position: UserPosition = {
        owner: positionAccount.owner,
        collateralAmount: 0, // Decrypt encrypted collateral
        borrowedAmount: 0,   // Decrypt encrypted borrowed
        healthFactor: 0,     // Calculate from encrypted values
        interestRate: 6.2,   // From pool
        liquidationThreshold: 75,
        lastUpdate: new Date(positionAccount.lastUpdate.toNumber() * 1000),
      };

      setUserPosition(position);
    } catch (error) {
      console.error('Error fetching position:', error);
      // Position doesn't exist yet - that's okay
      setUserPosition(null);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, program, getPositionPDA]);

  // Fetch pool statistics
  const fetchPoolStats = useCallback(async () => {
    if (!program) return;

    try {
      const [poolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), POOL_AUTHORITY.toBuffer()],
        PROGRAM_ID
      );

      const poolAccount = await program.account.lendingPool.fetch(poolPDA);

      const stats: PoolStats = {
        totalLiquidity: poolAccount.totalLiquidity.toNumber() / 1e6, // Assuming 6 decimals
        totalBorrowed: poolAccount.totalBorrowed.toNumber() / 1e6,
        utilizationRate: poolAccount.totalLiquidity.toNumber() > 0
          ? (poolAccount.totalBorrowed.toNumber() / poolAccount.totalLiquidity.toNumber()) * 100
          : 0,
        avgAPY: poolAccount.baseInterestRate / 100, // Convert basis points
      };

      setPoolStats(stats);
    } catch (error) {
      console.error('Error fetching pool stats:', error);
    }
  }, [program, PROGRAM_ID, POOL_AUTHORITY]);

  // Create position
  const createPosition = useCallback(async (): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !program) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      const { poolPDA, positionPDA } = await getPositionPDA(wallet.publicKey);

      // Mock MPC program ID for now
      const mpcProgramId = web3.Keypair.generate().publicKey;

      const tx = await program.methods
        .createPosition(mpcProgramId)
        .accounts({
          position: positionPDA,
          pool: poolPDA,
          user: wallet.publicKey,
          mpcProgram: mpcProgramId,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchUserPosition();
      
      return { success: true, signature: tx };
    } catch (error: any) {
      console.error('Error creating position:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet, program, getPositionPDA, fetchUserPosition]);

  // Deposit collateral
  const depositCollateral = useCallback(async (
    amount: number
  ): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !program) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      const { poolPDA, positionPDA } = await getPositionPDA(wallet.publicKey);

      // Get token accounts
      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        wallet.publicKey
      );

      const poolVault = await getAssociatedTokenAddress(
        USDC_MINT,
        poolPDA,
        true
      );

      // Convert amount to lamports (assuming 6 decimals for USDC)
      const amountLamports = new BN(amount * 1e6);

      // Mock encrypted amount (in production, encrypt with Arcium MPC)
      const encryptedAmount = Buffer.from('encrypted_data_here');

      const tx = await program.methods
        .depositCollateral(amountLamports, encryptedAmount)
        .accounts({
          position: positionPDA,
          pool: poolPDA,
          poolVault,
          userTokenAccount,
          user: wallet.publicKey,
          mpcProgram: web3.Keypair.generate().publicKey, // Mock MPC
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await fetchUserPosition();
      await fetchPoolStats();
      
      return { success: true, signature: tx };
    } catch (error: any) {
      console.error('Error depositing collateral:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet, program, getPositionPDA, fetchUserPosition, fetchPoolStats, USDC_MINT]);

  // Borrow funds
  const borrow = useCallback(async (
    amount: number
  ): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !program) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      const { poolPDA, positionPDA } = await getPositionPDA(wallet.publicKey);

      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        wallet.publicKey
      );

      const poolVault = await getAssociatedTokenAddress(
        USDC_MINT,
        poolPDA,
        true
      );

      const amountLamports = new BN(amount * 1e6);
      const encryptedBorrowData = Buffer.from('encrypted_borrow_data');

      const tx = await program.methods
        .borrow(amountLamports, encryptedBorrowData)
        .accounts({
          position: positionPDA,
          pool: poolPDA,
          poolVault,
          userTokenAccount,
          user: wallet.publicKey,
          mpcProgram: web3.Keypair.generate().publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await fetchUserPosition();
      await fetchPoolStats();
      
      return { success: true, signature: tx };
    } catch (error: any) {
      console.error('Error borrowing:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet, program, getPositionPDA, fetchUserPosition, fetchPoolStats, USDC_MINT]);

  // Repay loan
  const repay = useCallback(async (
    amount: number
  ): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !program) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      const { poolPDA, positionPDA } = await getPositionPDA(wallet.publicKey);

      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        wallet.publicKey
      );

      const poolVault = await getAssociatedTokenAddress(
        USDC_MINT,
        poolPDA,
        true
      );

      const amountLamports = new BN(amount * 1e6);
      const encryptedRepayData = Buffer.from('encrypted_repay_data');

      const tx = await program.methods
        .repay(amountLamports, encryptedRepayData)
        .accounts({
          position: positionPDA,
          pool: poolPDA,
          poolVault,
          userTokenAccount,
          user: wallet.publicKey,
          mpcProgram: web3.Keypair.generate().publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await fetchUserPosition();
      await fetchPoolStats();
      
      return { success: true, signature: tx };
    } catch (error: any) {
      console.error('Error repaying:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet, program, getPositionPDA, fetchUserPosition, fetchPoolStats, USDC_MINT]);

  // Withdraw collateral
  const withdrawCollateral = useCallback(async (
    amount: number
  ): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !program) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      const { poolPDA, positionPDA } = await getPositionPDA(wallet.publicKey);

      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        wallet.publicKey
      );

      const poolVault = await getAssociatedTokenAddress(
        USDC_MINT,
        poolPDA,
        true
      );

      const amountLamports = new BN(amount * 1e6);
      const encryptedWithdrawalData = Buffer.from('encrypted_withdrawal_data');

      const tx = await program.methods
        .withdrawCollateral(amountLamports, encryptedWithdrawalData)
        .accounts({
          position: positionPDA,
          pool: poolPDA,
          poolVault,
          userTokenAccount,
          user: wallet.publicKey,
          mpcProgram: web3.Keypair.generate().publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await fetchUserPosition();
      await fetchPoolStats();
      
      return { success: true, signature: tx };
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet, program, getPositionPDA, fetchUserPosition, fetchPoolStats, USDC_MINT]);

  // Request airdrop (for testing on devnet)
  const requestAirdrop = useCallback(async (): Promise<TransactionResult> => {
    if (!wallet.publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL
      );

      await connection.confirmTransaction(signature);
      
      return { success: true, signature };
    } catch (error: any) {
      console.error('Error requesting airdrop:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection]);

  // Fetch data on wallet connection
  useEffect(() => {
    if (wallet.publicKey && program) {
      fetchUserPosition();
      fetchPoolStats();
    }
  }, [wallet.publicKey, program, fetchUserPosition, fetchPoolStats]);

  return {
    // State
    loading,
    userPosition,
    poolStats,
    program,
    
    // Actions
    createPosition,
    depositCollateral,
    borrow,
    repay,
    withdrawCollateral,
    requestAirdrop,
    
    // Utils
    fetchUserPosition,
    fetchPoolStats,
  };
}

export default usePrivateLending;