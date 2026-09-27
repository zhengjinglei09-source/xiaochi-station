import type { LifeMap } from './life-map';
export const travelMap: LifeMap = {
 name:'旅行中',subtitle:'随便走走',bounds:{x:16,y:108,width:328,height:252},spawn:{x:180,y:320},
 obstacles:[{x:48,y:226,width:65,height:20},{x:273,y:116,width:40,height:37},{x:257,y:239,width:66,height:33}],objects:[],
};
// One collision layout and renderer; only scenery palettes and props change.
export function drawTravel(c:CanvasRenderingContext2D, style:string, time=0) {
 const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 r(0,0,360,390,'#c4ddcf');
 const coast=style==='seaside',mountain=style==='mountain';
 if(coast){
  r(0,0,360,154,'#a6d8df');r(0,64,360,80,'#73b5c3');r(0,108,360,40,'#97cfce');
  for(let i=0;i<12;i++)r((i*39+Math.sin(time)*3)%360,73+i%4*18,20,2,'#e2f0da');
 }else if(mountain){
  for(const [x,h]of[[0,75],[70,103],[162,90],[249,120]]){for(let y=0;y<h;y+=6)r(x+44-y/2,135-h+y,y+12,6,y<h/2?'#719b87':'#86ab87');}
  r(0,115,360,43,'#a3be91');
 }else{
  r(0,0,360,133,'#b3d2d0');
  for(let i=0;i<5;i++){const x=i*76-8;r(x,25+i%2*18,64,112,'#e8c99d');r(x,25+i%2*18,64,7,'#719186');for(let y=46;y<105;y+=25){r(x+10,y,15,18,'#789897');r(x+39,y,15,18,'#789897');}}
  if(style==='random'){r(131,33,99,30,'#fff0cb');c.fillStyle='#526f60';c.font='12px sans-serif';c.fillText('晴川埠',161,54);}
 }
 r(12,155,336,211,coast?'#eee0b7':mountain?'#dbcba8':'#d5d1bb');
 for(let y=161;y<362;y+=24)for(let x=16;x<340;x+=42)r(x,y,39,1,'#f4ead0');
 // Shared bench, vending machine and small shop.
 r(47,220,66,8,'#b99b6c');r(49,232,62,12,'#a78660');r(51,244,6,15,'#7c7055');r(104,244,6,15,'#7c7055');
 r(273,89,40,65,'#627f7e');r(277,94,23,42,'#bedbce');for(let j=0;j<6;j++)r(281+j%3*6,99+Math.floor(j/3)*15,4,10,['#c4a367','#d08969','#7d9f8b'][j%3]);r(280,141,26,6,'#435e5a');
 r(258,212,65,60,'#d9bc90');r(253,206,74,10,'#ab7158');r(263,224,24,29,'#87a69a');r(292,228,21,44,'#6c8574');
 for(const x of[25,331]){r(x,156,5,40,'#9c8264');r(x-10,136,28,26,'#7caa84');r(x-6,132,18,11,'#a7c197');}
 c.fillStyle='#5d776a';c.font='10px sans-serif';c.fillText('坐会儿',64,261);c.fillText('饮料',281,168);c.fillText('小店',278,287);
}
