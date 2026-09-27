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
    if (process.env.POSTGRAD_PACED) {
      const characters = (await p.locator('#dialogue-text').innerText()).length;
      const choices = await p.locator('[data-choice]').count();
      await p.waitForTimeout(Math.max(1800, characters / 5 * 1000) + (choices > 1 ? 3000 : 0));
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
async function board(p: Page, name: string, x: number) {
  await go(p, 345, 174); await go(p, x, 174);
  await p.getByRole('button', { name: `登上${name}`, exact: true }).click();
  await p.getByRole('button', { name: '上。', exact: true }).click();
}
async function library(p: Page) {
  await expect(p.locator('#game')).toHaveAttribute('data-scene', 'life');
  await expect(p.locator('#game')).toHaveAttribute('data-mode', 'exploring');
  await expect(p.locator('#life-transition')).toBeHidden();
  await go(p, 180, 185); await go(p, 290, 142);
  await p.getByRole('button', { name: '去图书馆', exact: true }).click();
}
async function reading(p: Page) {
  await go(p, 267, 280); await go(p, 126, 280);
  await p.getByRole('button', { name: '坐到自习桌前', exact: true }).click();
}
async function toOctober(p: Page) {
  await ready(p); await board(p, '学术号', 212);
  await expect(p.locator('#life-transition strong')).toHaveText('2026年9月');
  await library(p); await go(p, 267, 194);
  await p.getByRole('button', { name: '使用公共电脑', exact: true }).click();
  await finishDialogue(p, ['target-match']);
  expect((await snapshot(p)).chapter.postgradTarget).toBe('match');
  await reading(p); await finishDialogue(p, ['memory-first-no', 'memory-second-yes']);
  expect((await snapshot(p)).chapter.postgradMemoryQuizResult).toEqual([false, true]);
  await reading(p);
  // Verify the scripted 5/5 reading errors, then intentionally retry one vocabulary answer.
  let sawFive = false, sawReaction = false, retried = false;
  for (let i = 0; i < 50 && (await snapshot(p)).mode === 'dialogue'; i++) {
    const text = await p.locator('#dialogue-text').innerText();
    sawFive ||= (text.match(/❌/g) ?? []).length === 5;
    sawReaction ||= text === '挺整齐。';
    if (process.env.POSTGRAD_PACED) await p.waitForTimeout(Math.max(1800, text.length / 5 * 1000) + ((await p.locator('[data-choice]').count()) > 1 ? 3000 : 0));
    const wrong = p.locator('[data-choice="quiz:0:0"]');
    if (!retried && await wrong.count()) {
      await wrong.click(); retried = true;
      await expect(p.locator('#dialogue-speaker')).toHaveText('再想想');
    } else {
      const correct = p.locator('[data-choice="quiz:0:1"], [data-choice="quiz:1:0"], [data-choice="quiz:2:2"]');
      if (await correct.count()) await correct.first().click();
      else await p.locator('[data-dialogue-actions] button').first().click();
    }
  }
  expect(sawFive && sawReaction && retried).toBe(true);
  const s = (await snapshot(p)).chapter;
  expect(s.postgradEnglishQuizResult.attempts).toEqual([2, 1, 1]);
  expect(s.postgradEnglishQuizResult.correct).toBe(2); expect(s.quizResult).toBeNull();
  expect(s.currentMonth).toBe('2026年10月'); expect(s.eventId).toBe('pg-october');
}

test('continue: complete postgrad chapter, exam, free movement and persistent neutral result', async ({ page }) => {
  test.setTimeout(process.env.POSTGRAD_PACED ? 480000 : 130000);
  const began = Date.now(), errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await toOctober(page); await reading(page); await finishDialogue(page, ['pg-continue']);
  expect((await snapshot(page)).chapter.currentMonth).toBe('2026年12月');
  await go(page, 267, 280); await go(page, 267, 194);
  await page.getByRole('button', { name: '使用公共电脑', exact: true }).click();
  await finishDialogue(page);
  const examStart = Date.now();
  await expect(page.locator('#life-transition')).toBeVisible();
  await page.screenshot({ path: `test-results/postgrad-exam-${test.info().project.name}.png` });
  await expect(page.locator('#life-transition')).toBeHidden({ timeout: 33000 });
  expect(Date.now() - examStart).toBeGreaterThan(22000);
  expect((await snapshot(page)).location).toBe('campus');
  await expect(page.locator('#life-hint')).toBeEmpty(); await expect(page.locator('#life-mail')).toBeHidden();
  const before = await snapshot(page); await go(page, before.x + 20, before.y);
  expect((await snapshot(page)).x).toBeGreaterThan(before.x + 15);
  await expect(page.locator('#life-mail')).toBeVisible({ timeout: 8000 });
  await page.locator('#life-mail').click(); await finishDialogue(page);
  await expect(page.locator('#chapter-end')).toContainText('学术号 · 第一阶段结束');
  const s = (await snapshot(page)).chapter;
  expect(s.completed).toHaveLength(6); expect(s.currentMonth).toBe('2027年2月');
  expect(s.initialRoute).toBe('postgrad'); expect(s.postgradResult).toBe('retest');
  await page.screenshot({ path: `test-results/postgrad-end-${test.info().project.name}.png` });
  await page.reload(); await expect(page.locator('#chapter-end')).toBeVisible();
  expect((await snapshot(page)).chapter).toEqual(s); expect(errors).toEqual([]);
  console.log(`Postgrad playthrough: ${((Date.now() - began) / 1000).toFixed(1)}s (${process.env.POSTGRAD_PACED ? 'paced: 5 chars/sec plus choices' : 'fast functional'})`);
});

test('stop: station, rejoin and transfer to employment retain history and October', async ({ page }) => {
  test.setTimeout(130000);
  await toOctober(page); await reading(page); await finishDialogue(page, ['pg-stop']);
  await expect(page.locator('h1')).toHaveText('人生车站');
  let s = (await snapshot(page)).transfer;
  expect(s.atStation).toBe(true); expect(s.postgradOctoberChoice).toBe('stop');
  await page.reload(); await expect(page.locator('h1')).toHaveText('人生车站');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await board(page, '学术号', 212); await library(page);
  expect((await snapshot(page)).chapter.eventId).toBe('pg-october');
  await reading(page); await finishDialogue(page, ['pg-stop']);
  await expect(page.locator('h1')).toHaveText('人生车站');
  await board(page, '社畜号', 84); await expect(page.locator('#game')).toHaveAttribute('data-scene', 'life'); await expect(page.locator('#game')).toHaveAttribute('data-mode', 'exploring');
  s = (await snapshot(page)).chapter;
  expect(s.initialRoute).toBe('postgrad'); expect(s.currentRoute).toBe('employment');
  expect(s.postgradTarget).toBe('match'); expect(s.currentMonth).toBe('2026年10月');
  expect(s.eventId).toBe('applications'); expect(s.routeHistory).toEqual(['postgrad', 'employment']);
  await go(page, 180, 185); await go(page, 65, 142); await page.getByRole('button', { name: '回宿舍', exact: true }).click();
  await go(page, 267, 194); await page.getByRole('button', { name: '打开电脑', exact: true }).click();
  await finishDialogue(page, ['industry-0', 'role-0']);
  expect((await snapshot(page)).chapter.applicationCount).toBe(200);
  await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  s = (await snapshot(page)).chapter;
  expect(s.eventId).toBe('mail'); expect(s.currentMonth).toBe('2026年10月'); expect(s.postgradMemoryQuizResult).toEqual([false, true]);
});

test('retest is guaranteed regardless of quiz scores and old seed; postgrad choices fit mobile sizes', async ({ page }) => {
  await ready(page);
  const results = await page.evaluate(async () => {
    const { EventSystem, freshChapter } = await import(/* @vite-ignore */ '/src/systems/events.ts');
    const { postgradEvents } = await import(/* @vite-ignore */ '/src/content/postgrad.ts');
    return [0, .4, .9].flatMap(resultSeed => [0, 1, 3].map(correct => {
      const s = freshChapter('postgrad', 'pg-result'); s.currentMonth = '2026年12月'; s.resultSeed = resultSeed;
      s.postgradEnglishQuizResult = { quizId: 'common-vocabulary-01', answers: correct === 3 ? [1, 0, 2] : [0, 1, 0], correct, total: 3 };
      s.postgradMemoryQuizResult = [correct === 3, correct > 0];
      const e = new EventSystem(postgradEvents, s); const first = e.begin('campus', 'phone')!.id;
      e.cancel(); const repeated = e.begin('campus', 'phone')!.id; e.finish();
      return { first, repeated, result: s.postgradResult };
    }));
  });
  expect(results).toHaveLength(9);
  expect(results.every(r => r.result === 'retest')).toBe(true);
  expect(results.every(r => r.first === r.repeated)).toBe(true);
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(async () => {
      const { freshChapter, CHECKPOINT_KEY } = await import(/* @vite-ignore */ '/src/systems/events.ts');
      const s = freshChapter('postgrad', 'pg-target'); s.location = 'library'; localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(s));
    });
    await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
    await go(page, 267, 194); await page.getByRole('button', { name: '使用公共电脑', exact: true }).click();
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
    const box = (await page.getByRole('dialog').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(height);
    await expect(page.getByRole('button', { name: '比较匹配的学校', exact: true })).toBeVisible();
    expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth > innerWidth])).toEqual([0, 0, false]);
    await page.screenshot({ path: `test-results/postgrad-choice-${width}-${test.info().project.name}.png` });
    await page.evaluate(async () => {
      const { freshChapter, CHECKPOINT_KEY } = await import(/* @vite-ignore */ '/src/systems/events.ts');
      const s = freshChapter('postgrad', 'pg-result'); s.currentMonth = '2026年12月';
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(s));
    });
    await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
    await page.locator('#life-mail').click();
    const lines: string[] = [];
    while ((await snapshot(page)).mode === 'dialogue') {
      lines.push(await page.locator('#dialogue-text').innerText());
      const panel = (await page.getByRole('dialog').boundingBox())!;
      expect(panel.y).toBeGreaterThanOrEqual(0); expect(panel.y + panel.height).toBeLessThanOrEqual(height);
      await page.locator('[data-dialogue-actions] button').first().click();
    }
    expect(lines).toEqual(['小迟打开查分页面，输完最后一位信息。', '页面加载中……', '……', '页面刷新出来的那一刻，余小迟盯着分数线看了好几遍。', '……进了？', '……', '我进复试了？？？', '？？？', '你进了！！', '啊啊啊啊啊啊']);
    await expect(page.locator('#chapter-end')).toContainText('学术号 · 第一阶段结束');
    await expect(page.locator('#chapter-end')).toContainText('下一站：复试');
    expect((await snapshot(page)).chapter.postgradResult).toBe('retest');
  }
  await page.evaluate(async () => {
    const { freshChapter, CHECKPOINT_KEY } = await import(/* @vite-ignore */ '/src/systems/events.ts');
    const s = freshChapter('postgrad', 'pg-result'); s.currentMonth = '2026年12月';
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(s));
  });
  await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.location div>span')).toHaveText('林荫路 · 大四的日常');
  await page.locator('#life-mail').click(); await finishDialogue(page);
  await expect(page.locator('#chapter-end')).toContainText('2027年2月');
  await page.screenshot({ path: `test-results/postgrad-end-${test.info().project.name}.png` });

});
