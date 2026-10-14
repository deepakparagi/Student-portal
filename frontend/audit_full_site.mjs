import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('..', 'docs', 'ui-audit');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BREAKPOINTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];

const BASE_URL = 'http://localhost:3000';
const axeResults = [];

async function loginUser(page, roleName) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  // Try quick login button
  const quickBtn = page.locator(`button:has-text("${roleName}")`).first();
  if (await quickBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log(`Logging in using quick-login button for ${roleName}...`);
    await quickBtn.click();
  } else {
    // Fill credentials
    const email = roleName.toLowerCase() === 'admin' ? 'admin@test.com' :
                  roleName.toLowerCase() === 'parent' ? 'parent@test.com' : 'student@test.com';
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await emailInput.fill(email);
    await passwordInput.fill('Password123!');
    const submitBtn = page.locator('button.auth-submit, button:has-text("Sign in")').first();
    await submitBtn.click();
  }

  // Wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 12000 }).catch(err => {
    console.warn(`URL navigation timeout for ${roleName}:`, err.message);
  });
  await page.waitForTimeout(1000);
}

async function captureRoute(page, route, filePrefix, options = {}) {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    if (options.navigate !== false && route) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(600);
    }
    
    if (options.preAction) {
      await options.preAction(page, bp);
      await page.waitForTimeout(400);
    }

    const filename = `${filePrefix}-${bp.name}.png`;
    const filepath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: options.fullPage ?? false });

    // Run Axe on 1440 and 390
    if (bp.name === '1440' || bp.name === '390') {
      try {
        const results = await new AxeBuilder({ page }).analyze();
        axeResults.push({
          route: route || filePrefix,
          prefix: filePrefix,
          breakpoint: bp.name,
          violations: results.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
        });
      } catch (err) {
        console.error(`Axe error on ${filePrefix}:`, err.message);
      }
    }
  }
}

async function runAudit() {
  console.log('Starting comprehensive full-site audit across breakpoints and roles...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  // 1. PUBLIC ROUTES (Landing & Auth)
  console.log('1. Auditing Public Landing & Auth Routes...');
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  // Landing Top
  await captureRoute(publicPage, '/', 'landing-hero', { fullPage: false });
  // Landing Full Page (scrolled below fold)
  await captureRoute(publicPage, '/', 'landing-full', { fullPage: true });

  // Login Page
  await captureRoute(publicPage, '/login', 'auth-login', { fullPage: false });

  // Register Tab / View
  await captureRoute(publicPage, '/register', 'auth-register', { fullPage: true });
  await publicContext.close();

  // 2. STUDENT ROLE ROUTES
  console.log('2. Auditing Student Portal Routes...');
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await loginUser(studentPage, 'Student');

  await captureRoute(studentPage, '/dashboard', 'student-dashboard', { fullPage: true });
  await captureRoute(studentPage, '/quizzes', 'student-quizzes', { fullPage: true });

  // Look for an actual quiz link or visit /quizzes/5
  let quizUrl = '/quizzes/5';
  try {
    const quizLink = studentPage.locator('a[href^="/quizzes/"]').first();
    if (await quizLink.isVisible().catch(() => false)) {
      const href = await quizLink.getAttribute('href');
      if (href) quizUrl = href;
    }
  } catch {}
  await captureRoute(studentPage, quizUrl, 'student-quiz-runner', { fullPage: true });

  await captureRoute(studentPage, '/ai-tutor', 'student-tutor', { fullPage: false });
  await captureRoute(studentPage, '/tasks', 'student-tasks', { fullPage: true });
  await captureRoute(studentPage, '/focus', 'student-focus', { fullPage: true });
  await captureRoute(studentPage, '/analytics', 'student-progress', { fullPage: true });
  await studentContext.close();

  // 3. PARENT ROLE ROUTES
  console.log('3. Auditing Parent Portal Routes...');
  const parentContext = await browser.newContext();
  const parentPage = await parentContext.newPage();
  await loginUser(parentPage, 'Parent');

  await captureRoute(parentPage, '/parent', 'parent-overview', { fullPage: true });

  // Parent Quizzes Tab
  await captureRoute(parentPage, null, 'parent-tab-quizzes', {
    navigate: false,
    preAction: async (page) => {
      const tab = page.locator('button:has-text("Quizzes")').first();
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
    fullPage: true,
  });

  // Parent Sessions Tab
  await captureRoute(parentPage, null, 'parent-tab-sessions', {
    navigate: false,
    preAction: async (page) => {
      const tab = page.locator('button:has-text("Study Sessions")').first();
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
    fullPage: true,
  });

  // Parent Tasks Tab
  await captureRoute(parentPage, null, 'parent-tab-tasks', {
    navigate: false,
    preAction: async (page) => {
      const tab = page.locator('button:has-text("Tasks")').first();
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
    fullPage: true,
  });

  await parentContext.close();

  // 4. ADMIN ROLE ROUTES & TABS
  console.log('4. Auditing Admin Portal Routes & Tabs...');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginUser(adminPage, 'Admin');

  // Admin Overview / Users
  await captureRoute(adminPage, '/admin', 'admin-users', { fullPage: true });

  // Admin Document Pipeline Tab
  await captureRoute(adminPage, null, 'admin-tab-pipeline', {
    navigate: false,
    preAction: async (page) => {
      const tab = page.locator('button:has-text("Document Pipeline")').first();
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
    fullPage: true,
  });

  // Admin Platform Activity Stream Tab
  await captureRoute(adminPage, null, 'admin-tab-stream', {
    navigate: false,
    preAction: async (page) => {
      const tab = page.locator('button:has-text("Platform Activity")').first();
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
    fullPage: true,
  });

  // Admin Diagnostics & Health Tab
  await captureRoute(adminPage, null, 'admin-tab-health', {
    navigate: false,
    preAction: async (page) => {
      const tab = page.locator('button:has-text("Diagnostics")').first();
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
    fullPage: true,
  });

  await adminContext.close();
  await browser.close();

  // Save Axe results summary
  const axeReportPath = path.join(OUT_DIR, 'axe-audit-results.json');
  fs.writeFileSync(axeReportPath, JSON.stringify(axeResults, null, 2));
  console.log(`Audit complete! Screenshots and Axe report saved in ${OUT_DIR}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

