import type { FreeAction } from '../systems/free-action';
import type { SequenceStep } from '../systems/events';
const sequence = (titles: string[], seconds = 2): SequenceStep[] => titles.map(title => ({ title, text: '', seconds }));
const action = (id: string, location: FreeAction['location'], x: number, y: number, label: string, recordKey: string, lines: string[], steps?: SequenceStep[]): FreeAction => ({
  id, location, recordKey, target: { id, x, y, name: label, kind: id === 'bed' ? 'bed' : 'reading' },
  dialogue: { id: `free-${id}`, start: 'start', nodes: {
    start: { speaker: '余小迟', lines: steps ? ['……'] : lines, choices: [{ id: 'do', text: steps ? label : '起身', action: steps ? 'sequence:action' : 'complete' }] },
    done: { speaker: '余小迟', lines, choices: [{ id: 'done', text: '收起', action: 'complete' }] },
  } }, sequences: steps ? { action: { steps, next: 'done' } } : undefined,
});
export const lifeActions: FreeAction[] = [
  action('bed','dorm',90,250,'再睡会儿','sleep',['……'],[{ title:'11:20',text:'',seconds:2,presentation:'rest' },{title:'14:46',text:'',seconds:3,presentation:'black'}]),
  action('phone','dorm',165,233,'刷会儿手机','phone',['群聊：谁的杯子还在洗衣房？','朋友发来一张猫的照片。']),
  action('computer','dorm',267,194,'做点自己的东西','project',['新建了一个空白文件。','先写两行。'],sequence(['空白文件','输入了一点文字'],2)),
  action('learn','dorm',302,295,'学点东西','learn',['好像会了一点。'],sequence(['教程','跟着操作','做错了','再试一下'],3)),
  action('play','dorm',60,327,'玩会儿','play',['一局结束。'],sequence(['打开游戏','窗外的人经过','过了一会儿'],2)),
  action('idle','campus',144,276,'坐会儿','idle',['风吹过树叶。'],[{title:'',text:'',seconds:7,presentation:'ambient'}]),
  action('part-time','campus',318,317,'看看兼职信息','part_time',['累。','但是到账了。'],sequence(['到店','整理货架','下班 · 到账'],2)),
];
lifeActions.find(a => a.id === 'bed')!.timeCost = 206;
const learn = lifeActions.find(a => a.id === 'learn')!;
learn.dialogue.nodes.start = { speaker:'电脑',lines:['打开一个教程。'],choices:['剪辑','设计','AI工具','语言','编程'].map((text,i)=>({id:`learn-${i}`,text,action:'sequence:action'})) };
export const travelActions: FreeAction[] = [
  action('seat','campus',82,266,'坐会儿','idle',['……'],[{title:'',text:'',seconds:4,presentation:'ambient'}]),
  action('drink','campus',288,178,'买瓶饮料','drink',['咔哒。','冰的。']),
  action('shop','campus',280,303,'看看路边小店','browse',['门口挂着一串小风铃。']),
];
