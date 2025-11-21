
import React from 'react';
import { Loader } from 'lucide-react';

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  loading,
  label
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-[#00ff9d] text-black hover:bg-[#00cc7d] py-4 rounded-full font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,255,157,0.2)] hover:shadow-[0_0_30px_rgba(0,255,157,0.4)]"
    >
      {loading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
};