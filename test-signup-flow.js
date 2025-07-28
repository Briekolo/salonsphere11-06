/**
 * Test script to verify signup flow improvements
 * Run this in the browser console on the signup page to test
 */

console.log('🧪 Starting signup flow test...');

// Test data
const testData = {
  email: 'test' + Date.now() + '@example.com',
  password: 'testpassword123',
  salonName: 'Test Beauty Salon',
  firstName: 'Test',
  lastName: 'User'
};

console.log('📧 Test email:', testData.email);

// Function to fill form and submit
async function testSignupFlow() {
  // Check if we're on the signup page
  const signupForm = document.querySelector('form');
  if (!signupForm) {
    console.error('❌ Signup form not found');
    return;
  }

  // Fill in the form fields
  const salonField = document.querySelector('#salon, input[placeholder*="salon"], input[name="salon"]');
  const firstNameField = document.querySelector('#firstName, input[name="firstName"]');
  const lastNameField = document.querySelector('#lastName, input[name="lastName"]');
  const emailField = document.querySelector('#email, input[type="email"]');
  const passwordField = document.querySelector('#password, input[type="password"]');

  if (salonField) {
    salonField.value = testData.salonName;
    salonField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Salon name filled');
  }

  if (firstNameField) {
    firstNameField.value = testData.firstName;
    firstNameField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ First name filled');
  }

  if (lastNameField) {
    lastNameField.value = testData.lastName;
    lastNameField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Last name filled');
  }

  if (emailField) {
    emailField.value = testData.email;
    emailField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Email filled');
  }

  if (passwordField) {
    passwordField.value = testData.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Password filled');
  }

  // Wait a moment for React state to update
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('🚀 Submitting form...');
  
  // Submit the form
  const submitButton = signupForm.querySelector('button[type="submit"]');
  if (submitButton && !submitButton.disabled) {
    submitButton.click();
    console.log('✅ Form submitted');
  } else {
    console.error('❌ Submit button not found or disabled');
  }
}

// Instructions
console.log(`
🔧 Test Instructions:
1. Navigate to the signup page (http://localhost:3002/auth/sign-up)
2. Open browser console
3. Run: testSignupFlow()
4. Watch for error messages and network requests
5. Check if success message appears

To test manually:
- Email: ${testData.email}
- Password: ${testData.password}
- Salon: ${testData.salonName}
- Name: ${testData.firstName} ${testData.lastName}
`);

// Make testSignupFlow available globally
window.testSignupFlow = testSignupFlow;