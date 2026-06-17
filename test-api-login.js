const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// تحميل المتغيرات من .env
dotenv.config();

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

console.log(`Testing CarRent Auth API at: ${BASE_URL}`);

async function runTests() {
  try {
    // -------------------------------------------------------------
    // الحالة الأولى: تجربة التحقق باستخدام Firebase Mock Token
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Firebase Auth Verification (Mock Token) ---');
    try {
      const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        firebaseToken: 'mock-firebase-token',
        phone: '+201285217746' // رقم التليفون المراد تسجيله
      });
      console.log('SUCCESS: Authenticated with Firebase Mock Token!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      const jwtToken = response.data.access_token;
      
      // تجربة استخدام الـ JWT الناتج لجلب بيانات العميل
      if (jwtToken) {
        console.log('\n--- 2. Fetching user profile using the JWT token ---');
        const profileResponse = await axios.get(`${BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        });
        console.log('SUCCESS: Retrieved profile successfully!');
        console.log('Profile Data:', JSON.stringify(profileResponse.data, null, 2));
      }
    } catch (err) {
      console.error('FAILED: Verification failed:');
      if (err.response) {
        console.error(`HTTP Status: ${err.response.status}`);
        console.error('Error details:', err.response.data);
      } else {
        console.error(err.message);
      }
    }

    // -------------------------------------------------------------
    // الحالة الثانية: تجربة التحقق التقليدي بالـ OTP التجريبي (111111)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Traditional OTP Fallback (Mock OTP 111111) ---');
    try {
      const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phone: '+201222222222',
        code: '111111'
      });
      console.log('SUCCESS: Authenticated with Traditional Mock OTP!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('FAILED: Traditional verification failed:');
      if (err.response) {
        console.error(`HTTP Status: ${err.response.status}`);
        console.error('Error details:', err.response.data);
      } else {
        console.error(err.message);
      }
    }

  } catch (globalError) {
    console.error('Global Error in Test Script:', globalError.message);
  }
}

runTests();
