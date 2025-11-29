import React, { useState } from 'react';
import { Database, Upload, Download, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const FirebaseSetup: React.FC = () => {
  const { 
    seedInitialData, 
    refreshData, 
    loading, 
    isFirebaseConnected, 
    firebaseError,
    switchToFirebase,
    switchToMockData 
  } = useApp();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfig, setShowConfig] = useState(false);

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      setSeedingStatus('idle');
      await seedInitialData();
      setSeedingStatus('success');
    } catch (error) {
      console.error('Error seeding data:', error);
      setSeedingStatus('error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      await refreshData();
      alert('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Error refreshing data. Please try again.');
    }
  };

  const handleConnectFirebase = async () => {
    try {
      await switchToFirebase();
      alert('Successfully connected to Firebase!');
    } catch (error) {
      alert('Failed to connect to Firebase. Please check your configuration.');
    }
  };

  const handleUseMockData = () => {
    switchToMockData();
    alert('Switched to mock data mode.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const sampleFirebaseConfig = `// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};`;

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Or for development, allow all access (NOT for production)
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}`;

  const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Firebase Setup & Data Management</h2>
        <p className="text-gray-600">Configure your Firebase backend and manage data synchronization</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
            </div>
            <Badge variant={isFirebaseConnected ? 'success' : 'warning'}>
              {isFirebaseConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-4 border ${
              isFirebaseConnected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                {isFirebaseConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <h4 className={`font-semibold ${
                  isFirebaseConnected ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {isFirebaseConnected ? 'Firebase Connected' : 'Using Mock Data'}
                </h4>
              </div>
              <p className={`mt-2 ${
                isFirebaseConnected ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {isFirebaseConnected 
                  ? 'Your application is connected to Firebase and using real-time data.'
                  : 'Your application is using mock data. Configure Firebase to enable real-time features.'
                }
              </p>
              {firebaseError && (
                <p className="mt-2 text-red-700 text-sm">
                  <strong>Error:</strong> {firebaseError}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleConnectFirebase}
                disabled={loading}
                variant={isFirebaseConnected ? 'secondary' : 'primary'}
              >
                {isFirebaseConnected ? 'Reconnect Firebase' : 'Connect to Firebase'}
              </Button>
              <Button
                onClick={handleUseMockData}
                variant="outline"
                disabled={loading}
              >
                Use Mock Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firebase Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Firebase Configuration</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={showConfig ? EyeOff : Eye}
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? 'Hide' : 'Show'} Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showConfig && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Sample Configuration</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Copy}
                    onClick={() => copyToClipboard(sampleFirebaseConfig)}
                  >
                    Copy
                  </Button>
                </div>
                <pre className="bg-gray-100 p-4 text-sm overflow-x-auto">
                  <code>{sampleFirebaseConfig}</code>
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Configuration Steps</h4>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-blue-700 mt-2 text-sm">
                  <li>Replace the values in <code className="bg-blue-100 px-2 py-1 rounded">src/config/firebase.ts</code></li>
                  <li>Get your config from Firebase Console → Project Settings → General → Your apps</li>
                  <li>Enable Firestore, Authentication, and Storage in your Firebase project</li>
                  <li>Set up Firestore security rules (see below)</li>
                </ol>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Required Firebase Services:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-gray-900">Firestore Database</h5>
                  <p className="text-sm text-gray-600">For storing all application data</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-gray-900">Authentication</h5>
                  <p className="text-sm text-gray-600">For user management</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-gray-900">Storage</h5>
                  <p className="text-sm text-gray-600">For PDF ticket storage</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Firestore Collections:</h4>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {['customers', 'vendors', 'bookings', 'payments', 'expenses', 'refunds', 'users', 'logs', 'tickets'].map(collection => (
                  <div key={collection} className="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-center">
                    {collection}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Seed Initial Data</h4>
                <p className="text-sm text-gray-600">Upload mock data to Firebase for testing and development</p>
                {!isFirebaseConnected && (
                  <p className="text-sm text-red-600 mt-1">⚠️ Firebase connection required</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {seedingStatus === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {seedingStatus === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <Button
                  onClick={handleSeedData}
                  disabled={isSeeding || !isFirebaseConnected}
                  icon={isSeeding ? RefreshCw : Upload}
                  variant={seedingStatus === 'success' ? 'secondary' : 'primary'}
                >
                  {isSeeding ? 'Seeding...' : seedingStatus === 'success' ? 'Data Seeded' : 'Seed Data'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Refresh Data</h4>
                <p className="text-sm text-gray-600">Reload all data from Firebase</p>
                {!isFirebaseConnected && (
                  <p className="text-sm text-red-600 mt-1">⚠️ Firebase connection required</p>
                )}
              </div>
              <Button
                onClick={handleRefreshData}
                disabled={loading || !isFirebaseConnected}
                icon={RefreshCw}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Rules */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Firebase Security Rules</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Firestore Rules</h4>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Copy}
                  onClick={() => copyToClipboard(firestoreRules)}
                >
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 text-sm overflow-x-auto">
                <code>{firestoreRules}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Storage Rules</h4>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Copy}
                  onClick={() => copyToClipboard(storageRules)}
                >
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 text-sm overflow-x-auto">
                <code>{storageRules}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Quick Setup Guide</h3>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <span className="text-sm">Firebase Console</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <h4 className="font-medium text-gray-900">Create Firebase Project</h4>
                  </div>
                  <p className="text-gray-600 text-sm ml-8">
                    Go to Firebase Console and create a new project with a unique name.
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <h4 className="font-medium text-gray-900">Enable Services</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-8">
                    <li>Firestore Database (production mode)</li>
                    <li>Authentication (Email/Password)</li>
                    <li>Storage (for file uploads)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <h4 className="font-medium text-gray-900">Get Configuration</h4>
                  </div>
                  <p className="text-gray-600 text-sm ml-8">
                    Project Settings → General → Your apps → Web app → Config
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <h4 className="font-medium text-gray-900">Update & Test</h4>
                  </div>
                  <p className="text-gray-600 text-sm ml-8">
                    Update firebase.ts config and test connection using the button above.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Pro Tips</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-green-700 mt-2 text-sm">
                <li>Start with development mode for Firestore rules, then tighten security</li>
                <li>Use Firebase emulators for local development</li>
                <li>Enable billing for production usage</li>
                <li>Set up backup and monitoring for production</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseSetup;