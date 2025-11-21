
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, Copy, LogOut } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { useNotification } from '@/app/src/contexts/NotificationContext';

export const WalletButton: React.FC = () => {
  const wallet = useWallet();
  const { showSuccess } = useNotification();

  if (!wallet.connected) {
    return (
      <WalletMultiButton className="!bg-[#00ff9d] !text-black !font-bold !rounded-full !px-6 !py-2.5 hover:!bg-[#00cc7d] transition-all" />
    );
  }

  return (
    <div className="relative group">
      <div className="glass-card rounded-full pl-1 pr-1 py-1 flex items-center gap-2 cursor-pointer hover:border-[#00ff9d]/30 transition-all group-hover:rounded-b-none group-hover:rounded-t-2xl">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00ff9d] to-blue-500 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-black" />
        </div>
        <span className="text-sm font-medium text-white pr-2">
          {shortenAddress(wallet.publicKey?.toString() || '')}
        </span>
        
        <div className="absolute top-full right-0 mt-0 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-2">
          <div className="glass-card rounded-2xl p-4 border border-[#00ff9d]/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <span className="text-sm text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse" />
                  <span className="text-xs text-[#00ff9d]">Connected</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(wallet.publicKey?.toString() || '');
                  showSuccess('Success', 'Address copied to clipboard');
                }}
                className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                <Copy className="w-4 h-4" />
                Copy Address
              </button>
              
              <button 
                onClick={() => wallet.disconnect()}
                className="flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};