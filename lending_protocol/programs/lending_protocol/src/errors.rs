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
}
