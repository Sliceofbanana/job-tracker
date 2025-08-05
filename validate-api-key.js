// Simple API Key Validation Test
// Open this in browser console or run as a script

const API_KEY = 'AIzaSyDXxq64viBhUhol7rVtgG0ywlSqp83dUUQ';

async function validateGoogleCalendarApiKey() {
    console.log('🔍 Validating Google Calendar API Key...');
    console.log('API Key:', API_KEY);
    
    try {
        // Test 1: Try to load the discovery document
        console.log('\n📋 Test 1: Discovery Document');
        const discoveryResponse = await fetch(
            `https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest?key=${API_KEY}`
        );
        
        if (discoveryResponse.ok) {
            console.log('✅ Discovery document loaded successfully');
            const discoveryData = await discoveryResponse.json();
            console.log('Calendar API version:', discoveryData.version);
        } else {
            console.error('❌ Failed to load discovery document');
            console.error('Status:', discoveryResponse.status);
            console.error('Status text:', discoveryResponse.statusText);
            
            if (discoveryResponse.status === 403) {
                console.log('💡 Solution: Enable Google Calendar API for this API key');
            }
        }

        // Test 2: Try to access calendar colors (public endpoint)
        console.log('\n🎨 Test 2: Calendar Colors (Public Endpoint)');
        const colorsResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/colors?key=${API_KEY}`
        );
        
        if (colorsResponse.ok) {
            console.log('✅ Calendar colors endpoint accessible');
            const colorsData = await colorsResponse.json();
            console.log('Available calendar colors:', Object.keys(colorsData.calendar || {}).length);
        } else {
            console.error('❌ Failed to access calendar colors');
            console.error('Status:', colorsResponse.status);
            console.error('Status text:', colorsResponse.statusText);
            
            const errorData = await colorsResponse.json().catch(() => null);
            if (errorData) {
                console.error('Error details:', errorData.error);
                
                if (errorData.error.status === 'PERMISSION_DENIED') {
                    console.log('💡 Solution: Google Calendar API is not enabled for this API key');
                    console.log('   Go to Google Cloud Console > APIs & Services > Library');
                    console.log('   Search for "Google Calendar API" and enable it');
                }
            }
        }

    } catch (error) {
        console.error('❌ Network error during API key validation:', error);
        console.log('💡 Possible causes:');
        console.log('- Network connectivity issues');
        console.log('- CORS policy blocking the request');
        console.log('- API key format is invalid');
    }
}

// Run the validation
validateGoogleCalendarApiKey();

// Also make it available globally for manual testing
window.validateApiKey = validateGoogleCalendarApiKey;
