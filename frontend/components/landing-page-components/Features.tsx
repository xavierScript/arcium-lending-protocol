import { Eye, Zap, Shield, Globe, Lock, BarChart3 } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="glass-card p-6 rounded-2xl hover:border-[#00ff9d]/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-lg bg-[#00ff9d]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-6 h-6 text-[#00ff9d]" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export const Features = () => {
  const features = [
    {
      icon: Eye,
      title: "Zero-Knowledge Privacy",
      description: "Prove your creditworthiness without revealing your financial history or personal identity."
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Lightning-fast loan approvals and disbursements powered by Solana's high-speed network."
    },
    {
      icon: Shield,
      title: "Institutional Grade",
      description: "Built with rigorous security standards and audited smart contracts for maximum safety."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Borrow from anywhere in the world without geographical restrictions or intermediaries."
    },
    {
      icon: Lock,
      title: "Encrypted Data",
      description: "Your financial data is encrypted end-to-end and only accessible by you."
    },
    {
      icon: BarChart3,
      title: "Transparent Yield",
      description: "Lenders earn real yield generated from overcollateralized and undercollateralized loans."
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            A New Era of <span className="text-gradient">DeFi Lending</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Experience a borrower-friendly, privacy-first protocol that empowers you to leverage your reputation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};
