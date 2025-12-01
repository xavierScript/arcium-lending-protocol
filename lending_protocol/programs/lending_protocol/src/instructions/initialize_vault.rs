use anchor_lang::prelude::*;
use crate::state::VaultAccount;

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + VaultAccount::INIT_SPACE,
        seeds = [b"vault_v2"],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.bump = ctx.bumps.vault;
    
    msg!("Vault initialized at: {}", ctx.accounts.vault.key());
    Ok(())
}
