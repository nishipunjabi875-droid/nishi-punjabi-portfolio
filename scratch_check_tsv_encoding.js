const fs = require('fs');
const path = require('path');

const csvPath = path.resolve(__dirname, 'data/products.csv');
if (fs.existsSync(csvPath)) {
  const buffer = fs.readFileSync(csvPath);
  console.log('Buffer length:', buffer.length);
  console.log('First 10 bytes:', buffer.slice(0, 10));

  // Check for UTF-16 LE BOM (0xFF 0xFE)
  const isUtf16Le = buffer[0] === 0xFF && buffer[1] === 0xFE;
  console.log('Is UTF-16 LE BOM:', isUtf16Le);

  const encoding = isUtf16Le ? 'utf16le' : 'utf-8';
  const text = buffer.toString(encoding);
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  console.log('Total lines read:', lines.length);
  console.log('First line:', JSON.stringify(lines[0]));
  console.log('Second line:', JSON.stringify(lines[1]));
  
  // Search for "samiha" or "sam"
  console.log('\n--- Searching for "samiha" (case-insensitive) ---');
  let foundCount = 0;
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('samiha')) {
      console.log(`Line ${idx + 1}: ${line}`);
      foundCount++;
    }
  });
  console.log(`Found count: ${foundCount}`);

} else {
  console.log('File not found');
}
