import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { LendingProtocol } from "../target/types/lending_protocol";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  uploadCircuit,
  buildFinalizeCompDefTx,
  RescueCipher,
  deserializeLE,
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  x25519,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

// Cluster configuration
const CLUSTER_OFFSET: number | null = null;

function getClusterAccount(): PublicKey {
  if (CLUSTER_OFFSET !== null) {
    return getClusterAccAddress(CLUSTER_OFFSET);
  } else {
    return getArciumEnv().arciumClusterPubkey;
  }
}

// Helper to read keypair from JSON
function readKpJson(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

describe("Private Lending Protocol", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.LendingProtocol as Program<LendingProtocol>;
  const provider = anchor.getProvider();

  type Event = anchor.IdlEvents<(typeof program)["idl"]>;
  const awaitEvent = async <E extends keyof Event>(
    eventName: E
  ): Promise<Event[E]> => {
    let listenerId: number;
    const event = await new Promise<Event[E]>((res) => {
      listenerId = program.addEventListener(eventName, (event) => {
        res(event);
      });
    });
    await program.removeEventListener(listenerId);
    return event;
  };

  const clusterAccount = getClusterAccount();
  let owner: Keypair;
  let userAccountPda: PublicKey;
  let vaultPda: PublicKey;
  let cipher: RescueCipher;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

  before(async () => {
    owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    // Derive PDAs
    [userAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), owner.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    console.log("User PDA:", userAccountPda.toString());
    console.log("Vault PDA:", vaultPda.toString());
  });

  it("Initialize computation definitions", async () => {
    console.log("\n🔧 Initializing health check computation definition...");
    const healthCheckSig = await initHealthCheckCompDef(
      program,
      owner,
      false,
      false
    );
    console.log("✅ Health check comp def initialized:", healthCheckSig);

    console.log("\n🔧 Initializing liquidation computation definition...");
    const liquidationSig = await initLiquidationCompDef(
      program,
      owner,
      false,
      false
    );
    console.log("✅ Liquidation comp def initialized:", liquidationSig);

    // Setup encryption
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );
    console.log("\n🔑 MXE x25519 public key obtained");

    privateKey = x25519.utils.randomSecretKey();
    publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    cipher = new RescueCipher(sharedSecret);
    console.log("✅ Encryption cipher initialized");
  });

  it("Initialize user account", async () => {
    console.log("\n👤 Initializing user account...");

    const sig = await program.methods
      .initializeUser()
      .accounts({
        owner: owner.publicKey,
        userAccount: userAccountPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    console.log("✅ User account initialized:", sig);

    const userAccount = await program.account.userAccount.fetch(userAccountPda);
    expect(userAccount.owner.toString()).to.equal(owner.publicKey.toString());
    expect(userAccount.depositedCollateral.toNumber()).to.equal(0);
    expect(userAccount.borrowedAmount.toNumber()).to.equal(0);
  });

  it("Deposit collateral", async () => {
    console.log("\n💰 Depositing collateral...");

    const depositAmount = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL

    const sig = await program.methods
      .depositCollateral(depositAmount)
      .accounts({
        owner: owner.publicKey,
        userAccount: userAccountPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    console.log("✅ Deposited 1 SOL as collateral:", sig);

    const userAccount = await program.account.userAccount.fetch(userAccountPda);
    expect(userAccount.depositedCollateral.toString()).to.equal(
      depositAmount.toString()
    );
    console.log(
      "📊 Total collateral:",
      userAccount.depositedCollateral.toNumber() / LAMPORTS_PER_SOL,
      "SOL"
    );
  });

  it("Borrow funds with encrypted health check", async () => {
    console.log("\n💳 Attempting to borrow 0.5 SOL...");

    const borrowAmount = new BN(0.5 * LAMPORTS_PER_SOL);
    const collateral = BigInt(1 * LAMPORTS_PER_SOL); // 1 SOL collateral
    const totalBorrow = BigInt(0.5 * LAMPORTS_PER_SOL); // Requesting 0.5 SOL

    const nonce = randomBytes(16);
    const plaintext = [collateral, totalBorrow];
    const ciphertext = cipher.encrypt(plaintext, nonce);

    const healthEventPromise = awaitEvent("healthCheckEvent");
    const computationOffset = new BN(randomBytes(8), "hex");

    const sig = await program.methods
      .borrow(
        computationOffset,
        borrowAmount,
        Array.from(ciphertext[0]),
        Array.from(ciphertext[1]),
        Array.from(publicKey),
        new BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        payer: owner.publicKey,
        userAccount: userAccountPda,
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("check_health_factor")).readUInt32LE()
        ),
      })
      .signers([owner])
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("✅ Borrow request queued:", sig);

    const finalizeSig = await awaitComputationFinalization(
      provider as anchor.AnchorProvider,
      computationOffset,
      program.programId,
      "confirmed"
    );
    console.log("✅ Health check computation finalized:", finalizeSig);

    const healthEvent = await healthEventPromise;
    console.log("📊 Encrypted health check result received");

    // Note: The result is encrypted - in production, only authorized parties can decrypt
    console.log("🔒 Health status remains private (encrypted)");

    // Capture balances before finalization
    const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
    const ownerBalanceBefore = await provider.connection.getBalance(
      owner.publicKey
    );

    console.log("🔁 Finalizing borrow on-chain (relayer/authority call)...");
    const finalizeSig = await program.methods
      .finalizeBorrow()
      .accounts({
        authority: owner.publicKey,
        userAccount: userAccountPda,
        vault: vaultPda,
        recipient: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    console.log("✅ Borrow finalized (disbursed):", finalizeSig);

    // Check balances and user account state after finalization
    const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
    const ownerBalanceAfter = await provider.connection.getBalance(
      owner.publicKey
    );

    const userAccountAfter = await program.account.userAccount.fetch(
      userAccountPda
    );

    expect(userAccountAfter.pendingBorrow.toNumber()).to.equal(0);
    expect(userAccountAfter.borrowedAmount.toString()).to.equal(
      borrowAmount.toString()
    );

    console.log(
      "📊 User borrowed amount on-chain:",
      userAccountAfter.borrowedAmount.toNumber() / LAMPORTS_PER_SOL,
      "SOL"
    );

    // Vault should have decreased by the borrow amount, owner should have increased by borrow amount
    expect(vaultBalanceAfter).to.equal(
      vaultBalanceBefore - borrowAmount.toNumber()
    );
    expect(ownerBalanceAfter).to.equal(
      ownerBalanceBefore + borrowAmount.toNumber()
    );
  });

  it("Repay borrowed funds", async () => {
    console.log("\n💵 Repaying loan...");

    const repayAmount = new BN(0.2 * LAMPORTS_PER_SOL);

    const sig = await program.methods
      .repay(repayAmount)
      .accounts({
        owner: owner.publicKey,
        userAccount: userAccountPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    console.log("✅ Repaid 0.2 SOL:", sig);

    const userAccount = await program.account.userAccount.fetch(userAccountPda);
    console.log(
      "📊 Remaining debt:",
      userAccount.borrowedAmount.toNumber() / LAMPORTS_PER_SOL,
      "SOL"
    );
  });

  it("Withdraw collateral (conservative)", async () => {
    console.log(
      "\n🏦 Withdrawing collateral (requires no outstanding debt)..."
    );

    // Fetch current state
    let userAccount = await program.account.userAccount.fetch(userAccountPda);
    const depositedAmount = new BN(userAccount.depositedCollateral.toString());
    const borrowedAmount = new BN(userAccount.borrowedAmount.toString());

    // If there's remaining borrowed amount, repay it first so withdraw can proceed
    if (borrowedAmount.gt(new BN(0))) {
      console.log(
        "🔁 Repaying remaining debt before withdraw:",
        borrowedAmount.toNumber() / LAMPORTS_PER_SOL,
        "SOL"
      );
      const repaySig = await program.methods
        .repay(borrowedAmount)
        .accounts({
          owner: owner.publicKey,
          userAccount: userAccountPda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" });
      console.log("✅ Remaining debt repaid:", repaySig);
      userAccount = await program.account.userAccount.fetch(userAccountPda);
    }

    // Sanity: ensure no pending borrow and no outstanding debt
    expect(userAccount.pendingBorrow.toNumber()).to.equal(0);
    expect(userAccount.borrowedAmount.toNumber()).to.equal(0);

    // Capture balances before withdraw
    const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
    const ownerBalanceBefore = await provider.connection.getBalance(
      owner.publicKey
    );

    // Withdraw full deposited collateral
    const withdrawSig = await program.methods
      .withdraw(depositedAmount)
      .accounts({
        owner: owner.publicKey,
        userAccount: userAccountPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    console.log("✅ Withdraw executed:", withdrawSig);

    // Fetch post-withdraw state and balances
    const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
    const ownerBalanceAfter = await provider.connection.getBalance(
      owner.publicKey
    );
    const userAccountAfter = await program.account.userAccount.fetch(
      userAccountPda
    );

    expect(userAccountAfter.depositedCollateral.toNumber()).to.equal(0);
    expect(vaultBalanceAfter).to.equal(
      vaultBalanceBefore - depositedAmount.toNumber()
    );
    expect(ownerBalanceAfter).to.equal(
      ownerBalanceBefore + depositedAmount.toNumber()
    );
    console.log("📊 Withdraw complete — collateral returned to owner");
  });

  // Helper functions
  async function initHealthCheckCompDef(
    program: Program<LendingProtocol>,
    owner: Keypair,
    uploadRawCircuit: boolean,
    offchainSource: boolean
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("check_health_factor");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initHealthCheckCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    if (uploadRawCircuit) {
      const rawCircuit = fs.readFileSync("build/check_health_factor.arcis");
      await uploadCircuit(
        provider as anchor.AnchorProvider,
        "check_health_factor",
        program.programId,
        rawCircuit,
        true
      );
    } else if (!offchainSource) {
      const finalizeTx = await buildFinalizeCompDefTx(
        provider as anchor.AnchorProvider,
        Buffer.from(offset).readUInt32LE(),
        program.programId
      );
      const latestBlockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = latestBlockhash.blockhash;
      finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
      finalizeTx.sign(owner);
      await provider.sendAndConfirm(finalizeTx);
    }
    return sig;
  }

  async function initLiquidationCompDef(
    program: Program<LendingProtocol>,
    owner: Keypair,
    uploadRawCircuit: boolean,
    offchainSource: boolean
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("check_liquidation");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const sig = await program.methods
      .initLiquidationCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({ commitment: "confirmed" });

    if (uploadRawCircuit) {
      const rawCircuit = fs.readFileSync("build/check_liquidation.arcis");
      await uploadCircuit(
        provider as anchor.AnchorProvider,
        "check_liquidation",
        program.programId,
        rawCircuit,
        true
      );
    } else if (!offchainSource) {
      const finalizeTx = await buildFinalizeCompDefTx(
        provider as anchor.AnchorProvider,
        Buffer.from(offset).readUInt32LE(),
        program.programId
      );
      const latestBlockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = latestBlockhash.blockhash;
      finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
      finalizeTx.sign(owner);
      await provider.sendAndConfirm(finalizeTx);
    }
    return sig;
  }
  async function getMXEPublicKeyWithRetry(
    provider: anchor.AnchorProvider,
    programId: PublicKey,
    maxRetries: number = 20,
    retryDelayMs: number = 500
  ): Promise<Uint8Array> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mxePublicKey = await getMXEPublicKey(provider, programId);
        if (mxePublicKey) {
          return mxePublicKey;
        }
      } catch (error) {
        console.log(
          `Attempt ${attempt} failed to fetch MXE public key:`,
          error
        );
      }

      if (attempt < maxRetries) {
        console.log(
          `Retrying in ${retryDelayMs}ms... (attempt ${attempt}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
    throw new Error(
      `Failed to fetch MXE public key after ${maxRetries} attempts`
    );
  }
});
