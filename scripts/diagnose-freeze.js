// Diagnostic script to identify freeze issues
console.log('🔍 Starting freeze diagnosis...');

// Test Firebase configuration
console.log('🔥 Testing Firebase configuration...');
try {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  console.log('Firebase config check:', {
    apiKey: firebaseConfig.apiKey ? '✅ Present' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Present' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Present' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Present' : '❌ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Present' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Present' : '❌ Missing',
  });
} catch (error) {
  console.error('❌ Firebase config error:', error.message);
}

// Test network connectivity
console.log('🌐 Testing network connectivity...');
if (typeof fetch !== 'undefined') {
  fetch('https://www.google.com', { 
    method: 'HEAD',
    signal: AbortSignal.timeout(3000)
  })
    .then(() => console.log('✅ Network connectivity OK'))
    .catch(error => console.error('❌ Network connectivity failed:', error.message));
} else {
  console.log('⚠️ Fetch not available in this environment');
}

console.log('✅ Diagnosis complete. Check console output above.');