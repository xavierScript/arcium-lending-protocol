import React from "react";
import Link from "next/link";
import { Shield, Home, BarChart3, Eye, EyeOff } from "lucide-react";
import { WalletButton } from "./WalletButton";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showPrivateInfo: boolean;
  setShowPrivateInfo: (show: boolean) => void;
  userStats: { level: number; currentXP: number; nextLevelXP: number };
  mounted: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showPrivateInfo,
  setShowPrivateInfo,
  userStats,
  mounted,
}) => {
  const tabs = [
    { id: "lending", label: "Lending", icon: Home },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="glass-card rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 relative z-50">
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="ZKredit Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </Link>

      <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
              ${
                activeTab === tab.id
                  ? "bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <tab.icon
              className={`w-4 h-4 ${activeTab === tab.id ? "text-black" : ""}`}
            />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {mounted && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-black/20 border border-white/5">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">
                Level {userStats.level}
              </span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#00ff9d] rounded-full"
                  style={{
                    width: `${
                      (userStats.currentXP / userStats.nextLevelXP) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <Shield className="w-5 h-5 text-[#00ff9d]" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrivateInfo(!showPrivateInfo)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {showPrivateInfo ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
          {mounted && <WalletButton />}
        </div>
      </div>
    </div>
  );
};
