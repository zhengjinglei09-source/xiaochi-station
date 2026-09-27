import type { StoryEvent, SequenceStep } from '../systems/events';
import type { DialogueScript, Presentation } from '../systems/dialogue';
import { lifeActions, travelActions } from './gap-actions';
const done = (text='收起') => [{id:'done',text,action:'complete'}];
const act = (text:string,action:string) => [{id:action,text,action}];
const steps = (titles:string[], seconds=2, presentation?:Presentation):SequenceStep[] => titles.map(title=>({title,text:'',seconds,presentation}));
function event(id:string,month:string,location:StoryEvent['location'],target:string,nodes:DialogueScript['nodes'],nextEvent:string|null,extra:Partial<StoryEvent>={}):StoryEvent {
 return {id,route:'gap',chapter:1,month,location,target,trigger:target==='auto'?'auto':target==='phone'?'phone':'object',title:'待机号',hint:'',dialogue:{id,start:'start',nodes},nextEvent,...extra};
}
const travelNames = {seaside:'海边',mountain:'山里',city:'陌生城市',random:'未命名的小地方'};
export const gapEvents: StoryEvent[] = [
 event('gap-wake','2026年9月','any','auto',{
  start:{speaker:'第二天 · 宿舍',presentation:'rest',lines:['手机安静地放在旁边。'],choices:act('醒来','sequence:wake')},
  awake:{speaker:'余小迟',lines:['……','今天干嘛？'],choices:done('起床')},
 },'gap-day-1',{sequences:{wake:{steps:[{title:'2026年秋',text:'',seconds:6,presentation:'rest'}],next:'awake'}},effects:{set:{location:'dorm'}}}),
 event('gap-day-1','2026年9月','any','auto',{start:{speaker:'',lines:[''],choices:act('','sequence:night')}},'gap-day-2',{
  freeTime:{seconds:60,actions:lifeActions,clock:true}, sequences:{night:{steps:[{title:'一天过去了',text:'',seconds:2},{title:'过了几天',text:'',seconds:2}]}},effects:{set:{currentMonth:'2026年10月',location:'dorm'}},
 }),
 event('gap-day-2','2026年10月','any','auto',{start:{speaker:'',lines:[''],choices:act('','sequence:night')}},'gap-dinner',{
  freeTime:{seconds:50,actions:lifeActions,clock:true},sequences:{night:{steps:[{title:'晚上',text:'手机：叮——',seconds:2}]}},
 }),
 event('gap-dinner','2026年10月','any','phone',{
  start:{speaker:'朋友',lines:['晚上吃饭？'],choices:act('来。','sequence:meal')},
  a:{speaker:'朋友A',presentation:'meal',lines:['我下周入职了。'],next:'b'},b:{speaker:'朋友B',presentation:'meal',lines:['我导师让我提前看论文。'],next:'c'},
  c:{speaker:'朋友C',presentation:'meal',lines:['我省考进面了。'],next:'d'},d:{speaker:'朋友D',presentation:'meal',lines:['我签证终于下来了。'],next:'you'},
  you:{speaker:'朋友',presentation:'meal',lines:['小迟你呢？'],choices:[
   {id:'self-gap',text:'我Gap一下。',next:'gap'},{id:'self-thinking',text:'还没想好。',next:'thinking'},
   {id:'self-project',text:'最近在做点自己的东西。',next:'project'},{id:'self-unknown',text:'不知道。',next:'unknown'},
  ]},
  gap:{speaker:'朋友',presentation:'meal',lines:['哦——','最近都在干嘛？'],next:'casual'},casual:{speaker:'余小迟',presentation:'meal',lines:['就……随便看看。'],next:'food'},
  thinking:{speaker:'朋友',presentation:'meal',lines:['嗯。','这个菜是谁点的？'],next:'eat'},
  project:{speaker:'朋友',presentation:'meal',lines:['什么东西？'],next:'unfinished'},unfinished:{speaker:'余小迟',presentation:'meal',lines:['还没做出来。'],next:'unknown'},
  unknown:{speaker:'朋友',presentation:'meal',lines:['哦。'],next:'food'},food:{speaker:'另一个朋友',presentation:'meal',lines:['你们还加菜吗？'],next:'eat'},
  eat:{speaker:'饭后',lines:['大家走出了食堂。'],choices:done('在校园站一会儿')},
 },'gap-experiment',{hint:'朋友：晚上吃饭？',sequences:{meal:{steps:[{title:'食堂',text:'坐到朋友旁边。',seconds:3,presentation:'meal'}],next:'a'}},choices:Object.fromEntries(['gap','thinking','project','unknown'].map(id=>[`self-${id}`,{set:{gapSelfDescription:id}}])),effects:{set:{location:'campus',currentMonth:'2027年1月'}},freeExploreSeconds:5}),
 event('gap-experiment','2027年1月','any','phone',{
  start:{speaker:'翻到一张旧便签',lines:['最近想试点什么？'],choices:[
   {id:'exp-work',text:'短期实习 / 兼职',action:'sequence:work'},{id:'exp-walk',text:'出去走走',action:'sequence:walk'},
   {id:'exp-learn',text:'学点东西',next:'learn'},{id:'exp-project',text:'做自己的项目',action:'sequence:new-project'},
  ]},
  learn:{speaker:'电脑',lines:['打开教程。'],choices:['剪辑','设计','AI工具','语言','编程'].map((text,i)=>({id:`subject-${i}`,text,action:'sequence:learn'}))},
  work:{speaker:'余小迟',lines:['累。','但是到账了。'],choices:done()},
  walk:{speaker:'余小迟',lines:['饮料喝完了。'],choices:done('回去')},
  learned:{speaker:'余小迟',lines:['好像会了一点。'],choices:done()},
  name:{speaker:'余小迟',presentation:'project',lines:['？'],choices:act('删掉，重新输入','sequence:rename')},
  create:{speaker:'新建项目',presentation:'project',lines:['untitled_project'],choices:act('CREATE','sequence:create')},
  edit:{speaker:'空白页面',presentation:'project',lines:['光标闪着。'],choices:act('输入一点文字','sequence:type')},
  element:{speaker:'页面',presentation:'project',lines:['你好。'],choices:act('放上一个元素','sequence:element')},
  run:{speaker:'untitled_project',presentation:'project',lines:['一个文字块，一个方块。'],choices:act('RUN','sequence:error')},
  error:{speaker:'余小迟',presentation:'project',lines:['……'],choices:act('修改一下，再RUN','sequence:fix')},
  works:{speaker:'余小迟',presentation:'project',lines:['？'],choices:done('关上电脑')},
 },'gap-graduation',{hint:'手机里翻到一张便签。',choices:Object.fromEntries(['work','walk','learn','project'].map(id=>[`exp-${id}`,{set:{gapExperiment:id}}])),
 sequences:{
  work:{steps:steps(['工作牌','电脑前 · 整理资料','做事情','下班','手机到账'],5),next:'work'},
  walk:{steps:steps(['公交车窗','走过一条街','买杯饮料','坐一会儿','拍了一张照片'],5),next:'walk'},
  learn:{steps:steps(['教程','跟着操作','出错','改一下','继续'],5),next:'learned'},
  'new-project':{steps:[...steps(['新建项目','项目名称：▏','小迟▏','小迟去哪儿▏'],2,'project')],next:'name'},
  rename:{steps:steps(['项目名称：▏','untitled_project▏'],1.5,'project'),next:'create'},
  create:{steps:steps(['空白页面'],1,'project'),next:'edit'},type:{steps:steps(['你好。▏'],1,'project'),next:'element'},element:{steps:steps(['□ → 页面'],1.5,'project'),next:'run'},
  error:{steps:steps(['RUN','ERROR'],1.5,'project'),next:'error'},fix:{steps:steps(['修改一行','RUN','页面出现了'],1.5,'project'),next:'works'},
 },effects:{set:{currentMonth:'2027年6月',location:'campus'}},freeExploreSeconds:5}),
 event('gap-graduation','2027年6月','campus','friend',{
  start:{speaker:'朋友',lines:['我明天走了。'],next:'quick'},quick:{speaker:'余小迟',lines:['这么快？'],next:'yes'},yes:{speaker:'朋友',lines:['嗯。','你呢？'],next:'me'},
  me:{speaker:'余小迟',lines:['我……','还不知道。'],next:'photo'},photo:{speaker:'朋友',lines:['行。','到时候给我发照片。'],choices:done('帮忙提一下纸箱')},
 },'gap-map',{hint:'朋友站在纸箱旁。',effects:{set:{currentMonth:'2027年7月',location:'dorm'}}}),
 event('gap-map','2027年7月','dorm','phone',{
  start:{speaker:'宿舍',lines:['衣服、书、杂物。'],choices:act('简单收拾一下','sequence:tidy')},
  phone:{speaker:'手机',lines:['相册旁边，是地图。'],choices:[{id:'map',text:'看看地图',next:'idea'}]},
  idea:{speaker:'余小迟',lines:['……','要不出去走走？','反正最近也没事。','出去玩几天？'],choices:act('看看想去的地方','activity:travel')},
  selected:{speaker:'余小迟',lines:['就这吧。'],choices:done('收拾旅行包')},
  ticket:{speaker:'购票页面',lines:['目的地：——','……'],choices:act('随便看看','sequence:ticket')},
 },'gap-items',{hint:'床边的手机还亮着。',sequences:{tidy:{steps:steps(['把书装进纸箱','叠好衣服','坐到床边'],2),next:'phone'},ticket:{steps:steps(['风汀','苇野','晴川埠'],.8),next:'selected'}},
 activities:{travel:{title:'去哪种地方？',kind:'single',field:'gapTravelStyle',storeIds:true,min:1,max:1,submit:'就这个',next:'selected',options:[{id:'seaside',label:'去海边',detail:'想吹吹风。'},{id:'mountain',label:'去山里',detail:'找个安静一点的地方。'},{id:'city',label:'去陌生城市',detail:'随便逛逛。'},{id:'random',label:'没有目的地',detail:'先买张票再说。'}]}},
 resolve:s=>s.gapTravelStyle==='random'?{activities:{travel:{...gapEvents.find(e=>e.id==='gap-map')!.activities!.travel,next:'ticket'}}}:{},
 }),
 event('gap-items','2027年7月','dorm','bed',{
  start:{speaker:'旅行包',presentation:'small-bag',lines:['带点什么？'],choices:act('挑几件','activity:items')},
  packed:{speaker:'余小迟',presentation:'small-bag',lines:['拉上拉链。'],choices:act('出门','sequence:forgot')},
  forgot:{speaker:'余小迟',presentation:'small-bag',lines:['差点。'],choices:act('这次出门','sequence:leave')},
 },'gap-travel-day',{
  hint:'床边放着一个小旅行包。',activities:{items:{title:'带点什么？',intro:'挑3～4件。',kind:'multi',field:'gapTravelItems',storeIds:true,min:3,max:4,submit:'装进旅行包',next:'packed',options:['衣服','充电器','耳机','相机','书','雨伞','零食','电脑','水杯'].map((label,i)=>({id:['clothes','charger','headphones','camera','book','umbrella','snacks','computer','cup'][i],label}))}},
  resolve:s=>({sequences:{forgot:{steps:[{title:'走到门口，又回来了',text:s.gapTravelItems?.includes('charger')?'拿上身份证。':'拿上充电器。',seconds:3,presentation:'small-bag'}],next:'forgot'},leave:{steps:[{title:'走出宿舍',text:'旅行包提好了。',seconds:3,presentation:'trip-depart'},{title:'校园',text:'有人拍照，有人提着纸箱。',seconds:3},...steps(s.gapTravelStyle==='seaside'?['车窗','海','买杯饮料','脱鞋踩一下水','坐着吹风']:s.gapTravelStyle==='mountain'?['车窗','山路','住宿点','散步','坐着看远处']:s.gapTravelStyle==='city'?['车站','陌生街道','便利店','公交 · 坐错站了','看一眼地图，继续走']:['车站','看站牌','上车','这是哪？','算了。'],1.6,'travel')]}},textValues:{travelName:travelNames[s.gapTravelStyle as keyof typeof travelNames]??''}}),
  effects:{set:{gapTravelStarted:true,location:'campus'}},
 }),
 event('gap-travel-day','2027年7月','any','auto',{start:{speaker:'',lines:[''],choices:done()}},'gap-message',{freeTime:{seconds:14,actions:travelActions}}),
 event('gap-message','2027年7月','any','phone',{
  start:{speaker:'朋友',lines:['玩得怎么样？'],next:'okay'},okay:{speaker:'余小迟',lines:['还行。'],choices:act('拍张照片发过去','sequence:photo')},
  friend:{speaker:'朋友',lines:['哈哈哈哈'],choices:done('收起手机，继续走')},
 },'gap-last-walk',{hint:'朋友发来一条消息。',sequences:{photo:{steps:[{title:'发送照片',text:'',seconds:2,presentation:'photo'}],next:'friend'}}}),
 event('gap-last-walk','2027年7月','any','auto',{start:{speaker:'',lines:[''],choices:act('','sequence:fade')}},null,{
  freeTime:{seconds:8,actions:travelActions},sequences:{fade:{steps:[{title:'',text:'',seconds:3,presentation:'ambient'}]}},effects:{set:{chapterComplete:true}},
 }),
];
