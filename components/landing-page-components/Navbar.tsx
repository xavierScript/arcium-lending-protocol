"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Shield, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 glass">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#00ff9d]/10 flex items-center justify-center group-hover:bg-[#00ff9d]/20 transition-colors">
            <Shield className="w-6 h-6 text-[#00ff9d]" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ZKredit</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</Link>
          <Link href="#governance" className="text-sm text-gray-400 hover:text-white transition-colors">Governance</Link>
        </div>

        {/* CTA & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Documentation
            </Button>
            <Button variant="primary" size="sm" href="/dashboard">
              Launch App
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-white/5 p-6 animate-in slide-in-from-top-5">
          <div className="flex flex-col space-y-4">
            <Link 
              href="#features" 
              className="text-lg text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-lg text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              href="#governance" 
              className="text-lg text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Governance
            </Link>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="ghost" size="lg" className="w-full justify-start">
                Documentation
              </Button>
              <Button variant="primary" size="lg" href="/dashboard" className="w-full">
                Launch App
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
