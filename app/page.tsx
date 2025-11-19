"use client";


import React, { useState, useEffect } from 'react';
import { Wallet, Shield, TrendingUp, AlertCircle, Loader, Lock, Eye, EyeOff, DollarSign, Percent, Clock, CheckCircle } from 'lucide-react';

const ArciumLendingProtocol = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrivateInfo, setShowPrivateInfo] = useState(false);
  
  // User state (encrypted in real implementation)
  const [userPosition, setUserPosition] = useState({
    collateralAmount: 0,
    borrowedAmount: 0,
    healthFactor: 0,
    interestRate: 0,
    liquidationThreshold: 75,
  });

  // Pool state
  const [poolStats, setPoolStats] = useState({
    totalLiquidity: 1250000,
    totalBorrowed: 850000,
    utilizationRate: 68,
    avgAPY: 5.8,
  });

  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  // Simulate wallet connection
  const connectWallet = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setWalletConnected(true);
    setIsProcessing(false);
    
    // Simulate loading encrypted user data
    setUserPosition({
      collateralAmount: 5000,
      borrowedAmount: 3200,
      healthFactor: 1.56,
      interestRate: 6.2,
      liquidationThreshold: 75,
    });
  };

  // Calculate health factor
  const calculateHealthFactor = (collateral, borrowed, threshold = 75) => {
    if (borrowed === 0) return 999;
    return (collateral * (threshold / 100)) / borrowed;
  };

  // Deposit collateral
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newCollateral = userPosition.collateralAmount + parseFloat(depositAmount);
    const newHealthFactor = calculateHealthFactor(newCollateral, userPosition.borrowedAmount);
    
    setUserPosition({
      ...userPosition,
      collateralAmount: newCollateral,
      healthFactor: newHealthFactor,
    });
    
    setDepositAmount('');
    setIsProcessing(false);
  };

  // Borrow funds
  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) return;
    
    const maxBorrow = (userPosition.collateralAmount * 0.75) - userPosition.borrowedAmount;
    if (parseFloat(borrowAmount) > maxBorrow) {
      alert('Borrow amount exceeds maximum allowed based on collateral');
      return;
    }
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBorrowed = userPosition.borrowedAmount + parseFloat(borrowAmount);
    const newHealthFactor = calculateHealthFactor(userPosition.collateralAmount, newBorrowed);
    
    setUserPosition({
      ...userPosition,
      borrowedAmount: newBorrowed,
      healthFactor: newHealthFactor,
    });
    
    setPoolStats({
      ...poolStats,
      totalBorrowed: poolStats.totalBorrowed + parseFloat(borrowAmount),
      utilizationRate: ((poolStats.totalBorrowed + parseFloat(borrowAmount)) / poolStats.totalLiquidity) * 100,
    });
    
    setBorrowAmount('');
    setIsProcessing(false);
  };

  // Repay loan
  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const repayValue = Math.min(parseFloat(repayAmount), userPosition.borrowedAmount);
    const newBorrowed = userPosition.borrowedAmount - repayValue;
    const newHealthFactor = calculateHealthFactor(userPosition.collateralAmount, newBorrowed);
    
    setUserPosition({
      ...userPosition,
      borrowedAmount: newBorrowed,
      healthFactor: newHealthFactor,
    });
    
    setRepayAmount('');
    setIsProcessing(false);
  };

  // Withdraw collateral
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    const newCollateral = userPosition.collateralAmount - parseFloat(withdrawAmount);
    const newHealthFactor = calculateHealthFactor(newCollateral, userPosition.borrowedAmount);
    
    if (newHealthFactor < 1.2 && userPosition.borrowedAmount > 0) {
      alert('Cannot withdraw: would result in unhealthy position');
      return;
    }
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setUserPosition({
      ...userPosition,
      collateralAmount: newCollateral,
      healthFactor: newHealthFactor,
    });
    
    setWithdrawAmount('');
    setIsProcessing(false);
  };

  const getHealthFactorColor = (hf) => {
    if (hf >= 1.5) return 'text-green-500';
    if (hf >= 1.2) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthFactorBg = (hf) => {
    if (hf >= 1.5) return 'bg-green-500';
    if (hf >= 1.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Arcium Private Lending</h1>
              <p className="text-sm text-gray-300">Confidential DeFi Protocol</p>
            </div>
          </div>
          
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-green-600 px-6 py-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>Connected</span>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-purple-800/30 border border-purple-500/50 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <Lock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-300 mb-1">End-to-End Privacy via Arcium MPC</h3>
            <p className="text-sm text-gray-300">
              Your collateral amounts, borrow positions, and health factors are computed in encrypted state using Multi-Party Computation. 
              No single party can see your private financial data.
            </p>
          </div>
        </div>

        {!walletConnected ? (
          <div className="bg-gray-800/50 rounded-lg p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your Solana wallet to access private lending features
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="space-y-6">
              {/* Protocol Stats */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                  Protocol Stats
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Liquidity</div>
                    <div className="text-2xl font-bold">${poolStats.totalLiquidity.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
                    <div className="text-2xl font-bold">${poolStats.totalBorrowed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Utilization Rate</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${poolStats.utilizationRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{poolStats.utilizationRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Average APY</div>
                    <div className="text-2xl font-bold text-green-400">{poolStats.avgAPY}%</div>
                  </div>
                </div>
              </div>

              {/* User Position */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-purple-400" />
                    Your Position
                  </h2>
                  <button
                    onClick={() => setShowPrivateInfo(!showPrivateInfo)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showPrivateInfo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Collateral Deposited</div>
                    <div className="text-2xl font-bold">
                      {showPrivateInfo ? `$${userPosition.collateralAmount.toLocaleString()}` : '••••••'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Amount Borrowed</div>
                    <div className="text-2xl font-bold">
                      {showPrivateInfo ? `$${userPosition.borrowedAmount.toLocaleString()}` : '••••••'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Health Factor</div>
                    <div className={`text-2xl font-bold ${getHealthFactorColor(userPosition.healthFactor)}`}>
                      {showPrivateInfo ? userPosition.healthFactor.toFixed(2) : '•••'}
                    </div>
                    {showPrivateInfo && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Safe</span>
                          <span>At Risk</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getHealthFactorBg(userPosition.healthFactor)}`}
                            style={{ width: `${Math.min(100, (userPosition.healthFactor / 2) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Interest Rate</div>
                    <div className="text-xl font-bold">
                      {showPrivateInfo ? `${userPosition.interestRate}% APY` : '••••'}
                    </div>
                  </div>
                </div>

                {userPosition.healthFactor < 1.3 && userPosition.borrowedAmount > 0 && showPrivateInfo && (
                  <div className="mt-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-300 font-semibold">Warning: Low Health Factor</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Consider adding collateral or repaying debt to avoid liquidation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                  {['deposit', 'borrow', 'repay', 'withdraw'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-4 px-6 font-semibold capitalize transition-colors ${
                        activeTab === tab
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'deposit' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Deposit Collateral</h3>
                        <p className="text-gray-400 text-sm">
                          Add collateral to your private position. Your deposit amount is encrypted via Arcium MPC.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Amount (USDC)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-lg focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-300">New Collateral</span>
                          <span className="font-semibold">
                            ${(userPosition.collateralAmount + (parseFloat(depositAmount) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">New Health Factor</span>
                          <span className={`font-semibold ${getHealthFactorColor(
                            calculateHealthFactor(
                              userPosition.collateralAmount + (parseFloat(depositAmount) || 0),
                              userPosition.borrowedAmount
                            )
                          )}`}>
                            {calculateHealthFactor(
                              userPosition.collateralAmount + (parseFloat(depositAmount) || 0),
                              userPosition.borrowedAmount
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleDeposit}
                        disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Deposit Collateral</span>
                        )}
                      </button>
                    </div>
                  )}

                  {activeTab === 'borrow' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Borrow Funds</h3>
                        <p className="text-gray-400 text-sm">
                          Borrow against your collateral. Your loan details remain private.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Amount (USDC)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={borrowAmount}
                            onChange={(e) => setBorrowAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-lg focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-400">Available to borrow</span>
                          <span className="font-semibold text-green-400">
                            ${((userPosition.collateralAmount * 0.75) - userPosition.borrowedAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Interest Rate</span>
                          <span className="font-semibold">{userPosition.interestRate}% APY</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">New Borrowed</span>
                          <span className="font-semibold">
                            ${(userPosition.borrowedAmount + (parseFloat(borrowAmount) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">New Health Factor</span>
                          <span className={`font-semibold ${getHealthFactorColor(
                            calculateHealthFactor(
                              userPosition.collateralAmount,
                              userPosition.borrowedAmount + (parseFloat(borrowAmount) || 0)
                            )
                          )}`}>
                            {calculateHealthFactor(
                              userPosition.collateralAmount,
                              userPosition.borrowedAmount + (parseFloat(borrowAmount) || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleBorrow}
                        disabled={isProcessing || !borrowAmount || parseFloat(borrowAmount) <= 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Borrow Funds</span>
                        )}
                      </button>
                    </div>
                  )}

                  {activeTab === 'repay' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Repay Loan</h3>
                        <p className="text-gray-400 text-sm">
                          Repay your borrowed amount to improve your health factor.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Amount (USDC)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-lg focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-400">Total debt</span>
                          <span className="font-semibold text-red-400">
                            ${userPosition.borrowedAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Remaining Debt</span>
                          <span className="font-semibold">
                            ${Math.max(0, userPosition.borrowedAmount - (parseFloat(repayAmount) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">New Health Factor</span>
                          <span className={`font-semibold ${getHealthFactorColor(
                            calculateHealthFactor(
                              userPosition.collateralAmount,
                              Math.max(0, userPosition.borrowedAmount - (parseFloat(repayAmount) || 0))
                            )
                          )}`}>
                            {calculateHealthFactor(
                              userPosition.collateralAmount,
                              Math.max(0, userPosition.borrowedAmount - (parseFloat(repayAmount) || 0))
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleRepay}
                        disabled={isProcessing || !repayAmount || parseFloat(repayAmount) <= 0 || userPosition.borrowedAmount === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Repay Loan</span>
                        )}
                      </button>
                    </div>
                  )}

                  {activeTab === 'withdraw' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Withdraw Collateral</h3>
                        <p className="text-gray-400 text-sm">
                          Withdraw your collateral. Must maintain healthy position if you have an active loan.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Amount (USDC)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-lg focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-400">Total collateral</span>
                          <span className="font-semibold text-green-400">
                            ${userPosition.collateralAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Remaining Collateral</span>
                          <span className="font-semibold">
                            ${Math.max(0, userPosition.collateralAmount - (parseFloat(withdrawAmount) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">New Health Factor</span>
                          <span className={`font-semibold ${getHealthFactorColor(
                            calculateHealthFactor(
                              Math.max(0, userPosition.collateralAmount - (parseFloat(withdrawAmount) || 0)),
                              userPosition.borrowedAmount
                            )
                          )}`}>
                            {calculateHealthFactor(
                              Math.max(0, userPosition.collateralAmount - (parseFloat(withdrawAmount) || 0)),
                              userPosition.borrowedAmount
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {userPosition.borrowedAmount > 0 && (
                        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-yellow-300">
                            Withdrawing collateral while having an active loan may decrease your health factor
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleWithdraw}
                        disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || userPosition.collateralAmount === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Withdraw Collateral</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* How It Works */}
              <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-400" />
                  Privacy Architecture
                </h3>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-600 rounded-full p-1 mt-0.5">
                      <Lock className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Encrypted State</p>
                      <p>All user positions, collateral amounts, and borrowed funds are encrypted using Arcium's MPC network. No single party can decrypt your data.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-600 rounded-full p-1 mt-0.5">
                      <Percent className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Private Calculations</p>
                      <p>Interest rates, health factors, and liquidation thresholds are computed on encrypted data without revealing individual values.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-600 rounded-full p-1 mt-0.5">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Verifiable Solvency</p>
                      <p>The protocol can prove solvency and enforce liquidations without exposing individual user positions on-chain.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-600 rounded-full p-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Real-Time Updates</p>
                      <p>Health factors and liquidation risks are monitored in real-time within the encrypted computation environment.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm pb-4">
          <p>Powered by Arcium Multi-Party Computation Network on Solana</p>
          <p className="mt-1">Demo Interface - Backend integration required for production use</p>
        </div>
      </div>
    </div>
  );
};

export default ArciumLendingProtocol;