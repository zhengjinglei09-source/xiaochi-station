import { test, expect, type Page } from '@playwright/test';
const snap = (p: Page) => p.evaluate(() => (window as any).__xiaochi.snapshot());
async function ready(p: Page) { await p.goto('/'); await expect(p.locator('#scene')).toHaveAttribute('data-ready','true'); }
async function go(p: Page,x:number,y:number) {
  const origin={x:60,y:p.viewportSize()!.height-75}; await p.mouse.move(origin.x,origin.y); await p.mouse.down();
  try { for(let i=0;i<70;i++) { const s=await snap(p),dx=x-s.x,dy=y-s.y,d=Math.hypot(dx,dy);if(d<2)return;await p.mouse.move(origin.x+dx/d*55,origin.y+dy/d*55);await p.waitForTimeout(Math.min(350,d/69*1000)); } throw Error(`walk ${x},${y}: ${JSON.stringify(await snap(p))}`); } finally {await p.mouse.up();}
}
async function to(p:Page,location:string) {
  let s=await snap(p);if(s.location===location)return;
  if(s.location!=='campus'){await go(p,267,280);await go(p,180,320);await p.getByRole('button',{name:'去校园',exact:true}).click();}
  if(location!=='campus'){await go(p,180,185);await go(p,location==='dorm'?65:290,142);await p.getByRole('button',{name:location==='dorm'?'回宿舍':'去图书馆',exact:true}).click();}
}
async function target(p:Page,id:string){
  if(await p.locator('#life-mail').isVisible()){await p.locator('#life-mail').click();return;}
  if(id==='ab-teacher'){await to(p,'campus');return;}
  if(id==='ab-wait'){await to(p,'campus');await go(p,224,280);await p.getByRole('button',{name:'和朋友聊天',exact:true}).click();return;}
  if(['ab-parcel','ab-result-1','ab-result-2','ab-accept'].includes(id)){await p.waitForTimeout(200);return;}
  await to(p,id==='ab-ielts'?'library':'dorm');await go(p,267,280);await go(p,267,194);await p.getByRole('button',{name:id==='ab-ielts'?'使用公共电脑':'打开电脑',exact:true}).click();
}
async function findFile(p:Page,id:string){ for(let i=0;i<4;i++){if(await p.locator(`[data-file="${id}"]`).isVisible())return;await p.locator('[data-files-next]').click();}throw Error('Missing file '+id); }
async function drop(p:Page,file:string,slot:string,tap=false){await findFile(p,file);const f=p.locator(`[data-file="${file}"]`),s=p.locator(`[data-slot="${slot}"]`);if(tap){await f.tap();await s.tap();}else{const a=(await f.boundingBox())!,b=(await s.boundingBox())!;await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await p.mouse.up();}}
async function play(p:Page,method='diy',region='uk',third=true){
 const started=Date.now(),seen:string[]=[];const events=new Set<string>();const paced=!!process.env.ABROAD_PACED;
 for(let i=0;i<1800;i++){
  const s=await snap(p);if(s.mode==='complete')return{seconds:(Date.now()-started)/1000,seen};const id=s.chapter.eventId;
  if(!events.has(id)){events.add(id);console.log(`Abroad ${id} ${((Date.now()-started)/1000).toFixed(1)}s`);}
  if(s.mode==='transition'){await p.waitForTimeout(150);continue;}
  if(s.mode==='exploring'){await target(p,id);continue;}
  if(s.mode==='activity'){
   if(await p.locator('#upload-layer').isVisible()){
    if(id==='ab-documents') { expect(await p.locator('[data-file="recommendation"]').count()).toBe(0); await drop(p,'photo','transcript');await expect(p.locator('[data-upload-status]')).toContainText('Invalid document'); }
    for(const [f,t] of (id==='ab-documents'?[['cv','cv'],['ps','ps'],['transcript','transcript'],['ielts','language']]:[['recommendation','recommendation']])){if(paced)await p.waitForTimeout(6500);await drop(p,f,t,f==='ps');}
    await expect(p.locator('[data-upload-count]')).toHaveText(id==='ab-documents'?'4 / 5':'5 / 5');if(paced)await p.waitForTimeout(2500);await p.locator('[data-upload-submit]').click();continue;
   }
   const title=await p.locator('#activity-title').innerText();if(paced)await p.waitForTimeout(title.includes('学校')?12000:6000);
   const cards=p.locator('[data-card]');
   if(title==='选择申请地区')await p.locator(`[data-card="${region}"]`).click();
   else if(title==='申请方式')await p.locator(`[data-card="${method}"]`).click();
   else if(title.includes('顾问方案'))await p.locator('[data-card="full"]').click();
   else if(title.includes('虚构学校')){await cards.nth(0).click();await cards.nth(2).click();}
   else await cards.last().click();
   await p.locator('[data-activity-submit]').click();continue;
  }
  const text=await p.locator('#dialogue-text').innerText();seen.push(text);
  if(paced)await p.waitForTimeout(Math.max(1200,text.length/6*1000)+((await p.locator('[data-choice]').count())>1?3000:0));
  const preferred=p.locator(`[data-choice="deadline"],[data-choice="teacher-c"],[data-choice="${third?'ab-third':'ab-apply'}"]`);
  if(await preferred.count())await preferred.first().click();else await p.locator('[data-dialogue-actions] button').first().click();
 }
 throw Error('route did not end');
}
async function seed(p:Page,eventId:string,method='diy',region='uk'){
 await ready(p);await p.evaluate(async ({eventId,method,region})=>{const {freshChapter,CHECKPOINT_KEY}=await import(/* @vite-ignore */ '/src/systems/events.ts');const s=freshChapter('abroad',eventId);s.currentMonth='2027年3月';s.location='dorm';s.abroadRegion=region;s.abroadApplicationMethod=method;s.abroadIELTSScore=6.5;s.abroadIELTSAttempts=2;s.resultSeed=.5;localStorage.setItem(CHECKPOINT_KEY,JSON.stringify(s));},{eventId,method,region});await p.reload();await expect(p.locator('#scene')).toHaveAttribute('data-ready','true');
}
test('abroad full DIY route: station, drag, teacher, two schools, explicit accept and suitcase',async({page})=>{
 test.setTimeout(process.env.ABROAD_PACED?650000:240000);const began=Date.now();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await ready(page);await go(page,345,174);await go(page,468,174);await page.getByRole('button',{name:'登上留子号',exact:true}).click();await page.getByRole('button',{name:'上。',exact:true}).click();await expect(page.locator('#game')).toHaveAttribute('data-scene','life');
 const result=await play(page);const s=(await snap(page)).chapter;
 expect(s.abroadRegion).toBe('uk');expect(s.abroadApplicationMethod).toBe('diy');expect(s.abroadIELTSAttempts).toBe(3);expect(s.abroadIELTSScore).toBe(7);expect(s.abroadUploadedDocuments).toHaveLength(5);expect(s.abroadRecommendationChoice).toBe('c');expect(s.abroadAppliedSchools).toHaveLength(2);expect(s.abroadApplicationResults[s.abroadAcceptedSchool]).toBe('offer');expect(s.chapterComplete).toBe(true);
 for(const text of ['怎么还是你。','7？？？','推荐信。','终于。','您的快递已发出','23.0 kg','23.8 kg'])expect(result.seen).toContain(text);
 await expect(page.locator('#chapter-end')).toContainText('留子号 · 到站');await expect(page.locator('#chapter-end')).toContainText('英国');await page.screenshot({path:`test-results/abroad-end-${test.info().project.name}.png`});
 await page.reload();await expect(page.locator('#chapter-end')).toBeVisible();expect((await snap(page)).chapter).toEqual(s);expect(errors).toEqual([]);console.log(`ABROAD TOTAL ${(Date.now()-began)/1000}s ${process.env.ABROAD_PACED?'paced':'functional'}`);
});
test('agency branch and applying with 6.5 both complete',async({page})=>{
 test.setTimeout(process.env.ABROAD_PACED?650000:240000);const began=Date.now();await seed(page,'ab-plan','agency','hk');const r=await play(page,'agency','hk',false);const s=(await snap(page)).chapter;
 expect(s.abroadAgencyPackage).toBe('full');expect(s.abroadIELTSAttempts).toBe(2);expect(s.abroadIELTSScore).toBe(6.5);expect(s.abroadRegion).toBe('hk');expect(s.abroadApplicationResults[s.abroadAcceptedSchool]).toBe('offer');expect(r.seen).not.toContain('7？？？');await expect(page.locator('#chapter-end')).toContainText('中国香港');console.log(`ABROAD AGENCY TOTAL ${(Date.now()-began)/1000}s ${process.env.ABROAD_PACED?'paced':'functional'}`);
});
test('all region schools and result pools are independent of IELTS/method; upload validation and phone sizes',async({page})=>{
 test.setTimeout(60000);await ready(page);
 const result=await page.evaluate(async()=>{const {regions,schools,applicationResults,documentDesktop}=await import(/* @vite-ignore */ '/src/content/abroad-data.ts');const {DocumentUpload}=await import(/* @vite-ignore */ '/src/systems/documents.ts');const {freshChapter,EventSystem}=await import(/* @vite-ignore */ '/src/systems/events.ts');const {abroadEvents}=await import(/* @vite-ignore */ '/src/content/abroad.ts');
 const branches=regions.flatMap(r=>['diy','agency'].flatMap(method=>[6.5,7].flatMap(score=>[0,.5,.9].map(seed=>{const s=freshChapter('abroad','ab-schools');s.abroadRegion=r.id;s.abroadApplicationMethod=method;s.abroadIELTSScore=score;s.abroadAppliedSchools=schools.filter(v=>v.region===r.id).slice(0,2).map(v=>v.id);s.resultSeed=seed;s.currentMonth='2026年11月';const e=new EventSystem(abroadEvents,s);e.begin('dorm','computer');e.finish();return Object.values(s.abroadApplicationResults!);}))));
 const state=freshChapter('abroad','ab-documents');state.abroadApplicationMethod='diy';const d=new DocumentUpload(documentDesktop(state));const wrong=d.drop('photo','transcript');for(const [f,t]of[['cv','cv'],['ps','ps'],['transcript','transcript'],['ielts','language']])d.drop(f,t);return{pools:branches,counts:regions.map(r=>schools.filter(s=>s.region===r.id).length),wrong,uploaded:[...d.uploaded],noLetter:!d.data.files.some(f=>f.targetSlot==='recommendation')};});
 expect(result.counts).toEqual([3,3,3,3]);expect(result.pools.every(p=>p.includes('offer'))).toBe(true);expect(result.pools.some(p=>p.includes('reject'))).toBe(true);expect(result.pools.some(p=>p.includes('waitlist'))).toBe(true);expect(result.wrong).toBe(false);expect(result.uploaded).toHaveLength(4);expect(result.noLetter).toBe(true);
 for(const [w,h]of[[320,568],[390,844],[430,932]]){await page.setViewportSize({width:w,height:h});await seed(page,'ab-documents');await target(page,'ab-documents');await page.getByRole('button',{name:'整理文件，开始上传'}).click();await drop(page,'cv','cv',true);await expect(page.locator('[data-slot="cv"]')).toHaveAttribute('data-done','true');await page.screenshot({path:`test-results/abroad-upload-${w}-${test.info().project.name}.png`});expect(await page.evaluate(()=>[scrollX,scrollY,document.documentElement.scrollWidth>innerWidth])).toEqual([0,0,false]);const box=(await page.locator('[data-upload-submit]').boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(h);}
});
test('touch dragging, cancellation, multi-touch ownership and no world movement',async({page,browserName})=>{
 test.skip(browserName!=='chromium','CDP touch');await page.setViewportSize({width:320,height:568});await seed(page,'ab-documents');await target(page,'ab-documents');await page.getByRole('button',{name:'整理文件，开始上传'}).click();
 const before=await snap(page),cdp=await page.context().newCDPSession(page);const a=(await page.locator('[data-file="cv"]').boundingBox())!,b=(await page.locator('[data-slot="cv"]').boundingBox())!;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:1}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*i/8,y:a.y+a.height/2+(b.y+b.height/2-a.y-a.height/2)*i/8,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('[data-slot="cv"]')).toHaveAttribute('data-done','true');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:2},{x:b.x+b.width/2,y:b.y+b.height/2,id:3}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:2}]});await expect(page.locator('[data-upload-count]')).toHaveText('1 / 5');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await expect(page.locator('[data-file-ghost]')).toBeHidden();
 expect((await snap(page)).x).toBe(before.x);expect((await snap(page)).y).toBe(before.y);expect(await page.evaluate(()=>[scrollX,scrollY])).toEqual([0,0]);await page.getByRole('button',{name:'收起文件',exact:true}).tap();expect((await snap(page)).chapter.abroadUploadedDocuments).toBeUndefined();
});

test('four region cards persist, teacher choices converge, one and two offers require explicit acceptance',async({page})=>{
 test.setTimeout(90000);
 for(const region of ['us','uk','au','hk']){
  await seed(page,'ab-plan');await page.evaluate(()=>{const key='xiaochi.chapter.v1',s=JSON.parse(localStorage.getItem(key)!);delete s.abroadApplicationMethod;delete s.abroadRegion;localStorage.setItem(key,JSON.stringify(s));});await page.reload();await expect(page.locator('#scene')).toHaveAttribute('data-ready','true');await target(page,'ab-plan');
  while(!await page.locator('#activity-layer').isVisible())await page.locator('[data-dialogue-actions] button').first().click();
  await page.locator(`[data-card="${region}"]`).tap();await page.locator('[data-activity-submit]').tap();await page.getByRole('button',{name:'想想申请方式'}).tap();await page.locator('[data-card="agency"]').tap();await page.locator('[data-activity-submit]').tap();
  while(!await page.locator('#activity-layer').isVisible())await page.locator('[data-dialogue-actions] button').first().click();
  await page.locator('[data-card="basic"]').tap();await page.locator('[data-activity-submit]').tap();await page.locator('[data-dialogue-actions] button').first().tap();
  expect((await snap(page)).chapter.abroadRegion).toBe(region);expect((await snap(page)).chapter.abroadAgencyPackage).toBe('basic');
  await page.evaluate(async region=>{const {schools}=await import(/* @vite-ignore */ '/src/content/abroad-data.ts');const key='xiaochi.chapter.v1',s=JSON.parse(localStorage.getItem(key)!);s.eventId='ab-accept';s.currentMonth='2027年3月';s.abroadAppliedSchools=schools.filter(v=>v.region===region).slice(0,2).map(v=>v.id);s.abroadApplicationResults=Object.fromEntries(s.abroadAppliedSchools.map((id:string,i:number)=>[id,region==='uk'||i===1?'offer':'reject']));localStorage.setItem(key,JSON.stringify(s));},region);
  await page.reload();await expect(page.locator('#scene')).toHaveAttribute('data-ready','true');await page.locator('#life-mail').tap();await page.getByRole('button',{name:'查看可接受的Offer'}).tap();
  await expect(page.locator('[data-card]')).toHaveCount(region==='uk'?2:1);await page.locator('[data-card]').last().tap();await page.locator('[data-activity-submit]').tap();expect((await snap(page)).chapter.abroadAcceptedSchool).toBeUndefined();await page.getByRole('button',{name:'ACCEPT OFFER',exact:true}).tap();await expect.poll(async()=>(await snap(page)).chapter.eventId).toBe('ab-pack');const s=(await snap(page)).chapter;expect(s.abroadAcceptedSchool).toBe(s.abroadAppliedSchools[1]);
 }
 const choices=await page.evaluate(async()=>{const {EventSystem,freshChapter}=await import(/* @vite-ignore */ '/src/systems/events.ts');const {abroadEvents}=await import(/* @vite-ignore */ '/src/content/abroad.ts');const {DialogueSystem}=await import(/* @vite-ignore */ '/src/systems/dialogue.ts');return ['a','b','c'].map(id=>{const s=freshChapter('abroad','ab-teacher');s.currentMonth='2026年11月';const e=new EventSystem(abroadEvents,s);let view:any;const d=new DialogueSystem(v=>view=v,v=>e.choose(v));d.open(e.begin('campus','phone')!,()=>e.finish());d.choose(`teacher-${id}`);const first=view.text;for(let i=0;i<20&&d.active;i++){if(view.choices.length)d.choose(view.choices[0].id);else d.continue();}return{first,choice:s.abroadRecommendationChoice,received:s.abroadRecommendationReceived};});});
 expect(choices.map(c=>c.choice)).toEqual(['a','b','c']);expect(choices.every(c=>c.received)).toBe(true);expect(choices[2].first).toBe('？');
});
