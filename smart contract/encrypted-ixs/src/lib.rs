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
        
        // Calculate max borrowable amount: collateral * 80 / 100
        let max_borrow = (input.collateral * 80) / 100;
        
        // Health check: is the total borrowed amount within safe limits?
        let is_healthy = input.borrow_amount <= max_borrow;
        
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
        
        // Calculate liquidation threshold: collateral * 80 / 100
        let liquidation_threshold = (input.collateral * 80) / 100;
        
        // If debt exceeds liquidation threshold, position needs liquidation
        let needs_liquidation = input.debt > liquidation_threshold;
        
        input_ctxt.owner.from_arcis(needs_liquidation)
    }
}
