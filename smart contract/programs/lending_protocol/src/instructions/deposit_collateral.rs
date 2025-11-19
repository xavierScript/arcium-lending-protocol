use anchor_lang::prelude::*;
use crate::{state::UserAccount, events::DepositEvent};

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
