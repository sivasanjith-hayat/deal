import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage.tsx";
import JudgePanel from "./pages/JudgePanel.tsx";
import ProjectorDisplay from "./pages/ProjectorDisplay.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useAuthStore } from "./store/authStore.ts";
import { useEventStore } from "./store/eventStore.ts";
import { io } from "socket.io-client";
import DotGrid from "./components/DotGrid.tsx";

const queryClient = new QueryClient();

// Connect to the same host/port serving the Vite app
const socket = io();

const StoreSync = () => {
  useEffect(() => {
    // 1. LocalStorage sync (for identical browser tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dealmaker-event-storage') {
        useEventStore.persist?.rehydrate();
      }
      if (e.key === 'dealmaker-auth-storage') {
        useAuthStore.persist?.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. WebSocket sync (for cross-device synchronization)
    let isEventSocketUpdate = false;
    let isAuthSocketUpdate = false;

    const handleEventSync = (newState: any) => {
      isEventSocketUpdate = true;
      // Zustand setState performs a shallow merge, so functions are preserved.
      useEventStore.setState(newState);
      // reset flag after state updates
      setTimeout(() => { isEventSocketUpdate = false; }, 50);
    };

    const handleAuthSync = (newState: any) => {
      isAuthSocketUpdate = true;
      useAuthStore.setState(newState);
      setTimeout(() => { isAuthSocketUpdate = false; }, 50);
    };

    socket.on("sync-event-state", handleEventSync);
    socket.on("sync-auth-state", handleAuthSync);

    const unsubscribeEvent = useEventStore.subscribe((state) => {
      if (!isEventSocketUpdate) {
        socket.emit("update-event-state", state);
      }
    });

    const unsubscribeAuth = useAuthStore.subscribe((state) => {
      if (!isAuthSocketUpdate) {
        socket.emit("update-auth-state", state);
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorage);
      socket.off("sync-event-state", handleEventSync);
      socket.off("sync-auth-state", handleAuthSync);
      unsubscribeEvent();
      unsubscribeAuth();
    };
  }, []);
  return null;
};

const BackgroundWrapper = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <DotGrid
        dotSize={16}
        gap={32}
        baseColor="#222222"
        activeColor="#00FF00"
        proximity={150}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreSync />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackgroundWrapper />
        <div className="relative z-10 w-full min-h-screen pointer-events-none *:pointer-events-auto">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* Shark / Admin view */}
            <Route
              path="/judge"
              element={
                <ProtectedRoute allowedRoles={['shark', 'admin']}>
                  <JudgePanel />
                </ProtectedRoute>
              }
            />

            {/* War Room — accessible to all authenticated users */}
            <Route
              path="/projector"
              element={
                <ProtectedRoute allowedRoles={['admin', 'shark', 'team']}>
                  <ProjectorDisplay />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
