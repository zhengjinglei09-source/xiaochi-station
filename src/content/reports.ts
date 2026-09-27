import type { ChapterState } from '../systems/events';
import { schoolName, regionName } from './abroad-data';
export interface ReportEntry { label: string; value?: string }
export interface ReportContent { facts: ReportEntry[]; choices: ReportEntry[]; outcome: string }
export function buildReport(s: ChapterState): ReportContent {
  const facts: ReportEntry[] = [], choices: ReportEntry[] = [];
  const did = (id: string) => s.completed.includes(id);
  const fact = (condition: unknown, label: string, value?: string) => { if (condition) facts.push({label, ...(value ? {value} : {})}); };
  const choice = (label: string, value?: string) => { if (value) choices.push({label,value}); };
  let outcome = '';
  switch (s.currentRoute) {
    case 'employment':
      fact(did('applications'), '海投过简历', s.applicationCount > 0 ? `${s.applicationCount}份` : undefined);
      fact(did('mail'), '收到过拒信，也收到过面试邀请');
      fact(did('assessment'), '做过一次企业测评');
      fact(did('friend'), '听朋友说过一次：“没有HC”');
      fact(did('preparation') && s.interviewPrepChoice === 'self', '和ChatGPT模拟过面试');
      fact(did('interview'), '参加过面试');
      choice('最初投递的方向', [s.targetIndustry,s.targetRole].filter(Boolean).join(' · '));
      choice('面试准备方式', ({self:'自己准备',coaching:'求职陪跑'} as Record<string,string>)[s.interviewPrepChoice]);
      outcome = did('result') ? '通过本轮面试，等待后续安排。秋招还在继续。' : '社畜号 · 第一章结束'; break;
    case 'postgrad':
      fact(did('pg-memory'), '背过，又重新背过');
      fact(did('pg-english'), '做过英语阅读，经历过“5个错5个”');
      fact(did('pg-english'), '翻过三张高频词便签');
      fact(did('pg-exam'), '参加了十二月初试');
      choice('当时想考的学校', ({reach:'想冲一冲的学校',match:'比较匹配的学校',steady:'相对稳妥的学校'} as Record<string,string>)[s.postgradTarget ?? '']);
      choice('十月的时候', s.postgradOctoberChoice === 'continue' ? '再坚持一下。' : s.postgradOctoberChoice === 'stop' ? '我不想继续了。' : undefined);
      outcome = s.postgradOctoberChoice === 'stop' ? '十月的时候，决定不继续考了。' : s.postgradResult === 'retest' && did('pg-result') ? '进入复试' : '这一阶段结束了。'; break;
    case 'civil_service':
      fact(did('cs-quiz'), '做过限时行测'); fact(did('cs-essay'), '读过材料，提炼过问题和措施');
      fact(did('cs-national'), '参加了第一次考试', s.civilServiceFirstResult === 'not_interview' ? '第一次没有进入面试' : undefined);
      fact(did('cs-strategy'), '后来又报了一次，参加了第二次考试');
      fact(s.civilServiceSecondResult === 'interview', '进入面试');
      fact(s.civilServiceInterviewResult === 'passed', '参加面试，走过后续录用流程');
      choice('第一次选择的岗位', s.civilServiceFirstJob); choice('第二次选择的岗位', s.civilServiceSecondJob);
      outcome = s.civilServiceFinalJob ? `进入：${s.civilServiceFinalJob}` : '编制号 · 到站'; break;
    case 'abroad': {
      choice('申请地区', regionName(s.abroadRegion));
      choice('申请方式', ({diy:'DIY',agency:'中介'} as Record<string,string>)[s.abroadApplicationMethod ?? '']);
      const language = [s.abroadIELTSAttempts && s.abroadIELTSAttempts > 0 ? `考了${s.abroadIELTSAttempts}次` : '',s.abroadIELTSScore && s.abroadIELTSScore > 0 ? `最后成绩 ${s.abroadIELTSScore.toFixed(1)}` : ''].filter(Boolean).join(' · ');
      fact(language, 'IELTS', language);
      const applied = [...new Set(s.abroadAppliedSchools ?? [])].filter(id => schoolName(id));
      const offers = applied.filter(id => s.abroadApplicationResults?.[id] === 'offer').length;
      fact(applied.length, '提交过申请', `${applied.length}所学校${offers ? ` · 收到${offers}份Offer` : ''}`);
      fact(s.abroadRecommendationReceived, '找老师要过推荐信');
      fact(did('ab-documents') && s.abroadApplicationMethod === 'diy', '整理过一桌子的“最终版”');
      fact(did('ab-parcel'), '等申请结果时，被快递通知骗过一次');
      outcome = schoolName(s.abroadAcceptedSchool) ? `接受了 ${schoolName(s.abroadAcceptedSchool)} 的Offer。留子号 · 到站` : '留子号 · 到站'; break;
    }
    case 'gap': {
      const labels: Record<string,string> = {sleep:'睡过懒觉',walk:'出去走走',phone:'刷过手机',part_time:'做过兼职',learn:'学了点东西',project:'做点自己的东西',play:'玩过一会儿',idle:'发过呆',drink:'买过饮料',browse:'逛过小店'};
      const actions = Object.keys(labels).filter(id => (s.gapActionCounts?.[id] ?? 0) > 0 || s.gapActions?.includes(id));
      fact(actions.length, '这一阵子', actions.map(id => labels[id]).join('、'));
      fact(did('gap-dinner'), '和朋友吃过饭');
      fact(s.gapExperiment === 'project' && did('gap-experiment'), '做过一个叫untitled_project的东西');
      fact(did('gap-graduation'), '毕业季，送朋友离开校园');
      fact(s.gapTravelStarted, '毕业以后，出去旅行了');
      choice('朋友问：“小迟你呢？”', ({gap:'我Gap一下。',thinking:'还没想好。',project:'最近在做点自己的东西。',unknown:'不知道。'} as Record<string,string>)[s.gapSelfDescription ?? '']);
      choice('后来试过', ({work:'短期实习 / 兼职',walk:'出去走走',learn:'学点东西',project:'做自己的项目'} as Record<string,string>)[s.gapExperiment ?? '']);
      choice('旅行方式', ({seaside:'海边',mountain:'山里',city:'陌生城市',random:'没有目的地'} as Record<string,string>)[s.gapTravelStyle ?? '']);
      outcome = s.gapTravelStarted ? '旅行中' : '这一段时间，就记录到这里。'; break;
    }
  }
  return { facts, choices, outcome };
}
