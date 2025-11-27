use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use crate::ID;

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

pub fn init_health_check_comp_def(ctx: Context<InitHealthCheckCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;
    Ok(())
}

pub fn init_liquidation_comp_def(ctx: Context<InitLiquidationCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;
    Ok(())
}
