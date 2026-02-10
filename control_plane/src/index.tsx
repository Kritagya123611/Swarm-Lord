// control_plane/ui/index.tsx
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';

// Export components (optional, but fine)
export { App } from './ui/App.js';
export { CommandInput } from './ui/components/CommandInput.js';
export { LogBox } from './ui/components/LogBox.js';
export { StatusBadge } from './ui/components/StatusBadge.js';

// Direct render (ESM-safe)
render(<App />);
