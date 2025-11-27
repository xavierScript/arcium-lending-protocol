use anchor_lang::prelude::*;
use crate::state::UserAccount;

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

pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.owner = ctx.accounts.owner.key();
    user_account.deposited_collateral = 0;
    user_account.borrowed_amount = 0;
    user_account.is_healthy = true;
    user_account.bump = ctx.bumps.user_account;
    Ok(())
}
