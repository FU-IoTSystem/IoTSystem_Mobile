# IoT Kit Rental System - Mobile App (Expo SDK 54)

### 📱 Các vai trò (Roles) trong ứng dụng
1. **Admin** - Quản trị viên hệ thống
2. **Academic** - Quản lý học thuật
3. **Lecturer** - Giảng viên
4. **Leader** - Trưởng nhóm
5. **Member** - Thành viên

### 🔑 Các tính năng chính
- **Authentication**: Login/Register
- **QR Code Scanning**: Quét QR để quản lý kit
- **Wallet**: Quản lý ví tiền
- **Rental Management**: Quản lý cho thuê thiết bị IoT
- **Group Management**: Quản lý nhóm
- **Penalty System**: Hệ thống phạt
- **Transaction History**: Lịch sử giao dịch

## ⚙️ Configuration

### API
Configured in `src/services/api.js`:
```javascript
const API_BASE_URL = 'https://iot-system-kit.azurewebsites.net';
```

## 📊 Tech Stack
- **Framework**: React Native and Expo (~54.0.0)
- **React Version**: 19.1.0
- **Navigation**: React Navigation (Stack, Drawer, Bottom Tabs)
- **UI Library**: React Native Paper
- **State Management**: React Context (AuthContext)

## 🏗️ Project Structure

```
iotsystem_mobile/
├── .git/                             # Git repository
│
└── mobile/                           # React Native/Expo mobile application
    │
    ├── 📱 Core Application Files
    │   ├── App.js                    # Main application component
    │   ├── index.js                  # Entry point
    │   ├── app.json                  # Expo configuration
    │   ├── package.json              # Dependencies & scripts
    │   ├── package-lock.json         # Locked dependencies
    │   ├── babel.config.js           # Babel configuration
    │   ├── metro.config.js           # Metro bundler config
    │   ├── eas.json                  # EAS Build configuration
    │   ├── polyfills.js              # Polyfills for compatibility
    │   │
    │   └── 📄 Documentation
    │        └── README.md
    │
    ├── 📂 src/                       # Source code
    │   │
    │   ├── components/               # Reusable layout components
    │   │   ├── AdminLayout.js
    │   │   ├── LeaderLayout.js
    │   │   ├── LecturerLayout.js
    │   │   └── MemberLayout.js
    │   │
    │   ├── contexts/                 # React Context providers
    │   │   └── AuthContext.js        # Authentication context
    │   │
    │   ├── navigation/               # Navigation configuration
    │   │   └── AppNavigator.js       # Main navigation setup
    │   │
    │   ├── screens/                  # Screen components (organized by role)
    │   │   │
    │   │   ├── academic/             # Academic role screens
    │   │   │   ├── AcademicClasses.js
    │   │   │   ├── AcademicDashboard.js
    │   │   │   ├── AcademicLecturers.js
    │   │   │   ├── AcademicStudentEnrollment.js
    │   │   │   └── AcademicStudents.js
    │   │   │
    │   │   ├── admin/                # Admin role screens
    │   │   │   ├── AdminApprovals.js
    │   │   │   ├── AdminDashboard.js
    │   │   │   ├── AdminFines.js
    │   │   │   ├── AdminGroups.js
    │   │   │   ├── AdminKitComponentHistory.js
    │   │   │   ├── AdminKitComponents.js
    │   │   │   ├── AdminKits.js
    │   │   │   ├── AdminLogHistory.js
    │   │   │   ├── AdminPenaltyPolicies.js
    │   │   │   ├── AdminReturnKits.js
    │   │   │   ├── AdminScanQR.js
    │   │   │   ├── AdminTransactions.js
    │   │   │   └── AdminUsers.js
    │   │   │
    │   │   ├── auth/                 # Authentication screens
    │   │   │   ├── LoginScreen.js
    │   │   │   └── RegisterScreen.js
    │   │   │
    │   │   ├── leader/               # Leader role screens
    │   │   │   ├── GroupManagementScreen.js
    │   │   │   ├── LeaderBorrowStatus.js
    │   │   │   ├── LeaderComponentRental.js
    │   │   │   ├── LeaderDashboard.js
    │   │   │   ├── LeaderProfile.js
    │   │   │   ├── LeaderRentals.js
    │   │   │   ├── LeaderSettings.js
    │   │   │   ├── LeaderWallet.js
    │   │   │   └── QRScannerScreen.js
    │   │   │
    │   │   ├── lecturer/             # Lecturer role screens
    │   │   │   ├── LecturerClasses.js
    │   │   │   ├── LecturerComponentRental.js
    │   │   │   ├── LecturerDashboard.js
    │   │   │   ├── LecturerGroups.js
    │   │   │   ├── LecturerKitRental.js
    │   │   │   ├── LecturerProfile.js
    │   │   │   ├── LecturerRentals.js
    │   │   │   └── LecturerWallet.js
    │   │   │
    │   │   ├── member/               # Member role screens
    │   │   │   ├── MemberDashboard.js
    │   │   │   ├── MemberGroups.js
    │   │   │   ├── MemberNotifications.js
    │   │   │   ├── MemberProfile.js
    │   │   │   └── MemberWallet.js
    │   │   │
    │   │   └── shared/               # Shared screens across roles
    │   │       ├── PenaltyPaymentScreen.js
    │   │       ├── QRInfoScreen.js
    │   │       ├── TransferScreen.js
    │   │       └── TopUpScreen.js
    │   │
    │   ├── services/                 # API & external services
    │   │   └── api.js                # Main API service (966 lines)
    │   │
    │   ├── theme/                    # Theme configuration
    │   │   └── theme.js              # App theme & styling
    │   │
    │   └── utils/                    # Utility functions
    │       └── (empty)
    │
    ├── 📂 android/                   # Android native code
    │   ├── app/                      # Android app module
    │   │   ├── build/                # Build outputs
    │   │   ├── build.gradle          # App-level Gradle config
    │   │   ├── proguard-rules.pro    # ProGuard rules
    │   │   ├── debug.keystore        # Debug signing key
    │   │   └── src/
    │   │       ├── debug/            # Debug manifest
    │   │       ├── debugOptimized/
    │   │       └── main/             # Main source
    │   │           ├── AndroidManifest.xml
    │   │           ├── java/         # Java/Kotlin source
    │   │           └── res/          # Android resources
    │   │               ├── drawable/
    │   │               ├── mipmap-*/     # App icons
    │   │               └── values/       # Strings, colors, styles
    │   │
    │   ├── build.gradle              # Project-level Gradle config
    │   ├── settings.gradle           # Gradle settings
    │   ├── gradle.properties         # Gradle properties
    │   ├── local.properties          # Local SDK paths
    │   ├── build-error.log           # Build error log
    │   └── gradle/                   # Gradle wrapper
    │       └── wrapper/
    │
    ├── 📂 assets/                    # Static assets
    │   ├── favicon.png
    │   ├── icon.png                  # App icon
    │   └── splash.png                # Splash screen
    │
    └── node_modules/                 # Dependencies (excluded from tree)
```

### 📦 Dependencies chính
- `expo` - Expo framework
- `react-navigation` - Navigation
- `react-native-paper` - UI components
- `expo-camera` - Camera & QR scanning
- `@react-native-async-storage/async-storage` - Local storage
- `dayjs` - Date manipulation

### 🏗️ Build & Deploy
- **EAS Build**: Cấu hình trong `eas.json`
- **Android**: Native Android project trong `android/`
- **Scripts**: 
  - Development: `npm start`, `npm run android`
  - Build: `npm run build:android:preview/production/dev`