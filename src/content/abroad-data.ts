import type { ChapterState } from '../systems/events';
import type { UploadDefinition } from '../systems/documents';
export const regions = [
  { id: 'us', label: '美国', detail: '选择很多，但申请准备也不少。' },
  { id: 'uk', label: '英国', detail: '学制相对紧凑，申请季也来得很快。' },
  { id: 'au', label: '澳大利亚', detail: '距离更远一些，生活会是新的开始。' },
  { id: 'hk', label: '中国香港', detail: '离家近一些，周末回家好像也不是不行。' },
];
export interface School { id: string; region: string; displayName: string; location: string; costHint: string; programHint: string; courseHint: string }
// Entirely fictional schools and city descriptions, without logos, rankings or likelihoods.
export const schools: School[] = [
  ['us-paperbridge','us','Paperbridge University','湖畔城市','生活成本偏高','公共传播与设计','项目讨论比较多'],
  ['us-cedarquay','us','Cedarquay Institute','西岸小城','日常开销中等','数字文化研究','小组实践与选修课'],
  ['us-cloudgrain','us','Cloudgrain University','内陆大学城','生活成本相对低','信息与社会','阅读、研讨和研究项目'],
  ['uk-mossquay','uk','Mossquay University','大城市','生活成本偏高','创意产业与传播','方向很感兴趣，工作坊较多'],
  ['uk-paperfen','uk','Paperfen University','小城市','生活成本相对低','数字服务设计','课程比较实用，项目制作较多'],
  ['uk-cloudmere','uk','Cloudmere Institute','大城市周边','日常开销中等','媒介与文化','课程设置喜欢，选修空间较多'],
  ['au-sunfold','au','Sunfold University','沿海城市','生活成本偏高','可持续设计','案例讨论与团队项目'],
  ['au-reedbay','au','Reedbay Institute','河畔小城','日常开销中等','社区与数字服务','实践课比较多'],
  ['au-paperreef','au','Paperreef University','城市外围','生活成本相对低','传播与社会','阅读研讨与毕业项目'],
  ['hk-starwharf','hk','星埠学院','城区','生活成本偏高','城市传播','项目密集，课堂讨论较多'],
  ['hk-cloudpier','hk','云汀大学','近海片区','日常开销中等','数字文化','跨方向选修与团队制作'],
  ['hk-reedhill','hk','苇山学院','山边校园','生活成本相对低','服务与社会','研究课与社区项目'],
].map(([id,region,displayName,location,costHint,programHint,courseHint]) => ({id,region,displayName,location,costHint,programHint,courseHint}));
export const schoolName = (id?: string) => schools.find(s => s.id === id)?.displayName ?? '';
export const regionName = (id?: string) => regions.find(r => r.id === id)?.label ?? '';
export function applicationResults(ids: string[], seed: number): Record<string, 'offer' | 'reject' | 'waitlist'> {
  const first = (['reject', 'offer', 'waitlist'] as const)[Math.min(2, Math.floor(Math.max(0, seed) * 3))];
  return Object.fromEntries(ids.map((id, i) => [id, i === 0 ? first : 'offer']));
}
export function documentDesktop(s: ChapterState, final = false): UploadDefinition {
  const file = (id: string, displayName: string, targetSlot?: string) => ({ id, displayName, documentType: targetSlot ?? 'other', targetSlot, isDecoy: !targetSlot });
  const files = s.abroadApplicationMethod === 'agency' ? [
    file('cv','CV_final.pdf','cv'), file('ps','PS_final.docx','ps'), file('transcript','Transcript_EN.pdf','transcript'), file('ielts','IELTS.pdf','language'), file('photo','自拍.jpg'), file('homework','课程作业.docx'),
  ] : [
    file('cv-old','CV.pdf'), file('cv-draft','CV_final.pdf'), file('cv-older','CV_final_final.pdf'), file('cv','CV_final_final2.pdf','cv'),
    file('ps-draft','PS初稿.docx'), file('ps-old','PS最终版.docx'), file('ps','PS最终版_真的.docx','ps'),
    file('transcript-cn','成绩单中文版.pdf'), file('transcript','Transcript_EN.pdf','transcript'), file('ielts','IELTS.pdf','language'), file('photo','自拍.jpg'), file('homework','课程作业.docx'),
  ];
  if (final && s.abroadRecommendationReceived) files.push(file('recommendation','Recommendation_Letter.pdf','recommendation'));
  return { title: 'UPLOAD DOCUMENTS', folder: s.abroadApplicationMethod === 'agency' ? '/申请材料/ · 已整理' : '/桌面/ · 最新版在哪儿？', files,
    slots: [{id:'cv',label:'CV'},{id:'ps',label:'Personal Statement'},{id:'transcript',label:'Transcript'},{id:'language',label:'Language Certificate'},{id:'recommendation',label:'Recommendation Letter'}],
    uploaded: s.abroadUploadedDocuments ?? [], requiredCount: final ? 5 : 4, next: final ? 'finally' : 'missing' };
}
