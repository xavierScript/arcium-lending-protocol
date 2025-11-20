import React from 'react';
import { Shield } from 'lucide-react';

interface WalletGuardProps {
  connected: boolean;
  children: React.ReactNode;
}

export const WalletGuard: React.FC<WalletGuardProps> = ({ connected, children }) => {
  if (!connected) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-[#00ff9d]" />
        <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">
          Connect your Solana wallet to access private lending features
        </p>
      </div>
    );
  }

  return <>{children}</>;
};