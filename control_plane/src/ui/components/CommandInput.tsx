import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommandInputProps {
  onCommand: (command: string) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onCommand }) => {
  const [value, setValue] = useState('');
  const [cursor, setCursor] = useState(0);

  useInput((char, key) => {
    if (key.return) {
      if (value.trim()) {
        onCommand(value);
        setValue('');
        setCursor(0);
      }
      return;
    }

    if (key.backspace && cursor > 0) {
      setValue(v => v.slice(0, cursor - 1) + v.slice(cursor));
      setCursor(c => c - 1);
      return;
    }

    if (key.leftArrow) {
      setCursor(c => Math.max(0, c - 1));
      return;
    }

    if (key.rightArrow) {
      setCursor(c => Math.min(value.length, c + 1));
      return;
    }

    if (!key.ctrl && !key.meta && char) {
      setValue(v => v.slice(0, cursor) + char + v.slice(cursor));
      setCursor(c => c + 1);
    }
  });

  return (
    <Box>
      <Text color="green">└─$ </Text>
      <Text>
        {value.slice(0, cursor)}
        <Text inverse>{value[cursor] ?? ' '}</Text>
        {value.slice(cursor + 1)}
      </Text>
    </Box>
  );
};
