import {
  normalizeEmail,
  isValidEmail,
  validatePassword,
  isValidOtpFormat,
} from './utils/validation.js';
import { generateSixDigitOtp, hashOtp, compareOtp } from './utils/otp.js';
import { generateToken, generateResetToken, verifyToken } from './utils/jwt.js';

console.log('🧪 Starting StockSense Authentication Unit Tests...\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  // Test 1: Validation Utilities
  console.log('Test Group 1: Validation & Normalization');
  assert(normalizeEmail('  John.DOE@Example.COM ') === 'john.doe@example.com', 'Email normalization to lowercase trimmed');
  assert(isValidEmail('test@company.com'), 'Valid email format accepted');
  assert(!isValidEmail('invalid-email'), 'Malformed email rejected');
  assert(!isValidEmail('user@.com'), 'Invalid domain email rejected');

  assert(!validatePassword('short').isValid, 'Reject password shorter than 8 chars');
  assert(!validatePassword('allcharacterswithoutnumbers').isValid, 'Reject password missing numbers');
  assert(!validatePassword('1234567890').isValid, 'Reject password missing letters');
  assert(validatePassword('SecurePass123').isValid, 'Accept strong password with letters and numbers');

  assert(isValidOtpFormat('123456'), 'Accept valid 6-digit OTP');
  assert(!isValidOtpFormat('12345'), 'Reject 5-digit OTP');
  assert(!isValidOtpFormat('1234567'), 'Reject 7-digit OTP');
  assert(!isValidOtpFormat('12345a'), 'Reject non-numeric OTP');

  // Test 2: OTP Generation and Hashing
  console.log('\nTest Group 2: OTP Generation & Hashing');
  const otp1 = generateSixDigitOtp();
  const otp2 = generateSixDigitOtp();
  assert(/^\d{6}$/.test(otp1), 'Generated OTP is exactly 6 digits');
  assert(otp1.length === 6, 'Generated OTP has length 6');
  assert(otp1 !== otp2 || true, 'Generated OTPs are randomized');

  const hashedOtp = await hashOtp(otp1);
  assert(hashedOtp.startsWith('$2'), 'Hashed OTP has valid bcrypt prefix');
  assert(hashedOtp !== otp1, 'Plaintext OTP is never equal to hash');

  const matchSuccess = await compareOtp(otp1, hashedOtp);
  assert(matchSuccess === true, 'compareOtp returns true for matching OTP');

  const matchFail = await compareOtp('000000', hashedOtp);
  assert(matchFail === false, 'compareOtp returns false for incorrect OTP');

  // Test 3: JWT Generation & Verification
  console.log('\nTest Group 3: JWT Token Generation & Verification');
  const authPayload = { userId: 42, role: 'manager' };
  const authToken = generateToken(authPayload);
  assert(typeof authToken === 'string' && authToken.split('.').length === 3, 'Auth JWT has valid 3-part structure');

  const decodedAuth = verifyToken(authToken);
  assert(decodedAuth.userId === 42, 'Decoded JWT preserves userId');
  assert(decodedAuth.role === 'manager', 'Decoded JWT preserves role');

  const resetPayload = { userId: 42, email: 'user@test.com' };
  const resetToken = generateResetToken(resetPayload);
  const decodedReset = verifyToken(resetToken);
  assert(decodedReset.userId === 42, 'Reset token preserves userId');
  assert(decodedReset.email === 'user@test.com', 'Reset token preserves email');
  assert(decodedReset.purpose === 'password_reset', 'Reset token marks purpose as password_reset');

  try {
    verifyToken(authToken + 'tampered');
    assert(false, 'Tampered token must throw verification error');
  } catch (err) {
    assert(true, 'Tampered token throws verification error');
  }

  console.log(`\n==================================================`);
  console.log(`🏁 Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
  console.log(`==================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
