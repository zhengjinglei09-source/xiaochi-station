import type { StoryEvent, ChapterState } from '../systems/events';
import type { DialogueNode } from '../systems/dialogue';
import type { ActivityDefinition } from '../systems/activity';
import { regions, schools, schoolName, regionName, applicationResults, documentDesktop } from './abroad-data';
const act = (text: string, action: string) => [{ id: action, text, action }];
const done = (text = '收起手机') => act(text, 'complete');
const card = (title: string, field: ActivityDefinition['field'], options: ActivityDefinition['options'], next: string, submit = '就这个吧', multi = false): ActivityDefinition => ({ title, field, options, next, submit, kind: multi ? 'multi' : 'single', min: multi ? 2 : 1, max: multi ? 2 : 1, storeIds: true });
const values = (s: ChapterState) => ({ abroadRegion: regionName(s.abroadRegion), abroadAcceptedSchool: schoolName(s.abroadAcceptedSchool), abroadAppliedSchools: s.abroadAppliedSchools?.map(schoolName).join('\n') ?? '' });
const event = (id: string, month: string, location: StoryEvent['location'], target: string, title: string, hint: string, nodes: Record<string, DialogueNode>, nextEvent: string | null, extra: Partial<StoryEvent> = {}): StoryEvent => ({
  id, route: 'abroad', chapter: 1, month, location, target, title, hint, trigger: target === 'phone' ? 'phone' : 'object', dialogue: { id, start: 'start', nodes }, nextEvent, ...extra,
  resolve: s => ({ textValues: values(s), ...extra.resolve?.(s) }),
});
const packages = [{ id:'basic', label:'基础申请服务 · ¥8,800', detail:'游戏中的虚构价格示例\n选校信息整理 · 材料检查 · 申请递交' }, { id:'full', label:'全程申请服务 · ¥16,800', detail:'游戏中的虚构价格示例\n申请规划 · 文书协助 · 材料检查 · 申请递交' }];
function resultEvent(index: number): StoryEvent {
  const id = index ? 'ab-result-2' : 'ab-result-1';
  return event(id, '2027年3月', 'any', 'phone', 'Application Status Updated', '叮——Application Status Updated', { start: {speaker:'邮箱',lines:['Application Status Updated']} }, index ? 'ab-accept' : 'ab-result-2', {
    freeExploreSeconds: index ? 0 : 3,
    resolve: s => {
      const school = s.abroadAppliedSchools?.[index] ?? '', result = s.abroadApplicationResults?.[school] ?? 'offer';
      const offer = result === 'offer';
      return { dialogue: { id, start:'start', nodes: {
        start: { speaker: schoolName(school), lines:['Application Status Updated'], choices: act('打开这封邮件', 'sequence:loading') },
        result: { speaker: schoolName(school), lines: offer ? ['Congratulations...', 'Offer of Admission'] : result === 'reject' ? ['Unfortunately...', 'Application unsuccessful.'] : ['Application on waitlist.'], next: 'reaction' },
        reaction: {speaker:'余小迟',lines:[offer ? '？' : '哦。'], ...(offer ? {next:'friend'} : {choices:done()})},
        friend:{speaker:'朋友',lines:['你申到了？？？'],next:'yes'}, yes:{speaker:'余小迟',lines:['……','好像是。'],choices:done()},
      } }, sequences: { loading: { steps:[{title:'Loading…',text:schoolName(school),seconds:1}],next:'result'} } };
    },
  });
}
export const abroadEvents: readonly StoryEvent[] = [
  event('ab-arrival','2026年9月','campus','phone','宿舍的电脑','回宿舍，打开电脑。',{
    start:{speaker:'2026年9月',lines:['宿舍的电脑亮着。']},
  },'ab-plan',{trigger:'auto',effects:{set:{location:'dorm'}}}),
  event('ab-plan','2026年9月','dorm','computer','所以……去哪？','电脑上开着申请页面。',{
    start:{speaker:'余小迟',lines:['所以……','去哪？'],choices:act('选择申请地区','activity:regions')},
    method:{speaker:'朋友',lines:['你准备自己申吗？'],choices:act('想想申请方式','activity:method')},
    'method-route':{speaker:'申请准备',lines:['……'],choices:act('打开电脑','sequence:tabs')},
    website:{speaker:'虚构大学 · Admissions',lines:['找到申请截止时间。'],choices:[
      {id:'programme',text:'Programme',next:'programme'}, {id:'requirements',text:'Entry Requirements',next:'requirements'}, {id:'fees',text:'Tuition Fees',next:'fees'}, {id:'deadline',text:'Application Deadline',next:'deadline'}, {id:'contact',text:'Contact',next:'contact'},
    ]},
    programme:{speaker:'Programme',lines:['课程介绍、项目结构。截止时间不在这里。'],next:'website'},
    requirements:{speaker:'Entry Requirements',lines:['申请材料与语言要求。'],next:'website'}, fees:{speaker:'Tuition Fees',lines:['学费与付款说明。'],next:'website'},contact:{speaker:'Contact',lines:['Admissions Office 联系方式。'],next:'website'},
    deadline:{speaker:'Application Deadline',lines:['Deadline：12月15日\n（游戏中的虚构日期）'],next:'found'},found:{speaker:'余小迟',lines:['找到了。'],choices:done('记下来，准备语言成绩。')},
    region:{speaker:'余小迟',lines:['{{abroadRegion}}。'],next:'budget'},budget:{speaker:'顾问',lines:['预算大概是多少？','我们这边有两个方案。'],choices:act('看看服务内容','activity:packages')},
    price:{speaker:'余小迟',lines:['……'],choices:done('好，语言成绩先自己准备。')},
  },'ab-ielts',{
    activities:{ regions:card('选择申请地区','abroadRegion',regions,'method','就这里吧'), method:card('申请方式','abroadApplicationMethod',[{id:'diy',label:'自己DIY',detail:'省下一笔中介费，但很多事情要自己研究。'},{id:'agency',label:'找中介',detail:'有人帮忙盯流程，但要花一笔钱，也还是得自己做决定。'}],'method-route'), packages:card('顾问方案 · 虚构价格示例','abroadAgencyPackage',packages,'price') },
    sequences:{tabs:{steps:[{title:'1 个标签页',text:'申请材料有哪些',seconds:1},{title:'4 个标签页',text:'PS怎么写 · CV模板',seconds:1},{title:'8 个标签页',text:'推荐信要几封 · Deadline在哪里看',seconds:1},{title:'13 个标签页',text:'conditional offer是什么意思\n余小迟：“……”',seconds:2}],next:'website'}},
    resolve:s => s.abroadApplicationMethod === 'agency' ? { dialogue:{ id:'ab-plan',start:'method-route',nodes:{...abroadPlanNodes(), 'method-route':{speaker:'顾问',lines:['比较想申请哪个地区？'],next:'region'}}} } : {},
    effects:{set:{currentMonth:'2026年10月'}},
  }),
  event('ab-ielts','2026年10月','library','computer','IELTS','去图书馆电脑前，打开语言练习。',{
    start:{speaker:'Language Requirement',lines:['IELTS：目标 7.0'],choices:act('开始视觉听力模拟','sequence:listening')},
    quiz:{speaker:'IELTS · 体验练习',lines:['Listening / Reading / Vocabulary'],choices:act('开始练习','quiz')},
    first:{speaker:'成绩查询',lines:['IELTS · Overall：6.5'],next:'half'},half:{speaker:'余小迟',lines:['差0.5。'],choices:act('继续准备','sequence:second')},
    second:{speaker:'IELTS',lines:['Overall：6.5'],next:'again'},again:{speaker:'余小迟',lines:['？','怎么还是你。'],choices:[{id:'ab-third',text:'再考一次。还是想再试一次。',action:'sequence:third'},{id:'ab-apply',text:'先申请。先把申请往前推。',action:'complete'}]},
    third:{speaker:'IELTS',lines:['Overall：7.0'],next:'seven'},seven:{speaker:'余小迟',lines:['？','7？？？'],choices:done('回去整理申请材料。')},
  },'ab-documents',{
    quizState:'abroadIELTSQuizResult',afterQuiz:'first', optionalMiniGame:{id:'ielts-experience',questions:[
      {id:'listening',category:'Listening · 视觉模拟',text:'The library will close at ______ on Friday.',options:['5:15','5:50','6:15'],answer:0,explanation:'公告中的 five fifteen 是5:15。'},
      {id:'reading',category:'Reading',text:'The team planned outdoor workshops. After residents asked for evening sessions, they moved the workshops indoors.\nWhy did the project change?',options:['Residents wanted evening sessions.','The team lost its funding.','The project had ended.'],answer:0,explanation:'居民希望增加晚间活动。'},
      {id:'word',category:'Vocabulary',text:'The schedule is flexible.\n“flexible”在这里是什么意思？',options:['固定不变的','可灵活调整的','取消的'],answer:1,explanation:'flexible：可以灵活调整的。'},
    ],completion:{speaker:'练习结束',lines:['关掉练习页，去参加考试。'],button:'查询第一次成绩'}},
    sequences:{listening:{steps:[{title:'公告字幕 · 视觉模拟',text:'The library will close at five fifteen on Friday.',seconds:6}],next:'quiz'},second:{steps:[{title:'单词 · 阅读',text:'咖啡放凉了。',seconds:4},{title:'继续刷题',text:'又去了一次考场。',seconds:4},{title:'Loading…',text:'IELTS',seconds:2}],next:'second'},third:{steps:[{title:'单词 · 阅读 · 咖啡',text:'日历又翻了几页。',seconds:4},{title:'考场',text:'收好证件。',seconds:3},{title:'Loading…',text:'IELTS',seconds:2}],next:'third'}},
    choices:{'ab-third':{set:{abroadIELTSAttempts:3,abroadIELTSScore:7}},'ab-apply':{set:{abroadIELTSAttempts:2,abroadIELTSScore:6.5}}},
    effects:{set:{currentMonth:'2026年11月',location:'dorm'}},
  }),
  event('ab-documents','2026年11月','dorm','computer','申请材料','电脑桌面上堆着申请文件。',{
    start:{speaker:'申请系统',lines:['CV、PS、成绩单、语言成绩、推荐信。'],choices:act('整理文件，开始上传','documents')},
    missing:{speaker:'余小迟',lines:['……','推荐信。'],choices:done('去校园里联系老师。')},
  },'ab-teacher',{resolve:s=>({documents:documentDesktop(s)})}),
  event('ab-teacher','2026年11月','campus','phone','推荐信','走到校园，给老师发条消息。',{
    start:{speaker:'给老师的消息',lines:['开头要怎么写？'],choices:[
      {id:'teacher-a',text:'老师您好，我最近正在准备留学申请，想请问您是否方便帮我写一封推荐信？',next:'okay'},
      {id:'teacher-b',text:'老师您好！我最近在申请学校，可以麻烦您帮我写一封推荐信吗？',next:'okay'},
      {id:'teacher-c',text:'老师老师！江湖救急😭',next:'question'},
    ]},
    question:{speaker:'老师',lines:['？'],next:'explain'},explain:{speaker:'余小迟',lines:['……','老师您好，我正在准备留学申请，想请您帮忙写一封推荐信。'],next:'okay'},
    okay:{speaker:'老师',lines:['可以。','把你的CV、申请方向和Deadline发我。'],next:'deadline'},deadline:{speaker:'申请截止时间',lines:['3天后'],next:'dot'},dot:{speaker:'余小迟',lines:['。'],choices:act('把资料发给老师','sequence:letter')},
    received:{speaker:'老师',lines:['发你邮箱了。'],choices:done('回电脑前下载附件。')},
  },'ab-final-document',{choices:Object.fromEntries(['a','b','c'].map(id=>[`teacher-${id}`,{set:{abroadRecommendationChoice:id}}])),sequences:{letter:{steps:[{title:'过了两天',text:'手机：叮——',seconds:3}],next:'received'}},effects:{set:{abroadRecommendationReceived:true}}}),
  event('ab-final-document','2026年11月','dorm','computer','最后一份材料','邮件附件已经出现在电脑桌面。',{
    start:{speaker:'下载完成',lines:['Recommendation_Letter.pdf'],choices:act('把推荐信放进申请系统','documents')},
    finally:{speaker:'申请系统',lines:['All required documents uploaded.'],next:'done'},done:{speaker:'余小迟',lines:['终于。'],choices:done('CONTINUE TO APPLICATION')},
  },'ab-schools',{resolve:s=>({documents:documentDesktop(s,true)})}),
  event('ab-schools','2026年11月','dorm','computer','选择学校','申请材料齐了，看看学校。',{
    start:{speaker:'选择学校 · 全部虚构',lines:['选择2所学校提交申请。'],choices:act('看看学校卡片','activity:schools')},
    selected:{speaker:'申请列表',lines:['{{abroadAppliedSchools}}'],choices:[{id:'review-submit',text:'SUBMIT APPLICATIONS',next:'confirm'}]},
    confirm:{speaker:'Are you sure?',lines:['{{abroadAppliedSchools}}'],choices:act('SUBMIT','sequence:submit')},
  },'ab-wait',{freeExploreSeconds:6,resolve:s=>({activities:{schools:card(`${regionName(s.abroadRegion)} · 虚构学校`,'abroadAppliedSchools',schools.filter(v=>v.region===s.abroadRegion).map(v=>({id:v.id,label:v.displayName,detail:`${v.location} · ${v.costHint}\n${v.programHint}\n${v.courseHint}`})),'selected','提交这两所',true)},effects:{set:{abroadApplicationResults:applicationResults(s.abroadAppliedSchools??[],s.resultSeed??.5),location:'campus',currentMonth:'2027年1月'}}}),sequences:{submit:{steps:[{title:'Submitting…',text:'两份申请正在递交。',seconds:2},{title:'Applications submitted.',text:'合上电脑，出去走走。',seconds:2}]}}}),
  event('ab-wait','2027年1月','campus','friend','等','朋友在校园路边。',{
    start:{speaker:'朋友',lines:['有结果了吗？'],next:'no'},no:{speaker:'余小迟',lines:['没有。'],choices:done('再走一会儿。')},
  },'ab-parcel',{freeExploreSeconds:5,effects:{set:{currentMonth:'2027年2月'}}}),
  event('ab-parcel','2027年2月','any','phone','叮——','叮——一条新通知。',{
    start:{speaker:'手机通知',lines:['您的快递已发出'],next:'reaction'},reaction:{speaker:'余小迟',lines:['……'],choices:done()},
  },'ab-result-1',{freeExploreSeconds:6,effects:{set:{currentMonth:'2027年3月'}}}),
  resultEvent(0),resultEvent(1),
  event('ab-accept','2027年3月','any','phone','最终去向','Offer还在邮箱里，决定去哪。',{
    start:{speaker:'选择最终去向',lines:['{{abroadRegion}}'],choices:act('查看可接受的Offer','activity:offers')},
    confirm:{speaker:'{{abroadAcceptedSchool}}',lines:['{{abroadRegion}}'],choices:act('ACCEPT OFFER','sequence:accept')},
  },'ab-pack',{resolve:s=>({activities:{offers:card('选择最终去向','abroadAcceptedSchool',schools.filter(v=>s.abroadApplicationResults?.[v.id]==='offer').map(v=>({id:v.id,label:v.displayName,detail:`${v.location} · ${v.programHint}`})),'confirm','选择这份Offer')}}),sequences:{accept:{steps:[{title:'Accepting…',text:'{{abroadAcceptedSchool}}',seconds:1},{title:'Offer accepted.',text:'{{abroadRegion}}',seconds:2}]}},effects:{set:{currentMonth:'2027年7月',location:'dorm'}}}),
  event('ab-pack','2027年7月','dorm','computer','收拾行李','毕业了，收拾行李。',{
    start:{speaker:'毕业 · 宿舍',presentation:'packing',lines:['行李箱打开了。'],choices:act('收拾行李','sequence:pack')},
    weight:{speaker:'行李秤',presentation:'packing',lines:['23.0 kg'],next:'one'},one:{speaker:'余小迟',presentation:'packing',lines:['……'],choices:act('再塞一件','sequence:extra')},
    heavier:{speaker:'行李秤',presentation:'packing-extra',lines:['23.8 kg'],choices:act('默默拿出来','sequence:leave')},
  },null,{sequences:{pack:{steps:[{title:'衣服 · 书',text:'折好，压一压。',seconds:3,presentation:'packing'},{title:'充电器 · 文件 · 生活用品',text:'拉上箱子。',seconds:3,presentation:'packing'}],next:'weight'},extra:{steps:[{title:'再称一次',text:'',seconds:2,presentation:'packing-extra'}],next:'heavier'},leave:{steps:[{title:'23.0 kg',text:'',seconds:2,presentation:'packing'},{title:'{{abroadAcceptedSchool}}',text:'{{abroadRegion}}',seconds:4,presentation:'depart'}]}},effects:{set:{chapterComplete:true}}}),
];
// This returns the base nodes only; the generic event resolver never duplicates a route engine.
function abroadPlanNodes() { return abroadEvents.find(e=>e.id==='ab-plan')!.dialogue.nodes; }
