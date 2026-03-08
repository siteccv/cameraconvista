const fs = require('fs');
const key = process.env.RESEND_KEY || process.env.RESEND_API_KEY;
if (key) {
  const envContent = `RESEND_KEY=${key}\n`;
  fs.writeFileSync('.env.production', envContent, { mode: 0o600 });
  console.log('✓ RESEND_KEY synced to .env.production');
} else {
  console.warn('⚠ RESEND_KEY not available in environment');
}
