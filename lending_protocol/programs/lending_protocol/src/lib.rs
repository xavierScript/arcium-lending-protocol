use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

mod constants;
mod state;
mod events;
mod errors;
mod instructions;

pub use constants::*;
pub use state::*;
pub use events::*;
pub use errors::*;

// Re-export only account structs, not handler functions
pub use instructions::*;

// pub use instructions::InitHealthCheckCompDef;
// pub use instructions::InitLiquidationCompDef;
// pub use instructions::InitializeUser;
// pub use instructions::DepositCollateral;
// pub use instructions::Borrow;
// pub use instructions::CheckHealthFactorCallback;
// pub use instructions::Repay;
// pub use instructions::CheckLiquidation;
// pub use instructions::CheckLiquidationCallback;

declare_id!("5ZDZTQm8b86mojHbXfGtoY1gj3JpQGLeFyw3hqiDc1RT");

#[arcium_program]
pub mod lending_protocol {
    use super::*;

    pub fn init_health_check_comp_def(ctx: Context<InitHealthCheckCompDef>) -> Result<()> {
        instructions::init_health_check_comp_def(ctx)
    }

    pub fn init_liquidation_comp_def(ctx: Context<InitLiquidationCompDef>) -> Result<()> {
        instructions::init_liquidation_comp_def(ctx)
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        instructions::initialize_user(ctx)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        instructions::deposit_collateral(ctx, amount)
    }

    pub fn borrow(
        ctx: Context<Borrow>,
        computation_offset: u64,
        borrow_amount: u64,
        encrypted_collateral: [u8; 32],
        encrypted_borrow: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        instructions::borrow(
            ctx,
            computation_offset,
            borrow_amount,
            encrypted_collateral,
            encrypted_borrow,
            pub_key,
            nonce,
        )
    }

    #[arcium_callback(encrypted_ix = "check_health_factor")]
    pub fn check_health_factor_callback(
        ctx: Context<CheckHealthFactorCallback>,
        output: ComputationOutputs<CheckHealthFactorOutput>,
    ) -> Result<()> {
        instructions::check_health_factor_callback(ctx, output)
    }

    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        instructions::repay(ctx, amount)
    }

    pub fn check_liquidation(
        ctx: Context<CheckLiquidation>,
        computation_offset: u64,
        encrypted_collateral: [u8; 32],
        encrypted_debt: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        instructions::check_liquidation(
            ctx,
            computation_offset,
            encrypted_collateral,
            encrypted_debt,
            pub_key,
            nonce,
        )
    }

    #[arcium_callback(encrypted_ix = "check_liquidation")]
    pub fn check_liquidation_callback(
        ctx: Context<CheckLiquidationCallback>,
        output: ComputationOutputs<CheckLiquidationOutput>,
    ) -> Result<()> {
        instructions::check_liquidation_callback(ctx, output)
    }
}
