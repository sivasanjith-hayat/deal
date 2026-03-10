import { motion } from 'framer-motion';

interface DealLockOverlayProps {
  options: number[];
  maxAmount: number;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

export const DealLockOverlay = ({ options, maxAmount, onConfirm, onCancel }: DealLockOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-deal-green"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h2 className="font-display text-6xl font-bold text-primary-foreground tracking-wider mb-2">
          ARMED
        </h2>
        <p className="text-primary-foreground/70 font-mono text-sm tracking-widest mb-10">
          SELECT INVESTMENT AMOUNT
        </p>

        <div className="grid grid-cols-2 gap-4 px-8 mb-8">
          {options.filter(o => o <= maxAmount).map((amount) => (
            <motion.button
              key={amount}
              whileTap={{ scale: 0.93 }}
              onClick={() => onConfirm(amount)}
              className="h-16 rounded-md bg-primary-foreground/20 border-2 border-primary-foreground/40 font-mono text-xl font-bold text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
            >
              {amount.toLocaleString()}
            </motion.button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="font-mono text-sm text-primary-foreground/50 tracking-widest hover:text-primary-foreground transition-colors"
        >
          DISARM
        </button>
      </motion.div>
    </motion.div>
  );
};
