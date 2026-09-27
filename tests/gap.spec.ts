import {test,expect,type Page} from '@playwright/test';
const snap=(p:Page)=>p.evaluate(()=>(window as any).__xiaochi.snapshot());
async function ready(p:Page){await p.goto('/');await expect(p.locator('#scene')).toHaveAttribute('data-ready','true');}
async function go(p:Page,x:number,y:number){const origin={x:60,y:p.viewportSize()!.height-75};await p.mouse.move(origin.x,origin.y);await p.mouse.down();try{for(let i=0;i<60;i++){const s=await snap(p),dx=x-s.x,dy=y-s.y,d=Math.hypot(dx,dy);if(d<2)return;await p.mouse.move(origin.x+55*dx/d,origin.y+55*dy/d);await p.waitForTimeout(Math.min(300,d/69*1000));}throw Error(`Cannot walk to ${x},${y} ${JSON.stringify(await snap(p))}`);}finally{await p.mouse.up();}}
async function seed(p:Page,id:string,extra:Record<string,unknown>={}){await ready(p);await p.evaluate(async({id,extra})=>{const {freshChapter,CHECKPOINT_KEY}=await import(/* @vite-ignore */'/src/systems/events.ts');const s=freshChapter('gap',id);Object.assign(s,{currentMonth:'2027年7月',location:'dorm'},extra);localStorage.setItem(CHECKPOINT_KEY,JSON.stringify(s));},{id,extra});await p.reload();await expect(p.locator('#scene')).toHaveAttribute('data-ready','true');}
async function dialogue(p:Page,preferred:string[]=[]){while((await snap(p)).mode==='dialogue'){const choices=p.locator('[data-choice]');let chosen=false;for(const id of preferred){const b=p.locator(`[data-choice="${id}"]`);if(await b.count()){await b.tap();chosen=true;break;}}if(!chosen)await p.locator('[data-dialogue-actions] button').first().tap();}}
async function play(p:Page,style='seaside',experiment='project',paced=false){
 const texts:string[]=[],seen=new Set<string>(),start=Date.now();let didSleep=false,didPlay=false;
 for(let i=0;i<2500;i++){
  const s=await snap(p),id=s.chapter.eventId;if(s.mode==='complete')return texts;
  if(!seen.has(id)){seen.add(id);console.log(`GAP ${id} ${((Date.now()-start)/1000).toFixed(1)}s`);}
  if(s.mode==='transition'){await p.waitForTimeout(200);continue;}
  if(s.mode==='exploring'){
   if(id==='gap-day-1'){
    if(!didSleep){await go(p,180,280);await go(p,90,250);await p.getByRole('button',{name:'再睡会儿',exact:true}).tap();didSleep=true;continue;}
    if(!didPlay){await go(p,90,290);await go(p,60,327);await p.getByRole('button',{name:'玩会儿',exact:true}).tap();didPlay=true;continue;}
    await p.waitForTimeout(400);continue;
   }
   if(id==='gap-day-2'){await p.waitForTimeout(400);continue;}
   if(id==='gap-travel-day'||id==='gap-last-walk'){
    if(!seen.has(id+'walk')){await go(p,190,300);await go(p,230,315);seen.add(id+'walk');await p.screenshot({path:`test-results/gap-${style}-${test.info().project.name}.png`});}else await p.waitForTimeout(200);continue;
   }
   if(await p.locator('#life-mail').isVisible()){await p.locator('#life-mail').tap();continue;}
   if(id==='gap-graduation'){await go(p,224,280);await p.getByRole('button',{name:'和朋友聊天',exact:true}).tap();continue;}
   if(id==='gap-items'){await go(p,180,280);await go(p,90,250);await p.getByRole('button',{name:'坐一会儿',exact:true}).tap();continue;}
   await p.waitForTimeout(200);continue;
  }
  if(s.mode==='activity'){
   if(paced)await p.waitForTimeout(7000);
   if(id==='gap-map')await p.locator(`[data-card="${style}"]`).tap();
   else{for(const item of ['clothes','book','camera'])await p.locator(`[data-card="${item}"]`).tap();}
   await p.locator('[data-activity-submit]').tap();continue;
  }
  const text=await p.locator('#dialogue-text').innerText();texts.push(text);
  if(paced)await p.waitForTimeout(Math.max(1200,text.length/5*1000)+((await p.locator('[data-choice]').count())>1?4000:0));
  let used=false;for(const choice of ['self-unknown',`exp-${experiment}`]){const b=p.locator(`[data-choice="${choice}"]`);if(await b.count()){await b.tap();used=true;break;}}
  if(!used)await p.locator('[data-dialogue-actions] button').first().tap();
 }
 throw Error('Gap did not finish');
}
test('full Gap from station, repeatable free actions, AFK day, project, travel and saved quiet ending',async({page})=>{
 test.setTimeout(600000);const begin=Date.now(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await ready(page);
 await go(page,345,174);await go(page,596,174);await page.getByRole('button',{name:'登上待机号',exact:true}).tap();await page.getByRole('button',{name:'上。',exact:true}).tap();await expect(page.locator('#game')).toHaveAttribute('data-scene','life');
 const text=await play(page,'seaside','project',!!process.env.GAP_PACED),s=(await snap(page)).chapter;
 expect(s.gapActionCounts.sleep).toBe(1);expect(s.gapActionCounts.play).toBe(1);expect(s.gapActionCounts.idle).toBeGreaterThan(0);expect(s.gapSelfDescription).toBe('unknown');expect(s.gapExperiment).toBe('project');expect(s.gapTravelStyle).toBe('seaside');expect(s.gapTravelItems).toEqual(['clothes','book','camera']);expect(s.gapTravelStarted).toBe(true);expect(s.initialRoute).toBe('gap');expect(s.atStation).not.toBe(true);
 for(const t of ['今天干嘛？','小迟你呢？','你们还加菜吗？','untitled_project','我明天走了。','还不知道。','要不出去走走？','差点。','玩得怎么样？','还行。'])expect(text).toContain(t);
 await expect(page.locator('#chapter-end h2')).toHaveText('待机号 · 旅行中');await expect(page.locator('#chapter-end section>small').first()).toHaveText('2027.07');await expect(page.locator('#chapter-save-status')).toBeEmpty();await page.screenshot({path:`test-results/gap-end-${test.info().project.name}.png`});await page.reload();await expect(page.locator('#chapter-end')).toBeVisible();expect((await snap(page)).chapter).toEqual(s);expect(errors).toEqual([]);console.log(`GAP TOTAL ${(Date.now()-begin)/1000}s ${process.env.GAP_PACED?'paced':'functional'}`);
});
test('all dinner answers, experiments and neutral records converge through shared events',async({page})=>{
 await ready(page);const result=await page.evaluate(async()=>{const {gapEvents}=await import(/* @vite-ignore */'/src/content/gap.ts');const {freshChapter,EventSystem}=await import(/* @vite-ignore */'/src/systems/events.ts');const {DialogueSystem}=await import(/* @vite-ignore */'/src/systems/dialogue.ts');const {recordAction}=await import(/* @vite-ignore */'/src/systems/free-action.ts');
 const replies=['gap','thinking','project','unknown'].map(id=>{const s=freshChapter('gap','gap-dinner');s.currentMonth='2026年10月';const e=new EventSystem(gapEvents,s);e.begin('dorm','phone');let view:any;const d=new DialogueSystem(v=>view=v,v=>e.choose(v));const script=e.script('you');d.open(script,()=>e.finish());d.choose('self-'+id);const texts=[];while(d.active){texts.push(view.text);if(view.choices.length)d.choose(view.choices[0].id);else d.continue();}return{s,texts};});
 const exp=['work','walk','learn','project'].map(id=>{const s=freshChapter('gap','gap-experiment');s.currentMonth='2027年1月';const e=new EventSystem(gapEvents,s);e.begin('campus','phone');e.choose('exp-'+id);e.finish();return s;});const s=freshChapter('gap','gap-day-1');for(const id of ['sleep','sleep','idle','walk','phone','learn','project','play','part_time'])recordAction(s,id);return{replies,exp,s};});
 expect(result.replies.map(r=>r.s.gapSelfDescription)).toEqual(['gap','thinking','project','unknown']);expect(result.replies.every(r=>r.s.eventId==='gap-experiment')).toBe(true);expect(result.replies[3].texts).toEqual(['哦。','你们还加菜吗？','大家走出了食堂。']);expect(result.exp.every(s=>s.eventId==='gap-graduation')).toBe(true);expect(result.s.gapActionCounts.sleep).toBe(2);expect(result.s.gapActions).toHaveLength(9);
});
for(const style of ['mountain','city','random'])test(`travel ${style}, touch item choice and forgotten item, free movement`,async({page})=>{
 test.setTimeout(100000);await page.setViewportSize({width:320,height:568});await seed(page,'gap-map');const text=await play(page,style);expect((await snap(page)).chapter.gapTravelStyle).toBe(style);expect(text).toContain('差点。');expect(await page.evaluate(()=>[scrollX,scrollY,document.documentElement.scrollWidth>innerWidth])).toEqual([0,0,false]);
});
test('free actions at physical objects repeat and resume after refresh; touch releases movement',async({page})=>{
 test.setTimeout(160000);await seed(page,'gap-day-1',{currentMonth:'2026年9月'});await expect(page.locator('#game')).toHaveAttribute('data-mode','exploring');
 for(let i=0;i<2;i++){await go(page,180,280);await go(page,90,250);await page.getByRole('button',{name:'再睡会儿',exact:true}).tap();await dialogue(page);await expect(page.locator('#game')).toHaveAttribute('data-mode','dialogue',{timeout:8000});await dialogue(page);}
 const before=(await snap(page)).chapter;expect(before.gapActionCounts.sleep).toBe(2);expect(before.gapFreeElapsed['gap-day-1:clock']).toBeGreaterThan(900);const clockText=await page.locator('#life-hint').innerText();await page.reload();await expect(page.locator('#scene')).toHaveAttribute('data-ready','true');expect((await snap(page)).chapter.gapActionCounts.sleep).toBe(2);expect((await snap(page)).chapter.gapFreeElapsed['gap-day-1']).toBeGreaterThan(10);await expect(page.locator('#life-hint')).toHaveText(clockText);
 await expect.poll(async()=>(await snap(page)).chapter.eventId,{timeout:125000}).toBe('gap-dinner');await expect(page.locator('#life-mail')).toBeVisible();
});
test('all four short experiments run their actual dialogue and sequence branches',async({page})=>{
 test.setTimeout(180000);for(const kind of ['work','walk','learn','project']){
  await seed(page,'gap-experiment',{currentMonth:'2027年1月',location:'campus'});await page.locator('#life-mail').tap();await page.locator(`[data-choice="exp-${kind}"]`).tap();const titles=new Set<string>();
  for(let i=0;i<300;i++){const s=await snap(page);if(s.chapter.eventId==='gap-graduation'){expect(s.chapter.gapExperiment).toBe(kind);break;}if(s.mode==='transition'){titles.add(await page.locator('#life-transition strong').innerText());await page.waitForTimeout(150);}else if(s.mode==='dialogue')await page.locator('[data-dialogue-actions] button').first().tap();else throw Error('Unexpected state');}
  expect((await snap(page)).chapter.eventId).toBe('gap-graduation');if(kind==='project'){expect([...titles]).toContain('小迟去哪儿▏');expect([...titles]).toContain('ERROR');expect([...titles]).toContain('页面出现了');}
 }
});
test('free activity points are reachable and save only neutral actions',async({page})=>{
 test.setTimeout(160000);for(const a of [{id:'phone',x:165,y:233,key:'phone'},{id:'computer',x:267,y:194,key:'project'},{id:'learn',x:302,y:295,key:'learn'},{id:'part-time',x:318,y:317,key:'part_time',location:'campus'},{id:'idle',x:144,y:276,key:'idle',location:'campus'}]){
  await seed(page,'gap-day-1',{currentMonth:'2026年9月',location:a.location??'dorm'});await expect(page.locator('#game')).toHaveAttribute('data-mode','exploring');
  if(a.id==='computer'){await go(page,267,280);}await go(page,a.x,a.y);await page.locator('#interaction').tap();
  for(let i=0;i<150;i++){const s=await snap(page);if(s.mode==='exploring')break;if(s.mode==='transition')await page.waitForTimeout(150);else await page.locator('[data-dialogue-actions] button').first().tap();}
  expect((await snap(page)).chapter.gapActions).toContain(a.key);expect((await snap(page)).chapter.balance).toBe(8000);expect(await page.evaluate(()=>[scrollX,scrollY])).toEqual([0,0]);
 }
});
test('wake can be reopened after close, touch joystick stops, charger choice keeps chosen items',async({page,browserName})=>{
 test.setTimeout(60000);await seed(page,'gap-wake',{currentMonth:'2026年9月'});await expect(page.locator('#dialogue-layer')).toBeVisible();await page.locator('[data-dialogue-close]').tap();await expect(page.locator('#dialogue-layer')).toBeVisible({timeout:3000});
 await seed(page,'gap-day-1',{currentMonth:'2026年9月'});await expect(page.locator('#game')).toHaveAttribute('data-mode','exploring');
 if(browserName==='chromium'){
  const cdp=await page.context().newCDPSession(page),before=await snap(page);const y=page.viewportSize()!.height-75;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:60,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:113,y,id:1}]});await page.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect((await snap(page)).x).toBeGreaterThan(before.x+10);expect((await snap(page)).motion).toBe('idle');
 }
 await seed(page,'gap-items',{gapTravelStyle:'city'});await go(page,180,280);await go(page,90,250);await page.locator('#interaction').tap();await page.getByRole('button',{name:'挑几件',exact:true}).tap();
 for(const item of ['clothes','charger','umbrella'])await page.locator(`[data-card="${item}"]`).tap();await page.screenshot({path:`test-results/gap-items-${test.info().project.name}.png`});await page.locator('[data-activity-submit]').tap();await page.getByRole('button',{name:'出门',exact:true}).tap();await expect(page.locator('#life-transition p')).toHaveText('拿上身份证。');await expect(page.locator('#dialogue-layer')).toBeVisible({timeout:5000});await page.getByRole('button',{name:'这次出门',exact:true}).tap();await expect.poll(async()=>(await snap(page)).chapter.gapTravelStarted,{timeout:20000}).toBe(true);expect((await snap(page)).chapter.gapTravelItems).toEqual(['clothes','charger','umbrella']);expect(await page.evaluate(()=>[scrollX,scrollY])).toEqual([0,0]);
});
test('travel bench, drink and shop stay optional and keep accurate neutral records',async({page})=>{
 test.setTimeout(60000);await seed(page,'gap-message',{location:'campus',gapTravelStyle:'city',gapTravelStarted:true});
 for(const item of [{x:82,y:266,key:'idle'}, {x:288,y:178,key:'drink'}, {x:280,y:303,key:'browse'}]){
  await go(page,180,300);if(item.key==='drink'){await go(page,230,178);}if(item.key==='browse'){await go(page,230,303);}await go(page,item.x,item.y);await page.locator('#interaction').tap();
  for(let i=0;i<80;i++){const s=await snap(page);if(s.mode==='exploring')break;if(s.mode==='transition')await page.waitForTimeout(150);else await page.locator('[data-dialogue-actions] button').first().tap();}
  expect((await snap(page)).chapter.gapActions).toContain(item.key);expect((await snap(page)).chapter.eventId).toBe('gap-message');
 }
 await page.locator('#life-mail').tap();await dialogue(page);await expect(page.locator('#life-transition strong')).toHaveText('发送照片');await page.waitForTimeout(100);await page.screenshot({path:`test-results/gap-photo-${test.info().project.name}.png`});
});
