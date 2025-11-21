import { Shield, Twitter, Github, Disc } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="relative py-20">
      {/* Ambient background for the footer area */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#00ff9d]/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="glass-card rounded-[2.5rem] p-12 relative overflow-hidden">
          {/* Inner Gradient "Grading" to make glass effect pop */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#00ff9d]/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <Link href="/" className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#00ff9d]/10 flex items-center justify-center border border-[#00ff9d]/20">
                    <Shield className="w-6 h-6 text-[#00ff9d]" />
                  </div>
                  <span className="text-2xl font-bold text-white tracking-tight">ZKredit</span>
                </Link>
                <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                  The first privacy-preserving lending protocol on Solana. Borrow and lend with confidence, powered by zero-knowledge proofs.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00ff9d]/20 hover:text-[#00ff9d] hover:border-[#00ff9d]/30 transition-all">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00ff9d]/20 hover:text-[#00ff9d] hover:border-[#00ff9d]/30 transition-all">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00ff9d]/20 hover:text-[#00ff9d] hover:border-[#00ff9d]/30 transition-all">
                    <Disc className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 text-lg">Protocol</h4>
                <ul className="space-y-4">
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Markets</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Governance</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Developers</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Docs</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 text-lg">Legal</h4>
                <ul className="space-y-4">
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Terms of Service</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm">© 2024 ZKredit Protocol. All rights reserved.</p>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse" />
                <span className="text-gray-400 text-xs font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
