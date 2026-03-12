import { useState, useEffect, useCallback } from 'react';
import { useEventStore, type EventStatus } from '@/store/eventStore';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const store = useEventStore();
  const {
    judges, teams, deals, status, currentTeamIndex, timerSeconds, timerRunning,
    eventLog, minInvestment, maxInvestment, multiInvestorMode,
    pitchDuration, qaDuration, dealWindowDuration,
  } = store;
  const currentTeam = teams[currentTeamIndex];

  const [showSettings, setShowSettings] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

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
    store.logEvent('START_PITCH', currentTeam?.name);
  }, [store, currentTeam]);

  const startQA = useCallback(() => {
    store.setStatus('qa');
    store.setTimerSeconds(store.qaDuration);
    store.setTimerRunning(true);
    store.setProjectorMode('countdown');
    store.logEvent('START_QA', currentTeam?.name);
  }, [store, currentTeam]);

  const openDealWindow = useCallback(() => {
    store.setStatus('deal_window');
    store.setTimerSeconds(store.dealWindowDuration);
    store.setTimerRunning(true);
    store.setProjectorMode('countdown');
    store.logEvent('OPEN_DEAL_WINDOW', currentTeam?.name);
    store.pushNotification('Deal window is now open!', 'warning');
  }, [store, currentTeam]);

  const closeDealWindow = useCallback(() => {
    store.setStatus('waiting');
    store.setTimerRunning(false);
    store.setTimerSeconds(0);
    store.setProjectorMode('waiting');
    store.logEvent('CLOSE_DEAL_WINDOW');
  }, [store]);

  const handleNextTeam = useCallback(() => {
    store.nextTeam();
    store.setProjectorMode('waiting');
    store.pushNotification('Team changed — next pitch starting', 'info');
  }, [store]);

  const handleAddTeam = useCallback(() => {
    if (!newTeamName.trim()) return;
    store.addTeam({
      id: `t${Date.now()}`,
      name: newTeamName.trim().toUpperCase(),
      description: newTeamDesc.trim(),
    });
    setNewTeamName('');
    setNewTeamDesc('');
    setShowTeamForm(false);
  }, [store, newTeamName, newTeamDesc]);

  const totalInvested = deals.reduce((acc, d) => acc + d.amount, 0);

  const statusColors: Record<EventStatus, string> = {
    waiting: 'bg-muted-foreground',
    pitching: 'bg-deal-blue',
    qa: 'bg-deal-yellow',
    deal_window: 'bg-deal-green',
    paused: 'bg-deal-yellow',
    ended: 'bg-deal-red',
  };

  const isPaused = status === 'paused';
  const isEnded = status === 'ended';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">ADMIN CONTROL</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest mt-1">EVENT MANAGEMENT SYSTEM</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="font-mono text-sm text-muted-foreground uppercase">{status.replace('_', ' ')}</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="ml-4 px-3 py-1 rounded-sm border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground tracking-widest transition-colors"
          >
            ⚙ SETTINGS
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-card rounded-md border border-border p-4">
              <h2 className="font-display text-lg text-foreground mb-4 tracking-wider">SETTINGS</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">PITCH (sec)</label>
                  <input
                    type="number"
                    value={pitchDuration}
                    onChange={(e) => store.setPitchDuration(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-deal-green/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">Q&A (sec)</label>
                  <input
                    type="number"
                    value={qaDuration}
                    onChange={(e) => store.setQaDuration(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-deal-green/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">DEAL (sec)</label>
                  <input
                    type="number"
                    value={dealWindowDuration}
                    onChange={(e) => store.setDealWindowDuration(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-deal-green/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">MIN INVEST</label>
                  <input
                    type="number"
                    value={minInvestment}
                    onChange={(e) => store.setMinInvestment(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-deal-green/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">MAX INVEST</label>
                  <input
                    type="number"
                    value={maxInvestment}
                    onChange={(e) => store.setMaxInvestment(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-deal-green/50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">MULTI-INVESTOR</label>
                  <button
                    onClick={() => store.setMultiInvestorMode(!multiInvestorMode)}
                    className={`flex-1 rounded-sm font-mono text-xs tracking-wider transition-colors ${
                      multiInvestorMode ? 'bg-deal-green text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {multiInvestorMode ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Event Control */}
        <div className="bg-card rounded-md border border-border p-4">
          <h2 className="font-display text-lg text-foreground mb-4 tracking-wider">EVENT CONTROL</h2>
          
          {/* Current Team */}
          <div className="mb-4 p-3 bg-secondary rounded-md">
            <p className="text-[10px] text-muted-foreground tracking-widest">CURRENT TEAM</p>
            <p className="font-display text-xl text-foreground">{currentTeam?.name || 'NONE'}</p>
            <p className="text-xs text-muted-foreground">{currentTeam?.description}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
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
              <button onClick={startPitch} disabled={isPaused || isEnded} className="h-10 rounded-md bg-deal-blue font-display text-sm font-bold tracking-wider text-info-foreground disabled:opacity-30">
                START PITCH
              </button>
              <button onClick={startQA} disabled={isPaused || isEnded} className="h-10 rounded-md bg-deal-yellow font-display text-sm font-bold tracking-wider text-warning-foreground disabled:opacity-30">
                START Q&A
              </button>
            </div>
            <button onClick={openDealWindow} disabled={isPaused || isEnded} className="w-full h-12 rounded-md bg-deal-green font-display text-lg font-bold tracking-wider text-primary-foreground disabled:opacity-30">
              OPEN DEAL WINDOW
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={closeDealWindow} disabled={isEnded} className="h-10 rounded-md bg-deal-red font-display text-sm font-bold tracking-wider text-destructive-foreground disabled:opacity-30">
                CLOSE WINDOW
              </button>
              <button onClick={handleNextTeam} disabled={isPaused || isEnded} className="h-10 rounded-md bg-secondary font-display text-sm font-bold tracking-wider text-secondary-foreground disabled:opacity-30">
                NEXT TEAM →
              </button>
            </div>

            {/* Pause / Resume / End */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {!isPaused ? (
                <button
                  onClick={() => store.pauseEvent()}
                  disabled={isEnded || status === 'waiting'}
                  className="h-9 rounded-md bg-deal-yellow font-mono text-[10px] font-bold tracking-widest text-warning-foreground disabled:opacity-30"
                >
                  PAUSE
                </button>
              ) : (
                <button
                  onClick={() => store.resumeEvent()}
                  className="h-9 rounded-md bg-deal-green font-mono text-[10px] font-bold tracking-widest text-primary-foreground"
                >
                  RESUME
                </button>
              )}
              <button
                onClick={() => store.endEvent()}
                disabled={isEnded}
                className="h-9 rounded-md bg-deal-red font-mono text-[10px] font-bold tracking-widest text-destructive-foreground disabled:opacity-30"
              >
                END EVENT
              </button>
              <button
                onClick={() => store.setProjectorMode('leaderboard')}
                className="h-9 rounded-md bg-secondary font-mono text-[10px] font-bold tracking-widest text-secondary-foreground"
              >
                LEADERBOARD
              </button>
            </div>

            {/* Emergency Overrides */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground tracking-widest mb-2">EMERGENCY</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => store.reopenDealWindow()}
                  className="h-8 rounded-sm border border-deal-yellow/30 text-[10px] font-mono text-deal-yellow tracking-wider hover:bg-deal-yellow/10 transition-colors"
                >
                  REOPEN DEAL
                </button>
                <button
                  onClick={() => store.resetEvent()}
                  className="h-8 rounded-sm border border-deal-red/30 text-[10px] font-mono text-deal-red tracking-wider hover:bg-deal-red/10 transition-colors"
                >
                  RESET ALL
                </button>
              </div>
            </div>
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
                  <span className="font-mono text-[10px] text-muted-foreground">
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

                {/* Cancel last deal for this judge */}
                {deals.filter(d => d.judgeId === judge.id).length > 0 && (
                  <button
                    onClick={() => {
                      const lastDeal = [...deals].reverse().find(d => d.judgeId === judge.id);
                      if (lastDeal) store.cancelDeal(lastDeal.id);
                    }}
                    className="w-full mt-1 h-6 rounded-sm border border-deal-red/20 text-[10px] font-mono text-deal-red/60 tracking-wider hover:text-deal-red hover:border-deal-red/40 transition-colors"
                  >
                    UNDO LAST DEAL
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats, Deals, Teams, Log */}
        <div className="bg-card rounded-md border border-border p-4 space-y-4">
          {/* Stats */}
          <div>
            <h2 className="font-display text-lg text-foreground mb-3 tracking-wider">EVENT STATS</h2>
            <div className="grid grid-cols-2 gap-3">
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
                <p className="font-mono text-2xl tabular-nums text-foreground">{Math.max(0, teams.length - currentTeamIndex - 1)}</p>
              </div>
            </div>
          </div>

          {/* Deal Log */}
          <div>
            <h3 className="font-display text-sm text-muted-foreground tracking-wider mb-2">DEAL LOG</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-deal-green tabular-nums">
                          {deal.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => store.cancelDeal(deal.id)}
                          className="text-[10px] text-deal-red/50 hover:text-deal-red transition-colors"
                          title="Cancel deal"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Team Queue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-sm text-muted-foreground tracking-wider">TEAM QUEUE</h3>
              <button
                onClick={() => setShowTeamForm(!showTeamForm)}
                className="text-[10px] font-mono text-deal-green tracking-wider hover:text-deal-green/80 transition-colors"
              >
                + ADD TEAM
              </button>
            </div>

            <AnimatePresence>
              {showTeamForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-2"
                >
                  <div className="p-2 bg-secondary rounded-sm space-y-2">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Team name"
                      className="w-full bg-background border border-border rounded-sm px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-deal-green/50"
                    />
                    <input
                      type="text"
                      value={newTeamDesc}
                      onChange={(e) => setNewTeamDesc(e.target.value)}
                      placeholder="Description"
                      className="w-full bg-background border border-border rounded-sm px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-deal-green/50"
                    />
                    <button
                      onClick={handleAddTeam}
                      className="w-full h-7 rounded-sm bg-deal-green font-mono text-[10px] text-primary-foreground tracking-wider"
                    >
                      ADD
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px]">
                      {i === currentTeamIndex ? 'ACTIVE' : i < currentTeamIndex ? 'DONE' : `#${i + 1}`}
                    </span>
                    {i > currentTeamIndex && (
                      <button
                        onClick={() => store.removeTeam(team.id)}
                        className="text-[10px] text-deal-red/40 hover:text-deal-red transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Log */}
          <div>
            <button
              onClick={() => setShowEventLog(!showEventLog)}
              className="font-display text-sm text-muted-foreground tracking-wider mb-2 hover:text-foreground transition-colors"
            >
              EVENT LOG {showEventLog ? '▴' : '▾'}
            </button>
            <AnimatePresence>
              {showEventLog && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {eventLog.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono">No events</p>
                    ) : (
                      [...eventLog].reverse().map(log => (
                        <div key={log.id} className="flex items-center justify-between p-1 text-[10px] font-mono text-muted-foreground">
                          <span>{log.action} {log.detail ? `· ${log.detail}` : ''}</span>
                          <span className="tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
