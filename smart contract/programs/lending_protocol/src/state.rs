use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub deposited_collateral: u64,
    pub borrowed_amount: u64,
    pub pending_borrow: u64,
    pub is_healthy: bool,
    pub bump: u8,
}
