use anchor_lang::prelude::*;
use crate::state::UserAccount;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct CloseUserAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump,
        close = owner,
        constraint = user_account.owner == owner.key(),
        constraint = user_account.borrowed_amount == 0 @ ErrorCode::OutstandingDebt,
        constraint = user_account.deposited_collateral == 0 @ ErrorCode::CollateralRemaining,
    )]
    pub user_account: Account<'info, UserAccount>,
}

pub fn close_user_account(_ctx: Context<CloseUserAccount>) -> Result<()> {
    msg!("User account closed successfully");
    Ok(())
}
