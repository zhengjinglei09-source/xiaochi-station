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
async function seed(p: Page, eventId: string, location = 'library') {
  await ready(p);
  await p.evaluate(async ({ eventId, location }) => {
    const { freshChapter, CHECKPOINT_KEY } = await import(/* @vite-ignore */ '/src/systems/events.ts');
    const s = freshChapter('civil_service', eventId); s.location = location; s.currentMonth = '2027年4月';
    s.civilServiceSecondJob = '家乡 · 行政事务岗'; localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(s));
  }, { eventId, location });
  await p.reload(); await expect(p.locator('#scene')).toHaveAttribute('data-ready', 'true');
}
async function activity(p: Page, id: string) {
  const root = p.locator('#activity-layer'), kind = await root.getAttribute('data-kind');
  const title = await root.locator('h2').innerText();
  const paced = !!process.env.CIVIL_PACED;
  if (paced) await p.waitForTimeout(title.includes('问题') ? 9500 : title.includes('改善') ? 4500 : kind === 'single' ? 6000 : 1500);
  let ids: string[];
  if (kind === 'filters') ids = ['education', 'graduate', 'experience'];
  else if (kind === 'single') ids = [id === 'cs-notice' ? 'city-a' : 'hometown'];
  else if (kind === 'order') ids = ['order-2', 'order-0', 'order-1', 'order-3', 'order-4'];
  else ids = title.includes('问题') ? ['problem-0', 'problem-2', 'problem-1'] : ['measure-0', 'measure-4'];
  for (const card of ids) { await root.locator(`[data-card="${card}"]`).click(); if (paced) await p.waitForTimeout(kind === 'multi' ? 2000 : 1200); }
  if (kind === 'filters') await expect(root.locator('[data-activity-status]')).toHaveText(id === 'cs-notice' ? '符合条件：38' : '符合条件：23');
  await root.locator('[data-activity-submit]').click();
}
async function moveToEvent(p: Page, id: string) {
  let s = await snapshot(p);
  if (id === 'cs-after-exam') {
    await go(p, 224, 280); await p.getByRole('button', { name: '和朋友聊天', exact: true }).click(); return;
  }
  if (await p.locator('#life-mail').isVisible()) { await p.locator('#life-mail').click(); return; }
  if (['cs-first-result', 'cs-province', 'cs-shortlist', 'cs-first-day'].includes(id)) { await p.waitForTimeout(200); return; }
  if (s.location === 'campus') { await go(p, 180, 185); await go(p, 290, 142); await p.getByRole('button', { name: '去图书馆', exact: true }).click(); }
  const reading = ['cs-essay', 'cs-strategy'].includes(id);
  await go(p, 267, 280);
  if (reading) { await go(p, 126, 280); await p.getByRole('button', { name: '坐到自习桌前', exact: true }).click(); }
  else { await go(p, 267, 194); await p.getByRole('button', { name: '使用公共电脑', exact: true }).click(); }
}
async function play(p: Page) {
  const seen: string[] = []; const milestones = new Map<string, number>(); const start = Date.now();
  for (let i = 0; i < 1200; i++) {
    const s = await snapshot(p);
    if (s.mode === 'complete') return { seen, seconds: (Date.now() - start) / 1000 };
    const id = s.chapter.eventId;
    if (!milestones.has(id)) { milestones.set(id, Date.now()); console.log(`Civil event ${id} at ${((Date.now() - start) / 1000).toFixed(1)}s`); }
    if (s.mode === 'transition') { await p.waitForTimeout(150); continue; }
    if (s.mode === 'activity') { await activity(p, id); continue; }
    if (s.mode === 'exploring') { await moveToEvent(p, id); continue; }
    const text = await p.locator('#dialogue-text').innerText(); seen.push(text);
    const quiz = await p.locator('#quiz-clock').isVisible();
    if (process.env.CIVIL_PACED) {
      if (quiz) await p.waitForTimeout(12500);
      else await p.waitForTimeout(Math.max(1300, text.length / 6 * 1000) + ((await p.locator('[data-choice]').count()) > 1 ? 3500 : 0));
    }
    // Deadline can replace the question while reading it; always resolve the current buttons.
    const custom = p.locator('[data-choice="exam-essay"], [data-choice="civil-cancel"], [data-choice="civil-ask"]');
    if (await custom.count()) await custom.first().click();
    else await p.locator('[data-dialogue-actions] button').first().click();
  }
  throw new Error('Civil route did not end');
}

test('full civil route: real joystick, two exams, interview and selected final job', async ({ page }) => {
  test.setTimeout(process.env.CIVIL_PACED ? 600000 : 200000);
  const began = Date.now(), errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await ready(page); await go(page, 345, 174); await go(page, 340, 174);
  await page.getByRole('button', { name: '登上编制号', exact: true }).click(); await page.getByRole('button', { name: '上。', exact: true }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'life');
  const result = await play(page); const s = (await snapshot(page)).chapter;
  expect(s.civilServiceFirstJob).toBe('A市 · 综合事务岗'); expect(s.civilServiceSecondJob).toBe('家乡 · 行政事务岗');
  expect(s.civilServiceFinalJob).toBe(s.civilServiceSecondJob);
  expect(s.civilServiceFirstFilters).toHaveLength(3); expect(s.civilServiceSecondFilters).toHaveLength(3);
  expect(s.civilServiceEssayChoices.problems).toHaveLength(3); expect(s.civilServiceEssayChoices.measures).toHaveLength(2);
  expect(s.civilServiceExamOrder).toEqual(['资料', '言语', '判断', '常识', '数量']);
  expect(s.civilServiceFirstResult).toBe('not_interview'); expect(s.civilServiceSecondResult).toBe('interview');
  expect(s.civilServiceInterviewResult).toBe('passed'); expect(s.civilServiceInterviewChoices).toEqual(['cancel', 'ask']);
  expect(s.currentMonth).toBe('2027年7月'); expect(s.currentRoute).toBe('civil_service'); expect(s.initialRoute).toBe('civil_service');
  expect(s.completed).toHaveLength(11); expect(s.eventId).toBeNull();
  expect(result.seen).toContain('0个匹配结果'); expect(result.seen).toContain('怎么又来了。'); expect(result.seen).toContain('面试通过');
  await expect(page.locator('#chapter-end')).toContainText('编制号 · 到站'); await expect(page.locator('#chapter-end')).toContainText('余小迟 · 2027');
  await expect(page.locator('#chapter-end')).toContainText('家乡 · 行政事务岗');
  await page.screenshot({ path: `test-results/civil-end-${test.info().project.name}.png` });
  await page.reload(); await expect(page.locator('#chapter-end')).toBeVisible(); expect((await snapshot(page)).chapter).toEqual(s);
  expect(errors).toEqual([]); console.log(`CIVIL TOTAL ${(Date.now() - began) / 1000}s (${process.env.CIVIL_PACED ? 'paced reading' : 'fast functional'})`);
});

test('global quiz timer expires during reading, blocks late answers and continues with unanswered questions', async ({ page }) => {
  test.setTimeout(95000);
  await seed(page, 'cs-quiz'); await go(page, 267, 194); await page.getByRole('button', { name: '使用公共电脑', exact: true }).click();
  await page.getByRole('button', { name: '开始计时', exact: true }).click();
  await expect(page.locator('#quiz-clock')).toContainText('01:00');
  await page.locator('[data-choice="quiz:0:2"]').click();
  await page.waitForTimeout(1100); await expect(page.locator('#quiz-clock')).not.toContainText('01:00');
  await expect(page.locator('#dialogue-speaker')).toHaveText('时间到', { timeout: 65000 });
  await expect(page.locator('#dialogue-text')).toHaveText('完成：1\n未完成：4');
  expect(await page.locator('[data-choice^="quiz:"]').count()).toBe(0);
  while ((await snapshot(page)).chapter.eventId === 'cs-quiz') {
    if ((await snapshot(page)).mode === 'dialogue') await page.locator('[data-dialogue-actions] button').first().click();
    else await page.waitForTimeout(150);
  }
  expect((await snapshot(page)).chapter.civilServiceQuizAnswers).toEqual([2]);
  expect((await snapshot(page)).chapter.civilServiceQuizCompletedCount).toBe(1);
  expect((await snapshot(page)).chapter.eventId).toBe('cs-essay');
  // A cancelled foreground quiz never commits partial answers or a stale clock.
  await seed(page, 'cs-quiz'); await go(page, 267, 194);
  await page.getByRole('button', { name: '使用公共电脑', exact: true }).click(); await page.getByRole('button', { name: '开始计时', exact: true }).click();
  await page.locator('[data-choice="quiz:0:0"]').click();
  await page.getByRole('button', { name: '关闭对话', exact: true }).click();
  expect((await snapshot(page)).chapter.civilServiceQuizAnswers).toBeUndefined();
  await page.getByRole('button', { name: '使用公共电脑', exact: true }).click(); await page.getByRole('button', { name: '开始计时', exact: true }).click();
  await expect(page.locator('#quiz-clock')).toContainText('01:00');
});

test('cards, interview and result fit phones; cancellation and all final jobs remain data-driven', async ({ page }) => {
  test.setTimeout(60000);
  await ready(page);
  const result = await page.evaluate(async () => {
    const { EventSystem, freshChapter } = await import(/* @vite-ignore */ '/src/systems/events.ts');
    const { civilServiceEvents, civilJobs } = await import(/* @vite-ignore */ '/src/content/civil-service.ts');
    const { ActivitySelection } = await import(/* @vite-ignore */ '/src/systems/activity.ts');
    const event = civilServiceEvents.find(e => e.id === 'cs-notice')!;
    const filter = new ActivitySelection(event.activities!.filters);
    const counts = [filter.count]; for (const id of ['education', 'graduate', 'experience']) { filter.toggle(id); counts.push(filter.count); }
    filter.toggle('graduate'); const reversible = filter.count;
    const essay = new ActivitySelection(civilServiceEvents.find(e => e.id === 'cs-essay')!.activities!.measures);
    ['measure-0', 'measure-1', 'measure-2'].forEach(id => essay.toggle(id));
    const jobs = civilJobs.map(job => {
      const state = freshChapter('civil_service', 'cs-interview'); state.currentMonth = '2027年4月'; state.civilServiceSecondJob = job.label;
      state.civilServiceQuizAnswers = []; state.civilServiceQuizCompletedCount = 0;
      const runner = new EventSystem(civilServiceEvents, state); runner.begin('library', 'computer'); runner.choose('civil-cancel'); runner.choose('civil-deliver'); runner.finish();
      return [state.civilServiceFinalJob, state.civilServiceInterviewResult];
    });
    const state = freshChapter('civil_service', 'cs-notice'); const runner = new EventSystem(civilServiceEvents, state);
    runner.begin('campus', 'phone'); runner.recordActivity(event.activities!.jobs, [civilJobs[0].label]); runner.cancel();
    return { counts, reversible, limited: essay.selected.length, jobs, cancelled: state.civilServiceFirstJob };
  });
  expect(result.counts).toEqual([327, 186, 94, 38]); expect(result.reversible).toBe(94); expect(result.limited).toBe(2);
  expect(result.cancelled).toBeUndefined(); expect(result.jobs.map(j => j[0])).toEqual(['A市 · 综合事务岗', '家乡 · 行政事务岗', 'B市 · 综合管理岗']); expect(result.jobs.every(j => j[1] === 'passed')).toBe(true);
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height }); await seed(page, 'cs-essay'); await go(page, 126, 280);
    await page.getByRole('button', { name: '坐到自习桌前', exact: true }).click(); await page.getByRole('button', { name: '阅读材料，提炼问题' }).click();
    const panel = (await page.locator('.activity-panel').boundingBox())!;
    expect(panel.y).toBeGreaterThanOrEqual(0); expect(panel.y + panel.height).toBeLessThanOrEqual(height);
    const submit = page.locator('[data-activity-submit]'); await expect(submit).toBeDisabled();
    await page.locator('[data-card="problem-0"]').click(); await expect(submit).toBeDisabled();
    await page.locator('[data-card="problem-1"]').click(); await expect(submit).toBeEnabled();
    await page.screenshot({ path: `test-results/civil-essay-${width}-${test.info().project.name}.png` });
    await seed(page, 'cs-interview'); await go(page, 267, 194); await page.getByRole('button', { name: '使用公共电脑', exact: true }).click();
    await page.getByRole('button', { name: '走进面试室' }).click(); await expect(page.locator('#dialogue-speaker')).toHaveText('面试官');
    const box = (await page.locator('.dialogue-panel').boundingBox())!; expect(box.y + box.height).toBeLessThanOrEqual(height);
    await page.screenshot({ path: `test-results/civil-interview-${width}-${test.info().project.name}.png` });
    expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth > innerWidth])).toEqual([0, 0, false]);
  }
});


test('touch scroll reaches essay cards without moving the world or selecting during a swipe', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP touch injection');
  await page.setViewportSize({ width: 320, height: 568 }); await seed(page, 'cs-essay'); await go(page, 126, 280);
  await page.getByRole('button', { name: '坐到自习桌前', exact: true }).click(); await page.getByRole('button', { name: '阅读材料，提炼问题' }).click();
  const before = await snapshot(page); const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 145, y: 430, id: 1 }] });
  for (let y = 420; y >= 280; y -= 20) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 145, y, id: 1 }] }); await page.waitForTimeout(20); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.locator('.activity-scroll').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator('[data-activity-status]')).toHaveText('已选 0 / 3');
  expect((await snapshot(page)).x).toBe(before.x); expect((await snapshot(page)).y).toBe(before.y);
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
});
