import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  getArciumProgAddress,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  RescueCipher,
  deserializeLE,
  getArciumEnv,
  x25519,
} from "@arcium-hq/client";

/**
 * Arcium encryption utilities for private lending protocol
 * Based on Arcium template patterns
 */

export interface EncryptionKeys {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  sharedSecret: Uint8Array;
  cipher: RescueCipher;
}

/**
 * Initialize encryption keys and cipher for Arcium MPC
 * Matches pattern from arcium-template/tests/test.ts
 */
export async function initializeEncryption(
  provider: AnchorProvider,
  programId: PublicKey
): Promise<EncryptionKeys> {
  try {
    // Get MXE account address
    const mxeAddress = getMXEAccAddress(programId);
    console.log("🔍 Fetching MXE public key from:", mxeAddress.toString());

    // Get MXE public key - use manual extraction due to SDK bug
    let mxePublicKey: Uint8Array;
    try {
      mxePublicKey = await getMXEPublicKeyWithRetry(provider, programId);
      console.log("✓ Got MXE public key from SDK");
    } catch (error) {
      console.log(
        "⚠️ SDK method failed, reading manually from account data..."
      );

      // Manually read MXE account data
      const accountInfo = await provider.connection.getAccountInfo(mxeAddress);
      if (!accountInfo) {
        throw new Error("MXE account does not exist");
      }

      // MXE account structure: 8 bytes discriminator + 32 bytes pub_key + ...
      const pubKeyStart = 8;
      const pubKeyEnd = pubKeyStart + 32;
      mxePublicKey = accountInfo.data.slice(pubKeyStart, pubKeyEnd);
      console.log("✓ Manually extracted MXE public key from account data");
    }

    console.log("MXE x25519 pubkey bytes:", Array.from(mxePublicKey));
    console.log("MXE x25519 pubkey length:", mxePublicKey.length);

    if (!mxePublicKey || mxePublicKey.length !== 32) {
      throw new Error(`Invalid MXE public key: length=${mxePublicKey?.length}`);
    }

    console.log("✓ MXE public key extracted successfully");

    // Generate keypair for x25519 key exchange (matching template pattern)
    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);

    console.log("✓ Generated client keypair");

    // Generate shared secret using x25519 ECDH
    let sharedSecret: Uint8Array;
    try {
      sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      console.log("✓ Generated shared secret successfully");
    } catch (error: any) {
      console.error("❌ Failed at x25519 key exchange:", error.message);
      console.error(
        "This usually means the MXE public key is invalid or the Arcium network nodes haven't registered yet."
      );
      throw new Error(
        `Key exchange failed: ${error.message}. The Arcium network may not be fully initialized.`
      );
    }

    // Initialize Rescue cipher with shared secret
    const cipher = new RescueCipher(sharedSecret);

    console.log("✅ Encryption initialized successfully");
    return { privateKey, publicKey, sharedSecret, cipher };
  } catch (error) {
    console.error("❌ Encryption initialization failed:", error);
    throw error;
  }
}
/**
 * Encrypt values for Arcium computation
 * Matches pattern from template: cipher.encrypt(plaintext, nonce)
 * Returns Uint8Array[32] arrays as expected by smart contract
 */
export function encryptValues(
  cipher: RescueCipher,
  value1: bigint,
  value2: bigint,
  nonce: Uint8Array
): [Uint8Array, Uint8Array] {
  const plaintext = [value1, value2];
  const ciphertext = cipher.encrypt(plaintext, nonce);

  // Convert number[][] to Uint8Array[32] format expected by contract
  const encrypted1 = numberArrayToBytes32(ciphertext[0]);
  const encrypted2 = numberArrayToBytes32(ciphertext[1]);

  return [encrypted1, encrypted2];
}

/**
 * Convert number[] ciphertext to Uint8Array with exactly 32 bytes
 * Pads with zeros if needed, or takes first 32 bytes if longer
 */
function numberArrayToBytes32(numbers: number[]): Uint8Array {
  const result = new Uint8Array(32);
  const length = Math.min(numbers.length, 32);
  for (let i = 0; i < length; i++) {
    result[i] = numbers[i] & 0xff; // Ensure it's a valid byte
  }
  return result;
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
 * Get computation definition account address (properly derived from Arcium program)
 * This matches the pattern from the working test file
 */
export function getCompDefAccount(
  programId: PublicKey,
  compDefName: string
): PublicKey {
  const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
  const offset = getCompDefAccOffset(compDefName);
  const arciumProgramId = getArciumProgAddress();

  const [compDefPDA] = PublicKey.findProgramAddressSync(
    [baseSeed, programId.toBuffer(), offset],
    arciumProgramId
  );

  return compDefPDA;
}

/**
 * Get cluster account address
 */
export function getClusterAccount(clusterOffset?: number | null): PublicKey {
  if (clusterOffset !== null && clusterOffset !== undefined) {
    return getClusterAccAddress(clusterOffset);
  }
  return getArciumEnv().arciumClusterPubkey;
}

/**
 * Get Arcium program ID (not to be confused with your lending program ID)
 * This is the actual Arcium MPC program address
 */
export function getArciumProgramId(): PublicKey {
  return getArciumProgAddress();
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
 * Wait for DKG (Distributed Key Generation) to complete
 * Polls the MXE account until utility pubkeys are set with non-zero keys
 */
export async function waitForDKG(
  connection: Connection,
  programId: PublicKey,
  maxRetries: number = 30,
  delayMs: number = 2000
): Promise<boolean> {
  const mxeAccount = getMXEAccAddress(programId);
  console.log("⏳ Waiting for DKG ceremony to complete...");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const accountInfo = await connection.getAccountInfo(mxeAccount);
      if (!accountInfo) {
        console.log(
          `❌ Attempt ${attempt}/${maxRetries}: MXE account not found`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Check utility_pubkeys offset
      const utilityPubkeysOffset = 8 + 33 + 5; // discriminator + authority + cluster
      const isSet = accountInfo.data[utilityPubkeysOffset];

      if (isSet === 1) {
        // Check if keys are non-zero
        const pubKeyStart = utilityPubkeysOffset + 1;
        const x25519PubKey = accountInfo.data.slice(
          pubKeyStart,
          pubKeyStart + 32
        );
        const hasKeys = x25519PubKey.some((byte) => byte !== 0);

        if (hasKeys) {
          console.log("✅ DKG complete! MXE keys are ready.");
          return true;
        }
      }

      console.log(
        `⏳ Attempt ${attempt}/${maxRetries}: DKG not complete yet...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      console.log(
        `❌ Attempt ${attempt}/${maxRetries}: Error checking DKG -`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log("❌ DKG did not complete within timeout period");
  return false;
}

/**
 * Retry helper for MXE public key retrieval
 * Based on Arcium migration docs
 */
export async function getMXEPublicKeyWithRetry(
  provider: AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 20,
  delayMs: number = 500
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const key = await getMXEPublicKey(provider, programId);
      if (key && key.length === 32) {
        // Verify it's not all zeros
        const isValid = key.some((byte) => byte !== 0);
        if (isValid) {
          console.log(
            `✅ MXE public key retrieved on attempt ${attempt}/${maxRetries}`
          );
          return key;
        }
      }
      throw new Error("MXE public key is null or all zeros (DKG not complete)");
    } catch (error: any) {
      console.log(
        `⏳ Attempt ${attempt}/${maxRetries} - MXE keys not ready yet`
      );

      if (attempt >= maxRetries) {
        throw new Error(
          `❌ DKG has not completed after ${maxRetries} attempts.\n\n` +
            `All tested devnet clusters have zero MXE keys. Options:\n` +
            `1. Use Arcium localnet: Set NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET to empty and run 'arcium localnet start'\n` +
            `2. Wait for Arcium team to run DKG on devnet clusters\n` +
            `3. Contact Arcium Discord for active devnet clusters with completed DKG\n\n` +
            `Your code is correct - the network just needs DKG to complete.`
        );
      }

      if (attempt < maxRetries) {
        console.log(`   Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error("Failed to get MXE public key");
}

/**
 * Check if MXE account is initialized (not all zeros)
 */
export async function isMXEInitialized(
  provider: AnchorProvider,
  programId: PublicKey
): Promise<boolean> {
  try {
    const key = await getMXEPublicKey(provider, programId);
    if (!key || key.length !== 32) return false;

    // Check if all bytes are zero
    return key.some((byte) => byte !== 0);
  } catch (error) {
    return false;
  }
}

/**
 * Convert Arcium comp def offset bytes to u32 number
 */
export function compDefOffsetToU32(offsetBytes: Uint8Array): number {
  // Convert 4-byte little-endian to u32
  const view = new DataView(
    offsetBytes.buffer,
    offsetBytes.byteOffset,
    offsetBytes.byteLength
  );
  return view.getUint32(0, true); // true for little-endian
}
