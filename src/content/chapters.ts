import { gapEvents } from './gap';
import { abroadEvents } from './abroad';
import { schoolName, regionName } from './abroad-data';
import type { ChapterState } from '../systems/events';
import { employmentChapter } from './employment-ch1';
import { civilServiceEvents } from './civil-service';
import { postgradEvents } from './postgrad';
import type { RouteId } from './routes';
import type { StoryEvent } from '../systems/events';
export interface ChapterContent { events: readonly StoryEvent[]; entry: string; lateEntry: string; arrival: string; ending: string; endingSubtitle: string; campusSubtitle?: string; endingJob?: boolean; quietEnding?: boolean; endingDetail?: (state: ChapterState) => string }
export const chapters: Partial<Record<RouteId, ChapterContent>> = {
  gap: { events: gapEvents, entry: 'gap-wake', lateEntry: 'gap-wake', arrival: '2026年秋', ending: '待机号 · 旅行中', endingSubtitle: '2027.07', campusSubtitle: '校园 · 日常', quietEnding: true },
  abroad: { events: abroadEvents, entry: 'ab-arrival', lateEntry: 'ab-arrival', arrival: '宿舍的电脑亮着。', campusSubtitle: '林荫路 · 大四的日常', ending: '留子号 · 到站', endingSubtitle: '余小迟 · 2027', endingDetail: s => `${schoolName(s.abroadAcceptedSchool)}\n${regionName(s.abroadRegion)}` },
  employment: { events: employmentChapter, entry: 'arrival', lateEntry: 'applications', arrival: '秋招开始了。', ending: '秋招还在继续。', endingSubtitle: '第一章结束' },
  postgrad: { campusSubtitle: '林荫路 · 大四的日常', events: postgradEvents, entry: 'pg-target', lateEntry: 'pg-target', arrival: '先去图书馆看看吧。', ending: '下一站：复试', endingSubtitle: '第一阶段结束' },
  civil_service: { events: civilServiceEvents, entry: 'cs-notice', lateEntry: 'cs-notice', arrival: '2026年秋季 · 校园', campusSubtitle: '林荫路 · 大四的日常', ending: '编制号 · 到站', endingSubtitle: '余小迟 · 2027', endingJob: true },
};
export const allEvents = [...employmentChapter, ...postgradEvents, ...civilServiceEvents, ...abroadEvents, ...gapEvents];
