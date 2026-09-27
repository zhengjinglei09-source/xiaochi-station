import { test, expect, type Page } from '@playwright/test';

const snapshot = (page: Page) => page.evaluate(() => (window as any).__xiaochi.snapshot());
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
}
// Travel with the actual joystick; never teleport the game or mutate debug state.
async function goTo(page: Page, x: number, y: number) {
  const size = page.viewportSize()!;
  const origin = { x: 78, y: size.height - 95 };
  await page.mouse.move(origin.x, origin.y); await page.mouse.down();
  try {
    for (let i = 0; i < 30; i++) {
      const position = await snapshot(page);
      const dx = x - position.x, dy = y - position.y, distance = Math.hypot(dx, dy);
      if (distance < 1.8) return;
      await page.mouse.move(origin.x + dx / distance * 55, origin.y + dy / distance * 55);
      await page.waitForTimeout(Math.min(550, distance / 69 * 1000));
    }
    throw new Error(`Joystick could not reach ${x},${y}: ${JSON.stringify(await snapshot(page))}`);
  } finally { await page.mouse.up(); }
}

test('nearby NPC button, branch dialogue, input lock, close and leaving range', async ({ page }) => {
  test.setTimeout(45000);
  await ready(page);
  await expect(page.locator('#interaction')).toBeHidden();
  const start = await snapshot(page); await page.waitForTimeout(150);
  expect((await snapshot(page)).commuters[0].x).not.toBe(start.commuters[0].x);
  await goTo(page, 301, 250);
  await expect(page.getByRole('button', { name: '与站务员对话' })).toBeVisible();
  await page.getByRole('button', { name: '与站务员对话' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await snapshot(page)).mode).toBe('dialogue');
  const stopped = await snapshot(page);
  await page.mouse.move(65, 420); await page.mouse.down(); await page.mouse.move(120, 420); await page.waitForTimeout(180); await page.mouse.up();
  expect((await snapshot(page)).x).toBe(stopped.x);
  expect((await snapshot(page)).commuters).toEqual(stopped.commuters);
  await page.getByRole('button', { name: '大家怎么都跑起来了？', exact: true }).click();
  await expect(page.locator('#dialogue-text')).toHaveText('有人赶秋招，有人赶自习室。');
  await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
  await expect(page.locator('#dialogue-text')).toContainText('DDL');
  await page.getByRole('button', { name: '收起', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect((await snapshot(page)).input).toEqual({ x: 0, y: 0 });
  await goTo(page, 350, 270);
  await expect(page.locator('#interaction')).toBeHidden();
});

const cases = [
  { id: 'employment', name: '社畜号', x: 84, status: '01 月台 · 即将发车' },
  { id: 'postgrad', name: '学术号', x: 212, status: '02 月台 · 检票中' },
  { id: 'civil_service', name: '编制号', x: 340, status: '03 月台 · 排队中' },
  { id: 'abroad', name: '留子号', x: 468, status: '04 月台 · 材料审核中' },
  { id: 'gap', name: '待机号', x: 596, status: '05 月台 · 晚点中……' },
];
for (const route of cases) {
  test(`walk to ${route.id}, inspect, decline, board, record only its initial route`, async ({ page }) => {
    test.setTimeout(60000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width: 320, height: 568 });
    await ready(page);
    await goTo(page, 345, 174);
    // The path above the benches and planters remains clear for all five signs.
    await goTo(page, route.x - 32, 174);
    await page.getByRole('button', { name: `查看${route.name}`, exact: true }).click();
    await expect(page.locator('#dialogue-speaker')).toHaveText(route.name);
    await expect(page.locator('[data-route-status]')).toHaveText(route.status);
    const hierarchy = await page.evaluate(() => {
      const title = document.querySelector('#dialogue-speaker')!, description = document.querySelector('#dialogue-text')!, status = document.querySelector('[data-route-status]')!;
      const panel = document.querySelector('.dialogue-panel')!;
      return { sizes: [title, description, status].map(element => parseFloat(getComputedStyle(element).fontSize)),
        fits: [title, description, status].every(element => element.scrollWidth <= element.clientWidth && element.getBoundingClientRect().right <= innerWidth),
        panelFits: panel.scrollHeight <= panel.clientHeight };
    });
    expect(hierarchy.sizes[0]).toBeGreaterThan(hierarchy.sizes[1]);
    expect(hierarchy.sizes[1]).toBeGreaterThan(hierarchy.sizes[2]);
    expect(hierarchy.fits).toBe(true); expect(hierarchy.panelFits).toBe(true);
    await page.screenshot({ path: `test-results/route-${route.id}-${test.info().project.name}.png` });
    await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
    await page.getByRole('button', { name: '收起', exact: true }).click();
    await goTo(page, route.x, 174);
    await page.getByRole('button', { name: `登上${route.name}`, exact: true }).click();
    await expect(page.locator('#dialogue-text')).toHaveText('同学，上不上？');
    expect((await snapshot(page)).tutorial.hasTalkedToConductor).toBe(true);
    await page.getByRole('button', { name: '我再看看。', exact: true }).click();
    expect((await snapshot(page)).mode).toBe('exploring');
    expect((await snapshot(page)).initialRoute).toBeNull();
    // A new drag works after declining. Stay in the unobstructed doorway corridor.
    await goTo(page, route.x + 8, 174); await goTo(page, route.x, 174);
    await page.getByRole('button', { name: `登上${route.name}`, exact: true }).click();
    await page.getByRole('button', { name: '上。', exact: true }).click();
    expect((await snapshot(page)).mode).toBe('boarding');
    expect((await snapshot(page)).initialRoute).toBeNull();
    await expect(page.locator('#boarding-feedback')).toBeVisible();
    if (route.id === 'employment' || route.id === 'postgrad' || route.id === 'civil_service' || route.id === 'abroad' || route.id === 'gap') {
      await expect(page.locator('#life-transition')).toBeVisible({ timeout: 4000 });
      expect((await snapshot(page)).initialRoute).toBe(route.id);
      if (route.id === 'employment') await expect(page.locator('#dialogue-speaker')).toHaveText('2026年9月');
      expect(errors).toEqual([]); return;
    }
    await expect(page.locator('#phase-complete')).toBeVisible({ timeout: 4000 });
    const complete = await snapshot(page);
    expect(complete.initialRoute).toBe(route.id); expect(complete.currentRoute).toBe(route.id);
    expect(complete.mode).toBe('complete'); expect(complete.motion).toBe('idle');
    expect(complete.input).toEqual({ x: 0, y: 0 });
    await expect(page.locator('#completion-title')).toHaveText(`已登上${route.name}`);
    await page.mouse.move(70, 470); await page.mouse.down(); await page.mouse.move(125, 470); await page.waitForTimeout(130); await page.mouse.up();
    expect((await snapshot(page)).x).toBe(complete.x);
    expect(errors).toEqual([]);
    if (route.id === 'gap') {
      await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
      expect((await snapshot(page)).initialRoute).toBe('gap');
    }
  });
}

test('selection stays stable in overlap, rechecks range, and route history permits later transfers', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { InteractionSystem } = await import(/* @vite-ignore */ '/src/systems/interaction.ts');
    const { RouteState } = await import(/* @vite-ignore */ '/src/content/routes.ts');
    let calls = 0;
    const make = (id: string, x: number) => ({ id, type: 'npc', target: { id, position: { x, y: 0 } }, range: 20, prompt: '对话', icon: 'talk', action: () => calls++ });
    const system = new InteractionSystem([make('a', 0), make('b', 20)]);
    const first = system.update({ x: 9, y: 0 })?.id;
    const overlap = system.update({ x: 11, y: 0 })?.id;
    const nearer = system.update({ x: 18, y: 0 })?.id;
    system.activate({ x: 100, y: 0 });
    const route = new RouteState(); route.recordBoarding('employment'); route.recordBoarding('gap');
    return { first, overlap, nearer, calls, initial: route.initialRoute, current: route.currentRoute };
  });
  expect(result).toEqual({ first: 'a', overlap: 'a', nearer: 'b', calls: 0, initial: 'employment', current: 'gap' });
});

test('small-screen dialogue fits and two-finger interaction releases the held joystick', async ({ page, browserName }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 320, height: 568 }); await ready(page);
  await goTo(page, 301, 250);
  if (browserName === 'chromium') {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 420, id: 1 }] });
    const box = (await page.locator('#interaction').boundingBox())!;
    const finger = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 420, id: 1 }, finger] });
    // CDP touchEnd takes the finger being released, not the remaining fingers.
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [finger] });
    await expect(page.getByRole('dialog')).toBeVisible();
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 110, y: 420, id: 1 }] });
    expect((await snapshot(page)).input).toEqual({ x: 0, y: 0 });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else await page.getByRole('button', { name: '与站务员对话' }).click();
  const panel = (await page.getByRole('dialog').boundingBox())!;
  expect(panel.y).toBeGreaterThan(0); expect(panel.y + panel.height).toBeLessThanOrEqual(568);
  const state = await snapshot(page);
  const feetY = (state.originY + state.y - state.dialogueCameraLift) * 320 / state.width;
  expect(feetY).toBeLessThan(panel.y - 10);
  for (const button of await page.getByRole('dialog').getByRole('button').all()) {
    const box = (await button.boundingBox())!; expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
  }
  expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth > innerWidth])).toEqual([0, 0, false]);
  await page.screenshot({ path: `test-results/phase02-dialogue-${browserName}.png` });
});
