use anchor_lang::prelude::*;
use crate::{state::{UserAccount, VaultAccount}, errors::ErrorCode, events::WithdrawEvent};

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
    #[account(
        mut,
        seeds = [b"vault_v2"],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;

    // Disallow withdraws while there is any outstanding debt or pending borrow
    require!(user_account.pending_borrow == 0 && user_account.borrowed_amount == 0, ErrorCode::OutstandingDebt);

    // Ensure user has enough deposited collateral
    require!(user_account.deposited_collateral >= amount, ErrorCode::InsufficientCollateral);

    // Ensure vault has enough lamports (accounting for rent-exempt minimum)
    let vault_lamports = ctx.accounts.vault.to_account_info().lamports();
    let rent_exempt = Rent::get()?.minimum_balance(ctx.accounts.vault.to_account_info().data_len());
    let available = vault_lamports.checked_sub(rent_exempt).unwrap_or(0);
    require!(available >= amount, ErrorCode::InsufficientVaultFunds);

    // Transfer lamports from vault (program-owned PDA) back to the owner
    // We directly modify lamport balances because the vault is a PDA owned by this program
    // and contains data, so we can't use system_program::transfer
    ctx.accounts.vault.sub_lamports(amount)?;
    ctx.accounts.owner.add_lamports(amount)?;

    user_account.deposited_collateral = user_account.deposited_collateral.checked_sub(amount).unwrap();

    emit!(WithdrawEvent {
        user: ctx.accounts.owner.key(),
        amount,
        remaining_collateral: user_account.deposited_collateral,
    });

    Ok(())
}
