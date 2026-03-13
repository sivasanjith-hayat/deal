import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useEventStore, type EventStatus, type Judge, type Team } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

// small form used inside the admin panel to add a judge
const AddJudgeForm = () => {
  const addJudge = useEventStore(state => state.addJudge);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addJudge({
      id: `j${Date.now()}`,
      name: name.trim(),
      balance: 10000,
      totalInvestment: 0,
      totalDeals: 0,
      isOnline: true,
    });
    setName('');
  };

  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        placeholder="Judge name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-mono text-foreground focus:outline-none"
      />
      <button
        onClick={handleAdd}
        className="px-3 py-1 bg-deal-green rounded-sm text-[10px] font-mono text-primary-foreground"
      >
        ADD
      </button>
    </div>
  );
};

// card used for each judge row with inline editing
const JudgeCard = ({ judge }: { judge: Judge }) => {
  const updateJudge = useEventStore(state => state.updateJudge);
  const toggleOnline = useEventStore(state => state.toggleJudgeOnline);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(judge.name);

  const save = () => {
    updateJudge(judge.id, { name: name.trim() });
    setEditing(false);
  };

  return (
    <div className="p-3 bg-secondary rounded-md relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${judge.isOnline ? 'bg-deal-green' : 'bg-deal-red'}`}
          />
          {editing ? (
            <input
              className="bg-secondary border border-border rounded-sm px-2 py-1 text-sm font-display"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={save}
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          ) : (
            <span className="font-display text-sm text-foreground cursor-pointer" onClick={() => setEditing(true)}>
              {judge.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleOnline(judge.id)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
          >
            {judge.isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>
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
          onClick={() => useEventStore.getState().adjustCredits(judge.id, 1000)}
          className="flex-1 h-7 rounded-sm bg-accent text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          +1000
        </button>
        <button
          onClick={() => useEventStore.getState().adjustCredits(judge.id, -1000)}
          className="flex-1 h-7 rounded-sm bg-accent text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          -1000
        </button>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const store = useEventStore();
  const {
    judges, teams, deals, status, currentTeamIndex, timerSeconds, timerRunning,
    eventLog, minInvestment, maxInvestment, multiInvestorMode,
    pitchDuration, dealWindowDuration,
  } = store;
  const currentTeam = teams[currentTeamIndex];

  const [showSettings, setShowSettings] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showTeamDirectory, setShowTeamDirectory] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamMembers, setNewTeamMembers] = useState('');

  const registerTeam = useAuthStore(s => s.registerTeam);

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

  const handleSelectTeam = useCallback((index: number) => {
    store.selectTeam(index);
    store.pushNotification(`Team ${teams[index]?.name} selected — pitch starting`, 'info');
  }, [store, teams]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    store.reorderTeams(result.source.index, result.destination.index);
  }, [store]);

  const handleAddTeam = useCallback(() => {
    if (!newTeamName.trim()) return;
    const newId = `t${Date.now()}`;
    const cleanName = newTeamName.trim().toUpperCase();
    store.addTeam({
      id: newId,
      name: cleanName,
      description: newTeamDesc.trim(),
      members: newTeamMembers.trim(),
    });
    registerTeam(newId, cleanName);
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamMembers('');
    setShowTeamForm(false);
  }, [store, newTeamName, newTeamDesc, newTeamMembers, registerTeam]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const totalInvested = deals.reduce((acc, d) => acc + d.amount, 0);

  const statusColors: Record<EventStatus, string> = {
    waiting: 'bg-muted-foreground',
    pitching: 'bg-deal-blue',
    deal_window: 'bg-deal-green',
    paused: 'bg-deal-yellow',
    ended: 'bg-deal-red',
  };

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
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => setShowTeamDirectory(true)}
              className="px-3 py-1 bg-deal-green/20 text-deal-green rounded-sm text-[10px] font-mono tracking-widest hover:bg-deal-green/30 transition-colors"
            >
              TEAM DIRECTORY
            </button>
            <button
              onClick={() => window.open('/projector', '_blank')}
              className="px-3 py-1 bg-deal-blue/20 text-deal-blue rounded-sm text-[10px] font-mono tracking-widest hover:bg-deal-blue/30 transition-colors"
            >
              WAR ROOM (VIEW)
            </button>
            <button
              onClick={() => window.open('/judge', '_blank')}
              className="px-3 py-1 bg-deal-yellow/20 text-deal-yellow rounded-sm text-[10px] font-mono tracking-widest hover:bg-deal-yellow/30 transition-colors"
            >
              JUDGE (VIEW)
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1 rounded-sm border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground tracking-widest transition-colors"
            >
              ⚙ SETTINGS
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-sm border border-deal-red/30 text-[10px] font-mono text-deal-red hover:bg-deal-red/10 tracking-widest transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Team Directory Modal */}
      <AnimatePresence>
        {showTeamDirectory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-md border border-border flex flex-col shadow-2xl"
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-display text-2xl text-foreground tracking-wider">TEAM DIRECTORY</h2>
                  <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">DETAILS & CREDENTIALS</p>
                </div>
                <button
                  onClick={() => setShowTeamDirectory(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-4">
                {teams.map(team => {
                  const authUser = useAuthStore.getState().users.find(u => u.teamId === team.id || u.username === team.name.toUpperCase());
                  return (
                    <div key={team.id} className="p-4 bg-secondary rounded-md border border-border/50">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display text-xl text-deal-green tracking-wider mb-1">{team.name}</h3>
                          <div className="mb-3">
                            <p className="text-[10px] text-muted-foreground font-mono tracking-widest mb-0.5">IDEA / PITCH</p>
                            <p className="text-sm text-foreground">{team.description}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-mono tracking-widest mb-0.5">MEMBERS</p>
                            <p className="text-sm text-foreground">{team.members || 'No members listed'}</p>
                          </div>
                        </div>
                        <div className="sm:w-64 bg-background p-3 rounded-sm border border-border/50 flex flex-col justify-center">
                          <p className="text-[10px] text-deal-yellow font-mono tracking-widest mb-2 border-b border-border/50 pb-1">APP CREDENTIALS</p>
                          {authUser ? (
                            <div className="space-y-1.5">
                              <div>
                                <span className="text-[10px] text-muted-foreground font-mono inline-block w-16">USER:</span>
                                <span className="font-mono text-sm text-foreground">{authUser.username}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground font-mono inline-block w-16">PASS:</span>
                                <span className="font-mono text-sm text-foreground bg-secondary px-1.5 py-0.5 rounded-sm">{authUser.password}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-deal-red font-mono">No linked account</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <div className="flex flex-col opacity-50">
                  <label className="text-[10px] text-muted-foreground tracking-widest block mb-1">MULTI-INVESTOR</label>
                  <button
                    disabled
                    className="flex-1 rounded-sm font-mono text-xs tracking-wider bg-deal-green text-primary-foreground cursor-not-allowed"
                  >
                    ALWAYS ON
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
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-secondary rounded-md">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">Current Pitcher</p>
              <p className="font-display text-xl text-deal-green leading-tight">{currentTeam?.name || 'STANDBY'}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                {currentTeamIndex + 1} of {teams.length} Teams
              </p>
            </div>

            <div className="p-3 bg-deal-blue/5 border border-deal-blue/20 rounded-md">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">Queued Next</p>
              <p className="font-display text-lg text-deal-blue leading-tight">
                {teams[currentTeamIndex + 1]?.name || 'NONE (END OF QUEUE)'}
              </p>
              {teams[currentTeamIndex + 1] && (
                <button
                  onClick={() => store.nextTeam()}
                  disabled={isEnded}
                  className="mt-2 w-full py-1 bg-deal-blue/20 text-deal-blue hover:bg-deal-blue/30 rounded-sm text-[10px] font-mono tracking-widest transition-colors disabled:opacity-30"
                >
                  START NEXT PITCH →
                </button>
              )}
            </div>
          </div>

          {/* Timer */}
          <div className="mb-4 p-3 bg-secondary rounded-md text-center">
            <p className="font-mono text-4xl tabular-nums text-foreground">{formatTime(timerSeconds)}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${timerRunning ? 'bg-deal-green animate-pulse' : 'bg-muted-foreground'}`} />
              <p className="text-[10px] text-muted-foreground tracking-widest">
                {timerRunning ? 'TIMER ACTIVE' : 'TIMER STOPPED'}
              </p>
            </div>
          </div>

          {/* Select Next Team & Queue Reordering */}
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-2">TEAM QUEUE (DRAG TO REORDER)</p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="teams">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1"
                  >
                    {teams.map((team, i) => (
                      <Draggable key={team.id} draggableId={team.id} index={i} isDragDisabled={isEnded || i <= currentTeamIndex}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                            className={`w-full flex items-center justify-between p-2 rounded-sm text-xs transition-all ${i === currentTeamIndex
                              ? 'bg-deal-green/20 text-deal-green border border-deal-green/30 cursor-default'
                              : i < currentTeamIndex
                                ? 'text-muted-foreground/50 line-through bg-secondary/50 cursor-not-allowed'
                                : snapshot.isDragging
                                  ? 'bg-deal-blue/20 border border-deal-blue/30 scale-105 z-10 shadow-lg cursor-grabbing'
                                  : 'text-foreground bg-secondary hover:bg-deal-blue/10 hover:border-deal-blue/30 border border-transparent cursor-grab'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {/* Drag handle icon (only for mutable items) */}
                              {i > currentTeamIndex && !isEnded && (
                                <span className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                                  ⋮⋮
                                </span>
                              )}
                              <span className="font-display truncate max-w-[100px]">{team.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {i > currentTeamIndex && !isEnded && (
                                <>
                                  <button
                                    onClick={() => store.setNextTeam(team.id)}
                                    title="Set as next presenter"
                                    className="px-2 py-0.5 rounded-sm bg-deal-blue/10 text-deal-blue text-[9px] hover:bg-deal-blue/20 transition-colors uppercase font-mono"
                                  >
                                    Set Next
                                  </button>
                                  <button
                                    onClick={() => handleSelectTeam(i)}
                                    title="Present immediately"
                                    className="px-2 py-0.5 rounded-sm bg-deal-green/10 text-deal-green text-[9px] hover:bg-deal-green/20 transition-colors uppercase font-mono"
                                  >
                                    Present Now
                                  </button>
                                </>
                              )}
                              <span className="font-mono text-[10px] w-12 text-right shrink-0">
                                {i === currentTeamIndex ? '▶ ACTIVE' : i < currentTeamIndex ? 'DONE' : `#${i + 1}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <button onClick={openDealWindow} disabled={isEnded} className="w-full h-12 rounded-md bg-deal-green font-display text-lg font-bold tracking-wider text-primary-foreground disabled:opacity-30">
              OPEN DEAL WINDOW
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={closeDealWindow} disabled={isEnded} className="h-10 rounded-md bg-deal-red font-display text-sm font-bold tracking-wider text-destructive-foreground disabled:opacity-30">
                CLOSE WINDOW
              </button>
              <button
                onClick={() => store.setProjectorMode('war_room')}
                className="h-10 rounded-md bg-secondary border border-border font-display text-sm font-bold tracking-wider text-foreground"
              >
                WAR ROOM
              </button>
            </div>

            {/* End */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <button
                onClick={() => store.endEvent()}
                disabled={isEnded}
                className="h-9 rounded-md bg-deal-red font-mono text-[10px] font-bold tracking-widest text-destructive-foreground disabled:opacity-30"
              >
                END EVENT
              </button>
              <button
                onClick={() => store.resetEvent()}
                className="h-9 rounded-sm border border-deal-red/30 text-[10px] font-mono text-deal-red tracking-wider hover:bg-deal-red/10 transition-colors"
              >
                RESET ALL
              </button>
            </div>

            {/* Emergency Overrides */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground tracking-widest mb-2">EMERGENCY</p>
              <button
                onClick={() => store.reopenDealWindow()}
                className="w-full h-8 rounded-sm border border-deal-yellow/30 text-[10px] font-mono text-deal-yellow tracking-wider hover:bg-deal-yellow/10 transition-colors"
              >
                REOPEN DEAL WINDOW
              </button>
            </div>
          </div>
        </div>

        {/* Judges Monitor */}
        <div className="bg-card rounded-md border border-border p-4">
          <h2 className="font-display text-lg text-foreground mb-4 tracking-wider">JUDGES MONITOR</h2>
          <AddJudgeForm />
          <div className="space-y-3">
            {judges.map(judge => (
              <JudgeCard key={judge.id} judge={judge} />
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

          {/* Team Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-sm text-muted-foreground tracking-wider">TEAM MANAGEMENT</h3>
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
                    <input
                      type="text"
                      value={newTeamMembers}
                      onChange={(e) => setNewTeamMembers(e.target.value)}
                      placeholder="Members (comma separated)"
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
                  className={`flex items-center justify-between p-2 rounded-sm text-xs ${i === currentTeamIndex ? 'bg-deal-green/10 text-deal-green' :
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
