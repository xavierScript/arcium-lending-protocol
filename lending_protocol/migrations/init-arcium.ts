/**
 * Initialize Arcium Computation Definitions
 * Using YOUR wallet as payer (Dhu3UEtRGE5...)
 */

import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";

// Arcium imports
import {
  getMXEAccAddress,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  buildFinalizeCompDefTx,
  getClusterAccAddress,
} from "@arcium-hq/client";

// ------------------------------
// IMPORTANT: YOUR WALLET HERE
// ------------------------------
const PAYER_KEYPAIR = JSON.parse(
  fs.readFileSync(
    path.join(process.env.HOME!, ".config/solana/id.json"), // your Solana wallet
    "utf8"
  )
);

const payerKeypair = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(PAYER_KEYPAIR)
);

console.log("✔ Using payer:", payerKeypair.publicKey.toString());
// Should print: Dhu3UEtRGE5iKzXJUiiFStJL4F63eW4nJMRd3dAg9WJK

// ----------------------------------------

const PROGRAM_ID = new PublicKey(
  "AmmiTwpa1ALMmF5R23kUBHe3oocVKcErRmvvAyGUuZMA"
);
const CLUSTER_OFFSET = 768109697; // devnet v0.3.0 (keys should be set)
// const CLUSTER_OFFSET = 3726127828; // devnet v0.3.0 (keys not set)
// const CLUSTER_OFFSET = 768109697; // devnet v0.4.0 (keys not set)

async function main() {
  // Setup connection
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const wallet = new anchor.Wallet(payerKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Load program IDL
  const idlPath = "./target/idl/lending_protocol.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new anchor.Program(idl, provider);

  console.log("Program ID:", PROGRAM_ID.toString());

  // Get Arcium accounts
  const mxeAccount = getMXEAccAddress(PROGRAM_ID);
  const arciumProgramId = getArciumProgAddress();
  const clusterAccount = getClusterAccAddress(CLUSTER_OFFSET);

  console.log("MXE Account:", mxeAccount.toString());
  console.log("Cluster Account:", clusterAccount.toString());

  // Fetch and display MXE account data
  try {
    const mxeAccountInfo = await connection.getAccountInfo(mxeAccount);
    if (mxeAccountInfo) {
      console.log("\n=== MXE Account Data ===");
      console.log("Data length:", mxeAccountInfo.data.length);
      console.log(
        "Raw bytes (first 100):",
        Array.from(mxeAccountInfo.data.slice(0, 100))
      );

      // Parse MXE account structure
      const utilityPubkeysOffset = 8 + 33 + 5; // discriminator + authority + cluster
      const isSet = mxeAccountInfo.data[utilityPubkeysOffset];
      console.log("\nUtility pubkeys set?:", isSet === 1 ? "YES" : "NO");

      if (isSet === 1) {
        const pubKeyStart = utilityPubkeysOffset + 1;
        const pubKeyEnd = pubKeyStart + 32;
        const x25519PubKey = mxeAccountInfo.data.slice(pubKeyStart, pubKeyEnd);
        console.log("x25519 public key:", Array.from(x25519PubKey));

        const isAllZeros = x25519PubKey.every((byte) => byte === 0);
        console.log(
          "Keys all zeros?:",
          isAllZeros ? "YES (DKG not complete)" : "NO (DKG complete!)"
        );
      }
    } else {
      console.log("⚠️ MXE account not found");
    }
  } catch (e) {
    console.error("Error fetching MXE account:", e);
  }

  // Get comp def offsets
  const healthCheckOffsetBytes = getCompDefAccOffset("check_health_factor");
  const liquidationOffsetBytes = getCompDefAccOffset("check_liquidation");

  // Derive comp def accounts
  const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");

  const [healthCheckCompDefAccount] = PublicKey.findProgramAddressSync(
    [baseSeed, PROGRAM_ID.toBuffer(), healthCheckOffsetBytes],
    arciumProgramId
  );

  const [liquidationCompDefAccount] = PublicKey.findProgramAddressSync(
    [baseSeed, PROGRAM_ID.toBuffer(), liquidationOffsetBytes],
    arciumProgramId
  );

  // --------------------------
  // HEALTH CHECK INIT
  // --------------------------
  console.log("\n=== Initializing Health Check Comp Def ===");
  console.log("Comp Def Account:", healthCheckCompDefAccount.toString());

  try {
    const info = await connection.getAccountInfo(healthCheckCompDefAccount);
    if (info) {
      console.log("✔ Already initialized");
    } else {
      const sig = await program.methods
        .initHealthCheckCompDef()
        .accounts({
          payer: payerKeypair.publicKey, // FIXED
          mxeAccount,
          compDefAccount: healthCheckCompDefAccount,
          arciumProgram: arciumProgramId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✔ Health check comp def initialized:", sig);

      // Finalize
      const finalizeTx = await buildFinalizeCompDefTx(
        provider,
        Buffer.from(healthCheckOffsetBytes).readUInt32LE(),
        PROGRAM_ID
      );

      const bh = await connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = bh.blockhash;
      finalizeTx.lastValidBlockHeight = bh.lastValidBlockHeight;

      await provider.sendAndConfirm(finalizeTx);
      console.log("✔ Health check finalized");
    }
  } catch (e) {
    console.error("❌ Health check failed:", e);
    throw e;
  }

  // --------------------------
  // LIQUIDATION INIT
  // --------------------------
  console.log("\n=== Initializing Liquidation Comp Def ===");
  console.log("Comp Def Account:", liquidationCompDefAccount.toString());

  try {
    const info = await connection.getAccountInfo(liquidationCompDefAccount);
    if (info) {
      console.log("✔ Already initialized");
    } else {
      const sig = await program.methods
        .initLiquidationCompDef()
        .accounts({
          payer: payerKeypair.publicKey, // FIXED
          mxeAccount,
          compDefAccount: liquidationCompDefAccount,
          arciumProgram: arciumProgramId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✔ Liquidation comp def initialized:", sig);

      // Finalize
      const finalizeTx = await buildFinalizeCompDefTx(
        provider,
        Buffer.from(liquidationOffsetBytes).readUInt32LE(),
        PROGRAM_ID
      );

      const bh = await connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = bh.blockhash;
      finalizeTx.lastValidBlockHeight = bh.lastValidBlockHeight;

      await provider.sendAndConfirm(finalizeTx);
      console.log("✔ Liquidation finalized");
    }
  } catch (e) {
    console.error("❌ Liquidation failed:", e);
    throw e;
  }

  console.log("\n✔ Arcium initialization complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
