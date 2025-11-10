// Import polyfills FIRST before anything else to fix URL.protocol issues
import './polyfills';

import { AppRegistry } from 'react-native';
import App from './App';

// React Native requires the app to be registered with 'main' as the component name
// This matches the default expected by React Native
const appName = 'main';

// Register the app component
AppRegistry.registerComponent(appName, () => App);