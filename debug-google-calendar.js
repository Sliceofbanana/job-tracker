// Google Calendar Debug Script
// Run this in the browser console to diagnose connection issues

console.log('🔍 Google Calendar Debug Script Starting...');

// 1. Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NEXT_PUBLIC_GOOGLE_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing');

// 2. Check if we're in browser environment
console.log('\n🌐 Environment Check:');
console.log('Browser environment:', typeof window !== 'undefined' ? '✅ Yes' : '❌ No');
console.log('Current URL:', window.location.href);
console.log('Current origin:', window.location.origin);

// 3. Check Content Security Policy
console.log('\n🛡️ Content Security Policy Check:');
const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
if (meta) {
  console.log('CSP found in meta tag:', meta.content);
} else {
  console.log('No CSP meta tag found, checking headers...');
}

// 4. Test Google API script loading
console.log('\n📜 Google API Script Check:');
console.log('Google API script present:', !!window.gapi ? '✅ Yes' : '❌ No');

if (!window.gapi) {
  console.log('Attempting to load Google API script...');
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    console.log('✅ Google API script loaded successfully');
    continueDebug();
  };
  script.onerror = (error) => {
    console.error('❌ Failed to load Google API script:', error);
    console.log('Possible causes:');
    console.log('- Content Security Policy blocking the script');
    console.log('- Network connectivity issues');
    console.log('- Browser blocking third-party scripts');
  };
  document.head.appendChild(script);
} else {
  continueDebug();
}

function continueDebug() {
  console.log('\n🔧 Google API Initialization Test:');
  
  if (window.gapi) {
    window.gapi.load('client:auth2', 
      () => {
        console.log('✅ Google API client modules loaded');
        testApiInit();
      },
      () => {
        console.error('❌ Failed to load Google API client modules');
        console.log('Possible causes:');
        console.log('- CSP blocking Google API domains');
        console.log('- Network issues with Google servers');
        console.log('- Browser privacy settings blocking Google APIs');
      }
    );
  }
}

async function testApiInit() {
  console.log('\n🚀 Testing API Initialization:');
  
  try {
    await window.gapi.client.init({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      scope: 'https://www.googleapis.com/auth/calendar'
    });
    
    console.log('✅ Google API client initialized successfully');
    
    // Test auth instance
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance) {
      console.log('✅ Auth instance created');
      console.log('User signed in:', authInstance.isSignedIn.get());
      
      if (!authInstance.isSignedIn.get()) {
        console.log('\n🔐 Testing Sign-in Process:');
        console.log('Click here to test sign-in:');
        console.log('%cTEST SIGN IN', 'background: blue; color: white; padding: 5px; border-radius: 3px;');
        
        // Make sign-in function available globally for testing
        window.testGoogleSignIn = async () => {
          try {
            await authInstance.signIn();
            console.log('✅ Sign-in successful!');
            return true;
          } catch (error) {
            console.error('❌ Sign-in failed:', error);
            analyzeSignInError(error);
            return false;
          }
        };
      }
      
    } else {
      console.error('❌ Failed to get auth instance');
    }
    
  } catch (error) {
    console.error('❌ API initialization failed:', error);
    analyzeInitError(error);
  }
}

function analyzeInitError(error) {
  console.log('\n🔬 Error Analysis:');
  
  if (error.error) {
    switch (error.error) {
      case 'idpiframe_initialization_failed':
        console.log('❌ OAuth iframe initialization failed');
        console.log('Solutions:');
        console.log('1. Check your Google Cloud Console OAuth consent screen');
        console.log('2. Verify authorized domains include your current domain');
        console.log('3. Check if your app is in "Testing" mode and you\'re not a test user');
        break;
        
      case 'popup_blocked_by_browser':
        console.log('❌ Browser blocked the OAuth popup');
        console.log('Solutions:');
        console.log('1. Allow popups for this site');
        console.log('2. Try signing in from user interaction (button click)');
        break;
        
      case 'invalid_client':
        console.log('❌ Invalid client configuration');
        console.log('Solutions:');
        console.log('1. Check your GOOGLE_CLIENT_ID is correct');
        console.log('2. Verify the client ID in Google Cloud Console');
        console.log('3. Check if the client is enabled for web applications');
        break;
        
      default:
        console.log('❌ Unknown error:', error.error);
    }
  }
  
  if (error.details) {
    console.log('Error details:', error.details);
  }
}

function analyzeSignInError(error) {
  console.log('\n🔬 Sign-in Error Analysis:');
  
  if (error.error) {
    switch (error.error) {
      case 'access_denied':
        console.log('❌ User denied access or app not approved');
        console.log('Solutions:');
        console.log('1. User needs to grant calendar permissions');
        console.log('2. Check OAuth consent screen configuration');
        break;
        
      case 'origin_mismatch':
        console.log('❌ Origin not authorized');
        console.log('Current origin:', window.location.origin);
        console.log('Solutions:');
        console.log('1. Add this origin to authorized JavaScript origins in Google Cloud Console');
        console.log('2. For localhost, add: http://localhost:3001');
        console.log('3. For production, add your domain');
        break;
        
      default:
        console.log('❌ Unknown sign-in error:', error.error);
    }
  }
}

// Check for common issues
console.log('\n🧪 Common Issues Check:');

// Check if running on localhost with correct port
if (window.location.hostname === 'localhost' && window.location.port !== '3001') {
  console.warn('⚠️ Running on wrong port. Expected localhost:3001, got:', window.location.host);
}

// Check if HTTPS in production
if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
  console.warn('⚠️ Google APIs require HTTPS in production');
}

console.log('\n✅ Debug script completed. Check the results above for any issues.');
console.log('If you see any ❌ or ⚠️ symbols, those indicate problems that need to be fixed.');
