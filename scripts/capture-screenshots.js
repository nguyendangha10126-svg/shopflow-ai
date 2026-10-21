const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function capture() {
  const targetDir = process.argv[2] || 'docs/screenshots/after';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Chụp Landing Page (Welcome) Desktop & Mobile (Light + Dark)
  console.log('Capturing Landing Page (Welcome)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(targetDir, '00_welcome_desktop_light.png') });

  // Mobile Welcome
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(targetDir, '00_welcome_mobile_light.png') });

  // 2. Chụp Login Page Desktop & Mobile
  console.log('Capturing Login Page...');
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(targetDir, '01_login_desktop_light.png') });

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(targetDir, '01_login_mobile_light.png') });

  // 3. Thực hiện Đăng nhập vào App
  console.log('Logging in with demo account...');
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'owner@mayboutique.vn');
  await page.type('input[type="password"]', 'ShopFlow@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  // Đánh dấu đã qua onboarding để chụp màn hình trang chính thức
  await page.evaluate(() => {
    localStorage.setItem('shopflow_onboarding_completed', 'true');
  });

  const routes = [
    { prefix: '02_dashboard', name: 'Dashboard', path: '/' },
    { prefix: '03_orders', name: 'Orders', path: '/orders' },
    { prefix: '04_products', name: 'Products', path: '/products' },
    { prefix: '05_customers', name: 'Customers', path: '/customers' },
    { prefix: '06_faq', name: 'FAQ', path: '/faq' },
    { prefix: '07_styleguide', name: 'Styleguide', path: '/styleguide' },
  ];

  // Chụp Desktop (1280px) Light & Dark
  await page.setViewport({ width: 1280, height: 850 });
  for (const r of routes) {
    console.log(`Capturing Desktop Light: ${r.name}`);
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle0' });
    await new Promise(res => setTimeout(res, 1200));
    await page.screenshot({ path: path.join(targetDir, `${r.prefix}_desktop_light.png`), fullPage: true });

    // Dark mode toggle
    const themeBtn = await page.$('button[title*="Tối"], button[title*="Sáng"], button[aria-label*="chế độ"]');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(res => setTimeout(res, 600));
      console.log(`Capturing Desktop Dark: ${r.name}`);
      await page.screenshot({ path: path.join(targetDir, `${r.prefix}_desktop_dark.png`), fullPage: true });
      // Switch back to light
      await themeBtn.click();
      await new Promise(res => setTimeout(res, 400));
    }
  }

  // Chụp Mobile (390px) Light & Dark
  console.log('Switching to mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  for (const r of routes) {
    console.log(`Capturing Mobile Light: ${r.name}`);
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle0' });
    await new Promise(res => setTimeout(res, 1000));
    await page.screenshot({ path: path.join(targetDir, `${r.prefix}_mobile_light.png`), fullPage: true });

    const themeBtn = await page.$('button[title*="Tối"], button[title*="Sáng"], button[aria-label*="chế độ"]');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(res => setTimeout(res, 600));
      console.log(`Capturing Mobile Dark: ${r.name}`);
      await page.screenshot({ path: path.join(targetDir, `${r.prefix}_mobile_dark.png`), fullPage: true });
      await themeBtn.click();
      await new Promise(res => setTimeout(res, 400));
    }
  }

  await browser.close();
  console.log(`🎉 [U14] Toàn bộ ảnh sau nâng cấp (After) đã được lưu vào ${targetDir}`);
}

capture().catch(err => {
  console.error('Lỗi khi chụp màn hình nghiệm thu:', err);
  process.exit(1);
});
