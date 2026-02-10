// control_plane/ui/index.ts
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App';

// Export components for external use
export { App } from './ui/App';
export { CommandInput } from './ui/components/CommandInput';
//export { LogBox } from './components/LogBox';
//export { StatusBadge } from './components/StatusBadge';

// Render the app if this is the main module

  render(<App />);



