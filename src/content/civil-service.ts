import type { StoryEvent } from '../systems/events';
import type { DialogueNode } from '../systems/dialogue';
import type { ActivityDefinition } from '../systems/activity';
const done = (text = '收起手机') => [{ id: 'finish', text, action: 'complete' }];
const act = (text: string, action: string) => [{ id: action, text, action }];
const event = (id: string, month: string, location: StoryEvent['location'], target: string, title: string, hint: string, nodes: Record<string, DialogueNode>, nextEvent: string | null, extra: Partial<StoryEvent> = {}): StoryEvent => ({
  id, route: 'civil_service', chapter: 1, month, location, target, title, hint,
  trigger: target === 'phone' ? 'phone' : target === 'friend' ? 'npc' : 'object', dialogue: { id, start: 'start', nodes }, nextEvent, ...extra,
});
const filters = [
  { id: 'education', label: '本科及以上', detail: '学历要求' },
  { id: 'graduate', label: '2027届应届毕业生', detail: '应届身份' },
  { id: 'experience', label: '不限基层工作经历', detail: '其他报考条件' },
];
export const civilJobs = [
  { id: 'city-a', label: 'A市 · 综合事务岗', detail: '很想去的城市 · 招录1人\n本科及以上' },
  { id: 'hometown', label: '家乡 · 行政事务岗', detail: '离家近 · 招录3人\n限应届毕业生' },
  { id: 'city-b', label: 'B市 · 综合管理岗', detail: '城市一般，有点远 · 招录5人\n其他条件符合' },
];
const firstFilters: ActivityDefinition = { title: '国考 · 虚构职位表', kind: 'filters', field: 'civilServiceFirstFilters', options: filters, counts: [327, 186, 94, 38], intro: '学历、身份、经历……先把能报的留下。', submit: '查看符合条件的岗位', next: 'filtered' };
const secondFilters: ActivityDefinition = { ...firstFilters, title: '省考 · 虚构职位表', field: 'civilServiceSecondFilters', counts: [218, 120, 57, 23], intro: '', next: 'jobs' };
const jobSelection = (second: boolean): ActivityDefinition => ({ title: '选择心仪岗位', kind: 'single', field: second ? 'civilServiceSecondJob' : 'civilServiceFirstJob', options: civilJobs, min: 1, max: 1, intro: '三个虚构岗位。你更愿意去哪里？', submit: '选这个岗位', next: 'register' });
const materials = ['社区不少老人不会使用线上预约，经常请邻居代办。', '社区设立了服务站，但每天只开放两小时，排队的人很多。', '志愿者只有两名，遇到复杂操作时也不知道怎么指导。'];
export const civilServiceEvents: readonly StoryEvent[] = [
  event('cs-notice', '2026年9月', 'campus', 'phone', '你国考看了吗？', '朋友发来一条消息。', {
    start: { speaker: '朋友', lines: ['你国考看了吗？'], next: 'xiaochi' },
    xiaochi: { speaker: '余小迟', lines: ['……什么？'], next: 'notice' },
    notice: { speaker: '手机 · 秋季招录公告', lines: ['国考招录公告已发布。职位表已附上。'], choices: act('打开职位表', 'activity:filters') },
    filtered: { speaker: '余小迟', lines: ['？', '……怎么越筛越少。'], choices: act('看看留下的岗位', 'activity:jobs') },
    register: { speaker: '报考岗位', lines: ['{{civilServiceFirstJob}}'], choices: act('报名', 'sequence:registration') },
  }, 'cs-quiz', { trigger: 'auto', activities: { filters: firstFilters, jobs: jobSelection(false) }, sequences: { registration: { steps: [
    { title: '报名信息已提交', text: '{{civilServiceFirstJob}}', seconds: 1 }, { title: '资格审查中……', text: '等待审核', seconds: 1 }, { title: '审核通过', text: '报名确认 · 缴费完成', seconds: 1 },
  ] } }, effects: { set: { currentMonth: '2026年10月' } } }),
  event('cs-quiz', '2026年10月', 'library', 'computer', '模拟行测', '图书馆电脑上放着模拟题。', {
    start: { speaker: '模拟行测', lines: ['备考资料　模拟题　计时器 01:00'], choices: act('开始计时', 'quiz') },
    practice: { speaker: '后面几周 · 模考记录', lines: ['笔记本又多了几页。'], choices: act('翻看记录', 'sequence:practice') },
    reaction: { speaker: '余小迟', lines: ['……', '那我这几周……', '在干嘛？'], choices: done('换一本，看看申论。') },
  }, 'cs-essay', { quizState: 'civilServiceQuizAnswers', afterQuiz: 'practice', optionalMiniGame: {
    id: 'civil-practice', durationSeconds: 60, questions: [
      { id: 'language', category: '言语理解', text: '社区把旧书架搬到广场，借阅量上升。居民说：“路过就能拿一本，更方便了。”\n最符合文意的是？', options: ['借阅更方便促进了阅读', '旧书比新书更受欢迎', '居民不再购买图书'], answer: 0, explanation: '材料强调借阅便利。' },
      { id: 'logic', category: '判断推理', text: '观察图形规律：\n■ □ ■ □ ■ ？', options: ['■', '□', '△'], answer: 1, explanation: '黑白方块交替。' },
      { id: 'number', category: '数量关系', text: '3名志愿者每人每小时整理20册书。一起工作2小时，共整理多少册？', options: ['60册', '100册', '120册'], answer: 2, explanation: '3 × 20 × 2 = 120。' },
      { id: 'data', category: '资料分析', text: '服务站接待记录（人）\n\n周一　20\n周二　30\n周三　40\n\n周三比周一增加了多少人？', options: ['10人', '20人', '40人'], answer: 1, explanation: '40 − 20 = 20。' },
      { id: 'knowledge', category: '常识', text: '纸质材料受潮后，哪种处理更适合？', options: ['放在通风处摊开晾干', '紧紧叠起来装袋', '靠近明火烘烤'], answer: 0, explanation: '通风晾干，避开明火。' },
    ],
  }, sequences: { practice: { next: 'reaction', steps: [
    { title: '第一次 · 61', text: '小迟的模考记录', seconds: 3 }, { title: '第二次 · 58', text: '翻书，刷题。小迟：“？”', seconds: 3 }, { title: '第三次 · 56', text: '继续刷题。笔尖停住了。', seconds: 3 },
  ] } } }),
  event('cs-essay', '2026年10月', 'library', 'reading', '极简申论', '自习桌上有三段材料。', {
    start: { speaker: '申论 · 虚构材料', lines: ['社区老人的数字服务，哪里卡住了？'], choices: act('阅读材料，提炼问题', 'activity:problems') },
    measures: { speaker: '第二问', lines: ['从材料出发，挑两项改善措施。'], choices: act('整理措施', 'activity:measures') },
    write: { speaker: '答题纸', lines: ['问题：{{civilServiceEssayProblems}}\n措施：{{civilServiceEssayMeasures}}', '把选出的要点分成“问题”和“建议”两段，写进答题纸。'], choices: done('提交答题纸') },
  }, 'cs-national', { activities: {
    problems: { title: '概括主要问题', kind: 'multi', field: 'civilServiceEssayChoices', part: 'problems', materials, min: 2, max: 3, intro: '选出2～3个要点', options: ['数字使用门槛', '服务资源不足', '志愿者不足', '商业竞争', '天气炎热', '娱乐设施不足'].map((label, i) => ({ id: `problem-${i}`, label })), next: 'measures' },
    measures: { title: '选择两项改善措施', kind: 'multi', field: 'civilServiceEssayChoices', part: 'measures', materials, min: 2, max: 2, intro: '选择2项', options: ['设置线下服务窗口', '增加志愿者培训', '全部改为线上办理', '减少服务时间', '开展数字技能指导'].map((label, i) => ({ id: `measure-${i}`, label })), next: 'write' },
  }, effects: { set: { currentMonth: '2026年11月' } } }),
  event('cs-national', '2026年11月', 'library', 'computer', '第一次考试 · 国考', '准考证可以打印了。', {
    start: { speaker: '2026年11月 · 国考', lines: ['准考证已打印。考点路线也存好了。'], choices: act('出发去考点', 'sequence') },
  }, 'cs-after-exam', { sequence: [
    { title: '天还没亮', text: '小迟背上深海军蓝双肩包。', seconds: 3 }, { title: '考点', text: '证件、准考证。找到自己的座位。', seconds: 3 },
    { title: '上午 · 行测', text: '翻页，涂卡。抬头看了一眼钟。', seconds: 4 }, { title: '下午 · 申论', text: '材料、问题、答题纸。笔一直没停。', seconds: 4 },
    { title: '请停止答题。', text: '放下笔，走出考场。', seconds: 4 },
  ], effects: { set: { location: 'campus' } }, freeExploreSeconds: 3 }),
  event('cs-after-exam', '2026年11月', 'campus', 'friend', '考完了', '朋友在校园路边等你。', {
    start: { speaker: '朋友', lines: ['怎么样？'], choices: [ { id: 'exam-unknown', text: '不知道。', next: 'unknown' }, { id: 'exam-unfinished', text: '做不完。', next: 'unfinished' }, { id: 'exam-essay', text: '申论写完了，别问写了什么。', next: 'essay' } ] },
    unknown: { speaker: '朋友', lines: ['先别对答案了。吃点东西？'], choices: done('走。') },
    unfinished: { speaker: '朋友', lines: ['我最后几分钟也只听见翻卷子的声音。'], choices: done('走。') },
    essay: { speaker: '朋友', lines: ['行，不问。先把手歇一会儿。'], choices: done('走。') },
  }, 'cs-first-result', { effects: { set: { currentMonth: '2027年1月' } } }),
  event('cs-first-result', '2027年1月', 'any', 'phone', '第一次查成绩', '成绩查询入口开放。', {
    start: { speaker: '手机 · 次年1月', lines: ['国考成绩查询入口开放。'], choices: act('查询成绩', 'sequence:loading') },
    score: { speaker: '笔试成绩', lines: ['行测：64.2\n申论：61.5'], next: 'question' },
    question: { speaker: '余小迟', lines: ['这是多少？'], next: 'list' },
    list: { speaker: '面试名单', lines: ['名单很长。先找自己的名字。'], choices: [{ id: 'search-name', text: '搜索姓名', next: 'search' }] },
    search: { speaker: '搜索：余小迟', lines: ['0个匹配结果'], next: 'oh' },
    oh: { speaker: '余小迟', lines: ['……', '哦。'], choices: done() },
  }, 'cs-province', { sequences: { loading: { steps: [{ title: '正在查询', text: '余小迟', seconds: 1 }], next: 'score' } }, effects: { set: { civilServiceFirstResult: 'not_interview' } }, freeExploreSeconds: 2 }),
  event('cs-province', '2027年1月', 'any', 'phone', '怎么又来了', '叮——新的招录公告。', {
    start: { speaker: '手机', lines: ['XX省公务员考试公告发布。'], next: 'reaction' },
    reaction: { speaker: '余小迟', lines: ['？', '怎么又来了。'], choices: act('打开新职位表', 'activity:filters') },
    jobs: { speaker: '职位表', lines: ['符合条件：23'], choices: act('看看岗位', 'activity:jobs') },
    register: { speaker: '这次想去的地方', lines: ['{{civilServiceSecondJob}}'], choices: act('报名', 'sequence:registration') },
  }, 'cs-strategy', { activities: { filters: secondFilters, jobs: jobSelection(true) }, sequences: { registration: { steps: [
    { title: '信息已提交', text: '{{civilServiceSecondJob}}', seconds: 1 }, { title: '审核通过', text: '确认，缴费。准考证信息已保存。', seconds: 1 },
  ] } }, effects: { set: { currentMonth: '2027年3月' } } }),
  event('cs-strategy', '2027年3月', 'library', 'reading', '第二次考试', '去自习桌前，排一下做题顺序。', {
    start: { speaker: '第二次 · 做题顺序', lines: ['这次先做哪一块？'], choices: act('安排顺序', 'activity:order') },
    ready: { speaker: '准考证背面的便签', lines: ['{{civilServiceExamOrder}}'], choices: act('去考点', 'sequence:province') },
    friend: { speaker: '朋友', lines: ['怎么样？'], next: 'response' },
    response: { speaker: '余小迟', lines: ['这句话是不是三个月前问过。'], choices: done('先回去。') },
  }, 'cs-shortlist', { activities: { order: { title: '安排做题顺序', kind: 'order', field: 'civilServiceExamOrder', options: ['言语', '判断', '资料', '常识', '数量'].map((label, i) => ({ id: `order-${i}`, label })), intro: '依次点选；再点一次可取消。', submit: '记下顺序', next: 'ready' } }, sequences: { province: { next: 'friend', steps: [
    { title: '06:20', text: '起床。拿上准考证。', seconds: 2 }, { title: '07:45', text: '到考点。找到楼梯口。', seconds: 2 }, { title: '09:00 · 行测', text: '{{civilServiceExamOrder}}', seconds: 2 }, { title: '14:00 · 申论', text: '读材料，列要点，再写进答题纸。', seconds: 2 }, { title: '17:00', text: '走出考场。', seconds: 2 },
  ] } }, effects: { set: { currentMonth: '2027年4月' } } }),
  event('cs-shortlist', '2027年4月', 'any', 'phone', '进入面试', '省考成绩可以查询了。', {
    start: { speaker: '手机 · 4月', lines: ['省考成绩查询入口开放。'], choices: act('查询成绩', 'sequence:loading') },
    result: { speaker: '进入面试', lines: ['余小迟　{{civilServiceSecondJob}}'], next: 'reaction' },
    reaction: { speaker: '余小迟', lines: ['？', '……我？', '我进了？'], choices: act('查看资格复审通知', 'sequence:review') },
  }, 'cs-interview', { sequences: {
    loading: { steps: [{ title: '正在加载', text: '成绩查询', seconds: 1 }], next: 'result' },
    review: { steps: [{ title: '身份证 ✓　学生证 ✓', text: '报名材料、相关证明已核对。', seconds: 2 }, { title: '资格复审通过', text: '面试通知已发送。', seconds: 3 }] },
  }, effects: { set: { civilServiceSecondResult: 'interview' } } }),
  event('cs-interview', '2027年4月', 'library', 'computer', '面试', '面试通知在电脑上，准备出发。', {
    start: { speaker: '候考区 · 工作人员', lines: ['下一位。'], presentation: 'waiting', choices: act('走进面试室', 'sequence:entrance') },
    q1: { speaker: '面试官', presentation: 'interview', lines: ['社区活动开始前，临时到场的人很多，工作人员不足。你会怎么处理？'], choices: [
      { id: 'civil-capacity', text: '先确认容量和安全，调整分工，分批进入。', next: 'capacity' }, { id: 'civil-admit', text: '先让大家进入，再在现场调整。', next: 'admit' }, { id: 'civil-cancel', text: '先取消活动，另约时间。', next: 'cancel' },
    ] },
    capacity: { speaker: '面试官', presentation: 'interview', lines: ['可以，接下来怎么向等候的人说明安排？我们再看另一种情况。'], next: 'q2' },
    admit: { speaker: '面试官', presentation: 'interview', lines: ['如果现场已经拥挤，你准备怎样控制入口？我们再看另一种情况。'], next: 'q2' },
    cancel: { speaker: '面试官', presentation: 'interview', lines: ['你会根据什么判断必须取消？我们再看另一种情况。'], next: 'q2' },
    q2: { speaker: '面试官', presentation: 'interview', lines: ['和同事共同做一项任务，临近截止才发现双方理解不一致。你会怎么办？'], choices: [
      { id: 'civil-align', text: '先核对交付目标，分清差异，再重排分工。', next: 'align' }, { id: 'civil-deliver', text: '先做出可交付部分，同时说明分歧。', next: 'deliver' }, { id: 'civil-ask', text: '带上两份方案，请负责人明确取舍。', next: 'ask' },
    ] },
    align: { speaker: '面试官', presentation: 'interview', lines: ['你把目标放在前面。沟通时也别忘了留出修改时间。'], next: 'end' },
    deliver: { speaker: '面试官', presentation: 'interview', lines: ['先交付一部分，哪些差异需要提前说明？这个思路我们了解了。'], next: 'end' },
    ask: { speaker: '面试官', presentation: 'interview', lines: ['请示前整理差异，能让讨论更具体。这个思路我们了解了。'], next: 'end' },
    end: { speaker: '工作人员', presentation: 'interview', lines: ['面试结束。请带好随身物品。'], choices: act('离开面试室', 'sequence:wait') },
    passed: { speaker: '手机 · 面试结果', lines: ['面试通过'], next: 'really' },
    really: { speaker: '余小迟', lines: ['……', '真的？'], choices: act('查看后续通知', 'sequence:formalities') },
  }, 'cs-first-day', { choices: Object.fromEntries(['capacity', 'admit', 'cancel', 'align', 'deliver', 'ask'].map(id => [`civil-${id}`, { civilInterviewAnswer: id }])), sequences: {
    entrance: { steps: [{ title: '', text: '', seconds: .6, presentation: 'black' }], next: 'q1' },
    wait: { steps: [{ title: '过了些日子', text: '手机亮了。', seconds: 1 }], next: 'passed' },
    formalities: { steps: [{ title: '综合成绩', text: '进入体检、考察环节。', seconds: 3 }, { title: '体检通过', text: '下一份材料正在准备。', seconds: 3 }, { title: '考察完成', text: '相关情况已核查。', seconds: 3 }, { title: '拟录用公示', text: '公示期结束。报到通知已送达。', seconds: 3 }] },
  }, effects: { set: { civilServiceInterviewResult: 'passed', currentMonth: '2027年7月', location: 'dorm' }, finalJobFromSelection: true } }),
  event('cs-first-day', '2027年7月', 'any', 'phone', '第一天', '报到的早晨。', {
    start: { speaker: '毕业以后 · 早晨', presentation: 'morning', lines: ['小迟站在镜子前，扶正眼镜。深海军蓝双肩包，还是那一只。'], choices: act('出门', 'sequence:morning') },
    door: { speaker: '{{civilServiceFinalJob}}', presentation: 'door', lines: ['……'], next: 'friend' },
    friend: { speaker: '朋友 · 手机消息', presentation: 'door', lines: ['第一天？'], next: 'yes' },
    yes: { speaker: '余小迟', presentation: 'door', lines: ['嗯。'], next: 'nervous' },
    nervous: { speaker: '朋友', presentation: 'door', lines: ['紧张吗？'], next: 'a-little' },
    'a-little': { speaker: '余小迟', presentation: 'door', lines: ['有点。'], choices: act('走进去', 'sequence:enter') },
  }, null, { trigger: 'auto', sequences: {
    morning: { steps: [{ title: '早晨', text: '背好包，出门。', seconds: 2, presentation: 'morning' }], next: 'door' },
    enter: { steps: [{ title: '{{civilServiceFinalJob}}', text: '余小迟，2027。', seconds: 3, presentation: 'enter' }] },
  }, effects: { set: { chapterComplete: true } } }),
];
