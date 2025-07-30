// Test script to check event template API
const API_BASE_URL = 'http://127.0.0.1:8000';

// Replace with your actual auth token
const AUTH_TOKEN = 'your-auth-token-here';

// Test browse templates endpoint
async function testBrowseTemplates() {
  console.log('Testing browse templates endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/core-data/event-templates/browse_templates/`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test get event template info (replace with actual event ID)
async function testEventTemplateInfo(eventId) {
  console.log(`\nTesting event template info for event ${eventId}...`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/template_info/`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test public template assets (no auth required)
async function testPublicTemplateAssets(templateId) {
  console.log(`\nTesting public template assets for template ${templateId}...`);
  try {
    const response = await fetch(`${API_BASE_URL}/api/core-data/event-templates/${templateId}/public_template_assets/`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run tests
(async () => {
  console.log('Starting template API tests...\n');
  
  // Test browse templates
  await testBrowseTemplates();
  
  // Test with a specific event ID if you have one
  // await testEventTemplateInfo('your-event-id');
  
  // Test with a specific template ID if you have one
  // await testPublicTemplateAssets(1);
  
  console.log('\nTests completed.');
})();