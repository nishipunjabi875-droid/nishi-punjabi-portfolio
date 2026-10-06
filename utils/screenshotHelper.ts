import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export class ScreenshotHelper {
  public static async captureOnFailure(page: Page, testName: string): Promise<string> {
    const sanitizedName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.resolve(process.cwd(), 'screenshots');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, `FAIL_${sanitizedName}_${timestamp}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }
}
