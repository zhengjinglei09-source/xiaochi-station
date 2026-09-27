import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 650 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForSelector('#scene[data-ready="true"]');
  await page.evaluate(async () => {
    const { NpcRenderer } = await import('/src/assets/npc.ts');
    const renderer = new NpcRenderer(); await renderer.load();
    const hero = new Image(); hero.src = '/assets/character/front.png'; await hero.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1100; canvas.height = 650;
    canvas.id = 'art-review'; canvas.style.cssText = 'position:fixed;inset:0;z-index:100;width:1100px;height:650px'; document.body.append(canvas);
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    c.fillStyle = '#e8e0cc'; c.fillRect(0, 0, 1100, 650);
    c.fillStyle = '#354e4c'; c.font = 'bold 22px sans-serif'; c.fillText('小迟视觉锚点 × 原创 NPC · 同比例对照', 32, 40);
    const roles = ['conductor', 'commuter-cv', 'commuter-book', 'commuter-ddl'];
    const labels = ['余小迟（原素材未改）', '列车员 · 站立 / 招呼', '资料青年', '抱书女生', '赶路同学'];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = '#536b61'; c.font = '15px sans-serif'; c.fillText(labels[i], 28 + i * 217, 77);
      c.save(); c.translate(110 + i * 217, 350); c.scale(2.7, 2.7);
      if (!i) c.drawImage(hero, -81 * hero.width / hero.height / 2, -81, 81 * hero.width / hero.height, 81);
      else renderer.draw(c, roles[i - 1], 0, 0);
      c.restore();
      c.save(); c.translate(110 + i * 217, 500);
      if (!i) c.drawImage(hero, -81 * hero.width / hero.height / 2, -81, 81 * hero.width / hero.height, 81);
      else renderer.draw(c, roles[i - 1], 0, 0, 1);
      c.restore();
    }
    c.fillStyle = '#536b61'; c.font = '16px sans-serif'; c.fillText('上排：2.7× 放大审阅 ｜ 下排：游戏逻辑尺寸、第二姿态 ｜ 列车员沿用同一双脚锚点', 32, 566);
    c.font = '14px sans-serif'; c.fillText('外部人物仅用于理解像素语言；没有复制、裁切或描图参考人物。', 32, 600);
  });
  await mkdir('docs', { recursive: true });
  await page.screenshot({ path: 'docs/npc-art-review.png' });
} finally { await browser.close(); }
