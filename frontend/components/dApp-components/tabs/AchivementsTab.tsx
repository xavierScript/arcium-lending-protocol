
import React from 'react';
import { Trophy, CheckCircle } from 'lucide-react';

interface AchievementsTabProps {
  userStats: {
    level: number;
    xp: number;
    streak: number;
  };
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({ userStats }) => {
  const achievements = [
    { id: 1, title: '🎯 First Steps', unlocked: true, points: 10 },
    { id: 2, title: '💎 Diamond Hands', unlocked: true, points: 200 },
    { id: 3, title: '🔥 On Fire', unlocked: true, points: 250 },
    { id: 4, title: '🐋 Whale Status', unlocked: false, points: 500 },
  ];

  const leaderboard = [
    { rank: 1, user: 'Bm8k...3Tn2', level: 12, xp: 5420 },
    { rank: 2, user: 'Ak2m...8Qw3', level: 10, xp: 4250 },
    { rank: 3, user: 'Fj5n...Lr9P', level: 8, xp: 3180 },
    { rank: 4, user: '7x9K...mP4L', level: 5, xp: 1250, highlight: true },
    { rank: 5, user: 'Zp4k...9Xm1', level: 5, xp: 1120 },
  ];

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-black';
    if (rank === 2) return 'bg-gray-400 text-black';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-white/10 text-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Level {userStats.level}</h2>
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-[#00ff9d]" />
              <span className="text-[#00ff9d] font-semibold">Top 5%</span>
            </div>
          </div>
        </div>
          
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Progress to Level {userStats.level + 1}</span>
          <span className="text-[#00ff9d] font-semibold">{userStats.xp} / 1500 XP</span>
        </div>
        
        <div className="w-full bg-black/50 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-[#00ff9d] to-[#00cc7d] h-3 rounded-full shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all duration-1000"
            style={{ width: `${(userStats.xp / 1500) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">{userStats.streak}</div>
            <div className="text-sm text-gray-400">Day Streak</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">{userStats.xp}</div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-1">{userStats.streak}</div>
          <div className="text-sm text-gray-400">Day Streak 🔥</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-[#00ff9d] mb-1">
            {achievements.filter(a => a.unlocked).length}
          </div>
          <div className="text-sm text-gray-400">Achievements Unlocked</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-1">{userStats.xp}</div>
          <div className="text-sm text-gray-400">Total XP Earned</div>
        </div>
      </div>

      {/* Achievements List */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-white">Your Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all ${
                achievement.unlocked
                  ? 'bg-[#00ff9d]/5 border-[#00ff9d]/30 shadow-[0_0_15px_rgba(0,255,157,0.1)]'
                  : 'bg-white/5 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{achievement.title.split(' ')[0]}</div>
                {achievement.unlocked && <CheckCircle className="w-5 h-5 text-[#00ff9d]" />}
              </div>
              <h4 className="font-semibold mb-1 text-white">
                {achievement.title.substring(2)}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {achievement.unlocked ? 'Unlocked!' : 'Locked'}
                </span>
                <span className="text-sm font-semibold text-yellow-400">
                  +{achievement.points} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-white">Top Lenders</h3>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div 
              key={entry.rank}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                entry.highlight
                  ? 'bg-[#00ff9d]/10 border-[#00ff9d]/30'
                  : 'bg-white/5 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getRankStyle(entry.rank)}`}>
                  {entry.rank}
                </div>
                <div>
                  <div className="font-semibold text-white">{entry.user}</div>
                  <div className="text-xs text-gray-400">Level {entry.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#00ff9d]">{entry.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};