export const Partners = () => {
  const partners = [
    "Solana", "Chainlink", "Arcium", "Circle", "Wintermute", "Jump Crypto"
  ];

  return (
    <section className="py-20 border-t border-white/5">
      <div className="container mx-auto px-6 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-10">Trusted by Industry Leaders</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner, index) => (
            <div key={index} className="text-2xl font-bold text-white/80 hover:text-[#00ff9d] transition-colors cursor-default">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
