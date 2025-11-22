
import React from 'react';
import { TrendingUp, Users, Activity, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsTabProps {
  poolStats: any;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ poolStats }) => {
  const healthFactorHistory = [
    { time: 'Mon', value: 1.45 },
    { time: 'Tue', value: 1.52 },
    { time: 'Wed', value: 1.48 },
    { time: 'Thu', value: 1.55 },
    { time: 'Fri', value: 1.62 },
    { time: 'Sat', value: 1.58 },
    { time: 'Sun', value: 1.65 },
  ];

  const riskDistribution = [
    { label: 'Low Risk', count: 850, color: 'bg-[#00ff9d]', percentage: 68.9 },
    { label: 'Medium Risk', count: 280, color: 'bg-yellow-500', percentage: 22.7 },
    { label: 'High Risk', count: 84, color: 'bg-orange-500', percentage: 6.8 },
    { label: 'Critical', count: 20, color: 'bg-red-500', percentage: 1.6 },
  ];

  const recentActivity = [
    { type: 'deposit', user: '7x9K...mP4L', action: 'Deposited collateral', time: '2 min ago' },
    { type: 'borrow', user: 'Ak2m...8Qw3', action: 'Borrowed funds', time: '5 min ago' },
    { type: 'repay', user: 'Fj5n...Lr9P', action: 'Repaid loan', time: '12 min ago' },
    { type: 'liquidation', user: 'Position #4829', action: 'Liquidated', time: '18 min ago' },
  ];

  const getActivityStyle = (type: string) => {
    const styles = {
      deposit: 'bg-[#00ff9d]/20 text-[#00ff9d]',
      borrow: 'bg-blue-500/20 text-blue-400',
      repay: 'bg-purple-500/20 text-purple-400',
      liquidation: 'bg-red-500/20 text-red-400',
    };
    return styles[type as keyof typeof styles] || '';
  };

  const getActivityIcon = (type: string) => {
    const icons = { deposit: '↓', borrow: '→', repay: '←', liquidation: '⚠' };
    return icons[type as keyof typeof icons] || '';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">TVL</span>
            <TrendingUp className="w-4 h-4 text-[#00ff9d]" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(poolStats?.totalLiquidity || 0).toLocaleString()}
          </div>
          <div className="text-sm text-[#00ff9d]">+12.5%</div>
        </div>
        
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Positions</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">1,234</div>
          <div className="text-sm text-[#00ff9d]">+8.2%</div>
        </div>
        
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Health</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">1.85</div>
          <div className="text-sm text-[#00ff9d]">+0.15</div>
        </div>
        
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Liquidations (24h)</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">3</div>
          <div className="text-sm text-[#00ff9d]">-2</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Factor Chart */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-white">Your Health Factor Trend</h3>
          <div style={{ width: '100%', height: '256px' }}>
            <ResponsiveContainer>
              <AreaChart data={healthFactorHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 3]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#00ff9d' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                />
                <Area type="monotone" dataKey="value" stroke="#00ff9d" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-white">Risk Distribution</h3>
          <div className="space-y-4">
            {riskDistribution.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="font-semibold text-white">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-white">Recent Protocol Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityStyle(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">{activity.user}</div>
                  <div className="text-xs text-gray-400">{activity.action} (Encrypted)</div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};