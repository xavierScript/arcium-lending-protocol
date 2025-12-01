use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
    #[msg("User position is unhealthy")]
    UnhealthyPosition,
    #[msg("Repay amount exceeds borrowed amount")]
    RepayTooMuch,
    #[msg("Invalid repay amount")]
    InvalidAmount,
    #[msg("Vault account is not owned by this program")]
    VaultNotOwned,
    #[msg("No pending borrow to finalize")]
    NoPendingBorrow,
    #[msg("Vault has insufficient funds")]
    InsufficientVaultFunds,
    #[msg("Position has outstanding debt or pending borrow")]
    OutstandingDebt,
    #[msg("Insufficient collateral to withdraw the requested amount")]
    InsufficientCollateral,
    #[msg("Cannot close account with remaining collateral")]
    CollateralRemaining,
}
