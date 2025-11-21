import React from 'react';
import { Lock } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="px-6 pt-6">
      <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-xl p-4 flex items-start space-x-3">
        <Lock className="w-5 h-5 text-[#00ff9d] mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-[#00ff9d] mb-1">End-to-End Privacy via Arcium MPC</h3>
          <p className="text-sm text-gray-400">
            All positions, health factors, and calculations are encrypted. No single party can see your private data.
          </p>
        </div>
      </div>
    </div>
  );
};