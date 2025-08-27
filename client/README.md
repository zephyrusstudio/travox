# Travox - B2B Travel Management Platform

A comprehensive travel finance management platform for travel agencies with AI-powered ticket processing and billing automation.

## 🚀 Features

### Core Modules
- **Dashboard** - Analytics and performance insights
- **Ticket Upload & AI Processing** - Automated ticket data extraction
- **Customer Management** - Complete customer database
- **Vendor Management** - Service provider tracking
- **Booking Management** - Travel booking lifecycle
- **Payment Management** - Payment tracking and receipts
- **Expense Management** - Business expense tracking
- **Refund Management** - Customer refund processing

### Financial Reports & Ledgers
- **Customer Ledger** - Account statements and transaction history
- **Vendor Ledger** - Vendor payment records
- **Outstanding Payments** - Pending payment tracking
- **Monthly Summary** - Income and expense analysis
- **GST & Tax View** - Tax compliance and reporting

### Additional Features
- **Calendar View** - Travel schedules and reminders
- **Activity Logs** - System audit trail
- **Reports & Analytics** - Comprehensive business reports
- **User Management** - Role-based access control

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Storage + Auth)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database, Authentication, and Storage
   - Copy your Firebase config and update `src/config/firebase.ts`

4. **Set up Firebase services**
   - **Firestore**: Enable in production mode
   - **Authentication**: Enable Email/Password provider
   - **Storage**: Enable for file uploads
   - **Security Rules**: Copy rules from `firestore.rules` and `storage.rules`

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Google Analytics (optional)

### 2. Enable Required Services

#### Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Choose a location close to your users
4. Update security rules with content from `firestore.rules`

#### Authentication
1. Go to Authentication → Sign-in method
2. Enable Email/Password provider
3. Configure authorized domains if needed

#### Storage
1. Go to Storage
2. Get started with default settings
3. Update security rules with content from `storage.rules`

### 3. Get Configuration
1. Go to Project Settings → General
2. Scroll to "Your apps" section
3. Click on Web app (</>) to create or view config
4. Copy the configuration object

### 4. Update Application Config
Replace the placeholder values in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```


## 📊 Data Structure

### Collections
- `customers` - Customer information and profiles
- `vendors` - Service provider details
- `bookings` - Travel booking records
- `payments` - Payment transactions
- `expenses` - Business expense records
- `refunds` - Customer refund records
- `users` - System user accounts
- `logs` - Activity audit trail
- `tickets` - Uploaded ticket metadata

### Security Rules
The application uses Firebase security rules to protect data:
- Authenticated users can read/write all documents
- Storage files are protected by authentication
- Development rules available for testing

## 🎯 Key Features

### AI-Powered Ticket Processing
- Upload PDF tickets or images
- Automatic data extraction (PNR, routes, passengers, amounts)
- Editable extracted data fields
- Seamless booking creation

### Financial Management
- Comprehensive ledger system
- GST and tax compliance
- Outstanding payment tracking
- Profit/loss analysis
- Cash flow management

### Real-time Updates
- Live data synchronization
- Instant notifications
- Activity tracking
- Performance monitoring

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting (Optional)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🔒 Security Considerations

### Production Setup
1. **Firestore Rules**: Implement proper user-based access control
2. **Storage Rules**: Restrict file access to authorized users
3. **Authentication**: Enable additional security features
4. **API Keys**: Restrict API key usage to your domains
5. **Backup**: Set up automated backups

### Development vs Production
- Use Firebase emulators for local development
- Implement proper error handling
- Set up monitoring and alerts
- Regular security audits

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the Firebase Setup guide in the application
2. Review Firebase Console for configuration issues
3. Check browser console for error messages
4. Verify network connectivity to Firebase services

## 🔄 Data Migration

### From Mock Data to Firebase
1. Configure Firebase as described above
2. Use the "Seed Data" feature in Settings
3. Verify data in Firebase Console
4. Switch to Firebase mode in the application

### Backup and Restore
- Use Firebase Console for manual backups
- Implement automated backup strategies for production
- Export data using the application's export features

---

**Travox** - Streamlining travel business management with modern technology.