use anchor_lang::prelude::*;
use crate::{state::{UserAccount, VaultAccount}, errors::ErrorCode, events::BorrowEvent};

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

    #[account(
        mut,
        seeds = [b"vault_v2"],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut, constraint = recipient.key() == user_account.owner)]
    /// CHECK: Recipient must be the owner recorded in the `UserAccount`.
    pub recipient: AccountInfo<'info>,
}

pub fn finalize_borrow(ctx: Context<FinalizeBorrow>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;

    let amount = user_account.pending_borrow;
    require!(amount > 0, ErrorCode::NoPendingBorrow);

    // Ensure vault has enough lamports (accounting for rent-exempt minimum)
    let vault_lamports = ctx.accounts.vault.to_account_info().lamports();
    let rent_exempt = Rent::get()?.minimum_balance(ctx.accounts.vault.to_account_info().data_len());
    let available = vault_lamports.checked_sub(rent_exempt).unwrap_or(0);
    require!(available >= amount, ErrorCode::InsufficientVaultFunds);

    // Transfer lamports from vault (program-owned PDA) to recipient
    // We directly modify lamport balances because the vault is a PDA owned by this program
    // and contains data, so we can't use system_program::transfer
    ctx.accounts.vault.sub_lamports(amount)?;
    ctx.accounts.recipient.add_lamports(amount)?;

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
