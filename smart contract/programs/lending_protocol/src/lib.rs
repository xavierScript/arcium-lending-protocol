use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

const COMP_DEF_OFFSET_CHECK_HEALTH: u32 = comp_def_offset("check_health_factor");
const COMP_DEF_OFFSET_LIQUIDATION: u32 = comp_def_offset("check_liquidation");

// Liquidation threshold: 80% LTV (loan-to-value)
const LIQUIDATION_THRESHOLD: u64 = 80;
const COLLATERAL_FACTOR: u64 = 100;

declare_id!("5jCuVD2zuLBFyt5PsVEXMaAdMCtj4vM9zML1s3ZSQx7v");

#[arcium_program]
pub mod lending_protocol {
    use super::*;

    // Initialize computation definition for health factor checks
    pub fn init_health_check_comp_def(ctx: Context<InitHealthCheckCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, 0, None, None)?;
        Ok(())
    }

    // Initialize computation definition for liquidation checks
    pub fn init_liquidation_comp_def(ctx: Context<InitLiquidationCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, 0, None, None)?;
        Ok(())
    }

    // Initialize a user account
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.owner = ctx.accounts.owner.key();
        user_account.deposited_collateral = 0;
        user_account.borrowed_amount = 0;
        user_account.is_healthy = true;
        user_account.bump = ctx.bumps.user_account;
        Ok(())
    }

    // Deposit collateral (public amount)
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        
        // Transfer SOL from user to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        user_account.deposited_collateral = user_account.deposited_collateral.checked_add(amount).unwrap();

        emit!(DepositEvent {
            user: ctx.accounts.owner.key(),
            amount,
            total_collateral: user_account.deposited_collateral,
        });

        Ok(())
    }

    // Borrow funds (initiates encrypted health check)
    pub fn borrow(
        ctx: Context<Borrow>,
        computation_offset: u64,
        borrow_amount: u64,
        encrypted_collateral: [u8; 32],
        encrypted_borrow: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        
        require!(user_account.is_healthy, ErrorCode::UnhealthyPosition);
        
        // Store the pending borrow request
        user_account.pending_borrow = borrow_amount;
        
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        
        // Queue encrypted health factor computation
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(encrypted_collateral),
            Argument::EncryptedU64(encrypted_borrow),
        ];
        
        queue_computation(
            ctx.accounts, 
            computation_offset, 
            args, 
            None, 
            vec![CheckHealthFactorCallback::callback_ix(&[])], 
            1
        )?;
        
        Ok(())
    }

    // Callback after health check computation
    #[arcium_callback(encrypted_ix = "check_health_factor")]
    pub fn check_health_factor_callback(
        ctx: Context<CheckHealthFactorCallback>,
        output: ComputationOutputs<CheckHealthFactorOutput>,
    ) -> Result<()> {
        let result = match output {
            ComputationOutputs::Success(CheckHealthFactorOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(HealthCheckEvent {
            is_healthy_encrypted: result.ciphertexts[0],
            nonce: result.nonce.to_le_bytes(),
        });
        
        Ok(())
    }

    // Repay borrowed funds
    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        
        require!(user_account.borrowed_amount >= amount, ErrorCode::RepayTooMuch);
        
        // Transfer SOL from user to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        user_account.borrowed_amount = user_account.borrowed_amount.checked_sub(amount).unwrap();

        emit!(RepayEvent {
            user: ctx.accounts.owner.key(),
            amount,
            remaining_debt: user_account.borrowed_amount,
        });

        Ok(())
    }

    // Check if liquidation is needed (encrypted)
    pub fn check_liquidation(
        ctx: Context<CheckLiquidation>,
        computation_offset: u64,
        encrypted_collateral: [u8; 32],
        encrypted_debt: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU64(encrypted_collateral),
            Argument::EncryptedU64(encrypted_debt),
        ];
        
        queue_computation(
            ctx.accounts, 
            computation_offset, 
            args, 
            None, 
            vec![CheckLiquidationCallback::callback_ix(&[])], 
            1
        )?;
        
        Ok(())
    }

    // Callback after liquidation check
    #[arcium_callback(encrypted_ix = "check_liquidation")]
    pub fn check_liquidation_callback(
        ctx: Context<CheckLiquidationCallback>,
        output: ComputationOutputs<CheckLiquidationOutput>,
    ) -> Result<()> {
        let result = match output {
            ComputationOutputs::Success(CheckLiquidationOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(LiquidationCheckEvent {
            needs_liquidation_encrypted: result.ciphertexts[0],
            nonce: result.nonce.to_le_bytes(),
        });
        
        Ok(())
    }
}

// Account Structs

#[init_computation_definition_accounts("check_health_factor", payer)]
#[derive(Accounts)]
pub struct InitHealthCheckCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("check_liquidation", payer)]
#[derive(Accounts)]
pub struct InitLiquidationCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", owner.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    /// CHECK: This is the vault account that holds deposited funds
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[queue_computation_accounts("check_health_factor", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Borrow<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user", payer.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CHECK_HEALTH)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("check_health_factor")]
#[derive(Accounts)]
pub struct CheckHealthFactorCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CHECK_HEALTH)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    /// CHECK: This is the vault account that holds deposited funds
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[queue_computation_accounts("check_liquidation", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct CheckLiquidation<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LIQUIDATION)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("check_liquidation")]
#[derive(Accounts)]
pub struct CheckLiquidationCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LIQUIDATION)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

// Data Accounts

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub deposited_collateral: u64,
    pub borrowed_amount: u64,
    pub pending_borrow: u64,
    pub is_healthy: bool,
    pub bump: u8,
}

// Events

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_collateral: u64,
}

#[event]
pub struct HealthCheckEvent {
    pub is_healthy_encrypted: [u8; 32],
    pub nonce: [u8; 16],
}

#[event]
pub struct RepayEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub remaining_debt: u64,
}

#[event]
pub struct LiquidationCheckEvent {
    pub needs_liquidation_encrypted: [u8; 32],
    pub nonce: [u8; 16],
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
    #[msg("User position is unhealthy")]
    UnhealthyPosition,
    #[msg("Repay amount exceeds borrowed amount")]
    RepayTooMuch,
}
