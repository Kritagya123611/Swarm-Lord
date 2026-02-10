// control_plane/ui/screens/App.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, Spacer } from 'ink';
import { CommandInput } from '../ui/components/CommandInput';
import { LogBox } from '../ui/components/LogBox';
import { StatusBadge } from '../ui/components/StatusBadge';
import { Dashboard } from '../ui/screens/Dashboard';
import { ApprovalRequest } from '../ui/screens/ApprovalRequest';

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
      <Box>
        <Text color="#00ff9d" bold>┌─[</Text>
        <Text color="#ffffff">root@swarm-lord</Text>
        <Text color="#00ff9d">]─[</Text>
        <Text color="#ffff00">~</Text>
        <Text color="#00ff9d">]</Text>
        <Spacer />
        <StatusBadge status={systemStatus} />
      </Box>

      {/* Main Content */}
      <Box flexDirection="column" marginTop={1}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'approval' && <ApprovalRequest />}
        
        {/* Logs Section */}
        <LogBox logs={logs} />
        
        {/* Command Input */}
        <CommandInput onCommand={handleCommand} />
      </Box>
    </Box>
  );
};