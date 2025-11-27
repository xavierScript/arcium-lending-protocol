use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use crate::{ID, errors::ErrorCode, constants::COMP_DEF_OFFSET_LIQUIDATION};
use crate::SignerAccount;
use crate::ID_CONST;
use arcium_client::idl::arcium::ID_CONST as OtherID_CONST;

#[queue_computation_accounts("check_liquidation", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct CheckLiquidation<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_LIQUIDATION)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

pub fn check_liquidation(
    ctx: Context<CheckLiquidation>,
    computation_offset: u64,
    encrypted_collateral: [u8; 32],
    encrypted_debt: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    use crate::instructions::CheckLiquidationCallback;
    
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
    
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU64(encrypted_collateral),
        Argument::EncryptedU64(encrypted_debt),
    ];
    
    queue_computation(
        ctx.accounts, 
        computation_offset, 
        args, 
        None, 
        vec![CheckLiquidationCallback::callback_ix(&[])], 
        1
    )?;
    
    Ok(())
}
