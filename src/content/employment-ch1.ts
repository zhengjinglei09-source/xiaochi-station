import type { StoryEvent, Effect } from '../systems/events';
import type { DialogueNode } from '../systems/dialogue';
const done = (text: string) => [{ id: 'finish', text, action: 'complete' }];
const event = (id: string, title: string, location: StoryEvent['location'], trigger: StoryEvent['trigger'], target: string,
  hint: string, nodes: Record<string, DialogueNode>, nextEvent: string | null, extra: Partial<StoryEvent> = {}): StoryEvent =>
  ({ id, route: 'employment', chapter: 1, month: '2026年9月', location, trigger, target, title, hint, dialogue: { id, start: 'start', nodes }, nextEvent, ...extra });
const industries = ['互联网', '国企 / 央企', '金融', '半导体', '外企'];
const roles = ['产品', '运营', '市场', '内容'];
const selectionEffects: Record<string, Effect> = {};
industries.forEach((value, i) => selectionEffects[`industry-${i}`] = { set: { targetIndustry: value } });
roles.forEach((value, i) => selectionEffects[`role-${i}`] = { set: { targetRole: value } });
export const employmentChapter: readonly StoryEvent[] = [
  event('arrival', '秋招开始了。', 'campus', 'auto', 'arrival', '电脑好像有新东西。', {
    start: { speaker: '2026年9月', lines: ['秋招开始了。', '大四的第一周。课表空了一点，群消息多了很多。'], next: 'campus' },
    campus: { speaker: '余小迟', lines: ['宿舍电脑还开着，招聘页面已经刷出来了。', '先回去看看。路上经过的图书馆，好像也比上学期满了。'], choices: done('走进校园') },
  }, 'applications'),
  event('applications', '我投什么？', 'dorm', 'object', 'computer', '宿舍的电脑开着。', {
    start: { speaker: '招聘入口', lines: ['27届秋招 · 第一批岗位已开放。', '公司名字一排排滑过去。先挑一个想了解的方向，之后仍然可以改变。'], next: 'industry' },
    industry: { speaker: '先看看哪个行业？', lines: ['这只是第一次投递的方向。'], choices: industries.map((text, i) => ({ id: `industry-${i}`, text, next: 'role' })) },
    role: { speaker: '岗位方向', lines: ['相似的岗位名称，写着不太一样的工作内容。先从哪一种开始？'], choices: roles.map((text, i) => ({ id: `role-${i}`, text, next: 'cv' })) },
    cv: { speaker: '余小迟', lines: ['教育经历、校园项目、实习经历……简历终于塞进了一页。', '文件名：余小迟_简历_最终版_真的最终版.pdf'], choices: [{ id: 'send-1', text: '选好第一批，投递。', next: 'batch1' }] },
    batch1: { speaker: '投递记录', lines: ['已投递 7 份 → 23 份', '每个平台都要重新填一次教育经历。复制、粘贴，上传，再确认。'], choices: [{ id: 'send-2', text: '换一批岗位，再投。', next: 'batch2' }] },
    batch2: { speaker: '几天后的投递记录', lines: ['已投递 58 份 → 103 份', '“该岗位已投递。”这行字开始有点眼熟。'], choices: [{ id: 'send-3', text: '整理剩下的岗位，提交。', next: 'batch3' }] },
    batch3: { speaker: '投递记录', lines: ['已投递 156 份 → 200 份', '几个晚上，被压进一张发送完成的页面。', '手机亮了。不是验证码。'], choices: done('先看看手机。') },
  }, 'mail', { choices: selectionEffects, effects: { set: { applicationCount: 200 } } }),
  event('mail', '邮件响了', 'any', 'phone', 'phone', '叮——手机有新邮件。', {
    start: { speaker: '收件箱 · 叮——', lines: ['3 封招聘邮件。标题都只显示了一半。'], choices: [{ id: 'mail-1', text: '打开第一封', next: 'rejection1' }] },
    rejection1: { speaker: '招聘团队', lines: ['感谢您对本公司的关注。很遗憾，经过综合评估，本次暂不推进您的申请。', '余小迟：“嗯，至少回了。”'], choices: [{ id: 'mail-2', text: '叮——再打开一封', next: 'rejection2' }] },
    rejection2: { speaker: '另一家招聘团队', lines: ['感谢您的投递。您的经历与本岗位现阶段需求未完全匹配。', '两个公司的措辞，像同一个人写的。'], choices: [{ id: 'mail-3', text: '打开第三封', next: 'pool' }] },
    pool: { speaker: '人才库通知', lines: ['您的简历已进入人才池，后续有合适机会我们将主动联系。', '余小迟：“什么时候轮到双非上桌。”'], next: 'invite' },
    invite: { speaker: '新邮件 · 下一轮通知', lines: ['恭喜您进入下一轮！请先完成线上测评，我们将在测评后安排首次面试。', '方向：{{targetIndustry}} · {{targetRole}}。', '这次终于不是“感谢”。小迟把测评链接转存到了图书馆电脑。'], choices: done('去图书馆找台电脑。') },
  }, 'assessment'),
  event('assessment', '企业测评', 'library', 'object', 'computer', '图书馆电脑上有测评链接。', {
    start: { speaker: '线上测评', lines: ['数字推理、图形推理、言语理解、资料分析。', '余小迟：“我就是不考公才来秋招的，怎么一打开全是行策 ᗜ - ᗜꐦ.........”', '先做这三题。答完就可以继续，不必重来。'], choices: [{ id: 'start-quiz', text: '打开测评', action: 'quiz' }] },
  }, 'friend', { optionalMiniGame: { id: 'assessment-01', questions: [
    { id: 'pattern', category: '图形 / 逻辑', text: '图案依次是：○ △ ○ △ ○ ？\n下一格是什么？', options: ['△', '○', '□'], answer: 0, explanation: '圆与三角交替出现。' },
    { id: 'reading', category: '言语理解', text: '“试点期间，使用率提高，但样本有限，尚不能判断长期效果。”\n哪种表述更贴近原文？', options: ['长期效果已经得到证明', '短期有变化，长期还需观察', '试点没有任何参考意义'], answer: 1, explanation: '原文只说短期使用率提高，长期效果还要观察。' },
    { id: 'numbers', category: '资料 / 数字', text: '某活动报名人数从 80 人增至 100 人。\n增加了原来人数的多少？', options: ['20%', '25%', '40%'], answer: 1, explanation: '增加 20 人，20 ÷ 80 = 25%。' },
  ] } }),
  event('friend', '朋友的转正答辩', 'campus', 'npc', 'friend', '朋友在校园长椅旁等你。', {
    start: { speaker: '朋友', lines: ['答辩结束了。', '刚刚 HR 告诉我……', '今年没有 HC。'], next: 'reply' },
    reply: { speaker: '朋友', lines: ['PPT 改到昨晚两点，最后一页还是“未来工作规划”。'], choices: [
      { id: 'friend-comfort', text: '你已经做得很好了。', next: 'comfort' },
      { id: 'friend-plan', text: '那你接下来准备怎么办？', next: 'plan' },
      { id: 'friend-food', text: '……要不要先去吃饭？', next: 'food' },
    ] },
    comfort: { speaker: '朋友', lines: ['谢谢。就是觉得，答辩前是不是就已经没有名额了。', '既然没有hc，我准备离职了，开始all in秋招吧。'], next: 'bye' },
    plan: { speaker: '朋友', lines: ['把实习经历写回简历，再投吧。', '至少这次不用从空白文档开始。'], next: 'bye' },
    food: { speaker: '朋友', lines: ['走。今天不想再听“未来规划”四个字了。', '食堂那个窗口，过点也不一定有饭。这个倒是确定的。'], next: 'bye' },
    bye: { speaker: '余小迟', lines: ['两个人在长椅边站了一会儿，群里又弹出一条内推消息。', '你的面试时间也确定了。图书馆那张桌子，还空着。'], choices: done('去准备自己的面试。') },
  }, 'preparation', { choices: {
    'friend-comfort': { set: { friendReply: '你已经做得很好了。' } }, 'friend-plan': { set: { friendReply: '那你接下来准备怎么办？' } }, 'friend-food': { set: { friendReply: '……要不要先去吃饭？' } },
  } }),
  event('preparation', '第一次面试，要怎么准备？', 'library', 'object', 'reading', '去图书馆的自习桌准备面试。', {
    start: { speaker: '面试日程', lines: ['第一次面试，就在这周。', '电脑里开着岗位 JD，旁边是一则求职陪跑广告。'], choices: [
      { id: 'prep-self', text: '自己准备', next: 'jd' }, { id: 'prep-coach', text: '看看求职陪跑', next: 'ad' },
    ] },
    ad: { speaker: '秋招全程陪跑 · Offer冲刺', lines: ['大厂前 HR 1V1。定制方案，面试直达。', '¥6,999。当前可用余额：¥8,000。'], choices: [
      { id: 'buy-coach', text: '购买陪跑 · ¥6,999', next: 'delivery' }, { id: 'skip-coach', text: '关掉，还是自己来。', next: 'jd' },
    ] },
    delivery: { speaker: '已购买 · 余额 ¥1,001', lines: ['余额 -¥6,999。', '《互联网黑话大全.pdf》\n《面试必问100题.pdf》\n老师微信语音 ×1', '语音：“把你的项目经历再梳理一下，面试时自信一点。”'], next: 'receipt' },
    receipt: { speaker: '余小迟', lines: ['？', '翻了几页 PDF，目录里的“定制”看起来很通用。', '面试链接已经发来。该讲什么，还是得自己想。'], choices: done('回宿舍参加面试。') },
    jd: { speaker: '拆 JD · 先标记一个重点', lines: ['【用户需求】  【数据分析】\n【跨团队协作】  【AI产品理解】', '这次想用哪段经历，串起自我介绍？'], choices: [
      { id: 'focus-users', text: '校园项目：从同学反馈里找需求。', next: 'intro' },
      { id: 'focus-data', text: '实习复盘：把数据变化说清楚。', next: 'intro' },
      { id: 'focus-team', text: '小组项目：和不同分工的人合作。', next: 'intro' },
    ] },
    intro: { speaker: '自我介绍草稿', lines: ['“我叫余小迟，2027 届毕业生。我想从一个具体项目说起……”', '把背景缩短，留下自己做的事、遇到的困难和仍然没解决的部分。'], choices: [{ id: 'mock-start', text: '开始 ChatGPT 模拟面试', next: 'mock' }] },
    mock: { speaker: 'ChatGPT · 预设模拟练习', lines: ['“项目最后效果不错。如果不由你来做，结果会有什么不同？”'], choices: [
      { id: 'mock-evidence', text: '说清我做过的验证和调整。', next: 'mock-end' },
      { id: 'mock-limit', text: '先说明团队贡献，再讲我的判断。', next: 'mock-end' },
    ] },
    'mock-end': { speaker: '余小迟', lines: ['怎么你也追问。', '把“参与了”改成具体动作，又删掉一行黑话。', '面试链接已经发来。回宿舍找个安静角落。'], choices: done('合上笔记，回宿舍。') },
  }, 'interview', { choices: {
    'prep-self': { set: { interviewPrepChoice: 'self' } }, 'skip-coach': { set: { interviewPrepChoice: 'self' } },
    'buy-coach': { set: { interviewPrepChoice: 'coaching' }, money: -6999 },
    'focus-users': { set: { jdFocus: '用户需求' } }, 'focus-data': { set: { jdFocus: '数据分析' } }, 'focus-team': { set: { jdFocus: '跨团队协作' } },
  } }),
  event('interview', '第一次面试', 'dorm', 'object', 'computer', '宿舍电脑收到面试链接。', {
    start: { speaker: '面试连接中', lines: ['摄像头打开前，小迟把桌上的纸杯往旁边挪了挪。', '“能听到吗？”\n“可以。”'], next: 'question' },
    question: { speaker: '面试官', lines: ['如果模型底层能力短期无法提升，但业务方仍然希望效果增长，你会怎么办？'], choices: [
      { id: 'interview-scope', text: '先缩小场景，明确最值得解决的用户问题。', next: 'scope' },
      { id: 'interview-data', text: '分析失败样本，从数据和流程里找改进空间。', next: 'data' },
      { id: 'interview-expect', text: '先对齐业务目标，试试产品流程和人工兜底。', next: 'expect' },
    ] },
    scope: { speaker: '面试官', lines: ['聚焦是一个方向。那暂时没覆盖的用户，怎么解释？'], next: 'follow' },
    data: { speaker: '面试官', lines: ['可以先找原因。如果这些样本并不代表真实使用呢？'], next: 'follow' },
    expect: { speaker: '面试官', lines: ['目标和流程都要考虑。人工兜底的成本，准备怎么算？'], next: 'follow' },
    follow: { speaker: '面试官', lines: ['资源只够做一个小实验，你会先如何判断它值不值得继续？'], choices: [
      { id: 'interview-test', text: '限定用户和时间，比较使用效果与成本。', next: 'test' },
      { id: 'interview-observe', text: '先看用户实际怎么用，再决定指标。', next: 'observe' },
      { id: 'interview-align', text: '和业务约定最低目标及停止实验的条件。', next: 'align' },
    ] },
    test: { speaker: '面试官', lines: ['好，那需要把实验范围交代清楚。我们先聊到这里。'], next: 'end' },
    observe: { speaker: '面试官', lines: ['观察有价值，也要留意时间窗口。我们先聊到这里。'], next: 'end' },
    align: { speaker: '面试官', lines: ['把停止条件说清楚也很重要。我们先聊到这里。'], next: 'end' },
    end: { speaker: '余小迟', lines: ['关掉会议以后，房间突然安静了。', '刚才第二个问题，好像还有另一种答法。', '先去图书馆还书吧。总盯着邮箱，也不会更快。'], choices: done('收起电脑，去图书馆。') },
  }, 'result', { choices: Object.fromEntries(['scope', 'data', 'expect', 'test', 'observe', 'align'].map(id => [`interview-${id}`, { interviewAnswer: id }])) }),
  event('result', '图书馆的晚上', 'library', 'phone', 'phone', '图书馆 · 晚上，手机亮了。', {
    start: { speaker: '手机 · 叮——', lines: ['几天后的晚上。图书馆还亮着灯。'], choices: [{ id: 'result-open', text: '打开邮件', next: 'message' }] },
    message: { speaker: '招聘团队', lines: ['恭喜您通过本轮面试，后续安排将另行通知。', '预祝您下一轮面试顺利'], next: 'xiaochi' },
    xiaochi: { speaker: '余小迟', lines: ['小迟把手机扣在桌上，给还没写完的笔记添了一行。', '“等后续。”'], next: 'october' },
    october: { speaker: '2026年10月', lines: ['秋招还在继续。'], choices: done('收起这个九月') },
  }, null, { effects: { set: { currentMonth: '2026年10月', chapterComplete: true } } }),
];
