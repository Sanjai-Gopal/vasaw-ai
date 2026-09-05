import { chromium } from 'playwright';
import { execSync } from 'child_process';
import readline from 'readline';

async function main() {
  console.log('🚀 Launching Google Chrome to OpenAI API Keys...');

  let browser;
  try {
    // Launch installed Google Chrome in non-headless mode
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
    });
  } catch (err) {
    console.log('Could not launch with channel "chrome", falling back to default chromium...');
    browser = await chromium.launch({
      headless: false,
    });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to https://platform.openai.com/api-keys ...');
  await page.goto('https://platform.openai.com/api-keys');

  console.log('\n======================================================');
  console.log('👉 Please log in to your OpenAI account in the Chrome window.');
  console.log('👉 Once logged in, click "+ Create new secret key".');
  console.log('👉 Copy your API key (starts with sk-...).');
  console.log('======================================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Paste your OpenAI API Key here (or press Ctrl+C to exit): ', async (apiKey) => {
    const trimmedKey = apiKey.trim();
    if (trimmedKey.startsWith('sk-')) {
      console.log('\n✅ Valid OpenAI API Key detected.');
      console.log('🔧 Setting OPENAI_API_KEY environment variable permanently on Windows...');

      try {
        execSync(`powershell -Command "[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', '${trimmedKey}', 'User')"`, {
          stdio: 'inherit',
        });
        console.log('🎉 SUCCESS: OPENAI_API_KEY has been set globally for your Windows user profile!');
        console.log('💡 You can now run any OpenAI / MCP tools from your terminal.');
      } catch (e) {
        console.error('Failed to set environment variable:', e.message);
      }
    } else {
      console.log('⚠️ Input did not start with "sk-". Key was not saved.');
    }

    await browser.close();
    rl.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Error running browser automation:', err);
  process.exit(1);
});
