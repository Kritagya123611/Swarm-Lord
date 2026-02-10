// control_plane/ui/screens/App.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, Spacer } from 'ink';
import { CommandInput } from '../ui/components/CommandInput';
//import { LogBox } from '../components/LogBox';
//import { StatusBadge } from '../components/StatusBadge/StatusBadge';
//import { Dashboard } from '../screens/Dashboard';
//import { ApprovalRequest } from '../screens/ApprovalRequest';

export const App = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'approval' | 'terminal'>('dashboard');
  const [logs, setLogs] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'maintenance'>('operational');

  useEffect(() => {
    // Simulate log updates
    const interval = setInterval(() => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      setLogs(prev => [...prev.slice(-9), `[${timestamp}] System heartbeat - OK`]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCommand = (command: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, `[${timestamp}] CMD: ${command}`]);
    
    // Parse commands
    if (command.includes('approval')) {
      setCurrentView('approval');
    } else if (command.includes('dashboard') || command.includes('status')) {
      setCurrentView('dashboard');
    } else if (command.includes('deploy') || command.includes('apply')) {
      setLogs(prev => [...prev, `[${timestamp}] ⚠️  Execution requires approval`]);
      setCurrentView('approval');
    }
  };

  return (
    <Box 
      flexDirection="column" 
      width="100%" 
      height="100%"
      padding={1}
      borderStyle="round"
      borderColor="#00ff9d"
    >
      {/* Header */}
      

      {/* Main Content */}
    </Box>
  );
};