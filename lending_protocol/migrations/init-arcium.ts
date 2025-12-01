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
  "CLLcUbHn9WtbyShMUvCHJeJR2vEXc8cmXQPYsjoq8RaD"
);
const CLUSTER_OFFSET = 1078779259; // devnet

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
