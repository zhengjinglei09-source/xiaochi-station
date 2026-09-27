export type RouteId = 'employment' | 'postgrad' | 'civil_service' | 'abroad' | 'gap';
export interface Route {
  id: RouteId;
  name: string;
  trainName: string;
  displayName: string;
  description: string;
  platformStatus: string;
  color: string;
}
export const routes: readonly Route[] = [
  { id: 'employment', name: '就业', trainName: '社畜号', displayName: '就业方向', description: '开往校招方向，准备成为一名光荣的纳税人。', platformStatus: '01 月台 · 即将发车', color: '#b88958' },
  { id: 'postgrad', name: '考研', trainName: '学术号', displayName: '考研方向', description: '开往考研方向，继续深造，学生体验卡再续几年。', platformStatus: '02 月台 · 检票中', color: '#668ca6' },
  { id: 'civil_service', name: '考公', trainName: '编制号', displayName: '考公方向', description: '开向备战公考，努力端上心心念念的铁饭碗。', platformStatus: '03 月台 · 排队中', color: '#aa7664' },
  { id: 'abroad', name: '留学', trainName: '留子号', displayName: '留学方向', description: '开往留学方向，开启申请出国学习。', platformStatus: '04 月台 · 材料审核中', color: '#688f89' },
  { id: 'gap', name: 'Gap', trainName: '待机号', displayName: 'Gap 方向', description: '开往 Gap 方向，先在人生加载页待一会儿。', platformStatus: '05 月台 · 晚点中……', color: '#85966b' },
];
export const getRoute = (id: RouteId) => routes.find(route => route.id === id)!;

// Runtime state only. A future save system can serialize this single source.
// initialRoute is a historical starting point; currentRoute can change later.
export class RouteState {
  initialRoute: RouteId | null = null;
  currentRoute: RouteId | null = null;
  recordBoarding(id: RouteId) {
    this.initialRoute ??= id;
    this.currentRoute = id;
  }
}
