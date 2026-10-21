const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function capture() {
  const targetDir = process.argv[2] || 'docs/screenshots/before';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Desktop view
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Capturing Login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(targetDir, 'login-desktop.png') });

  // Perform login
  await page.type('input[type="email"]', 'owner@mayboutique.vn');
  await page.type('input[type="password"]', 'ShopFlow@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const routes = [
    { name: 'dashboard', path: '/' },
    { name: 'orders', path: '/orders' },
    { name: 'products', path: '/products' },
    { name: 'customers', path: '/customers' },
    { name: 'faq', path: '/faq' },
    { name: 'showcase', path: '/showcase' },
  ];

  for (const route of routes) {
    console.log(`Capturing Desktop Light: ${route.name}`);
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(targetDir, `${route.name}-desktop-light.png`), fullPage: true });

    // Toggle dark mode if toggle button exists
    const darkToggle = await page.$('button[aria-label*="chế độ"], button[title*="Tối"], button[title*="Sáng"]');
    if (darkToggle) {
      await darkToggle.click();
      await new Promise(r => setTimeout(r, 500));
      console.log(`Capturing Desktop Dark: ${route.name}`);
      await page.screenshot({ path: path.join(targetDir, `${route.name}-desktop-dark.png`), fullPage: true });
      // Toggle back to light
      await darkToggle.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Mobile view (390x844 iPhone 12/13/14)
  console.log('Switching to mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  for (const route of routes) {
    console.log(`Capturing Mobile Light: ${route.name}`);
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(targetDir, `${route.name}-mobile-light.png`), fullPage: true });
  }

  await browser.close();
  console.log(`✅ All screenshots captured into ${targetDir}`);
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
