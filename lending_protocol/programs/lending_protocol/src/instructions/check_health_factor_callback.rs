use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use crate::{ID, errors::ErrorCode, events::HealthCheckEvent, constants::COMP_DEF_OFFSET_CHECK_HEALTH};
use crate::ID_CONST;
use arcium_client::idl::arcium::ID_CONST as OtherID_CONST;

#[callback_accounts("check_health_factor")]
#[derive(Accounts)]
pub struct CheckHealthFactorCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CHECK_HEALTH)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

pub fn check_health_factor_callback(
    _ctx: Context<CheckHealthFactorCallback>,
    output: ComputationOutputs<CheckHealthFactorOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(CheckHealthFactorOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    emit!(HealthCheckEvent {
        is_healthy_encrypted: result.ciphertexts[0],
        nonce: result.nonce.to_le_bytes(),
    });
    
    Ok(())
}
