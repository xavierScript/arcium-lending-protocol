use arcium_anchor::prelude::*;

pub const COMP_DEF_OFFSET_CHECK_HEALTH: u32 = comp_def_offset("check_health_factor");
pub const COMP_DEF_OFFSET_LIQUIDATION: u32 = comp_def_offset("check_liquidation");

// Liquidation threshold: 80% LTV (loan-to-value)
pub const LIQUIDATION_THRESHOLD: u64 = 80;
pub const COLLATERAL_FACTOR: u64 = 100;
