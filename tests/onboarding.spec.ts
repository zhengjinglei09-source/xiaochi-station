import { test, expect, type Page } from '@playwright/test';

const snapshot = (page: Page) => page.evaluate(() => (window as any).__xiaochi.snapshot());
async function ready(page: Page) {
  await page.goto('/'); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
}
async function goTo(page: Page, x: number, y: number) {
  const origin = { x: 78, y: page.viewportSize()!.height - 95 };
  await page.mouse.move(origin.x, origin.y); await page.mouse.down();
  try {
    for (let i = 0; i < 30; i++) {
      const p = await snapshot(page), dx = x - p.x, dy = y - p.y, distance = Math.hypot(dx, dy);
      if (distance < 1.8) return;
      await page.mouse.move(origin.x + dx / distance * 55, origin.y + dy / distance * 55);
      await page.waitForTimeout(Math.min(400, distance / 69 * 1000));
    }
    throw new Error('Could not reach tutorial target through joystick');
  } finally { await page.mouse.up(); }
}

test('persistent hints guide two distinct platforms, conductor proximity, and boarding', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await ready(page);
  await expect(page.locator('#movement-hint')).toBeVisible();
  await expect(page.locator('#movement-hint small')).toHaveText('摇杆控制小迟移动');
  await goTo(page, 352, 265);
  await expect(page.locator('#movement-hint')).toHaveCSS('opacity', '1');
  await expect(page.locator('#onboarding-hint')).toBeVisible();
  await expect(page.locator('#platform-direction')).toBeVisible();
  await expect(page.locator('#platform-direction')).toHaveText('向前走选择月台号');
  await page.screenshot({ path: `test-results/onboarding-platform-${test.info().project.name}.png` });
  await goTo(page, 352, 174); await goTo(page, 307, 174);
  await expect(page.locator('#onboarding-context')).toHaveText('看看站讯');
  await page.getByRole('button', { name: '查看编制号', exact: true }).click();
  await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
  await page.getByRole('button', { name: '收起', exact: true }).click();
  expect((await snapshot(page)).tutorial.viewedPlatformIds).toEqual(['civil_service']);
  await expect(page.locator('#onboarding-hint')).toBeVisible();
  await goTo(page, 301, 250);
  await expect(page.locator('#onboarding-context')).toHaveText('和列车员聊聊');
  await expect(page.locator('#onboarding-context')).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.locator('#onboarding-context')).toBeVisible();
  await expect(page.locator('#onboarding-hint')).toBeVisible();
  await page.screenshot({ path: `test-results/onboarding-talk-${test.info().project.name}.png` });
  await goTo(page, 350, 270);
  await expect(page.locator('#onboarding-context')).toBeHidden();
  await goTo(page, 301, 250);
  await expect(page.locator('#onboarding-context')).toBeVisible();
  await page.getByRole('button', { name: '与站务员对话', exact: true }).click();
  expect((await snapshot(page)).tutorial.hasTalkedToConductor).toBe(true);
  await page.getByRole('button', { name: '谢谢，我去逛逛。', exact: true }).click();
  await expect(page.locator('#onboarding-context')).toBeHidden();
  await goTo(page, 307, 174); await goTo(page, 179, 174);
  await page.getByRole('button', { name: '查看学术号', exact: true }).click();
  await page.getByRole('button', { name: '继续 ▸', exact: true }).click();
  await page.getByRole('button', { name: '收起', exact: true }).click();
  expect((await snapshot(page)).tutorial.hasExploredPlatforms).toBe(true);
  await expect(page.locator('#onboarding-hint')).toBeHidden();
  await expect(page.locator('#platform-direction')).toBeHidden();
  await expect(page.locator('#movement-hint')).toBeVisible();
  await goTo(page, 212, 174);
  await page.getByRole('button', { name: '登上学术号', exact: true }).click();
  await page.getByRole('button', { name: '上。', exact: true }).click();
  await expect(page.locator('#life-transition')).toBeVisible();
  expect((await snapshot(page)).initialRoute).toBe('postgrad');
  expect(errors).toEqual([]);
  await page.reload(); await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  expect((await snapshot(page)).currentRoute).toBe('postgrad');
});

test('hints never time out; only distinct platform reads count; conductor follows proximity', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { Onboarding } = await import(/* @vite-ignore */ '/src/systems/onboarding.ts');
    const idle = new Onboarding(); idle.update(7, 0, true, null);
    const held = idle.emphasis; idle.update(.1, 0, false, null);
    const reminded = idle.emphasis; idle.update(100, 0, false, null);
    const noRepeat = idle.emphasis;
    idle.update(.1, 2, true, null); const notMoved = idle.flags.hasMoved;
    idle.update(.1, 1, true, null); const moved = idle.flags.hasMoved;
    idle.update(100, 0, false, null); const persists = idle.platformVisible;
    idle.complete('info'); const notice = idle.platformVisible;
    idle.complete('info', 'employment'); idle.complete('info', 'employment'); const duplicate = idle.platformVisible;
    idle.complete('info', 'gap'); const distinct = idle.platformVisible;
    idle.update(.1, 0, false, 'conductor'); const near = idle.contextHint;
    idle.update(100, 0, false, 'conductor'); const noTimeout = idle.contextHint;
    idle.update(.1, 0, false, null); const far = idle.contextHint;
    idle.update(.1, 0, false, 'conductor'); const returnHint = idle.contextHint;
    idle.complete('conductor'); const done = idle.contextHint;
    return { held, reminded, noRepeat, notMoved, moved, persists, notice, duplicate, distinct, near, noTimeout, far, returnHint, done };
  });
  expect(result).toEqual({ held: '', reminded: 'reminder', noRepeat: '', notMoved: false, moved: true,
    persists: true, notice: true, duplicate: true, distinct: false, near: 'conductor', noTimeout: 'conductor', far: null, returnHint: 'conductor', done: null });
});

test('crisp movement card stays on ground tiles and arrow text fits phone widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height }); await ready(page);
    const hint = (await page.locator('#movement-hint').boundingBox())!;
    const s = await snapshot(page), scale = height / s.height;
    expect(hint.y).toBeGreaterThan((s.originY + 222) * scale); // below benches
    expect(hint.y + hint.height).toBeLessThan((s.originY + 359) * scale); // above fence
    expect(hint.x).toBeLessThan(width * .1);
    expect(hint.y + hint.height).toBeLessThan(height - 40);
    await expect(page.locator('#movement-hint')).toHaveCSS('animation-name', 'none');
    await page.screenshot({ path: `test-results/onboarding-start-${width}-${test.info().project.name}.png` });
    await goTo(page, 352, 265);
    const arrow = (await page.locator('#platform-direction').boundingBox())!;
    expect(arrow.x + arrow.width).toBeLessThan(width - 5);
    expect(arrow.x).toBeGreaterThan(hint.x + hint.width);
    expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth > innerWidth])).toEqual([0, 0, false]);
  }
});
