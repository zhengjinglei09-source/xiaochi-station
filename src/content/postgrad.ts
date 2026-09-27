import type { StoryEvent } from '../systems/events';
import type { DialogueNode } from '../systems/dialogue';
const done = (text: string) => [{ id: 'finish', text, action: 'complete' }];
const event = (id: string, month: string, target: string, title: string, hint: string, nodes: Record<string, DialogueNode>, nextEvent: string | null, extra: Partial<StoryEvent> = {}): StoryEvent => ({
  id, route: 'postgrad', chapter: 1, month, location: 'library', trigger: target === 'phone' ? 'phone' : 'object', target, title, hint,
  dialogue: { id, start: 'start', nodes }, nextEvent, ...extra,
});
export const postgradEvents: readonly StoryEvent[] = [
  event('pg-target', '2026年9月', 'computer', '考哪儿？', '去图书馆电脑前看看目标。', {
    start: { speaker: '图书馆电脑', lines: ['考哪儿？', '窗口开了好几个，招生说明还没看完，收藏夹已经越来越长。', '先选一个现在想去的方向。不是签合同，之后还可以改主意。'], next: 'choose' },
    choose: { speaker: '余小迟', lines: ['学什么、去哪里、为什么想去……先抓住一个理由。'], choices: [
      { id: 'target-reach', text: '想冲一冲的学校', next: 'reach' }, { id: 'target-match', text: '比较匹配的学校', next: 'match' }, { id: 'target-steady', text: '相对稳妥的学校', next: 'steady' },
    ] },
    reach: { speaker: '余小迟', lines: ['惦记很久了。先试着往那里走。'], next: 'end' },
    match: { speaker: '余小迟', lines: ['课程方向看起来合适。想把现在学的东西再往下挖一点。'], next: 'end' },
    steady: { speaker: '余小迟', lines: ['先把范围放到自己愿意去、也愿意准备的地方。'], next: 'end' },
    end: { speaker: '九月的计划', lines: ['专业课、英语，分成两摞。', '新买的笔记本，第一页还没舍得写。先找张桌子坐下来。'], choices: done('去自习桌前。') },
  }, 'pg-memory', { choices: Object.fromEntries(['reach', 'match', 'steady'].map(postgradTarget => [`target-${postgradTarget}`, { set: { postgradTarget } }])) }),
  event('pg-memory', '2026年9月', 'reading', '背了怎么又忘了', '自习桌上的书摊开了。', {
    start: { speaker: '练习便签 · 虚构知识点', lines: ['三格法：先圈问题，再列依据，最后写结论。', '小迟拿笔划了一遍。圈问题 → 列依据 → 写结论。'], choices: [{ id: 'close-book', text: '合上便签，试着想想。', next: 'recall' }] },
    recall: { speaker: '刚才讲的是？', lines: ['三格法的第一步是什么？'], choices: [
      { id: 'memory-first-yes', text: '先圈问题', next: 'remember' }, { id: 'memory-first-no', text: '先写结论', next: 'forgot' }, { id: 'memory-first-other', text: '先抄标题', next: 'forgot' },
    ] },
    forgot: { speaker: '余小迟', lines: ['……', '我刚刚不是会了吗？', '再看一眼：先圈问题。'], next: 'second' },
    remember: { speaker: '余小迟', lines: ['这一句还记得。往后翻一页。'], next: 'second' },
    second: { speaker: '下一张便签', lines: ['颜色标签：蓝色放例子，绿色放问题。', '小迟换了支笔。过了一会儿，又翻回刚才那页。'], choices: [{ id: 'close-again', text: '盖住便签，再想一次。', next: 'recall-again' }] },
    'recall-again': { speaker: '刚才那张便签', lines: ['“圈问题”之后，下一步是什么？'], choices: [
      { id: 'memory-second-no', text: '直接写结论', next: 'forgot-again' }, { id: 'memory-second-other', text: '按颜色排好', next: 'forgot-again' }, { id: 'memory-second-yes', text: '列依据', next: 'end' },
    ] },
    'forgot-again': { speaker: '余小迟', lines: ['……两张便签已经混在一起了。', '圈问题，列依据，写结论。重新念一遍。'], next: 'end' },
    end: { speaker: '余小迟', lines: ['把便签夹回书里。等会儿再来。'], choices: done('先换英语。') },
  }, 'pg-english', { choices: Object.fromEntries(['first-yes', 'first-no', 'first-other', 'second-no', 'second-other', 'second-yes'].map(id => [`memory-${id}`, { memoryAnswer: id.endsWith('yes') }])) }),
  event('pg-english', '2026年9月', 'reading', '挺整齐', '自习桌上换成了英语阅读。', {
    start: { speaker: '小迟刚做完的阅读', lines: ['一篇阅读，五道题。小迟在选项旁边涂了五个圈。'], choices: [{ id: 'submit-reading', text: '对答案', next: 'marks' }] },
    marks: { speaker: '刚才那篇阅读的批注', lines: ['❌', '❌  ❌', '❌  ❌  ❌', '❌  ❌  ❌  ❌', '❌  ❌  ❌  ❌  ❌'], next: 'reaction' },
    reaction: { speaker: '余小迟', lines: ['……', '挺整齐。', '长句暂时看不进去。先捡三个眼熟的词。'], choices: [{ id: 'vocab-start', text: '打开单词便签', action: 'quiz' }] },
  }, 'pg-october', { quizState: 'postgradEnglishQuizResult', effects: { set: { currentMonth: '2026年10月' } }, optionalMiniGame: {
    id: 'common-vocabulary-01', retryUntilCorrect: true, completion: { speaker: '2026年10月', lines: ['三张词卡夹进书里。', '日历已经翻到十月。图书馆窗边的位置，晚上开始有点凉。'], button: '收起便签' }, questions: [
      { id: 'ambiguous', category: '高频词', text: 'ambiguous\n这个词更接近哪种意思？', options: ['明确的', '模糊不清的', '愉快的'], answer: 1, explanation: 'ambiguous：模糊不清的、有歧义的。' },
      { id: 'retain', category: '高频词', text: 'retain\n这个词更接近哪种意思？', options: ['保留', '拒绝', '比较'], answer: 0, explanation: 'retain：保留、保持。' },
      { id: 'reluctant', category: '高频词', text: 'reluctant\n这个词更接近哪种意思？', options: ['迅速的', '相似的', '不情愿的'], answer: 2, explanation: 'reluctant：不情愿的、勉强的。' },
    ],
  } }),
  event('pg-october', '2026年10月', 'reading', '有点不想考了', '晚上，再坐回那张自习桌。', {
    start: { speaker: '2026年10月 · 图书馆', lines: ['朋友发来消息，拿到 Offer 了。', '隔壁桌已经开始第二轮。小迟的书上，还夹着第一轮的便签。', '书打开了一会儿，没有翻页。'], next: 'choice' },
    choice: { speaker: '余小迟', lines: ['小迟把胳膊叠在桌上。', '……', '有点不想考了。'], choices: [{ id: 'pg-continue', text: '再坚持一下。', next: 'continue' }, { id: 'pg-stop', text: '我不想继续了。', next: 'stop' }] },
    continue: { speaker: '图书馆的日历', lines: ['先把明天要看的那几页折好。', '背书，英语。今天记住的，明天再过一遍。', '有人提前离开，也有人带着热水杯坐下。', '天黑得越来越早。笔记本的空白页，越来越少。', '十一月翻过去。外套换厚了一件。'], choices: done('去参加十二月初试。') },
    stop: { speaker: '余小迟', lines: ['那就先到这里。', '合上书，把便签夹好。书和笔袋一起放回深海军蓝双肩包。', '桌面腾出来了。去车站看看。'], choices: [{ id: 'pg-return', text: '背好包，走吧。', action: 'return-station' }] },
  }, 'pg-exam', { choices: { 'pg-continue': { set: { postgradOctoberChoice: 'continue', currentMonth: '2026年12月' } }, 'pg-stop': { set: { postgradOctoberChoice: 'stop' } } } }),
  event('pg-exam', '2026年12月', 'computer', '十二月初试', '准考信息在图书馆电脑上。', {
    start: { speaker: '2026年12月 · 初试当天', lines: ['准考证、证件、笔。小迟又摸了一遍双肩包的夹层。', '天还没亮。走廊里也有人轻轻关上门。'], choices: [{ id: 'exam-start', text: '去考点。', action: 'sequence' }] },
  }, 'pg-result', { effects: { set: { location: 'campus' } }, freeExploreSeconds: 6, sequence: [
    { title: '天还没亮', text: '小迟背着包出门，路灯还亮着。', seconds: 4 },
    { title: '考点', text: '找到座位。把证件放在桌角。', seconds: 4 },
    { title: '开始答题', text: '卷子发下来。先翻到第一页。', seconds: 4 },
    { title: '这道见过', text: '写下第一行。笔尖终于动起来了。', seconds: 4 },
    { title: '这道不会', text: '先留一点空白，接着往后写。', seconds: 4 },
    { title: '请停止答题。', text: '铃响。放下笔，把卷子翻过去。', seconds: 4 },
  ] }),
  event('pg-result', '2026年12月', 'phone', '进入复试', '过了一阵子，手机有了新通知。', {
    start: { speaker: '2027年2月', lines: ['小迟打开查分页面，输完最后一位信息。'], choices: [{ id: 'view-result', text: '查询结果', next: 'loading' }] },
    loading: { speaker: '查分页面', lines: ['页面加载中……', '……'], next: 'result' },
    result: { speaker: '进入复试', lines: ['页面刷新出来的那一刻，余小迟盯着分数线看了好几遍。'], next: 'reaction' },
    reaction: { speaker: '余小迟', lines: ['……进了？', '……', '我进复试了？？？'], next: 'friend' },
    friend: { speaker: '朋友 · 手机消息', lines: ['？？？', '你进了！！'], next: 'reply' },
    reply: { speaker: '余小迟', lines: ['啊啊啊啊啊啊'], choices: done('收起手机') },
  }, null, { location: 'any', effects: { set: { currentMonth: '2027年2月', postgradResult: 'retest', chapterComplete: true } } }),
];
