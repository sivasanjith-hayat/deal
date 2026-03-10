import { useEventStore } from '@/store/eventStore';
import { Link } from 'react-router-dom';

const Index = () => {
  const { status } = useEventStore();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center mb-12">
        <h1 className="font-display text-5xl sm:text-7xl font-bold text-foreground tracking-wider mb-4">
          SHARK TANK
        </h1>
        <p className="font-mono text-sm text-muted-foreground tracking-[0.3em]">
          REAL-TIME DEAL SYSTEM
        </p>
        <div className="w-16 h-px bg-muted-foreground/30 mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <Link
          to="/judge"
          className="group flex flex-col items-center justify-center p-6 rounded-md border border-border bg-card hover:border-deal-green/50 transition-colors"
        >
          <div className="w-3 h-3 rounded-full bg-deal-green mb-3 group-hover:shadow-[0_0_12px_hsl(var(--deal-green)/0.5)] transition-shadow" />
          <span className="font-display text-lg text-foreground tracking-wider">JUDGE PANEL</span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">DECISION INTERFACE</span>
        </Link>

        <Link
          to="/projector"
          className="group flex flex-col items-center justify-center p-6 rounded-md border border-border bg-card hover:border-foreground/30 transition-colors"
        >
          <div className="w-3 h-3 rounded-full bg-foreground mb-3" />
          <span className="font-display text-lg text-foreground tracking-wider">WAR ROOM</span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">PROJECTOR DISPLAY</span>
        </Link>

        <Link
          to="/admin"
          className="group flex flex-col items-center justify-center p-6 rounded-md border border-border bg-card hover:border-deal-blue/50 transition-colors"
        >
          <div className="w-3 h-3 rounded-full bg-deal-blue mb-3 group-hover:shadow-[0_0_12px_hsl(var(--deal-blue)/0.5)] transition-shadow" />
          <span className="font-display text-lg text-foreground tracking-wider">ADMIN</span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">EVENT CONTROL</span>
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'waiting' ? 'bg-muted-foreground' : 'bg-deal-green'}`} />
        <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          {status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};

export default Index;
