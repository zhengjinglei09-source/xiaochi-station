# Phase 03A · 大四生活地图与社畜号第一章

## 范围与入口

从社畜号登车后进入 2026 年 9 月和生活地图。第一章在 2026 年 10 月结束，不进入第二章。其余四列车保持 Phase 02 的登车终点。没有新增依赖、后端、角色图片、正式后续路线、属性面板或完整手机系统。

## 文件与复用

| 文件 | 职责 |
| --- | --- |
| src/life/life-map.ts | 三张紧凑地图的数据、碰撞体、出口、交互对象与 Canvas 场景绘制 |
| src/life/life-game.ts | 共用生活地图运行器，接收事件内容包；复用人物、移动、摇杆、范围交互和对话面板 |
| src/systems/events.ts | 单个前台事件、选项效果草稿、一次性提交、后继、月份与轻量本地检查点 |
| src/systems/quiz.ts | 数据驱动 QuizMiniGame，生成原 DialogueSystem 可读取的节点与结果记录 |
| src/content/employment-ch1.ts | 唯一的社畜号第一章内容包，8 个事件、3 道测评题、2 道正式面试题 |
| src/main.ts | 从车站交接到生活地图、恢复章节检查点 |
| src/game/game.ts | 就业登车成功回调；其余路线行为不变 |
| src/game/player.ts | 给原碰撞算法传入不同地图，车站仍是默认地图，速度与步态不变 |
| src/systems/dialogue.ts | 增加可选的选择回调，事件记录效果仍使用原节点推进 |
| src/ui/interaction.ts | 场景销毁时移除监听，允许入口显示“进入”、电脑显示“使用” |
| src/ui/dialogue.ts | 新对白复位滚动，避免小屏上延续上一段滚动位置 |
| index.html、src/styles.css | 生活场景轻量标题、邮件提示、九月转场和第一章完成卡 |
| tests/chapter.spec.ts、tests/station.spec.ts | 完整流程、分支、存储、布局和就业入口变化的回归 |

原人物素材与渲染、NPC 素材与渲染、摇杆核心、车站地图、路线 ID 和展示文案未变。`docs/phase03a-before.sha256` 保留修改前基线；本阶段允许的小型接入变更见上表。

## 最小事件契约

`id / route / chapter / month / location / trigger / target / title / hint / dialogue / choices / effects / nextEvent / optionalMiniGame`

- trigger 支持 auto、object、npc、phone，地点为 campus、dorm、library 或 any。
- dialogue 直接复用已有 DialogueScript；choices 用选项 ID 映射简单 effects。
- effects 只支持必要状态赋值、金钱增减、面试回答记录，不提供 DSL。
- 开始事件时创建草稿，确认结束后一次性提交、推进后继、保存。重复提交不重复扣费；退出未完成事件则丢弃草稿，重新进入从该事件开头开始。
- 已完成事件不能再次触发。月份通过事件效果推进；结尾 nextEvent 为 null。
- 图书馆、宿舍和校园没有就业专属类名；生活场景运行器接收内容包，未来路线可以复用同一地图与交互对象。

## 地图

校园是连接中心，左右分别通往宿舍、图书馆。每张为 360 × 390 逻辑像素的紧凑区域，脚底碰撞，出口靠近后按右侧按钮进入。宿舍有床、床边手机、书桌电脑；图书馆有书架、公共电脑和自习桌；校园有树、长椅、朋友。朋友直接复用已确认的 commuter-book 美术，不生成低精度占位 NPC。

已完成移动教学的玩家不会再次看到移动提示；新地图以一句当前事件提示、物体脚边高亮和手机通知指向可玩入口。没有任务栏、小地图或新任务系统。

## 8 个事件包

1. 秋招开始：九月短转场，自动开场。
2. 我投什么 / 海投：5 个行业、4 个岗位；3 次批量操作，显示 7→23、58→103、156→200，最终记录 200 份。
3. 邮件响了：两封拒信、一封人才池、下一轮通知；手机主动打开。
4. 企业测评：图书馆电脑，图形、言语、数字共 3 题；错题不阻塞，最后出现性格测试 35 分钟的短反馈。
5. 朋友没有 HC：校园朋友，三个回复各有不同反馈，全部汇合。
6. 面试准备：自备的 JD 关键词、经历、自我介绍、预写 ChatGPT 模拟；或 ¥6,999 陪跑短支线。初始虚构可用余额 ¥8,000，购买后 ¥1,001，无借贷。
7. 第一次面试：宿舍电脑，两题，每题三种合理取向，不显示最佳答案或人格分。
8. 图书馆的晚上：阶段性通过邮件，推进十月，“秋招还在继续”，第一章结束。

## Quiz 复用

QuizDefinition 包含 id、questions；每题包含 id、category、text、options、answer、explanation。QuizMiniGame 自动生成问题和反馈节点，记录选择索引、正确数和总题数。题型标签、题文和说明均来自内容包，未写入就业判断；之后可换入英语、行测等小题组。面试继续复用 Dialogue/Event Choice，没有独立面试页面。

## 保存与状态

保存键：`xiaochi.chapter.v1`。仅保存一份本机章节检查点，无账号、云存档、存档槽位、人生收藏或多周目。

状态包括 version、initialRoute、currentRoute、currentChapter、currentMonth、location、eventId、completed、chapterComplete、targetIndustry、targetRole、applicationCount、balance、interviewPrepChoice、jdFocus、quizResult、friendReply、interviewChoices、playSeconds。

刷新回到最近完成事件后的稳定检查点及所在地图入口；不恢复半读的对白或按住的摇杆。结尾刷新仍停在第一章结束。保存失败显示提示和重试按钮，不宣称已保存。损坏或不兼容数据不会导致白屏。

开发者重新从车站测试：在此网址的控制台执行 `localStorage.removeItem('xiaochi.chapter.v1'); location.reload()`。清除的是这一份章节检查点。也可以使用新的无痕窗口。没有在游戏里新增多周目按钮。

## 验证记录

2026-09-23：生产构建通过。WebKit 全量回归 22 项通过，1 项仅适用于 Chromium 的触控注入按设计跳过，退出码 0。覆盖原移动、碰撞、新手引导、五个月台、就业登车接入与其他四路线终点、新地图碰撞、320×568 / 390×844 / 430×932 手机布局、三题全错推进、陪跑支付、三个朋友分支、检查点恢复和保存失败提示。

Chrome 完整阅读节奏试玩通过，327.8 秒（5 分 28 秒），退出码 0：按每秒 6 个汉字、每组选项额外 3 秒、最低每段 1.8 秒模拟阅读，地图用真实摇杆移动。游戏自身没有这套人为停留，也没有倒计时或强制等待来凑时长。它是可复现的模拟，不代表已完成真人时长测试。

快速功能流程约 45 秒（快进对白），验证剧情可达。完整第一章未捕获新增 JavaScript 或 console 错误。小迟与 NPC 所有美术文件及渲染入口哈希不变，Route 配置文件逐字节不变。首次 Chrome 快速套件曾在所有断言通过后出现退出超时；后续完整节奏检查正常退出。

小屏新对白滚动复位后，Chrome 最终补测 4 项全部通过，退出码 0；覆盖三种手机尺寸、实际触控注入、双指交互、陪跑支付与保存失败提示。

截图：[校园](phase03a-campus.png)、[宿舍](phase03a-dorm.png)、[图书馆](phase03a-library.png)、[小屏对话](phase03a-dialogue.png)、[章节结尾](phase03a-end.png)。

真实手机握持感、第一次探索是否容易找到目标，以及文案阅读和选择节奏，仍需用户试玩；模拟浏览器不等于 iOS/Android 真机。
