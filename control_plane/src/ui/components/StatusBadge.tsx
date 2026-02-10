import React from 'react';
import { Text } from 'ink';

export const StatusBadge = ({ status }: { status: 'operational' | 'degraded' | 'maintenance' }) => {
  const map = {
    operational: { label: 'OPERATIONAL', color: 'green' },
    degraded: { label: 'DEGRADED', color: 'yellow' },
    maintenance: { label: 'MAINTENANCE', color: 'blue' }
  };

  const s = map[status];

  return <Text color={s.color}>{s.label}</Text>;
};
