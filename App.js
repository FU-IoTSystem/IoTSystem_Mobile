// Import polyfills first to fix URL.protocol issues
import './polyfills';

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}

