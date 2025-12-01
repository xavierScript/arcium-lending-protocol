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

    pub system_program: Program<'info, System>,
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

    // Transfer lamports from vault (PDA owned by program) to recipient using PDA seeds
    let vault_seeds = &[b"vault_v2".as_ref(), &[ctx.accounts.vault.bump]];
    let signer_seeds = &[&vault_seeds[..]];
    
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        },
        signer_seeds,
    );
    anchor_lang::system_program::transfer(cpi_context, amount)?;

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
