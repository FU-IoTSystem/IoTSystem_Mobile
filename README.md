# IoT Kit Rental - Mobile App (Expo SDK 54)

## ✅ Upgraded to Expo SDK 54!

Your mobile app is now running on the latest Expo SDK 54 with React Native 0.81.5.

## 🚀 Quick Start

### 1. Start the App
```bash
npm start
```

### 2. Choose Your Platform
- Press **`a`** to open on Android emulator
- Press **`i`** to open on iOS simulator
- Scan **QR code** with Expo Go app on your phone

## 📱 Test on Your Phone

1. Install **Expo Go** from App Store or Play Store
2. Make sure phone and computer are on same WiFi
3. Run `npm start` and scan the QR code

## ⚙️ Configuration

### Backend API
Configured in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://192.168.1.9:8080';
```

## 📊 Tech Stack

- **Expo SDK**: 54.0.0
- **React Native**: 0.81.5
- **React**: 19.1.0
- **React Navigation**: v7
- **AsyncStorage**: 2.2.0
- **Icons**: @expo/vector-icons
- **Axios**: 1.10.0
- **Day.js**: 1.11.10

## 🏗️ Project Structure

```
mobile/
├── App.js              # Root component
├── index.js            # Entry point
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── assets/             # Images and icons
└── src/
    ├── navigation/     # AppNavigator
    ├── screens/        # 24 screens
    │   ├── auth/       # Login, Register
    │   ├── member/     # Member portal 
    │   ├── leader/     # Leader portal
    │   ├── lecturer/   # Lecturer portal
    │   ├── admin/      # Admin portal
    │   ├── academic/   # Academic Affairs
    │   └── shared/     # Shared screens
    └── services/
        └── api.js      # API integration 
```

## ✨ Features

### ✅ Fully Implemented
- Authentication (Login,Register)
- Member dashboard with wallet
- Transaction history
- Notifications
- Group management
- Role-based navigation
- Full API integration

## 🛠️ Commands

```bash
npm start         # Start Expo dev server
npm run android   # Open on Android
npm run ios       # Open on iOS
npm run web       # Open in browser
```

## 🐛 Troubleshooting

### Metro bundler issues
```bash
npx expo start -c
```

### Can't connect to backend
- Check `src/services/api.js` API_BASE_URL
- Verify backend is running
- Check firewall settings

### Module errors
```bash
npm install
npx expo start -c
```

## 📚 Documentation

- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **SDK 54 Changes**: https://blog.expo.dev/expo-sdk-54-is-now-available

## 🎯 Next Steps

1. ✅ Run the app
2. ✅ Test login
3. ✅ Navigate screens
4. ⏳ Add remaining features
5. ⏳ Test on devices
6. ⏳ Deploy to stores

## 🎉 Ready to Go!

Your mobile app is fully upgraded and ready to use!

```bash
npm start
```

Happy coding! 🚀
