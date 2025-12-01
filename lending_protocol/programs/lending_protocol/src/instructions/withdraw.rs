use anchor_lang::prelude::*;
use crate::{state::UserAccount, errors::ErrorCode, events::WithdrawEvent};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    /// CHECK: The program vault that holds deposited funds
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;

    // Ensure the vault is owned by this program (prevent vault substitution)
    require!(ctx.accounts.vault.owner == ctx.program_id, ErrorCode::VaultNotOwned);

    // Disallow withdraws while there is any outstanding debt or pending borrow
    require!(user_account.pending_borrow == 0 && user_account.borrowed_amount == 0, ErrorCode::OutstandingDebt);

    // Ensure user has enough deposited collateral
    require!(user_account.deposited_collateral >= amount, ErrorCode::InsufficientCollateral);

    // Ensure vault has enough lamports
    let vault_lamports = **ctx.accounts.vault.to_account_info().lamports.borrow();
    require!(vault_lamports >= amount, ErrorCode::InsufficientVaultFunds);

    // Transfer lamports from vault (program-owned PDA) back to the owner
    **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += amount;

    user_account.deposited_collateral = user_account.deposited_collateral.checked_sub(amount).unwrap();

    emit!(WithdrawEvent {
        user: ctx.accounts.owner.key(),
        amount,
        remaining_collateral: user_account.deposited_collateral,
    });

    Ok(())
}
