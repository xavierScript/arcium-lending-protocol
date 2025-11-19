use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use crate::{ID, errors::ErrorCode, events::LiquidationCheckEvent, constants::COMP_DEF_OFFSET_LIQUIDATION};
use crate::ID_CONST;
use arcium_client::idl::arcium::ID_CONST as OtherID_CONST;

#[callback_accounts("check_liquidation")]
#[derive(Accounts)]
pub struct CheckLiquidationCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LIQUIDATION)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

pub fn check_liquidation_callback(
    _ctx: Context<CheckLiquidationCallback>,
    output: ComputationOutputs<CheckLiquidationOutput>,
) -> Result<()> {
    let result = match output {
        ComputationOutputs::Success(CheckLiquidationOutput { field_0 }) => field_0,
        _ => return Err(ErrorCode::AbortedComputation.into()),
    };

    emit!(LiquidationCheckEvent {
        needs_liquidation_encrypted: result.ciphertexts[0],
        nonce: result.nonce.to_le_bytes(),
    });
    
    Ok(())
}
