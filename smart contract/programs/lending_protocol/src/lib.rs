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
            vec![HealthCheckCallback::callback_ix(&[])], 
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
            vec![LiquidationCallback::callback_ix(&[])], 
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
