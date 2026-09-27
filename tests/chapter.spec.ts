import { test, expect, type Page } from '@playwright/test';
const snapshot = (p: Page) => p.evaluate(() => (window as any).__xiaochi.snapshot());
async function ready(p: Page) { await p.goto('/'); await expect(p.locator('#scene')).toHaveAttribute('data-ready', 'true'); }
async function go(p: Page, x: number, y: number) {
  const origin = { x: 65, y: p.viewportSize()!.height - 80 };
  await p.mouse.move(origin.x, origin.y); await p.mouse.down();
  try {
    for (let i = 0; i < 60; i++) {
      const s = await snapshot(p), dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
      if (d < 2) return;
      await p.mouse.move(origin.x + dx / d * 55, origin.y + dy / d * 55);
      await p.waitForTimeout(Math.min(350, d / 69 * 1000));
    }
    throw new Error(`Cannot walk to ${x},${y}: ${JSON.stringify(await snapshot(p))}`);
  } finally { await p.mouse.up(); }
}
async function finishDialogue(p: Page, choices: string[] = []) {
  for (let i = 0; i < 100; i++) {
    if ((await snapshot(p)).mode !== 'dialogue') return;
    const buttons = p.locator('[data-dialogue-actions] button');
    if (process.env.CHAPTER_PACED) {
      const characters = (await p.locator('#dialogue-text').innerText()).length;
      const choices = await p.locator('[data-choice]').count();
      await p.waitForTimeout(Math.max(1800, characters / 6 * 1000) + (choices > 1 ? 3000 : 0));
    }
    await expect(buttons.first()).toBeVisible();
    let chosen = false;
    for (const id of choices) {
      const b = p.locator(`[data-dialogue-actions] [data-choice="${id}"]`);
      if (await b.count()) { await b.click(); chosen = true; break; }
    }
    if (!chosen) await buttons.first().click();
  }
  throw new Error('Dialogue did not terminate');
}
async function seed(p: Page, eventId: string, location: string) {
  await ready(p);
  await p.evaluate(async ({ eventId, location }) => {
    const { freshChapter, CHECKPOINT_KEY } = await import(/* @vite-ignore */ '/src/systems/events.ts');
    const s = freshChapter('employment', eventId); s.location = location;
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(s));
  }, { eventId, location });
  await p.reload(); await expect(p.locator('#scene')).toHaveAttribute('data-ready', 'true');
}

test('station to October: real joystick explores all three maps and completes the self-prep chapter', async ({ page }) => {
  test.setTimeout(process.env.CHAPTER_PACED ? 480000 : 150000);
  const began = Date.now();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await ready(page);
  await go(page, 345, 174); await go(page, 84, 174);
  await page.getByRole('button', { name: '登上社畜号', exact: true }).click();
  await page.getByRole('button', { name: '上。', exact: true }).click();
  await expect(page.locator('#life-transition')).toBeVisible();
  await expect(page.locator('#dialogue-speaker')).toHaveText('2026年9月');
  await finishDialogue(page);
  expect((await snapshot(page)).chapter.eventId).toBe('applications');
  await expect(page.locator('#movement-hint')).toBeHidden();
  await page.screenshot({ path: `test-results/life-campus-${test.info().project.name}.png` });
  await go(page, 180, 185); await go(page, 65, 142);
  await page.getByRole('button', { name: '回宿舍', exact: true }).click();
  expect((await snapshot(page)).location).toBe('dorm');
  await page.screenshot({ path: `test-results/life-dorm-${test.info().project.name}.png` });
  await go(page, 267, 194); await page.getByRole('button', { name: '打开电脑', exact: true }).click();
  await finishDialogue(page, ['industry-3', 'role-1']);
  let s = (await snapshot(page)).chapter;
  expect([s.targetIndustry, s.targetRole, s.applicationCount]).toEqual(['半导体', '运营', 200]);
  await page.locator('#life-mail').click(); await finishDialogue(page);
  expect((await snapshot(page)).chapter.eventId).toBe('assessment');
  await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  expect((await snapshot(page)).chapter.applicationCount).toBe(200);
  // Saved checkpoint restores room spawn, not an active modal or a held joystick.
  await go(page, 180, 342); await page.getByRole('button', { name: '去校园', exact: true }).click();
  await go(page, 180, 185); await go(page, 290, 142); await page.getByRole('button', { name: '去图书馆', exact: true }).click();
  await page.screenshot({ path: `test-results/life-library-${test.info().project.name}.png` });
  await go(page, 267, 194); await page.getByRole('button', { name: '使用公共电脑', exact: true }).click();
  await finishDialogue(page, ['quiz:0:2', 'quiz:1:0', 'quiz:2:2']);
  s = (await snapshot(page)).chapter; expect(s.quizResult.correct).toBe(0); expect(s.eventId).toBe('friend');
  await go(page, 267, 300); await go(page, 180, 342); await page.getByRole('button', { name: '去校园', exact: true }).click();
  await go(page, 224, 280); await page.getByRole('button', { name: '和朋友聊天', exact: true }).click();
  await finishDialogue(page, ['friend-food']);
  expect((await snapshot(page)).chapter.friendReply).toBe('……要不要先去吃饭？');
  await go(page, 290, 142); await page.getByRole('button', { name: '去图书馆', exact: true }).click();
  await go(page, 126, 280); await page.getByRole('button', { name: '坐到自习桌前', exact: true }).click();
  await finishDialogue(page, ['prep-self', 'focus-data', 'mock-limit']);
  s = (await snapshot(page)).chapter; expect(s.interviewPrepChoice).toBe('self'); expect(s.jdFocus).toBe('数据分析');
  await go(page, 180, 342); await page.getByRole('button', { name: '去校园', exact: true }).click();
  await go(page, 180, 185); await go(page, 65, 142); await page.getByRole('button', { name: '回宿舍', exact: true }).click();
  await go(page, 267, 194); await page.getByRole('button', { name: '打开电脑', exact: true }).click();
  await finishDialogue(page, ['interview-data', 'interview-align']);
  expect((await snapshot(page)).chapter.interviewChoices).toEqual(['data', 'align']);
  await go(page, 180, 342); await page.getByRole('button', { name: '去校园', exact: true }).click();
  await go(page, 180, 185); await go(page, 290, 142); await page.getByRole('button', { name: '去图书馆', exact: true }).click();
  await page.locator('#life-mail').click(); await finishDialogue(page);
  await expect(page.locator('#chapter-end')).toBeVisible();
  s = (await snapshot(page)).chapter;
  expect(s.completed).toHaveLength(8); expect(s.currentMonth).toBe('2026年10月'); expect(s.eventId).toBeNull();
  expect(s.initialRoute).toBe('employment'); expect(s.balance).toBe(8000);
  await page.screenshot({ path: `test-results/life-end-${test.info().project.name}.png` });
  await page.reload(); await expect(page.locator('#chapter-end')).toBeVisible();
  expect((await snapshot(page)).chapter).toEqual(s);
  expect(errors).toEqual([]);
  console.log(`Chapter playthrough: ${((Date.now() - began) / 1000).toFixed(1)} seconds (${process.env.CHAPTER_PACED ? 'paced reading, 6 chars/sec plus choices' : 'fast functional run'})`);
});

test('coaching purchase commits once, cancellation rolls back, and missing storage is reported', async ({ page }) => {
  await seed(page, 'preparation', 'library');
  await go(page, 126, 280); await page.getByRole('button', { name: '坐到自习桌前' }).click();
  await finishDialogue(page, ['prep-coach', 'buy-coach']);
  expect((await snapshot(page)).chapter.balance).toBe(1001);
  await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  expect((await snapshot(page)).chapter.balance).toBe(1001);
  const results = await page.evaluate(async () => {
    const { EventSystem, freshChapter, saveChapter, loadChapter } = await import(/* @vite-ignore */ '/src/systems/events.ts');
    const { employmentChapter } = await import(/* @vite-ignore */ '/src/content/employment-ch1.ts');
    const s = freshChapter('employment', 'preparation'); const runner = new EventSystem(employmentChapter, s);
    runner.begin('library', 'reading'); runner.choose('buy-coach'); runner.cancel(); const cancelled = s.balance;
    runner.begin('library', 'reading'); runner.choose('buy-coach'); runner.choose('buy-coach'); runner.finish(); runner.finish(); const once = s.balance;
    const replies = ['friend-comfort', 'friend-plan', 'friend-food'].map(id => {
      const state = freshChapter('employment', 'friend'); const e = new EventSystem(employmentChapter, state);
      e.begin('campus', 'friend'); e.choose(id); e.finish(); return [state.eventId, state.friendReply];
    });
    const original = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('Quota'); };
    const failedSave = saveChapter(s); Storage.prototype.setItem = original;
    localStorage.setItem('xiaochi.chapter.v1', '{broken'); const corrupt = loadChapter(employmentChapter);
    return { cancelled, once, replies, failedSave, corrupt };
  });
  expect(results.cancelled).toBe(8000); expect(results.once).toBe(1001);
  expect(results.replies.every((r: string[]) => r[0] === 'preparation' && r[1])).toBe(true);
  expect(results.failedSave).toBe(false); expect(results.corrupt).toBeNull();
  await seed(page, 'result', 'library');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Quota'); }; });
  await page.locator('#life-mail').click(); await finishDialogue(page);
  await expect(page.locator('#chapter-save-status')).toContainText('保存未成功');
  await expect(page.locator('#chapter-save-retry')).toBeVisible();
});

test('quiz shows red correction or green success, then continues; final email uses revised wording', async ({ page }) => {
  await seed(page, 'assessment', 'library');
  await go(page, 267, 194);
  await page.getByRole('button', { name: '使用公共电脑' }).click();
  await page.getByRole('button', { name: '继续 ▸' }).click();
  await expect(page.locator('#dialogue-text')).toContainText('我就是不考公才来秋招的，怎么一打开全是行策 ᗜ - ᗜꐦ.........');
  await page.getByRole('button', { name: '继续 ▸' }).click();
  await page.getByRole('button', { name: '打开测评' }).click();
  await page.locator('[data-choice="quiz:0:2"]').click();
  await expect(page.locator('#dialogue-speaker')).toHaveText('答错了');
  await expect(page.locator('#dialogue-text')).toContainText('正确答案：△');
  await expect(page.locator('.dialogue-panel')).toHaveAttribute('data-feedback', 'incorrect');
  await expect(page.locator('#dialogue-speaker')).toHaveCSS('color', 'rgb(166, 55, 55)');
  await expect(page.locator('#dialogue-text')).not.toContainText('测评照常继续');
  await page.getByRole('button', { name: '继续 ▸' }).click();
  await page.locator('[data-choice="quiz:1:1"]').click();
  await expect(page.locator('#dialogue-speaker')).toHaveText('答对了');
  await expect(page.locator('.dialogue-panel')).toHaveAttribute('data-feedback', 'correct');
  await expect(page.locator('#dialogue-speaker')).toHaveCSS('color', 'rgb(36, 107, 73)');
  await page.getByRole('button', { name: '继续 ▸' }).click();
  await page.locator('[data-choice="quiz:2:2"]').click();
  await expect(page.locator('#dialogue-text')).toContainText('正确答案：25%');
  await finishDialogue(page);
  const chapter = (await snapshot(page)).chapter;
  expect(chapter.quizResult.correct).toBe(1);
  expect(chapter.eventId).toBe('friend');

  await seed(page, 'result', 'library');
  await page.locator('#life-mail').click();
  await page.getByRole('button', { name: '打开邮件' }).click();
  await page.getByRole('button', { name: '继续 ▸' }).click();
  await expect(page.locator('#dialogue-text')).toHaveText('预祝您下一轮面试顺利');
});

test('life collision, touch layout and reusable event/quiz data validation', async ({ page }) => {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height }); await seed(page, 'applications', 'dorm');
    await go(page, 90, 250);
    await page.mouse.move(65, height - 80); await page.mouse.down(); await page.mouse.move(65, height - 135); await page.waitForTimeout(500); await page.mouse.up();
    expect((await snapshot(page)).y).toBeGreaterThanOrEqual(230);
    await go(page, 180, 270); await go(page, 267, 194);
    await page.getByRole('button', { name: '打开电脑' }).click();
    await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
    await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
    const panel = (await page.getByRole('dialog').boundingBox())!;
    expect(panel.y).toBeGreaterThan(0); expect(panel.y + panel.height).toBeLessThanOrEqual(height);
    await expect(page.getByRole('button', { name: '互联网', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '外企', exact: true }).click();
    const heading = (await page.locator('.dialogue-panel .dialogue-heading').boundingBox())!;
    expect(heading.y).toBeGreaterThanOrEqual(panel.y);
    expect(await page.locator('.dialogue-panel').evaluate(element => element.scrollTop)).toBe(0);
    expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth > innerWidth])).toEqual([0, 0, false]);
    await page.screenshot({ path: `test-results/life-dialogue-${width}-${test.info().project.name}.png` });
  }
});
