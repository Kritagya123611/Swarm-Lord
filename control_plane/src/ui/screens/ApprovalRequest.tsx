// control_plane/ui/screens/ApprovalRequest.tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export const ApprovalRequest = () => {
  const [selectedOption, setSelectedOption] = useState<'approve' | 'reject' | 'details'>('approve');
  const [approved, setApproved] = useState<boolean | null>(null);

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectedOption('approve');
    } else if (key.rightArrow) {
      setSelectedOption('reject');
    } else if (key.downArrow || key.upArrow) {
      setSelectedOption('details');
    } else if (key.return && approved === null) {
      if (selectedOption === 'approve') {
        setApproved(true);
        // In real app, this would trigger the actual deployment
      } else if (selectedOption === 'reject') {
        setApproved(false);
      }
    }
  });

  const renderButton = (text: string, isSelected: boolean, color: string) => (
    <Box 
      paddingX={2} 
      paddingY={1}
      borderStyle={isSelected ? 'bold' : 'single'}
      borderColor={isSelected ? color : '#333333'}
    >
      <Text color={isSelected ? color : '#666666'} bold={isSelected}>
        {text}
      </Text>
    </Box>
  );

  if (approved !== null) {
    return (
      <Box flexDirection="column">
        <Text color="#00ff9d" bold>┌─[ APPROVAL RESULT ]──────────────────────────┐</Text>
        <Box marginTop={2} justifyContent="center">
          <Text color={approved ? '#00ff9d' : '#ff5555'} bold>
            {approved ? '✓ APPROVED' : '✗ REJECTED'}
          </Text>
        </Box>
        <Text marginTop={1}>
          {approved 
            ? 'Execution will proceed. Deployment initiated...'
            : 'Execution halted. Returning to dashboard...'
          }
        </Text>
        <Text color="#00ff9d" bold marginTop={1}>└────────────────────────────────────────────────────┘</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="#00ff9d" bold>┌─[ APPROVAL REQUIRED ]────────────────────────┐</Text>
      
      <Box marginTop={2} flexDirection="column">
        <Text bold color="#ffffff">OPERATION: </Text>
        <Text color="#00bcd4">deploy service api --env=production</Text>
        
        <Box marginTop={2}>
          <Text bold color="#ffffff">CHANGESET:</Text>
        </Box>
        <Box flexDirection="column" marginLeft={2}>
          <Text color="#00ff9d">+</Text>
          <Text color="#cccccc"> Create 3 new pods (api-v2.1.0)</Text>
          <Text color="#ffaa00">~</Text>
          <Text color="#cccccc"> Update service load balancer configuration</Text>
          <Text color="#ff5555">-</Text>
          <Text color="#cccccc"> Remove old pods (api-v2.0.1)</Text>
        </Box>

        <Box marginTop={2}>
          <Text bold color="#ffffff">IMPACT:</Text>
          <Text color="#cccccc"> 2-3 minutes downtime during cutover</Text>
        </Box>

        <Box marginTop={3} justifyContent="center" gap={4}>
          {renderButton('APPROVE', selectedOption === 'approve', '#00ff9d')}
          {renderButton('VIEW DETAILS', selectedOption === 'details', '#00bcd4')}
          {renderButton('REJECT', selectedOption === 'reject', '#ff5555')}
        </Box>

        <Box marginTop={2} justifyContent="center">
          <Text color="#666666" italic>
            Use ←→ arrows to select, Enter to confirm
          </Text>
        </Box>
      </Box>

      <Text color="#00ff9d" bold marginTop={2}>└────────────────────────────────────────────────────┘</Text>
    </Box>
  );
};