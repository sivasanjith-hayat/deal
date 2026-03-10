import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '@/store/eventStore';

const ProjectorDisplay = () => {
  const { projectorMode, timerSeconds, lastDeal, teams, currentTeamIndex } = useEventStore();
  const currentTeam = teams[currentTeamIndex];

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center overflow-hidden">
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
              <p className="font-display text-2xl sm:text-3xl text-muted-foreground tracking-[0.3em] mb-6">
                {currentTeam.name}
              </p>
            )}
            <div className="font-mono text-[8rem] sm:text-[12rem] lg:text-[16rem] tabular-nums text-foreground leading-none">
              {formatTime(timerSeconds)}
            </div>
            <p className="font-mono text-sm text-muted-foreground tracking-[0.5em] mt-4">
              DEAL WINDOW
            </p>
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
      </AnimatePresence>
    </div>
  );
};

export default ProjectorDisplay;
