import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';

const PROD_URL = 'https://birthday-cinematic-birthday-surpris.vercel.app';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
  { name: '320x720', width: 320, height: 720 },
];

async function compareLocalVsProd() {
  console.log('=== COMPARING RUNTIME GEOMETRY: LOCALHOST vs VERCEL PRODUCTION ===');

  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    shell: true,
    cwd: process.cwd(),
  });

  const localUrl = 'http://localhost:4173';

  await new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(localUrl, () => {
        console.log(`Local preview server live at ${localUrl}`);
        resolve();
      }).on('error', () => {
        if (attempts < 25) setTimeout(check, 300);
        else resolve();
      });
    };
    check();
  });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const localPage = await browser.newPage();
    const prodPage = await browser.newPage();

    async function inspectMovable(page, url, vp) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${url}/?testMode=true&testCountdown=false`, { waitUntil: 'networkidle2' });

      // Wait for either stage or skip to MEMORIES
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) video.dispatchEvent(new Event('ended'));
      });

      // Poll until .movable-memories is in DOM
      await page.waitForFunction(() => {
        const v = document.querySelector('video');
        if (v) v.dispatchEvent(new Event('ended'));
        return !!document.querySelector('.movable-memories-card');
      }, { timeout: 30000 });

      // Scroll into view of Movable Memories to trigger any ScrollTriggers
      await page.evaluate(() => {
        const table = document.querySelector('.movable-memories-table');
        if (table) table.scrollIntoView({ behavior: 'instant', block: 'center' });
      });

      await new Promise(r => setTimeout(r, 1200));

      return await page.evaluate(() => {
        const table = document.querySelector('.movable-memories-table');
        const cards = Array.from(document.querySelectorAll('.movable-memories-card'));
        const tableRect = table ? table.getBoundingClientRect() : { width: 0, height: 0, left: 0, top: 0 };
        const tableComputed = table ? {
          position: getComputedStyle(table).position,
          width: getComputedStyle(table).width,
          height: getComputedStyle(table).height,
          padding: getComputedStyle(table).padding,
          display: getComputedStyle(table).display,
        } : null;

        const cardMetrics = cards.map((card, idx) => {
          const r = card.getBoundingClientRect();
          const cs = getComputedStyle(card);
          return {
            index: idx,
            left: Math.round(r.left - tableRect.left),
            top: Math.round(r.top - tableRect.top),
            width: Math.round(r.width),
            height: Math.round(r.height),
            right: Math.round(r.right - tableRect.left),
            bottom: Math.round(r.bottom - tableRect.top),
            inlineStyle: card.getAttribute('style') || '',
            computedPos: cs.position,
            computedLeft: cs.left,
            computedTop: cs.top,
            computedTransform: cs.transform,
            computedZIndex: cs.zIndex,
            computedDisplay: cs.display,
          };
        });

        return {
          tableRect: {
            left: Math.round(tableRect.left),
            top: Math.round(tableRect.top),
            width: Math.round(tableRect.width),
            height: Math.round(tableRect.height),
          },
          tableComputed,
          cardMetrics,
        };
      });
    }

    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);

      const localData = await inspectMovable(localPage, localUrl, vp);
      const prodData = await inspectMovable(prodPage, PROD_URL, vp);

      console.log('--- Table Comparison ---');
      console.log('LOCAL Table Rect:', localData.tableRect);
      console.log('PROD  Table Rect:', prodData.tableRect);
      console.log('LOCAL Table Computed:', localData.tableComputed);
      console.log('PROD  Table Computed:', prodData.tableComputed);

      console.log('\n--- Card Geometry Comparison (LOCAL vs PROD) ---');
      const compTable = localData.cardMetrics.map((lCard, i) => {
        const pCard = prodData.cardMetrics[i] || {};
        return {
          idx: i,
          'L Left': lCard.left,
          'P Left': pCard.left,
          'Diff L': (pCard.left ?? 0) - lCard.left,
          'L Top': lCard.top,
          'P Top': pCard.top,
          'Diff T': (pCard.top ?? 0) - lCard.top,
          'L W': lCard.width,
          'P W': pCard.width,
          'L H': lCard.height,
          'P H': pCard.height,
        };
      });
      console.table(compTable);

      console.log('\n--- Inline Style Sample (Card 0) ---');
      console.log('LOCAL inline:', localData.cardMetrics[0]?.inlineStyle);
      console.log('PROD  inline:', prodData.cardMetrics[0]?.inlineStyle);

      console.log('\n--- Computed Transform Sample (Card 0) ---');
      console.log('LOCAL transform:', localData.cardMetrics[0]?.computedTransform);
      console.log('PROD  transform:', prodData.cardMetrics[0]?.computedTransform);
    }

  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

compareLocalVsProd();
