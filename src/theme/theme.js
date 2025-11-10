import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#667eea',
    secondary: '#764ba2',
    tertiary: '#f093fb',
    error: '#ff4d4f',
    warning: '#fa8c16',
    info: '#1890ff',
    success: '#52c41a',
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f9f9f9',
    text: '#333333',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#333333',
    onSurface: '#333333',
    outline: '#e0e0e0',
  },
  roundness: 12,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#667eea',
    secondary: '#764ba2',
    tertiary: '#f093fb',
    error: '#ff4d4f',
    warning: '#fa8c16',
    info: '#1890ff',
    success: '#52c41a',
  },
  roundness: 12,
};
