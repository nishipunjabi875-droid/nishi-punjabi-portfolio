import * as dotenv from 'dotenv';
import * as path from 'path';

export interface EnvironmentConfig {
  envName: string;
  baseUrl: string;
  testPhone: string;
  testOtp: string;
  testPincode: string;
  testEmail: string;
  testPassword: string;
  testProduct: string;
  testSearchTerm: string;
  testCoupon: string;
  allowRealPayment: boolean;
  useAuthStorage: boolean;
  timeout: number;
}

export function loadEnvironment(): EnvironmentConfig {
  const env = process.env.TEST_ENV || process.env.NODE_ENV || 'production';
  const envFile = `.env.${env}`;
  const envPath = path.resolve(process.cwd(), envFile);

  dotenv.config({ path: envPath });
  dotenv.config(); // fallback to default .env

  return {
    envName: env,
    baseUrl: process.env.BASE_URL || 'https://beta.teamwoodenstreet.com',
    testPhone: process.env.TEST_PHONE || '7976191632',
    testOtp: process.env.TEST_OTP || '1111',
    testPincode: process.env.TEST_PINCODE || '302015',
    testEmail: process.env.TEST_EMAIL || 'qa_smoke_test@woodenstreet.com',
    testPassword: process.env.TEST_PASSWORD || 'TestPassword123!',
    testProduct: process.env.TEST_PRODUCT || 'alanis-wooden-sofa',
    testSearchTerm: process.env.TEST_SEARCH_TERM || 'sofa',
    testCoupon: process.env.TEST_COUPON || 'WELCOME10',
    allowRealPayment: process.env.ALLOW_REAL_PAYMENT === 'true',
    useAuthStorage: process.env.USE_AUTH_STORAGE === 'true',
    timeout: parseInt(process.env.TIMEOUT || '60000', 10),
  };
}

export const currentEnv = loadEnvironment();
