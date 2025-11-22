"use client";
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const faqs = [
  {
    question: "What is ZKredit?",
    answer: "ZKredit is a privacy-preserving lending protocol built on Solana. It uses Arcium's multi-party computation (MPC) technology to enable users to lend and borrow assets without revealing their detailed financial history or personal identity to the public."
  },
  {
    question: "How does the privacy technology work?",
    answer: "We leverage Zero-Knowledge Proofs (ZKPs) and MPC to verify your creditworthiness and collateralization ratios off-chain. This means the protocol can verify you have enough funds or a good reputation without ever seeing your actual account balances or transaction history."
  },
  {
    question: "Is my data safe?",
    answer: "Yes. Your financial data is encrypted end-to-end. ZKredit only receives a cryptographic proof that you meet the lending criteria, not the data itself. We never store your personal financial information."
  },
  {
    question: "What assets can I lend and borrow?",
    answer: "Currently, ZKredit supports major assets like USDC, SOL, and BTC. We plan to expand support to more tokens and real-world assets (RWAs) in the near future as the protocol matures."
  },
  {
    question: "Are there any fees?",
    answer: "ZKredit charges a small protocol fee on borrowing interest to maintain the insurance fund and development. Lenders receive the majority of the interest paid by borrowers. Specific fee rates are determined by protocol governance."
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative overflow-hidden" id="faq">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00ff9d]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know about private lending on ZKredit.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`
                rounded-2xl transition-all duration-300 border
                ${openIndex === index 
                  ? 'glass-card border-[#00ff9d]/30' 
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                }
              `}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`text-lg font-semibold transition-colors ${openIndex === index ? 'text-white' : 'text-gray-300'}`}>
                  {faq.question}
                </span>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${openIndex === index ? 'bg-[#00ff9d] rotate-180' : 'bg-white/10'}
                `}>
                  {openIndex === index ? (
                    <X className="w-4 h-4 text-black" />
                  ) : (
                    <Plus className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
              
              <div 
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="p-6 pt-0 text-gray-400 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
