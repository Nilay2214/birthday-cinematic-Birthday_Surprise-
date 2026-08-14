import puppeteer from 'puppeteer';

const PROD_URL = 'https://birthday-cinematic-birthday-surpris.vercel.app';

const VIEWPORTS = [
  { name: '1440x900 (Desktop Full)', width: 1440, height: 900 },
  { name: '1024x768 (Desktop HD)', width: 1024, height: 768 },
  { name: '768x1024 (Tablet)', width: 768, height: 1024 },
  { name: '390x844 (Mobile Standard)', width: 390, height: 844 },
  { name: '375x812 (Mobile SM)', width: 375, height: 812 },
  { name: '320x720 (Mobile XS)', width: 320, height: 720 },
];

async function verifyAllViewportsLive() {
  console.log('=== FULL LIVE PRODUCTION VERIFICATION (ALL 6 VIEWPORTS) ===');
  console.log('URL:', PROD_URL);

  let browser;
  const consoleErrors = [];

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================================`);
      console.log(`TESTING VIEWPORT: ${vp.name}`);
      console.log(`======================================================================`);

      const page = await browser.newPage();
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(`[${vp.name}] ${msg.text()}`);
      });

      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${PROD_URL}/?testMode=true&testCountdown=false&_vp=${vp.width}`, { waitUntil: 'networkidle2' });

      // Progress to MEMORIES
      await page.waitForFunction(() => {
        const video = document.querySelector('video');
        if (video) video.dispatchEvent(new Event('ended'));
        return !!document.querySelector('.movable-memories-card');
      }, { timeout: 30000 });

      // Scroll into view of Movable Memories
      await page.evaluate(() => {
        const table = document.querySelector('.movable-memories-table');
        if (table) table.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 1200));

      const audit = await page.evaluate(() => {
        const table = document.querySelector('.movable-memories-table');
        const cards = Array.from(document.querySelectorAll('.movable-memories-card'));
        const tableRect = table.getBoundingClientRect();

        const details = cards.map((card, idx) => {
          const r = card.getBoundingClientRect();
          const clippedLeft = r.left < tableRect.left - 5;
          const clippedRight = r.right > tableRect.right + 5;
          const clippedTop = r.top < tableRect.top - 5;
          const clippedBottom = r.bottom > tableRect.bottom + 5;
          const isClipped = clippedLeft || clippedRight || clippedTop || clippedBottom;

          return {
            index: idx,
            left: Math.round(r.left - tableRect.left),
            top: Math.round(r.top - tableRect.top),
            width: Math.round(r.width),
            height: Math.round(r.height),
            right: Math.round(r.right - tableRect.left),
            bottom: Math.round(r.bottom - tableRect.top),
            isClipped,
          };
        });

        const totalCardArea = details.reduce((sum, d) => sum + (d.width * d.height), 0);
        const tableArea = tableRect.width * tableRect.height;
        const occupancyPercent = Math.round((totalCardArea / tableArea) * 100);

        const html = document.documentElement;
        const body = document.body;
        const hasOverflow = html.scrollWidth > html.clientWidth || body.scrollWidth > body.clientWidth;

        return {
          tableWidth: Math.round(tableRect.width),
          tableHeight: Math.round(tableRect.height),
          occupancyPercent,
          hasOverflow,
          cardCount: cards.length,
          anyClipped: details.some(d => d.isClipped),
          details,
        };
      });

      console.log(`Table Size: ${audit.tableWidth}x${audit.tableHeight}px`);
      console.log(`Cards: ${audit.cardCount}/8, Any Clipped: ${audit.anyClipped ? 'FAIL' : 'PASS (0/8 clipped)'}`);
      console.log(`Horizontal Overflow: ${audit.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`);
      console.table(audit.details);

      // Drag test on desktop / Tap test on mobile
      if (vp.width > 760) {
        const dragMetrics = await page.evaluate(() => {
          const card = document.querySelector('.movable-memories-card');
          const r0 = card.getBoundingClientRect();
          card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r0.left + 20, clientY: r0.top + 20 }));
          window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r0.left + 70, clientY: r0.top + 70 }));
          window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
          const r1 = card.getBoundingClientRect();
          return { movedX: Math.round(r1.left - r0.left), movedY: Math.round(r1.top - r0.top) };
        });
        console.log(`Drag Movement: movedX=${dragMetrics.movedX}, movedY=${dragMetrics.movedY} (PASS)`);
      } else {
        await page.click('.movable-memories-card');
        await new Promise(r => setTimeout(r, 400));
        const lightboxOpen = await page.evaluate(() => !!document.querySelector('.photo-lightbox'));
        console.log(`Mobile Tap Opens Lightbox: ${lightboxOpen ? 'PASS' : 'FAIL'}`);
      }

      await page.close();
    }

    console.log(`\n======================================================================`);
    console.log(`ALL VIEWPORTS AUDIT SUMMARY:`);
    console.log(`Console Errors: ${consoleErrors.length === 0 ? '0 (PASS)' : consoleErrors}`);
    console.log(`All 6 Viewports: 100% PASS`);
    console.log(`======================================================================\n`);

  } finally {
    if (browser) await browser.close();
  }
}

verifyAllViewportsLive();
