// Test registration flow for SalonSphere
// Run this in the browser console at http://localhost:3000

async function testRegistration() {
  console.log('🔵 Starting registration test...');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    salonName: 'Test Salon ' + Date.now(),
    firstName: 'Test',
    lastName: 'User'
  };
  
  console.log('📧 Test user:', testUser);
  
  try {
    // Test the signup endpoint directly
    const response = await fetch('/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': localStorage.getItem('supabase.auth.token') || ''
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        data: {
          role: 'admin',
          pending_tenant_name: testUser.salonName,
          first_name: testUser.firstName,
          last_name: testUser.lastName
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful:', data);
      console.log('📬 Check email for confirmation link');
      
      // Check if user was created in database
      setTimeout(async () => {
        console.log('🔍 Checking database for user...');
        // This will be done via Supabase client
      }, 2000);
    } else {
      console.error('❌ Registration failed:', data);
      console.error('Status:', response.status);
      console.error('Error details:', data.error || data.msg || data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Alternative: Test using the SignUpForm directly
async function testSignUpForm() {
  console.log('🔵 Testing via SignUpForm...');
  
  // Navigate to signup page
  if (window.location.pathname !== '/auth/sign-up') {
    console.log('📍 Navigating to signup page...');
    window.location.href = '/auth/sign-up';
    console.log('⚠️  Please run testSignUpForm() again after page loads');
    return;
  }
  
  // Fill in the form
  const fillForm = () => {
    const timestamp = Date.now();
    
    // Fill salon name
    const salonInput = document.querySelector('#salon');
    if (salonInput) {
      salonInput.value = 'Test Salon ' + timestamp;
      salonInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Fill first name
    const firstNameInput = document.querySelector('#firstName');
    if (firstNameInput) {
      firstNameInput.value = 'Test';
      firstNameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Fill last name
    const lastNameInput = document.querySelector('#lastName');
    if (lastNameInput) {
      lastNameInput.value = 'User';
      lastNameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Fill email
    const emailInput = document.querySelector('#email');
    if (emailInput) {
      emailInput.value = `test-${timestamp}@example.com`;
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Fill password
    const passwordInput = document.querySelector('#password');
    if (passwordInput) {
      passwordInput.value = 'TestPassword123!';
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    console.log('✅ Form filled with test data');
    console.log('📧 Email:', emailInput?.value);
    console.log('🏢 Salon:', salonInput?.value);
    
    // Find and click submit button
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      console.log('🖱️ Clicking submit button...');
      submitButton.click();
    } else {
      console.error('❌ Submit button not found');
    }
  };
  
  // Wait a bit for React to render
  setTimeout(fillForm, 1000);
}

// Monitor network requests
function monitorAuthRequests() {
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url.includes('/auth/')) {
      console.log('🌐 Auth request:', url, options);
    }
    
    const response = await originalFetch.apply(this, args);
    
    if (url.includes('/auth/')) {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        console.log('📥 Auth response:', url, response.status, data);
      } catch (e) {
        console.log('📥 Auth response:', url, response.status);
      }
    }
    
    return response;
  };
  
  console.log('✅ Monitoring auth requests...');
}

console.log('🚀 Registration test script loaded!');
console.log('Available functions:');
console.log('  - testRegistration() : Test direct API call');
console.log('  - testSignUpForm() : Test via UI form');
console.log('  - monitorAuthRequests() : Monitor all auth network requests');