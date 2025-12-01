use anchor_lang::prelude::*;
use crate::{state::UserAccount, events::RepayEvent, errors::ErrorCode};

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
    #[account(
        mut,
        seeds = [b"vault_v2"],
        bump = vault.bump
    )]
    pub vault: Account<'info, crate::state::VaultAccount>,
    pub system_program: Program<'info, System>,
}

pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    // Prevent zero-value repay
    require!(amount > 0, ErrorCode::InvalidAmount);

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
