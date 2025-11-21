export const Stats = () => {
  const stats = [
    { label: "Total Value Locked", value: "$124.5M+", change: "+12.5%" },
    { label: "Total Loans Originated", value: "$450M+", change: "+8.2%" },
    { label: "Active Users", value: "25.5K+", change: "+24%" },
    { label: "Privacy Pools", value: "140+", change: null },
  ];

  return (
    <section className="py-10 border-y border-white/5 glass relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
                {stat.label}
                {stat.change && (
                  <span className="text-[#00ff9d] text-xs bg-[#00ff9d]/10 px-1.5 py-0.5 rounded">
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
