import { routes, type Route } from './routes';
import type { DialogueScript } from '../systems/dialogue';
import type { Interaction } from '../systems/interaction';

export const platforms = routes.map((route, index) => ({
  route, number: index + 1, x: 84 + index * 128,
  door: { x: 84 + index * 128, y: 150 },
  approach: { x: 84 + index * 128, y: 176 },
  sign: { x: 51 + index * 128, y: 183 },
}));
export type Platform = typeof platforms[number];
export const attendant = { id: 'station-attendant', name: '站务员', x: 298, y: 224 };

export const attendantDialogue: DialogueScript = {
  id: 'station-attendant', start: 'hello', nodes: {
    hello: { speaker: '站务员', lines: ['五个方向，都在这排站台。'], choices: [
      { id: 'where', text: '我先看看车次。', next: 'directions' },
      { id: 'busy', text: '大家怎么都跑起来了？', next: 'busy' },
      { id: 'bye', text: '谢谢，我去逛逛。' },
    ] },
    directions: { speaker: '站务员', lines: ['走近站牌能看方向，车门旁可以上车。', '左右都有车，慢慢看。'] },
    busy: { speaker: '站务员', lines: ['有人赶秋招，有人赶自习室。', '刚才还有个同学说，自己的 DDL 比列车跑得快。'] },
  },
};
export const noticeDialogue: DialogueScript = {
  id: 'station-notice', start: 'notice', nodes: {
    notice: { speaker: '站台公告', lines: ['请看清车次，再走到对应车门。', '本站不广播“别人都上车了”。'] },
  },
};
export const routeInformation = (route: Route): DialogueScript => ({
  id: `information-${route.id}`, start: 'info', nodes: {
    info: { speaker: route.trainName, lines: [route.description, '车门就在站牌旁，工作人员在候车。'] },
  },
});
export const boardingDialogue = (route: Route): DialogueScript => ({
  id: `boarding-${route.id}`, start: 'ask', nodes: {
    ask: { speaker: `${route.trainName} · 工作人员`, lines: ['同学，上不上？'], choices: [
      { id: 'board', text: '上。', action: 'board' },
      { id: 'look', text: '我再看看。' },
    ] },
  },
});

export function createStationInteractions(open: (script: DialogueScript, platform?: Platform) => void): Interaction[] {
  return [
    { id: 'talk-attendant', type: 'npc', target: { id: attendant.id, position: attendant }, range: 38,
      prompt: '与站务员对话', icon: 'talk', action: () => open(attendantDialogue) },
    { id: 'view-notice', type: 'sign', target: { id: 'notice', position: { x: 555, y: 217 } }, range: 32,
      prompt: '查看站台公告', icon: 'view', action: () => open(noticeDialogue) },
    ...platforms.flatMap((platform): Interaction[] => [
      { id: `sign-${platform.route.id}`, type: 'sign', target: { id: `route-sign-${platform.route.id}`, position: platform.sign }, range: 26,
        prompt: `查看${platform.route.trainName}`, icon: 'view', action: () => open(routeInformation(platform.route)) },
      { id: `train-${platform.route.id}`, type: 'train', target: { id: `door-${platform.route.id}`, position: platform.approach }, range: 30,
        prompt: `登上${platform.route.trainName}`, icon: 'board', action: () => open(boardingDialogue(platform.route), platform) },
    ]),
  ];
}
