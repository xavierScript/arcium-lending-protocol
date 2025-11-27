use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    // Health Factor Check
    // Checks if collateral * LTV >= borrowed amount
    // Returns true if healthy (can borrow), false if unhealthy
    pub struct HealthCheckInput {
        collateral: u64,
        borrow_amount: u64,
    }

    #[instruction]
    pub fn check_health_factor(input_ctxt: Enc<Shared, HealthCheckInput>) -> Enc<Shared, bool> {
        let input = input_ctxt.to_arcis();
        
        // Health check: borrow_amount * 100 <= collateral * 80
        // Rearranged to avoid division and reduce intermediate calculations
        let is_healthy = (input.borrow_amount * 100) <= (input.collateral * 80);
        
        input_ctxt.owner.from_arcis(is_healthy)
    }

    // Liquidation Check
    // Checks if a position should be liquidated
    // Returns true if needs liquidation (unhealthy), false if safe
    pub struct LiquidationInput {
        collateral: u64,
        debt: u64,
    }

    #[instruction]
    pub fn check_liquidation(input_ctxt: Enc<Shared, LiquidationInput>) -> Enc<Shared, bool> {
        let input = input_ctxt.to_arcis();
        
        // Liquidation check: debt * 100 > collateral * 80
        // Rearranged to avoid division
        let needs_liquidation = (input.debt * 100) > (input.collateral * 80);
        
        input_ctxt.owner.from_arcis(needs_liquidation)
    }
}
