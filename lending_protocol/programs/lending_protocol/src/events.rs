use anchor_lang::prelude::*;

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_collateral: u64,
}

#[event]
pub struct HealthCheckEvent {
    pub is_healthy_encrypted: [u8; 32],
    pub nonce: [u8; 16],
}

#[event]
pub struct RepayEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub remaining_debt: u64,
}

#[event]
pub struct LiquidationCheckEvent {
    pub needs_liquidation_encrypted: [u8; 32],
    pub nonce: [u8; 16],
}
