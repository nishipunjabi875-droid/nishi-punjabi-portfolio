import * as fs from 'fs';
import * as path from 'path';

export class TestDataReader {
  public static loadJson<T = any>(filename: string): T {
    const filePath = path.resolve(process.cwd(), 'test-data', filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test data file not found: ${filePath}`);
    }
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawContent) as T;
  }
}
