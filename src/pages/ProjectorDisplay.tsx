import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '@/store/eventStore';
import { useMemo } from 'react';

const ConfettiParticle = ({ index }: { index: number }) => {
  const colors = ['bg-deal-green', 'bg-deal-yellow', 'bg-deal-blue', 'bg-foreground'];
  const color = colors[index % colors.length];
  const left = `${Math.random() * 100}%`;
  const delay = Math.random() * 0.8;
  const duration = 1.5 + Math.random() * 1.5;
  const size = 4 + Math.random() * 8;

  return (
    <motion.div
      className={`absolute ${color} rounded-sm`}
      style={{ left, width: size, height: size }}
      initial={{ top: '-5%', opacity: 1, rotate: 0 }}
      animate={{ top: '110%', opacity: 0, rotate: 360 + Math.random() * 360 }}
      transition={{ delay, duration, ease: 'easeIn' }}
    />
  );
};

const ProjectorDisplay = () => {
  const { projectorMode, timerSeconds, lastDeal, teams, currentTeamIndex, judges, deals, judgeNotes } = useEventStore();
  const currentTeam = teams[currentTeamIndex];

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // War Room data
  const warRoomData = useMemo(() => {
    const relevantJudges = judges.filter(j => j.isOnline);

    const judgeStats = relevantJudges.map(j => ({
      name: j.name,
      totalInvestment: j.totalInvestment,
      totalDeals: j.totalDeals,
    })).sort((a, b) => b.totalInvestment - a.totalInvestment);

    const totalInvested = deals.reduce((a, d) => a + d.amount, 0);
    const largestDeal = deals.length > 0 ? Math.max(...deals.map(d => d.amount)) : 0;

    // Upcoming teams (after current)
    const upcomingTeams = teams.slice(currentTeamIndex + 1);
    const nextTeam = upcomingTeams.length > 0 ? upcomingTeams[0] : null;

    return { judgeStats, totalInvested, largestDeal, totalDeals: deals.length, upcomingTeams, nextTeam };
  }, [judges, deals, teams, currentTeamIndex]);

  const confettiParticles = useMemo(() => Array.from({ length: 40 }, (_, i) => i), []);

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="wait">
        {projectorMode === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-muted-foreground/40 tracking-wider">
              SHARKS ARE<br />DELIBERATING
            </h1>
            <div className="mt-8 w-24 h-px bg-muted-foreground/20 mx-auto" />

            {/* Next team preview */}
            {warRoomData.nextTeam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-10"
              >
                <p className="text-[10px] text-muted-foreground tracking-[0.4em] mb-2">NEXT UP</p>
                <p className="font-display text-2xl text-muted-foreground/60 tracking-wider">
                  {warRoomData.nextTeam.name}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {projectorMode === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {currentTeam && (
              <div className="mb-8">
                <p className="font-display text-4xl sm:text-5xl text-foreground tracking-[0.3em] mb-3 drop-shadow-lg">
                  {currentTeam.name}
                </p>
                {currentTeam.members && (
                  <p className="font-mono text-xs sm:text-sm text-deal-green/80 flex justify-center gap-2 mb-3 tracking-widest uppercase">
                    <span className="opacity-60">TEAM:</span>
                    <span>{currentTeam.members}</span>
                  </p>
                )}
                <p className="font-mono text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed border-b border-border/50 pb-6">
                  {currentTeam.description}
                </p>
              </div>
            )}
            <div className="font-mono text-[6rem] sm:text-[9rem] lg:text-[11rem] tabular-nums text-foreground leading-none drop-shadow-2xl">
              {formatTime(timerSeconds)}
            </div>
            <p className="font-mono text-xs sm:text-sm text-foreground/40 tracking-[0.5em] mt-4 mb-8">
              DEAL WINDOW
            </p>

            {/* Live Judge Feedback */}
            {judgeNotes.filter(n => n.teamId === currentTeam?.id).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto mt-4 text-left w-full px-4"
              >
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-deal-yellow font-display text-xs tracking-[0.2em]">LIVE SHARK FEEDBACK</h3>
                  <div className="flex-1 h-px bg-border/50"></div>
                </div>
                <div className="flex flex-col gap-3 max-h-[25vh] overflow-y-auto pr-2 pointer-events-auto custom-scrollbar">
                  {judgeNotes.filter(n => n.teamId === currentTeam?.id).slice().reverse().map(note => {
                    const judge = judges.find(j => j.id === note.judgeId);
                    return (
                      <div
                        key={note.id}
                        className="p-4 bg-secondary/80 backdrop-blur-md rounded-lg border border-border/50 shadow-xl flex gap-3 items-start"
                      >
                        <span className="font-bold text-deal-green font-mono uppercase tracking-wider whitespace-nowrap">
                          {judge?.name.split(' ')[0]}:
                        </span>
                        <span className="text-muted-foreground font-mono leading-relaxed text-sm">
                          {note.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {projectorMode === 'deal' && lastDeal && (
          <motion.div
            key="deal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full"
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {confettiParticles.map(i => (
                <ConfettiParticle key={i} index={i} />
              ))}
            </div>

            {/* Heartbeat line phase */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-2/3 h-px bg-deal-green animate-heartbeat" />
            </motion.div>

            {/* Deal secured reveal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl font-bold text-deal-green tracking-wider mb-6">
                DEAL SECURED
              </h1>
              <div className="w-32 h-px bg-deal-green/40 mx-auto mb-6" />
              <p className="font-display text-3xl sm:text-4xl text-foreground tracking-wider mb-2">
                {lastDeal.judgeName}
              </p>
              <p className="font-mono text-4xl sm:text-5xl text-deal-green tabular-nums">
                {lastDeal.amount.toLocaleString()} CREDITS
              </p>
              <p className="font-mono text-lg text-muted-foreground tracking-widest mt-4">
                → {lastDeal.teamName}
              </p>
            </motion.div>
          </motion.div>
        )}

        {projectorMode === 'no_deal' && (
          <motion.div
            key="nodeal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center animate-flash-red"
          >
            <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl font-bold text-deal-red tracking-wider">
              OUT
            </h1>
            <p className="font-display text-2xl sm:text-3xl text-muted-foreground tracking-[0.3em] mt-4">
              NO DEAL STRUCK
            </p>
          </motion.div>
        )}

        {projectorMode === 'negotiate' && (
          <motion.div
            key="negotiate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-deal-yellow tracking-wider">
              NEGOTIATION
            </h1>
            <p className="font-display text-2xl sm:text-3xl text-muted-foreground tracking-[0.3em] mt-4">
              IN PROGRESS
            </p>
            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-deal-yellow"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {projectorMode === 'war_room' && (
          <motion.div
            key="war_room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-4xl px-8"
          >
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-foreground tracking-wider mb-8">
              WAR ROOM
            </h1>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div>
                <p className="text-[10px] text-muted-foreground tracking-widest">TOTAL INVESTED</p>
                <p className="font-mono text-3xl tabular-nums text-deal-green">{warRoomData.totalInvested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground tracking-widest">TOTAL DEALS</p>
                <p className="font-mono text-3xl tabular-nums text-foreground">{warRoomData.totalDeals}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground tracking-widest">LARGEST DEAL</p>
                <p className="font-mono text-3xl tabular-nums text-deal-yellow">{warRoomData.largestDeal.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Judge Rankings */}
              <div>
                <h2 className="font-display text-lg text-muted-foreground tracking-wider mb-4 text-left">SHARK RANKINGS</h2>
                <div className="space-y-3">
                  {warRoomData.judgeStats.map((j, i) => (
                    <motion.div
                      key={j.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center justify-between p-4 bg-card rounded-md border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-2xl text-muted-foreground tabular-nums w-8">
                          {i + 1}
                        </span>
                        <span className="font-display text-lg text-foreground tracking-wider text-left">{j.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground tracking-widest">DEALS</p>
                          <p className="font-mono text-sm tabular-nums">{j.totalDeals}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground tracking-widest">INVESTED</p>
                          <p className="font-mono text-lg tabular-nums text-deal-green">{j.totalInvestment.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Team Queue */}
              <div>
                <h2 className="font-display text-lg text-muted-foreground tracking-wider mb-4 text-left">NEXT TO PRESENT</h2>

                {/* Currently Presenting */}
                {currentTeam && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-deal-green/10 rounded-md border border-deal-green/30 mb-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] text-deal-green tracking-widest mb-1">▶ NOW PRESENTING</p>
                        <p className="font-display text-xl text-deal-green tracking-wider">{currentTeam.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{currentTeam.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Upcoming Queue */}
                <div className="space-y-2">
                  {warRoomData.upcomingTeams.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-mono p-4 text-left">No more teams in queue</p>
                  ) : (
                    warRoomData.upcomingTeams.map((team, i) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`flex items-center justify-between p-3 rounded-md border transition-all ${i === 0
                          ? 'bg-deal-blue/10 border-deal-blue/30'
                          : 'bg-card border-border'
                          }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span className="font-mono text-lg text-muted-foreground tabular-nums w-6">
                            {i + 1}
                          </span>
                          <div>
                            <p className={`font-display text-base tracking-wider ${i === 0 ? 'text-deal-blue' : 'text-foreground'}`}>
                              {team.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{team.description}</p>
                          </div>
                        </div>
                        {i === 0 && (
                          <span className="text-[10px] font-mono text-deal-blue tracking-widest">UP NEXT</span>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectorDisplay;
