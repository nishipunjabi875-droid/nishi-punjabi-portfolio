import axios from 'axios';
import { Logger } from './logger';

export class OTPHelper {
  /**
   * Universal OTP retrieval method supporting Mode 1 (ENV), Mode 2 (API), Mode 3 (Fallback/Manual).
   */
  public static async getOTP(phone: string = process.env.TEST_PHONE || '9876543210'): Promise<string> {
    const mode = process.env.OTP_MODE || '1';

    Logger.info(`Retrieving OTP for mobile [${Logger.mask(phone)}] using OTP Mode [${mode}]`);

    switch (mode) {
      case '1':
        return this.getOTPFromEnv();
      case '2':
        return await this.getOTPFromAPI(phone);
      case '3':
        return await this.getOTPManualFallback(phone);
      default:
        Logger.warn(`Unrecognized OTP_MODE [${mode}]. Defaulting to ENV variable mode.`);
        return this.getOTPFromEnv();
    }
  }

  private static getOTPFromEnv(): string {
    const otp = process.env.TEST_OTP || '123456';
    Logger.info(`OTP retrieved from ENV variable: ${Logger.mask(otp)}`);
    return otp;
  }

  private static async getOTPFromAPI(phone: string): Promise<string> {
    const apiUrl = process.env.OTP_API_URL || 'https://api.testservice.woodenstreet.com/qa/latest-otp';
    try {
      Logger.info(`Fetching OTP from test service API: ${apiUrl}`);
      const response = await axios.get(`${apiUrl}?phone=${encodeURIComponent(phone)}`, {
        headers: { 'X-QA-Key': process.env.OTP_API_KEY || 'qa-secret-key' },
        timeout: 5000,
      });

      if (response.data && response.data.otp) {
        const otp = String(response.data.otp);
        Logger.info(`OTP fetched successfully from API: ${Logger.mask(otp)}`);
        return otp;
      }
      throw new Error('API response did not contain "otp" property.');
    } catch (error: any) {
      Logger.warn(`API OTP retrieval failed (${error.message}). Falling back to ENV variable OTP.`);
      return this.getOTPFromEnv();
    }
  }

  private static async getOTPManualFallback(phone: string): Promise<string> {
    const defaultOtp = process.env.TEST_OTP || '123456';
    Logger.info(`Manual OTP fallback mode active for ${Logger.mask(phone)}. Defaulting to: ${Logger.mask(defaultOtp)}`);
    return defaultOtp;
  }
}
