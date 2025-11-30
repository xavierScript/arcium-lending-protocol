use anchor_lang::prelude::*;
use crate::{state::UserAccount, errors::ErrorCode, events::BorrowEvent};

#[derive(Accounts)]
pub struct FinalizeBorrow<'info> {
    // Relayer/keeper authorized to finalize borrows
    #[account(mut, signer)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user_account.owner.as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    /// CHECK: Vault account that holds deposited funds. Expected to be a PDA owned by the program.
    pub vault: AccountInfo<'info>,

    #[account(mut, constraint = recipient.key() == user_account.owner)]
    /// CHECK: Recipient must be the owner recorded in the `UserAccount`.
    pub recipient: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn finalize_borrow(ctx: Context<FinalizeBorrow>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;

    let amount = user_account.pending_borrow;
    require!(amount > 0, ErrorCode::NoPendingBorrow);

    // Ensure vault has enough lamports
    let vault_lamports = **ctx.accounts.vault.to_account_info().lamports.borrow();
    require!(vault_lamports >= amount, ErrorCode::InsufficientVaultFunds);

    // Transfer lamports from vault (PDA owned by program) to recipient by direct lamports mutation
    **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;

    // Update user accounting
    user_account.borrowed_amount = user_account.borrowed_amount.checked_add(amount).unwrap();
    user_account.pending_borrow = 0;

    emit!(BorrowEvent {
        user: ctx.accounts.recipient.key(),
        amount,
        total_borrowed: user_account.borrowed_amount,
    });

    Ok(())
}
