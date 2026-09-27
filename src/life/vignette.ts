import { drawTravel } from './travel';
import { Player } from '../game/player';
import type { CharacterRenderer } from '../assets/character';
import type { NpcRenderer } from '../assets/npc';
import type { Presentation } from '../systems/dialogue';
// Non-playable, tiny stage pictures using the locked sprites; shared maps stay untouched.
export class Vignette {
  private pose = new Player();
  draw(c: CanvasRenderingContext2D, kind: Presentation, hero: CharacterRenderer, npcs: NpcRenderer, time: number, progress: number, job: string, travelStyle?: string) {
    const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    if (kind === 'black') { r(0, 0, 360, 340, '#263b39'); return; }
    r(0, 0, 360, 340, '#d8cdb5'); r(12, 92, 336, 248, '#ebe0c3');
    for (let y = 104; y < 330; y += 24) for (let x = 12; x < 345; x += 42) r(x, y, 40, 1, '#f9efd9');
    r(20, 12, 320, 78, '#b4c9bd'); r(30, 20, 74, 62, '#6b847b'); r(34, 24, 66, 53, '#d9e9db');
    this.pose.stop(); this.pose.x = 180; this.pose.y = 240; this.pose.direction = 'back';
    if (kind === 'travel') {
      drawTravel(c, travelStyle ?? 'seaside', time); this.pose.direction='front';this.pose.y=295;hero.draw(c,this.pose,true);npcs.draw(c,'commuter-cv',240,290);
    } else if (kind === 'rest') {
      r(88,123,186,90,'#927c61');r(93,128,176,78,'#9cafb4');r(98,131,48,69,'#fff2d8');
      c.save(); c.translate(174,169);c.rotate(-Math.PI/2);this.pose.x=0;this.pose.y=36;this.pose.direction='front';hero.draw(c,this.pose,true);c.restore();
      r(147,157,114,44,'#98b5b4');r(148,161,111,3,'#c9d6c7');
    } else if (kind === 'project') {
      r(53,80,254,181,'#486862');r(60,87,240,162,'#f8edd1');r(60,87,240,17,'#b2c7b1');
      r(73,119,82,3,'#94ab96');r(73,131,114,3,'#94ab96');r(80,158,36,32,'#82a5a0');r(81,163,34,3,'#bbd6c4');
      r(146,262,65,11,'#6d8b7a');r(91,280,182,18,'#b6beaa');
    } else if (kind === 'meal') {
      npcs.draw(c,'commuter-book',85,174);npcs.draw(c,'commuter-cv',181,166);npcs.draw(c,'commuter-ddl',273,180);
      r(48,169,265,64,'#b28a60');r(51,173,259,53,'#dcc095');
      for(const x of [77,141,208,268]) {r(x,187,23,16,'#fff0d0');r(x+4,191,14,7,'#8eac78');}
      this.pose.direction='back';this.pose.y=290;hero.draw(c,this.pose,true);
    } else if (kind === 'small-bag' || kind === 'trip-depart') {
      if(kind==='trip-depart') { c.translate(0,-progress*60);this.pose.motion='walk';this.pose.animationTime=time; }
      this.pose.direction=kind==='trip-depart'?'back':'front';this.pose.y=222;hero.draw(c,this.pose,kind!=='trip-depart');
      r(218,196,43,31,'#b5a178');r(224,201,31,23,'#d5be8d');r(230,187,20,3,'#667c68');r(230,188,3,9,'#667c68');r(247,188,3,9,'#667c68');r(222,205,35,2,'#7f8a70');
    } else if (kind === 'packing' || kind === 'packing-extra' || kind === 'depart') {
      const leaving = kind === 'depart'; this.pose.direction = leaving ? 'back' : 'front';
      this.pose.y = leaving ? 260 - progress * 80 : 206;
      if (leaving) { this.pose.motion = 'walk'; this.pose.animationTime = time; }
      const x = leaving ? 216 : 127, y = leaving ? this.pose.y - 34 : 225;
      r(x, y, leaving ? 33 : 108, 48, '#435f6e'); r(x+4,y+4,leaving ? 25 : 100,36,'#77959e');
      r(x+6,y+48,7,5,'#35473f'); r(x+(leaving ? 21 : 91),y+48,7,5,'#35473f');
      if (leaving) { r(x+9,y-18,3,18,'#657a75'); r(x+9,y-19,15,3,'#657a75'); }
      else { r(135,232,35,26,'#d9b879'); r(175,232,19,25,'#f7edd4'); r(201,232,22,18,'#6c7d65'); if(kind==='packing-extra') r(151,216,44,18,'#ad8f74'); }
      c.save(); if(leaving) c.globalAlpha = Math.min(1,(1-progress)*3); hero.draw(c,this.pose,!leaving); c.restore();
    } else if (kind === 'interview') {
      npcs.draw(c, 'commuter-book', 119, 159); npcs.draw(c, 'commuter-ddl', 241, 159);
      r(65, 139, 231, 23, '#b18c64'); r(71, 160, 219, 25, '#907352');
      for (const x of [103, 223]) { r(x, 142, 28, 10, '#fff5dd'); r(x + 32, 138, 6, 12, '#769b8c'); }
      r(166, 231, 30, 16, '#8d7059'); hero.draw(c, this.pose, true); r(164, 227, 34, 7, '#967653');
    } else if (kind === 'waiting') {
      r(62, 226, 231, 16, '#a88863'); r(68, 242, 8, 22, '#765e4d'); r(277, 242, 8, 22, '#765e4d');
      this.pose.direction = 'front'; hero.draw(c, this.pose, true); r(161, 231, 38, 6, '#a88863'); npcs.draw(c, 'conductor', 291, 163, 1);
    } else if (kind === 'morning') {
      r(139, 27, 79, 101, '#947b60'); r(144, 32, 69, 89, '#d9e5df');
      c.save(); c.globalAlpha = .3; this.pose.y = 124; this.pose.direction = 'front'; hero.draw(c, this.pose, true); c.restore();
      this.pose.y = 223; this.pose.direction = 'back'; hero.draw(c, this.pose, true);
    } else {
      r(120, 74, 120, 142, '#57776e'); r(128, 80, 104, 128, '#b2c9bf'); r(176, 81, 8, 127, '#53786c');
      r(50, 18, 260, 36, '#fff0d2'); c.font = 'bold 13px sans-serif'; c.fillStyle = '#455f55'; c.textAlign = 'center'; c.fillText(job, 180, 42, 245); c.textAlign = 'left';
      if (kind === 'enter') { this.pose.y = 260 - progress * 70; this.pose.motion = 'walk'; this.pose.animationTime = time; }
      c.save(); if (kind === 'enter') c.globalAlpha = Math.min(1, (1 - progress) * 3); hero.draw(c, this.pose, false); c.restore();
    }
  }
}
