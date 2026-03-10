import { useState, useEffect, useCallback } from 'react';
import { useEventStore, type EventStatus } from '@/store/eventStore';
import { motion } from 'framer-motion';

const AdminPanel = () => {
  const store = useEventStore();
  const { judges, teams, deals, status, currentTeamIndex, timerSeconds, timerRunning } = store;
  const currentTeam = teams[currentTeamIndex];

  // Timer logic
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      const state = useEventStore.getState();
      const newTime = state.timerSeconds - 1;
      if (newTime <= 0) {
        state.setTimerSeconds(0);
        state.setTimerRunning(false);
        if (state.status === 'deal_window') {
          state.setProjectorMode('waiting');
          state.setStatus('waiting');
        }
      } else {
        state.setTimerSeconds(newTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startPitch = useCallback(() => {
    store.setStatus('pitching');
    store.setTimerSeconds(store.pitchDuration);
    store.setTimerRunning(true);
    store.setProjectorMode('countdown');
  }, [store]);

  const startQA = useCallback(() => {
    store.setStatus('qa');
    store.setTimerSeconds(store.qaDuration);
    store.setTimerRunning(true);
    store.setProjectorMode('countdown');
  }, [store]);

  const openDealWindow = useCallback(() => {
    store.setStatus('deal_window');
    store.setTimerSeconds(store.dealWindowDuration);
    store.setTimerRunning(true);
    store.setProjectorMode('countdown');
  }, [store]);

  const closeDealWindow = useCallback(() => {
    store.setStatus('waiting');
    store.setTimerRunning(false);
    store.setTimerSeconds(0);
    store.setProjectorMode('waiting');
  }, [store]);

  const handleNextTeam = useCallback(() => {
    store.nextTeam();
    store.setProjectorMode('waiting');
  }, [store]);

  const totalInvested = deals.reduce((acc, d) => acc + d.amount, 0);

  const statusColors: Record<EventStatus, string> = {
    waiting: 'bg-muted-foreground',
    pitching: 'bg-deal-blue',
    qa: 'bg-deal-yellow',
    deal_window: 'bg-deal-green',
    paused: 'bg-deal-yellow',
    ended: 'bg-deal-red',
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">ADMIN CONTROL</h1>
          <p className="text-xs text-muted-foreground tracking-widest mt-1">EVENT MANAGEMENT SYSTEM</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="font-mono text-sm text-muted-foreground uppercase">{status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Event Control */}
        <div className="bg-card rounded-md border border-border p-4">
          <h2 className="font-display text-lg text-foreground mb-4 tracking-wider">EVENT CONTROL</h2>
          
          {/* Current Team */}
          <div className="mb-4 p-3 bg-secondary rounded-md">
            <p className="text-[10px] text-muted-foreground tracking-widest">CURRENT TEAM</p>
            <p className="font-display text-xl text-foreground">{currentTeam?.name || 'NONE'}</p>
            <p className="text-xs text-muted-foreground">{currentTeam?.description}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {currentTeamIndex + 1} / {teams.length}
            </p>
          </div>

          {/* Timer */}
          <div className="mb-4 p-3 bg-secondary rounded-md text-center">
            <p className="font-mono text-3xl tabular-nums text-foreground">{formatTime(timerSeconds)}</p>
            <p className="text-[10px] text-muted-foreground tracking-widest mt-1">
              {timerRunning ? 'RUNNING' : 'STOPPED'}
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startPitch} className="h-10 rounded-md bg-deal-blue font-display text-sm font-bold tracking-wider text-info-foreground">
                START PITCH
              </button>
              <button onClick={startQA} className="h-10 rounded-md bg-deal-yellow font-display text-sm font-bold tracking-wider text-warning-foreground">
                START Q&A
              </button>
            </div>
            <button onClick={openDealWindow} className="w-full h-12 rounded-md bg-deal-green font-display text-lg font-bold tracking-wider text-primary-foreground">
              OPEN DEAL WINDOW
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={closeDealWindow} className="h-10 rounded-md bg-deal-red font-display text-sm font-bold tracking-wider text-destructive-foreground">
                CLOSE WINDOW
              </button>
              <button onClick={handleNextTeam} className="h-10 rounded-md bg-secondary font-display text-sm font-bold tracking-wider text-secondary-foreground">
                NEXT TEAM →
              </button>
            </div>
            <button
              onClick={() => store.resetEvent()}
              className="w-full h-8 rounded-md border border-border text-xs font-mono text-muted-foreground tracking-widest hover:text-foreground transition-colors"
            >
              RESET EVENT
            </button>
          </div>
        </div>

        {/* Judges Monitor */}
        <div className="bg-card rounded-md border border-border p-4">
          <h2 className="font-display text-lg text-foreground mb-4 tracking-wider">JUDGES MONITOR</h2>
          <div className="space-y-3">
            {judges.map(judge => (
              <div key={judge.id} className="p-3 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${judge.isOnline ? 'bg-deal-green' : 'bg-deal-red'}`} />
                    <span className="font-display text-sm text-foreground">{judge.name}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {judge.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">CREDITS</p>
                    <p className="font-mono text-sm tabular-nums">{judge.balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">INVESTED</p>
                    <p className="font-mono text-sm tabular-nums">{judge.totalInvestment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">DEALS</p>
                    <p className="font-mono text-sm tabular-nums">{judge.totalDeals}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => store.adjustCredits(judge.id, 1000)}
                    className="flex-1 h-7 rounded-sm bg-accent text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +1000
                  </button>
                  <button
                    onClick={() => store.adjustCredits(judge.id, -1000)}
                    className="flex-1 h-7 rounded-sm bg-accent text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    -1000
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Deals Log */}
        <div className="bg-card rounded-md border border-border p-4">
          <h2 className="font-display text-lg text-foreground mb-4 tracking-wider">EVENT STATS</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-md text-center">
              <p className="text-[10px] text-muted-foreground tracking-widest">TOTAL DEALS</p>
              <p className="font-mono text-2xl tabular-nums text-foreground">{deals.length}</p>
            </div>
            <div className="p-3 bg-secondary rounded-md text-center">
              <p className="text-[10px] text-muted-foreground tracking-widest">TOTAL INVESTED</p>
              <p className="font-mono text-2xl tabular-nums text-deal-green">{totalInvested.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-secondary rounded-md text-center">
              <p className="text-[10px] text-muted-foreground tracking-widest">TEAMS PITCHED</p>
              <p className="font-mono text-2xl tabular-nums text-foreground">{currentTeamIndex + (status !== 'waiting' ? 1 : 0)}</p>
            </div>
            <div className="p-3 bg-secondary rounded-md text-center">
              <p className="text-[10px] text-muted-foreground tracking-widest">TEAMS LEFT</p>
              <p className="font-mono text-2xl tabular-nums text-foreground">{teams.length - currentTeamIndex - 1}</p>
            </div>
          </div>

          <h3 className="font-display text-sm text-muted-foreground tracking-wider mb-2">DEAL LOG</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {deals.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">No deals recorded</p>
            ) : (
              [...deals].reverse().map(deal => {
                const judge = judges.find(j => j.id === deal.judgeId);
                const team = teams.find(t => t.id === deal.teamId);
                return (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 bg-secondary rounded-sm"
                  >
                    <div>
                      <p className="text-xs text-foreground">{judge?.name} → {team?.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {new Date(deal.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-deal-green tabular-nums">
                      {deal.amount.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Team Queue */}
          <h3 className="font-display text-sm text-muted-foreground tracking-wider mb-2 mt-4">TEAM QUEUE</h3>
          <div className="space-y-1">
            {teams.map((team, i) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-2 rounded-sm text-xs ${
                  i === currentTeamIndex ? 'bg-deal-green/10 text-deal-green' : 
                  i < currentTeamIndex ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                <span className="font-display">{team.name}</span>
                <span className="font-mono text-[10px]">
                  {i === currentTeamIndex ? 'ACTIVE' : i < currentTeamIndex ? 'DONE' : `#${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
