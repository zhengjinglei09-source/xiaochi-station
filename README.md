# 《小迟去哪儿》· Phase 03E

已完成车站与可移动原型；现在登上「社畜号」会进入共用的宿舍、校园、图书馆，体验 2026 年 9 月的第一章。章末进入十月并保存章节检查点，不进入第二章。「学术号」已接入考研轻量路线，十月可继续或返回车站换乘；「编制号」已接入两次考试、选岗、行测、申论、面试与入职结局；「留子号」已接入地区、申请方式、IELTS、材料拖拽、推荐信、选校和接受Offer；「待机号」已接入自由生活、朋友聚餐、一次短期体验、毕业和旅行结尾，停在“2027.07 / 待机号 · 旅行中”。人物素材、速度和动态摇杆保持不变。

## 本地预览

需要 Node.js 20.19+ 或 22.12+，推荐使用本机已有的 Node.js 22。

在终端逐行运行：

```sh
cd '/Users/yuchi/Documents/ChatGPT/《小迟去哪儿》'
npm install
npm run dev
```

打开终端显示的 Local 地址，通常为 http://localhost:5173/ 。终端保持运行。按 Control+C 停止。

手机与电脑连接同一个 Wi-Fi，手机浏览器打开终端显示的 Network 地址。Phase 03E 验证时地址为 http://192.168.110.117:5173/ ，换网络后以终端新地址为准。若打不开，检查电脑的防火墙是否允许 Node、Wi-Fi 是否启用了设备隔离，以及 VPN 是否影响局域网连接。

桌面用鼠标按住游戏画面左侧约 40% 区域并拖动；手机用左手按住拖动。摇杆在落点出现，松手停止。无需键盘。

先走近小迟左上方的站务员，右侧会出现“对话”。沿上方站台左右探索，走近编号站牌可“查看”，靠近车门可“上车”。工作人员问“同学，上不上？”；选择“我再看看。”继续探索，选择“上。”走向车门、淡出；社畜号、学术号、编制号与留子号进入共用生活地图，其他列车显示准备中提示，可返回车站。

社畜号第一章每完成一个事件，会在本机保存一份章节检查点。刷新恢复到最近完成的事件及该地图入口；未结束的对话从事件开头重来。章末刷新仍停在第一章结束。学术号同样使用这个检查点，返回车站会保留学习记录、日期及最初选择；currentRoute 可换乘，initialRoute 不变。

重新从车站测试可使用无痕窗口，或在当前网址的开发者控制台执行 `localStorage.removeItem('xiaochi.chapter.v1'); location.reload()`，这会删除当前章节检查点。没有云存档或存档槽位。

## 构建

```sh
npm run build
npm run preview
```

`dist/` 是静态发布产物。当前未发布到公网。

## 代码怎么找

| 文件 | 负责什么 |
| --- | --- |
| `src/game/config.ts` | 步速、人物大小、碰撞半径、摇杆死区 |
| `src/game/game.ts` | 初始化、缩放、镜头、游戏循环 |
| `src/game/station.ts` | 出生点、边界、障碍坐标 |
| `src/game/scenery.ts` | 站台像素画面、轻量环境动画 |
| `src/game/player.ts` | 移动、朝向、idle/walk、碰撞滑动 |
| `src/input/joystick.ts` | 动态摇杆、指针归属与中断归零 |
| `src/assets/character.ts` | 四方向 × idle/walk 资源配置与绘制 |
| `src/assets/npc.ts`、`public/assets/npc/` | 原创 NPC 精灵图、两帧姿态与脚底锚点 |
| `src/systems/interaction.ts` | 范围检测、邻近目标选择、重叠防抖及动作分发 |
| `src/systems/dialogue.ts` | 短对白、继续、选项分支与结束回调 |
| `src/content/routes.ts` | 五条 Route 数据及初始/当前路线状态 |
| `src/content/station-content.ts` | 站牌/车门坐标、交互配置和对白内容 |
| `src/game/station-actors.ts` | 列车入口、站务员、循环经过的背景 NPC 与气泡 |
| `src/game/boarding.ts` | 锁定移动后的走向车门、淡出反馈 |
| `src/ui/interaction.ts` | 右侧对话/查看/上车情境按钮 |
| `src/ui/dialogue.ts`、`src/ui/press.ts` | 对话界面、键盘焦点及双指触控按钮 |
| `src/styles.css` | 手机全屏、9:16 桌面容器、安全区、极简 HUD |
| `scripts/extract-character.mjs` | 从用户原稿裁切并去除连通背景 |
| `tests/movement.spec.ts` | 浏览器交互、碰撞和布局检查 |
| `tests/station.spec.ts` | NPC、五条路线完整流程、输入锁定和小屏对话检查 |

技术为 Vite + TypeScript + Canvas 2D，无运行时框架依赖。静态场景预绘制，逐帧只更新镜头、角色与少量环境动画。逻辑宽度 360，等比适配屏幕；桌面保持居中竖屏。按首轮试玩反馈，步速从 43 提至 69 地图像素/秒（约 1.6 倍），人物从 54 放大到 81 地图像素高（1.5 倍）。可走宽度约 624，横穿约 9 秒；这是用户要求提速后对原先 10～20 秒目标的调整。斜向归一化，短拖动可慢走。

“左侧按住拖动”位于左侧长椅与围栏之间的地砖区域，恢复方向图标和“摇杆控制小迟移动”双行样式，自由探索时常驻。首次移动后显示月台提示与向前箭头，箭头旁标注“向前走选择月台号”；查看两个不同月台的信息后收起。靠近列车员时显示“和列车员聊聊”，未交互前不按计时消失，离开范围收起，再靠近仍可提示。摇杆操作方式不变；引导刷新重置，详见 [Onboarding 修复记录](docs/ONBOARDING.md)。考研列车名称按最新要求改为“学术号”，内部 ID 仍为 postgrad。

## Phase 03A 内容与架构

详见 [第一章实现与验收记录](docs/PHASE03A.md)。地图位于 `src/life/`，通用事件与测评位于 `src/systems/events.ts` 和 `src/systems/quiz.ts`，全部第一章对白、选项、题目位于 `src/content/employment-ch1.ts`。新增剧情主要修改内容数据，无须增加独立页面。

## Phase 03B 内容与换乘

详见 [学术号实现与验收记录](docs/PHASE03B.md)。`src/content/postgrad.ts` 是考研事件和题目数据，`src/content/chapters.ts` 登记路线内容，`src/systems/route-transfer.ts` 处理返回和重新登车。地图和 Phase 03A 事件数据保持不变。

## Phase 03C 内容与通用互动

详见 [编制号实现与验收记录](docs/PHASE03C.md)。`src/content/civil-service.ts` 配置全部事件、虚构岗位、题目、申论卡片与蒙太奇；复用已有地图和事件执行器。`src/ui/activity.ts` 统一实现筛选、单选、多选和排序，QuizMiniGame 通过可选时限开启倒计时。最终岗位来自第二次选岗，互动答案不决定录用结果。

## Phase 03D 留子号

详见 [留子号实现与验收记录](docs/PHASE03D.md)。`src/content/abroad.ts` 和 `abroad-data.ts` 提供事件、地区、虚构学校与文件桌面；`src/systems/documents.ts` 和 `src/ui/documents.ts` 是通用拖拽/点选上传组件。DIY和中介只改变准备经历；6.5与7.0都能继续申请。结果来自独立预设池，至少有一份Offer，最终学校由玩家主动接受。

## 角色与字体的当前限制

详见 [素材说明](docs/ASSETS.md)。余小迟的素材全部来自用户提供的 `风格2.png`，没有重新设计或生成。目前通过原稿的腿部切片摆动、交替抬脚和身体轻摆形成程序动画，步频跟随实际移动距离。左右行走使用原稿行走姿态及镜像。原稿仍不是完整 Sprite Sheet，后续可用正式逐帧动画替换；现在已不再是整张静态角色图平移。

Phase 02 定向修复将列车员和三名背景 NPC 替换为原创精致像素精灵图，使用内置 imagegen 生成；小迟保持原样。参见 [长期美术规范](ART_GUIDE.md)、[人物对照](docs/npc-art-review.png) 和 [本次 34 项验收](docs/PHASE02_REPAIR.md)。

主标题按用户新参考制作成白色大字、深蓝描边和纸飞机的透明像素图片，居中放在画面上方。正文和站牌仍用系统字体；Windows、Android、iOS 的具体字形可能不同。原图中的爱心、属性 UI、其他角色和路线玩法没有引入。

## 验证

```sh
npm run build
# 首次运行跨浏览器检查前安装测试浏览器：
npx playwright install webkit
npm test
```

Chrome 项目使用已安装的 Google Chrome；WebKit 项目使用 Playwright 安装的浏览器。测试自动启动本地开发服务，或复用 5173 端口上的现有服务。

模拟浏览器不能代替实机。手机试玩时请重点检查：左侧不同落点、四向与斜向、松手、多指、滑出触发区、浏览器切后台后返回、边界与长椅碰撞、刘海和底部安全区。当前进度和验收清单见 [Phase 02 说明](docs/PHASE02.md)；此前的 [Phase 01 验证记录](docs/VALIDATION.md) 保留为历史记录。

## Phase 03E

[待机号实现与验收记录](docs/PHASE03E.md)。五条路线首轮MVP均已接入；不包含Phase04人生报告、多周目或统一结算。
