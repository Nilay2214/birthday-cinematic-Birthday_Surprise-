import puppeteer from 'puppeteer';

const PROD_URL = 'https://birthday-cinematic-birthday-surpris.vercel.app';

async function test1024Live() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto(`${PROD_URL}/?testMode=true&testCountdown=false`, { waitUntil: 'networkidle2' });

  // Progress to MEMORIES
  await page.waitForFunction(() => {
    const video = document.querySelector('video');
    if (video) video.dispatchEvent(new Event('ended'));
    return !!document.querySelector('.movable-memories-card');
  }, { timeout: 30000 });

  await page.evaluate(() => {
    const table = document.querySelector('.movable-memories-table');
    table?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1200));

  const debugInfo = await page.evaluate(() => {
    const table = document.querySelector('.movable-memories-table');
    const cards = Array.from(document.querySelectorAll('.movable-memories-card'));
    const rect = table.getBoundingClientRect();
    return {
      windowWidth: window.innerWidth,
      mqMatches: window.matchMedia('(max-width: 768px)').matches,
      tableRect: { width: rect.width, height: rect.height, left: rect.left, top: rect.top },
      cardStyles: cards.map((c, i) => ({
        index: i,
        inline: c.getAttribute('style'),
        left: c.offsetLeft,
        top: c.offsetTop,
        width: c.offsetWidth,
        height: c.offsetHeight,
        computedTransform: getComputedStyle(c).transform,
      }))
    };
  });

  console.log('=== DEBUG INFO 1024x768 ===');
  console.log('windowWidth:', debugInfo.windowWidth);
  console.log('mqMatches (<=768):', debugInfo.mqMatches);
  console.log('tableRect:', debugInfo.tableRect);
  console.table(debugInfo.cardStyles);

  await browser.close();
}

test1024Live();
