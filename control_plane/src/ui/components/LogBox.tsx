// control_plane/ui/components/LogBox.tsx
import React from 'react';
import { Box, Text } from 'ink';

interface LogBoxProps {
  logs: string[];
  maxLines?: number;
}

export const LogBox: React.FC<LogBoxProps> = ({ logs, maxLines = 10 }) => {
  const displayLogs = logs.slice(-maxLines);

  const getLogColor = (log: string) => {
    if (log.includes('ERROR') || log.includes('FAILED')) return '#ff5555';
    if (log.includes('WARN') || log.includes('⚠️')) return '#ffaa00';
    if (log.includes('SUCCESS') || log.includes('✓')) return '#00ff9d';
    if (log.includes('CMD:')) return '#00bcd4';
    return '#cccccc';
  };

  return (
    <Box 
      flexDirection="column" 
      borderStyle="single" 
      borderColor="#333333"
      padding={1}
      marginTop={1}
      marginBottom={1}
    >
      <Text color="#666666" dimColor>=== SYSTEM LOGS ===</Text>
      {displayLogs.map((log, index) => (
        <Text key={index} color={getLogColor(log)}>
          {log}
        </Text>
      ))}
      {logs.length === 0 && (
        <Text color="#666666" italic>No logs yet. System ready.</Text>
      )}
    </Box>
  );
};