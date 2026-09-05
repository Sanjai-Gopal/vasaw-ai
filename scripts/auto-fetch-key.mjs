import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import fs from 'fs';

async function autoFetchKey() {
  const tempProfileDir = path.join(os.tmpdir(), 'chrome-automation-profile');
  
  console.log('🚀 Launching Google Chrome...');
  const context = await chromium.launchPersistentContext(tempProfileDir, {
    channel: 'chrome',
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ],
    viewport: null
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log('🌐 Navigating to https://platform.openai.com/api-keys ...');
  await page.goto('https://platform.openai.com/api-keys', { waitUntil: 'domcontentloaded' }).catch(() => {});

  console.log('🔄 Continuous watcher started. Waiting for OpenAI dashboard...');

  let keyExtracted = false;

  while (!keyExtracted) {
    try {
      const url = page.url();
      const title = await page.title().catch(() => '');

      // Check if we are on login landing page and auto-click Log In if available
      const loginBtn = await page.$('button:has-text("Log in"), a:has-text("Log in")').catch(() => null);
      if (loginBtn && (url.includes('auth') || url.includes('login') || url.includes('platform.openai.com'))) {
        const isVisible = await loginBtn.isVisible().catch(() => false);
        if (isVisible) {
          console.log('👉 Found Log In button, clicking...');
          await loginBtn.click().catch(() => {});
          await page.waitForTimeout(2000);
        }
      }

      // Check if Create Key button exists
      const createBtn = await page.$(
        'button:has-text("Create new secret key"), button:has-text("Create key"), button:has-text("+ Create")'
      ).catch(() => null);

      if (createBtn) {
        const isVisible = await createBtn.isVisible().catch(() => false);
        if (isVisible) {
          console.log('\n🎯 FOUND DASHBOARD! Automatically creating new secret key...');
          await createBtn.click();
          await page.waitForTimeout(1500);

          // Fill name if input exists
          const nameInput = await page.$('input[placeholder*="name" i], input[type="text"]').catch(() => null);
          if (nameInput) {
            await nameInput.fill(`auto-key-${Date.now()}`).catch(() => {});
          }

          // Click Create / Submit
          const submitBtn = await page.$(
            'button[type="submit"]:has-text("Create"), button:has-text("Create secret key"), button:has-text("Save")'
          ).catch(() => null);

          if (submitBtn) {
            await submitBtn.click().catch(() => {});
          }

          console.log('⏳ Extracting generated API key from dialog...');
          await page.waitForTimeout(2500);

          // Find key from page content or inputs
          const content = await page.content();
          const match = content.match(/sk-[a-zA-Z0-9_\-]{20,}/);

          if (match) {
            const apiKey = match[0];
            console.log('\n======================================================');
            console.log('🎉 SUCCESS! RETRIEVED OPENAI API KEY:');
            console.log('🔑', apiKey.slice(0, 7) + '...' + apiKey.slice(-4));
            console.log('======================================================\n');

            // Set globally in Windows User environment
            console.log('🔧 Setting OPENAI_API_KEY globally on Windows...');
            try {
              execSync(`powershell -Command "[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', '${apiKey}', 'User')"`, {
                stdio: 'inherit'
              });
              console.log('✅ OPENAI_API_KEY saved to Windows environment.');
            } catch (e) {
              console.error('Error setting Windows env:', e.message);
            }

            // Save to .env.local
            const envLocalPath = path.join(process.cwd(), '.env.local');
            let envContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
            if (envContent.includes('OPENAI_API_KEY=')) {
              envContent = envContent.replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${apiKey}`);
            } else {
              envContent += `\nOPENAI_API_KEY=${apiKey}\n`;
            }
            fs.writeFileSync(envLocalPath, envContent, 'utf8');
            console.log('📝 Updated .env.local with OPENAI_API_KEY.');

            keyExtracted = true;
            await page.waitForTimeout(2000);
            await context.close();
            process.exit(0);
          }
        }
      }
    } catch (err) {
      // Loop continues
    }

    await new Promise((r) => setTimeout(r, 1500));
  }
}

autoFetchKey().catch((err) => {
  console.error('Fatal error:', err);
});
