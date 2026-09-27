import { test, expect, type Page } from '@playwright/test';

const state = (page: Page) => page.evaluate(() => (window as any).__xiaochi.snapshot());
async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__xiaochi));
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.waitForFunction(() => { const logo = document.querySelector<HTMLImageElement>('.brand'); return logo?.complete && logo.naturalWidth > 0; });
  await expect(page.getByText('角色素材加载失败')).toHaveCount(0);
}

test('loads, stays still in dead zone, moves diagonally, stops immediately on release', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await expect(page.getByText('左侧按住拖动')).toBeVisible();
  const before = await state(page);
  await page.mouse.move(90, 560); await page.mouse.down();
  await expect(page.locator('#joystick')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('#movement-hint')).toHaveCSS('opacity', '1');
  await page.mouse.move(93, 562); await page.waitForTimeout(150);
  expect((await state(page)).x).toBe(before.x);
  await page.mouse.move(130, 600); await page.waitForTimeout(400);
  const moving = await state(page);
  expect(moving.x).toBeGreaterThan(before.x + 4); expect(moving.y).toBeGreaterThan(before.y + 4);
  expect(moving.motion).toBe('walk'); expect(Math.hypot(moving.input.x, moving.input.y)).toBeCloseTo(1);
  await page.mouse.up(); const released = await state(page);
  expect(released.motion).toBe('idle');
  await page.waitForTimeout(200); expect((await state(page)).x).toBe(released.x);
  await expect(page.locator('#joystick')).toHaveAttribute('data-active', 'false');
  await expect(page.locator('#movement-hint')).toHaveCSS('opacity', '1');
  expect((await state(page)).tutorial.hasMoved).toBe(true);
  expect(errors).toEqual([]);
});

test('walking changes the feet in every direction, idle is stable, and the old suitcase spot is walkable', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { CharacterRenderer } = await import(/* @vite-ignore */ '/src/assets/character.ts');
    const { Player } = await import(/* @vite-ignore */ '/src/game/player.ts');
    const renderer = new CharacterRenderer(); await renderer.load();
    const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 140;
    const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    const player = new Player(); player.x = 50; player.y = 100;
    const staysAboveGround: boolean[] = [];
    const capture = (time: number) => {
      ctx.clearRect(0, 0, 100, 140); player.animationTime = time; renderer.draw(ctx, player, false);
      const belowFeet = ctx.getImageData(0, 106, 100, 34).data;
      staysAboveGround.push(!belowFeet.some((value, i) => i % 4 === 3 && value > 0));
      return Array.from(ctx.getImageData(15, 82, 70, 22).data).join(',');
    };
    const changingDirections = ['front', 'back', 'left', 'right'].map(direction => {
      player.direction = direction; player.motion = 'walk'; return capture(.08) !== capture(.27);
    });
    player.motion = 'idle'; const stableIdle = capture(0) === capture(.27);
    player.x = 233; player.y = 330; player.update({ x: 0, y: -1 }, .4);
    return { changingDirections, stableIdle, staysAboveGround: staysAboveGround.every(Boolean), oldSuitcaseY: player.y };
  });
  expect(result.changingDirections).toEqual([true, true, true, true]);
  expect(result.stableIdle).toBe(true);
  expect(result.staysAboveGround).toBe(true);
  expect(result.oldSuitcaseY).toBeLessThan(319);
});

test('right-side touch does not activate, pointer capture survives leaving trigger area, blur resets', async ({ page }) => {
  await ready(page);
  await page.mouse.move(300, 500); await page.mouse.down(); await page.mouse.move(350, 500);
  expect((await state(page)).input).toEqual({ x: 0, y: 0 }); await page.mouse.up();
  await page.mouse.move(80, 510); await page.mouse.down(); await page.mouse.move(350, 510);
  await page.waitForTimeout(120); expect((await state(page)).motion).toBe('walk');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect((await state(page)).input).toEqual({ x: 0, y: 0 }); expect((await state(page)).motion).toBe('idle');
  await page.mouse.up();
  await expect(page.locator('#interaction')).toBeHidden();
});

test('actual touch events, multi-touch ownership, cancel, and no page scroll', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP touch injection is Chromium-specific.');
  await ready(page);
  const client = await page.context().newCDPSession(page);
  const touch = (type: string, points: object[]) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points } as any);
  await touch('touchStart', [{ x: 80, y: 540, id: 1 }]);
  await touch('touchMove', [{ x: 130, y: 540, id: 1 }]);
  await page.waitForTimeout(100); expect((await state(page)).input.x).toBe(1);
  await touch('touchStart', [{ x: 130, y: 540, id: 1 }, { x: 310, y: 530, id: 2 }]);
  await touch('touchMove', [{ x: 130, y: 540, id: 1 }, { x: 270, y: 570, id: 2 }]);
  expect((await state(page)).input).toEqual({ x: 1, y: 0 });
  await touch('touchCancel', []);
  expect((await state(page)).motion).toBe('idle'); expect((await state(page)).input).toEqual({ x: 0, y: 0 });
  expect(await page.evaluate(() => [window.scrollX, window.scrollY, document.documentElement.scrollWidth > innerWidth])).toEqual([0, 0, false]);
});

test('all directions, constant diagonal speed, collision, boundary, and wall sliding', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { Player } = await import(/* @vite-ignore */ '/src/game/player.ts');
    const p = new Player();
    const directions: string[] = [];
    for (const v of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]) { p.update(v, .01); directions.push(p.direction); }
    p.x = 345; p.y = 265; p.update({ x: 1, y: 1 }, 1);
    const diagonalDistance = Math.hypot(p.x - 345, p.y - 265);
    p.x = 150; p.y = 245; for (let i = 0; i < 300; i++) p.update({ x: 0, y: -1 }, 1 / 60);
    const bench = { x: p.x, y: p.y, motion: p.motion };
    p.x = 345; p.y = 265; for (let i = 0; i < 1800; i++) p.update({ x: 1, y: 0 }, 1 / 60);
    const rightEdge = p.x;
    p.update({ x: 1, y: 1 }, .2); const slideY = p.y;
    for (let i = 0; i < 1800; i++) p.update({ x: -1, y: 0 }, 1 / 60);
    const leftEdge = p.x;
    p.x = 345; p.y = 265; for (let i = 0; i < 900; i++) p.update({ x: 0, y: -1 }, 1 / 60);
    const topEdge = p.y;
    for (let i = 0; i < 900; i++) p.update({ x: 0, y: 1 }, 1 / 60);
    return { directions, diagonalDistance, bench, rightEdge, slideY, leftEdge, topEdge, bottomEdge: p.y };
  });
  expect(result.directions).toEqual(['right', 'left', 'back', 'front']); expect(result.diagonalDistance).toBeCloseTo(69);
  expect(result.bench.y).toBeGreaterThanOrEqual(226); expect(result.bench.motion).toBe('idle');
  expect(result.rightEdge).toBeLessThanOrEqual(652); expect(result.rightEdge).toBeGreaterThan(650);
  expect(result.leftEdge).toBeGreaterThanOrEqual(28); expect(result.leftEdge).toBeLessThan(30);
  expect(result.topEdge).toBeGreaterThanOrEqual(169); expect(result.bottomEdge).toBeLessThanOrEqual(345);
  expect(result.slideY).toBeGreaterThan(265);
});

for (const [width, height] of [[320, 568], [390, 844], [430, 932], [768, 1024]]) {
  test(`portrait layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await ready(page);
    const box = await page.locator('#game').boundingBox(); expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(width);
    // WebKit can represent 100dvh with a fractional CSS-pixel rounding error.
    expect(Math.abs(box!.height - height)).toBeLessThan(.5);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
    const s = await state(page); expect(s.originY + s.y).toBeLessThan(s.height - 35);
    await page.screenshot({ path: `test-results/${test.info().project.name}-${width}x${height}.png` });
  });
}
