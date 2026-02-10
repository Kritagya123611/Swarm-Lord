// control_plane/ui/screens/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, Spacer } from 'ink';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    agents: 12,
    services: 8,
    pendingApprovals: 3,
    uptime: '99.87%',
    cpuUsage: 42,
    memoryUsage: 67
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(10, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.min(100, Math.max(20, prev.memoryUsage + (Math.random() - 0.5) * 5))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const renderProgressBar = (percentage: number, color: string) => {
    const width = 20;
    const filled = Math.floor((percentage / 100) * width);

    return (
      <Box>
        <Text color={color}>
          {'█'.repeat(filled)}
          {'░'.repeat(width - filled)}
        </Text>
        <Text> {percentage.toFixed(1)}%</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Text color="#00ff9d" bold>
        ┌─[ DASHBOARD ]──────────────────────────────┐
      </Text>

      {/* Overview + Resources */}
      <Box marginTop={1}>
        <Box flexDirection="column" width="50%">
          <Text bold>SYSTEM OVERVIEW</Text>

          <Box>
            <Text>Active Agents:</Text>
            <Spacer />
            <Text color="#00ff9d" bold>{stats.agents}</Text>
          </Box>

          <Box>
            <Text>Managed Services:</Text>
            <Spacer />
            <Text color="#00bcd4" bold>{stats.services}</Text>
          </Box>

          <Box>
            <Text>Pending Approvals:</Text>
            <Spacer />
            <Text color={stats.pendingApprovals > 0 ? '#ffaa00' : '#00ff9d'} bold>
              {stats.pendingApprovals}
            </Text>
          </Box>

          <Box>
            <Text>System Uptime:</Text>
            <Spacer />
            <Text color="#00ff9d" bold>{stats.uptime}</Text>
          </Box>
        </Box>

        <Box flexDirection="column" width="50%">
          <Text bold>RESOURCE USAGE</Text>

          <Box>
            <Text>CPU:</Text>
            <Spacer />
            {renderProgressBar(stats.cpuUsage, '#00ff9d')}
          </Box>

          <Box>
            <Text>Memory:</Text>
            <Spacer />
            {renderProgressBar(stats.memoryUsage, '#00bcd4')}
          </Box>
        </Box>
      </Box>

      {/* Active workflows */}
      <Box marginTop={2}>
        <Text bold>ACTIVE WORKFLOWS</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="#00ff9d">✓</Text>
          <Text> api-service deployment to staging</Text>
          <Spacer />
          <Text dimColor>2m ago</Text>
        </Box>

        <Box>
          <Text color="#ffaa00">⚠</Text>
          <Text> database migration approval pending</Text>
          <Spacer />
          <Text dimColor>5m ago</Text>
        </Box>

        <Box>
          <Text color="#00bcd4">⟳</Text>
          <Text> monitoring agent scaling (75%)</Text>
          <Spacer />
          <Text dimColor>Now</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color="#00ff9d" bold>
          └────────────────────────────────────────────────────┘
        </Text>
      </Box>
    </Box>
  );
};
