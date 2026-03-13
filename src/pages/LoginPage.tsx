import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import Cubes from '@/components/Cubes';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, changePassword } = useAuthStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Password-change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changeError, setChangeError] = useState('');
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);
    const [pendingRole, setPendingRole] = useState<string | null>(null);

    const redirectByRole = (role: string) => {
        switch (role) {
            case 'admin':
                navigate('/admin', { replace: true });
                break;
            case 'shark':
                navigate('/judge', { replace: true });
                break;
            case 'team':
                navigate('/projector', { replace: true });
                break;
            default:
                navigate('/', { replace: true });
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = login(username.trim(), password);
        if (!user) {
            setError('Invalid username or password');
            return;
        }

        if (user.isFirstLogin) {
            setPendingUserId(user.id);
            setPendingRole(user.role);
            setShowPasswordChange(true);
            return;
        }

        redirectByRole(user.role);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setChangeError('');

        if (newPassword.length < 4) {
            setChangeError('Password must be at least 4 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setChangeError('Passwords do not match');
            return;
        }
        if (!pendingUserId) return;

        changePassword(pendingUserId, newPassword);
        redirectByRole(pendingRole || 'team');
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
            {/* Interactive Cubes Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
                <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                    <Cubes
                        gridSize={16}
                        maxAngle={180}
                        radius={4}
                        borderStyle="1px solid rgba(255,255,255,0.2)"
                        faceColor="#000000"
                        rippleColor="#FFFFFF"
                        rippleSpeed={2}
                        autoAnimate
                        rippleOnClick
                    />
                </div>
            </div>

            {/* Decorative top line */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-deal-green/60 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            <div className="relative z-50 pointer-events-none w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {!showPasswordChange ? (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="w-full max-w-sm relative z-10 bg-background/80 backdrop-blur-md p-8 rounded-xl border border-border/50 shadow-2xl pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="text-center mb-10">
                                <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground tracking-wider mb-2">
                                    SHARK TANK
                                </h1>
                                <p className="font-mono text-[10px] text-muted-foreground tracking-[0.4em]">
                                    COMMAND CENTER — AUTHENTICATE
                                </p>
                                <div className="w-16 h-px bg-muted-foreground/30 mx-auto mt-4" />
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-muted-foreground tracking-widest mb-1.5">
                                        USERNAME
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toUpperCase())}
                                        autoFocus
                                        className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-deal-green/50 transition-colors tracking-wider"
                                        placeholder="ENTER USERNAME"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-muted-foreground tracking-widest mb-1.5">
                                        PASSWORD
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-deal-green/50 transition-colors tracking-wider"
                                        placeholder="••••••"
                                    />
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-xs font-mono text-deal-red tracking-wider"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full h-12 rounded-md bg-deal-green font-display text-lg font-bold tracking-wider text-primary-foreground hover:brightness-110 transition-all"
                                >
                                    LOGIN
                                </motion.button>
                            </form>

                            {/* Hint */}
                            <div className="mt-8 text-center">
                                <p className="text-[10px] text-muted-foreground/60 font-mono tracking-wider">
                                    ADMIN — ENEXUS / SHARKTANK
                                </p>
                                <p className="text-[10px] text-muted-foreground/40 font-mono tracking-wider mt-1">
                                    TEAMS — PASSWORD IS NAME REVERSED
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        /* Password Change Form */
                        <motion.div
                            key="change-password"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="w-full max-w-sm relative z-10 bg-background/80 backdrop-blur-md p-8 rounded-xl border border-border/50 shadow-2xl pointer-events-auto"
                        >
                            <div className="text-center mb-10">
                                <div className="w-10 h-10 rounded-full border-2 border-deal-yellow mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-deal-yellow text-lg">!</span>
                                </div>
                                <h2 className="font-display text-3xl font-bold text-foreground tracking-wider mb-2">
                                    CHANGE PASSWORD
                                </h2>
                                <p className="font-mono text-[10px] text-muted-foreground tracking-[0.3em]">
                                    FIRST LOGIN — SET YOUR NEW PASSWORD
                                </p>
                                <div className="w-16 h-px bg-deal-yellow/30 mx-auto mt-4" />
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-muted-foreground tracking-widest mb-1.5">
                                        NEW PASSWORD
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoFocus
                                        className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-deal-yellow/50 transition-colors tracking-wider"
                                        placeholder="NEW PASSWORD"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-muted-foreground tracking-widest mb-1.5">
                                        CONFIRM PASSWORD
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-deal-yellow/50 transition-colors tracking-wider"
                                        placeholder="RE-ENTER PASSWORD"
                                    />
                                </div>

                                <AnimatePresence>
                                    {changeError && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-xs font-mono text-deal-red tracking-wider"
                                        >
                                            {changeError}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full h-12 rounded-md bg-deal-yellow font-display text-lg font-bold tracking-wider text-warning-foreground hover:brightness-110 transition-all"
                                >
                                    SET PASSWORD
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom decorative line */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-deal-green/30 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            />
        </div>
    );
};

export default LoginPage;
