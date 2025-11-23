import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { x25519 } from "@noble/curves/ed25519";
import {
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  RescueCipher,
  deserializeLE,
  getArciumEnv,
} from "@arcium-hq/client";

/**
 * Arcium encryption utilities for private lending protocol
 */

export interface EncryptionKeys {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  cipher: RescueCipher;
}

/**
 * Initialize encryption keys and cipher for Arcium MPC
 */
export async function initializeEncryption(
  provider: AnchorProvider,
  programId: PublicKey
): Promise<EncryptionKeys> {
  // Get MXE public key for shared secret generation
  const mxePublicKey = await getMXEPublicKey(provider, programId);
  if (!mxePublicKey) {
    throw new Error("Failed to get MXE public key");
  }

  // Generate ephemeral x25519 keypair
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);

  // Generate shared secret and initialize cipher
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);

  return { privateKey, publicKey, cipher };
}
/**
 * Encrypt two u64 values for Arcium computation
 */
export function encryptValues(
  cipher: RescueCipher,
  value1: bigint,
  value2: bigint,
  nonce: Uint8Array
): [Uint8Array, Uint8Array] {
  const plaintext = [value1, value2];
  const ciphertext = cipher.encrypt(plaintext, nonce);
  return [new Uint8Array(ciphertext[0]), new Uint8Array(ciphertext[1])];
}

/**
 * Generate random nonce for encryption
 */
export function generateNonce(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert nonce to u128 for program instruction
 */
export function nonceToU128(nonce: Uint8Array): bigint {
  return deserializeLE(nonce);
}

/**
 * Get Arcium account addresses for program interactions
 */
export function getArciumAccounts(
  programId: PublicKey,
  computationOffset: bigint
) {
  return {
    mxeAccount: getMXEAccAddress(programId),
    mempoolAccount: getMempoolAccAddress(programId),
    executingPool: getExecutingPoolAccAddress(programId),
    computationAccount: getComputationAccAddress(programId, computationOffset),
  };
}

/**
 * Get computation definition account address
 */
export function getCompDefAccount(
  programId: PublicKey,
  compDefName: string
): PublicKey {
  // Health check or liquidation check
  const offset = compDefName === "check_health_factor" ? 0 : 1;
  return getCompDefAccAddress(programId, offset);
}

/**
 * Get cluster account address
 */
export function getClusterAccount(clusterOffset?: number): PublicKey {
  if (clusterOffset !== null && clusterOffset !== undefined) {
    return getClusterAccAddress(clusterOffset);
  }
  return getArciumEnv().arciumClusterPubkey;
}

/**
 * Generate random computation offset
 */
export function generateComputationOffset(): bigint {
  const buffer = crypto.getRandomValues(new Uint8Array(8));
  return BigInt(
    "0x" +
      Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
  );
}

/**
 * Convert SOL amount to lamports
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * 1e9));
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / 1e9;
}

/**
 * Calculate health factor: (collateral * threshold) / borrowed
 */
export function calculateHealthFactor(
  collateral: bigint,
  borrowed: bigint,
  threshold: number = 80
): number {
  if (borrowed === BigInt(0)) return 999;
  const thresholdBps = BigInt(threshold);
  const hf = (collateral * thresholdBps) / (borrowed * BigInt(100));
  return Number(hf) / 100;
}

/**
 * Check if position is healthy
 */
export function isHealthy(
  collateral: bigint,
  borrowed: bigint,
  threshold: number = 80
): boolean {
  return calculateHealthFactor(collateral, borrowed, threshold) >= 1.0;
}

/**
 * Retry helper for MXE public key retrieval
 */
export async function getMXEPublicKeyWithRetry(
  provider: AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 5,
  delayMs: number = 1000
): Promise<Uint8Array> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const key = await getMXEPublicKey(provider, programId);
      if (key) return key;
      throw new Error("MXE public key is null");
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Failed to get MXE public key");
}
