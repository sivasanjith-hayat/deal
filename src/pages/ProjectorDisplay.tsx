import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectorDisplay = () => {
  const navigate = useNavigate();
  const { teams, currentTeamIndex, judges } = useEventStore();
  const { currentUser, logout } = useAuthStore();
  const currentTeam = teams[currentTeamIndex];

  // Internal security check: Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  }

  // War Room data simplified
  const warRoomData = useMemo(() => {
    // All teams with their original index for status checking
    const allTeams = teams.map((t, idx) => ({ ...t, originalIndex: idx }));
    return { allTeams };
  }, [teams]);

  return (
    <div className="h-screen w-screen bg-background flex flex-col items-center overflow-hidden relative p-8">
      {/* Session Info & Logout */}
      <div className="absolute top-4 right-8 flex items-center gap-4 z-20">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase opacity-60">Session</p>
          <p className="text-xs text-foreground font-mono tracking-wider">{currentUser?.displayName || '...'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-sm border border-border/50 text-[10px] font-mono text-muted-foreground hover:text-deal-red hover:border-deal-red/30 hover:bg-deal-red/5 transition-all tracking-widest uppercase"
        >
          Logout
        </button>
      </div>

      <h1 className="font-display text-4xl sm:text-6xl font-bold text-foreground tracking-wider mb-8 text-center">
        WAR ROOM
      </h1>

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row h-full overflow-hidden gap-12">
        {/* LEFT SIDE: SHARK PANEL */}
        <div className="w-full lg:w-[450px] flex flex-col shrink-0 border-r border-border/30 pr-10 h-full overflow-hidden bg-card/5">
          <h2 className="font-display text-3xl font-bold text-deal-green tracking-[0.2em] mb-10 text-left uppercase">
            The Sharks
          </h2>

          <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4">
            {judges.map((j, i) => (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="group relative"
              >
                <div className="flex items-start gap-5">
                  <div className="mt-2 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-deal-green shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                  </div>

                  <div className="flex-1">
                    <p className="font-display text-2xl sm:text-3xl text-foreground font-bold tracking-wide group-hover:text-deal-green transition-colors leading-tight mb-2">
                      {j.name.split('(')[0].trim()}
                    </p>

                    {j.name.includes('(') && (
                      <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase leading-relaxed max-w-[320px]">
                        {j.name.match(/\(([^)]+)\)/)?.[1] || ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-b border-border/10 w-full group-last:border-none" />
              </motion.div>
            ))}
          </div>

          <div className="mt-auto py-10">
            <div className="p-6 rounded-xl bg-deal-green/5 border border-deal-green/20 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-mono tracking-[0.3em] uppercase">Event Status</p>
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-deal-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-deal-green"></span>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-4xl text-deal-green font-bold">LIVE</p>
                <p className="text-muted-foreground text-sm font-mono ml-4 uppercase tracking-tighter">
                  {teams.length} Teams Registered
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: PITCH QUEUE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <h2 className="font-display text-2xl text-muted-foreground tracking-wider mb-6 text-center lg:text-right uppercase">Pitch Queue</h2>

          <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar pb-12">
            {/* NOW PRESENTING SECTION */}
            {currentTeam && (
              <div className="mb-8">
                <h3 className="text-[10px] text-deal-green tracking-widest mb-3 text-center lg:text-right uppercase font-mono">Now Presenting</h3>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-deal-green/5 rounded-lg border border-deal-green/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-64 h-64 bg-deal-green/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mt-20" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-center md:text-left">
                    <div className="flex-1">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <span className="font-mono text-xl text-deal-green opacity-50">#{currentTeamIndex + 1}</span>
                        <p className="font-display text-4xl sm:text-5xl text-deal-green tracking-wider font-bold">{currentTeam.name}</p>
                      </div>

                      {currentTeam.members && (
                        <div className="bg-deal-green/10 p-4 rounded-md border border-deal-green/20 mb-4">
                          <p className="text-[10px] text-deal-green font-mono tracking-widest uppercase mb-1 opacity-70">Team Members:</p>
                          <p className="font-display text-xl text-foreground font-semibold tracking-wide">
                            {currentTeam.members}
                          </p>
                        </div>
                      )}

                      <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                        {currentTeam.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      <div className="bg-deal-green text-primary-foreground font-display text-[10px] tracking-[0.3em] px-6 py-3 rounded-full shadow-lg border border-deal-green/50 animate-pulse uppercase font-bold">
                        Active
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* LINEUP LIST */}
            <div className="space-y-3">
              <h3 className="text-[10px] text-muted-foreground tracking-widest mb-4 text-center lg:text-right uppercase border-t border-border/50 pt-8 font-mono">Event Lineup</h3>
              {warRoomData.allTeams.map((team, idx) => {
                const isPast = team.originalIndex < currentTeamIndex;
                const isCurrent = team.originalIndex === currentTeamIndex;

                if (isCurrent) return null;

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className={`flex flex-col p-4 rounded-lg border transition-all ${isPast
                      ? 'bg-secondary/20 border-border/20 opacity-40 grayscale'
                      : 'bg-card/30 border-border/50 hover:bg-card hover:border-border'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-left">
                        <span className="font-mono text-lg tabular-nums w-8 text-muted-foreground/50">
                          {idx + 1}
                        </span>
                        <div>
                          <p className={`font-display text-xl tracking-wider ${isPast ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {team.name}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            {team.members && (
                              <p className="text-[10px] font-mono text-deal-green/60 uppercase tracking-widest">
                                <span className="opacity-50 mr-1.5">MEMBER:</span>
                                {team.members}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground italic line-clamp-1">{team.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isPast ? (
                          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Done</span>
                        ) : team.originalIndex === currentTeamIndex + 1 ? (
                          <span className="px-2 py-0.5 rounded-sm bg-deal-blue/10 text-[10px] font-mono text-deal-blue tracking-widest uppercase font-bold border border-deal-blue/20">Next Up</span>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground/40 tracking-widest uppercase">Queued</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProjectorDisplay;
