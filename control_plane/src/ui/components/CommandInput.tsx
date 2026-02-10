// control_plane/ui/components/CommandInput.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommandInputProps {
  onCommand: (command: string) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onCommand }) => {
  const [input, setInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useInput((input, key) => {
    if (key.return) {
      // Execute command
      if (input.trim()) {
        onCommand(input);
        setCommandHistory(prev => [...prev, input]);
        setInput('');
        setCursorPosition(0);
        setHistoryIndex(-1);
      }
    } else if (key.leftArrow) {
      setCursorPosition(prev => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPosition(prev => Math.min(input.length, prev + 1));
    } else if (key.upArrow) {
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : 0;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        setCursorPosition(commandHistory[commandHistory.length - 1 - newIndex].length);
      }
    } else if (key.downArrow) {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        setCursorPosition(commandHistory[commandHistory.length - 1 - newIndex].length);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
        setCursorPosition(0);
      }
    } else if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newInput = input.slice(0, cursorPosition - 1) + input.slice(cursorPosition);
        setInput(newInput);
        setCursorPosition(prev => prev - 1);
      }
    } else if (!key.ctrl && !key.meta && input.length < 100) {
      // Add character at cursor position
      const newInput = input.slice(0, cursorPosition) + input + input.slice(cursorPosition);
      setInput(newInput);
      setCursorPosition(prev => prev + 1);
    }
  });

  return (
    <Box>
      <Text color="#00ff9d">└─$ </Text>
      <Box>
        <Text>
          {input.slice(0, cursorPosition)}
          <Text backgroundColor="#ffffff" color="#000000">
            {input[cursorPosition] || ' '}
          </Text>
          {input.slice(cursorPosition + 1)}
        </Text>
        <Text color="#666666">█</Text> {/* Blinking cursor */}
      </Box>
    </Box>
  );
};

