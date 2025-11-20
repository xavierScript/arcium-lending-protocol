import React from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield, Home, BarChart3, Trophy, Eye, EyeOff, Wallet, Copy, LogOut } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showPrivateInfo: boolean;
  setShowPrivateInfo: (show: boolean) => void;
  userStats: {
    level: number;
    currentXP?: number;
    nextLevelXP?: number;
  };
  mounted: boolean;
  onCopyAddress: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  showPrivateInfo,
  setShowPrivateInfo,
  userStats,
  mounted,
  onCopyAddress,
}) => {
  const wallet = useWallet();

  return (
    <div className="glass-card rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 relative z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-[#00ff9d]/10 flex items-center justify-center border border-[#00ff9d]/20">
          <Shield className="w-6 h-6 text-[#00ff9d]" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ZKredit</span>
      </Link>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5">
        {[
          { id: 'lending', label: 'Lending', icon: Home },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
              ${activeTab === tab.id 
                ? 'bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Side: User Stats & Wallet */}
      <div className="flex items-center gap-4">
        {/* User Level Pill */}
        {mounted && wallet.connected && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-black/20 border border-white/5">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Level {userStats?.level || 1}</span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-[#00ff9d] rounded-full"
                  style={{ width: `${((userStats?.currentXP || 0) / (userStats?.nextLevelXP || 100)) * 100}%` }}
                />
              </div>
            </div>
            <Trophy className="w-5 h-5 text-[#00ff9d]" />
          </div>
        )}

        {/* Wallet & Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrivateInfo(!showPrivateInfo)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {showPrivateInfo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          {mounted && (
            <div className="relative group">
              {!wallet.connected ? (
                <WalletMultiButton className="!bg-[#00ff9d] !text-black !font-bold !rounded-full !px-6 !py-2.5 hover:!bg-[#00cc7d] transition-all" />
              ) : (
                <div className="glass-card rounded-full pl-1 pr-1 py-1 flex items-center gap-2 cursor-pointer hover:border-[#00ff9d]/30 transition-all group-hover:rounded-b-none group-hover:rounded-t-2xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00ff9d] to-blue-500 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-sm font-medium text-white pr-2">
                    {shortenAddress(wallet.publicKey?.toString() || '')}
                  </span>
                  
                  {/* Dropdown Menu */}
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
                          onClick={onCopyAddress}
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};