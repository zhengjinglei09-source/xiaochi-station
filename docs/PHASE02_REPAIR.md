# Phase 02 定向修复验收

日期：2026-09-21。范围只有五路线展示文案与现有 NPC 美术；没有进入 Phase 03。

## 修改文件

| 文件 | 变更 |
| --- | --- |
| `src/content/routes.ts` | 最终列车名、说明、月台状态；五个 ID 和 RouteState 行为不变 |
| `src/content/station-content.ts` | 介绍对话读取统一说明，其他对白/动作不变 |
| `src/ui/dialogue.ts` | 路线信息展示月台状态，不修改 DialogueSystem |
| `index.html`、`src/styles.css` | 原对话面板增加小字号状态；名称 > 说明 > 状态 |
| `src/assets/npc.ts` | 新增独立 NPC 精灵加载和两帧绘制，脚底对齐 |
| `src/game/station-actors.ts` | 用原创精灵替换矩形人物；循环路径与速度不变 |
| `src/game/game.ts` | 等待 NPC 素材就绪、传入绘制资源与招呼显示状态 |
| `public/assets/npc/conductor.png` | 新列车员站立 / 抬手两帧 |
| `public/assets/npc/commuter-cv.png`、`commuter-book.png`、`commuter-ddl.png` | 三个独立背景 NPC 两帧素材 |
| `public/assets/npc/atlas.json` | 帧范围和脚底锚点，不改变源图像素 |
| `scripts/index-npc-sprites.mjs` | 可复现 alpha 帧索引 |
| `scripts/capture-npc-review.mjs` | 实际渲染器生成同屏人物对照图 |
| `tests/station.spec.ts` | 新名称回归、五路线 320px 信息布局/状态/console 检查 |
| `ART_GUIDE.md`、`docs/NPC_PROMPTS.md` | 长期美术约束、内置 imagegen 生成提示 |
| `docs/phase02-repair-locked.sha256` | 修改前读取的受保护文件校验值 |
| `README.md`、`docs/PHASE02.md`、本文件 | 当前说明、名称同步和验收记录 |
| `docs/npc-art-review.png`、`docs/phase02-preview.png`、`docs/phase02-dialogue.png`、`docs/route-information-review.png` | 本次实际渲染截图 |

## 最终展示内容

| ID | 列车名 | 说明 | 月台状态 |
| --- | --- | --- | --- |
| employment | 社畜号 | 开往校招方向，准备成为一名光荣的纳税人。 | 01 月台 · 即将发车 |
| postgrad | 学术号 | 开往考研方向，继续深造，学生体验卡再续几年。 | 02 月台 · 检票中 |
| civil_service | 编制号 | 开向备战公考，努力端上心心念念的铁饭碗。 | 03 月台 · 排队中 |
| abroad | 留子号 | 开往留学方向，开启申请出国学习。 | 04 月台 · 材料审核中 |
| gap | 待机号 | 开往 Gap 方向，先在人生加载页待一会儿。 | 05 月台 · 晚点中…… |

站台保持原地图结构。车身保留短名称、站牌保留编号；走近查看时，原像素信息框完整展示三级信息，避免把五段说明常驻堆在地图上。月台状态是展示文案，本次没有新增发车计时或审核系统。

## 34 项逐项自查

“视觉自查”表示已审阅生成原图、与小迟的同尺寸对照及游戏截图，仍需用户最终美术确认。“模拟检查”不等同真实手机验收。

| 项 | 结果与证据 |
| --- | --- |
| 1 社畜号 | 通过：车身、信息框、上车按钮、工作人员和完成提示统一读取 Route |
| 2 学术号 | 通过：列车名称在 320px 信息框完整显示 |
| 3 编制号 | 通过：对应 civil_service |
| 4 留子号 | 通过：对应 abroad |
| 5 待机号 | 通过：对应 gap |
| 6 五条说明 | 通过：按用户原文逐条核对，来源为 description |
| 7 月台状态 | 通过：按用户原文核对，五路线自动检查对应状态 |
| 8 无旧名称 | 通过：当前 src/public/index 与构建 JS 检索无旧名；当前说明已同步 |
| 9 手机文案不溢出 | 模拟通过：五路线均在 320×568 检查名称、说明、状态、面板宽高和字号层级 |
| 10 employment | 通过：ID 未改 |
| 11 postgrad | 通过：ID 未改 |
| 12 civil_service | 通过：ID 未改 |
| 13 abroad | 通过：ID 未改 |
| 14 gap | 通过：ID 未改 |
| 15 initialRoute | 通过：五条路线分别从移动、查看、取消到登车后核对 ID |
| 16 登车/交互 | 通过：沿用原流程，取消可继续移动，完成后仍停在 Phase 02 |
| 17 小迟完全未改 | 通过：四张 PNG、provenance 和绘制源码均与修改前 SHA-256 一致 |
| 18 NPC 精度 | 视觉自查完成：去除矩形人形，改为独立精灵图 |
| 19 同一建模语言 | 视觉自查完成：统一约 2.5 头身、细致五官、暖深轮廓和低饱和衣物 |
| 20 人物差异 | 视觉自查完成：四人不同发型/眉眼/穿搭/携带物，没有同图换色 |
| 21 列车员职业识别 | 视觉自查完成：大檐职业帽与完整制服 |
| 22 职业帽轮廓 | 视觉自查完成：帽冠、深色帽檐、帽带和方形徽记 |
| 23 制服结构 | 视觉自查完成：翻领、衬衫、领带、制服外套和深色下装 |
| 24 身份标识 | 视觉自查完成：原创方框箭头帽徽与矩形胸牌，无现实铁路 Logo |
| 25 Q 版像素世界 | 视觉自查完成：与小迟同屏、实际高度 83 对 81，关闭平滑插值 |
| 26 未复制参考人物 | 通过制作方式及视觉自查：原创生成，不裁切、描图或复用完整人物组合 |
| 27 长期规范 | 通过：项目根目录 ART_GUIDE.md |
| 28 碰撞 | 通过：移动、地图障碍源码哈希一致；边界/碰撞/滑动回归通过 |
| 29 DialogueSystem | 通过：核心系统未改，分支/继续/关闭/输入锁定回归通过 |
| 30 InteractionSystem | 通过：源码哈希一致；邻近出现、离开隐藏、目标稳定选择回归通过 |
| 31 人物尺寸 | 模拟通过：78～83 逻辑像素，四种屏幕尺寸截图检查 |
| 32 显示清晰 | 视觉自查完成：透明素材无底板，nearest-neighbor 绘制，实际尺寸对照完成 |
| 33 console | 通过：五路线旅程未捕获 pageerror 或 console.error |
| 34 原功能 | 模拟通过：原 9 项移动检查、NPC 对话、双指、五路线和初始路线检查 |

## 实际验证与限制

- `npm run build` 通过。
- Chrome 17 项用例断言全部通过；本机 Chrome 测试 worker 退出阶段发生等待，触发运行器 120 秒全局超时（非游戏断言失败）。保留这一环境限制，不将该命令报告为退出码 0。
- WebKit 独立执行：16 项通过，1 项 Chromium 专用触控注入按设计跳过，命令退出码 0。
- 真实 iPhone / Android 尚未接入测试。最终美术偏好、手机触摸手感与实际安全区仍请用户查看。
- NPC 为内置 imagegen 生成的原创资产，并非手工逐像素绘制；没有宣称原创性可以由自动测试证明。参考图完整人物未直接使用。
- 背景 NPC 保持轻量两帧姿态，没有扩展复杂动画、AI、碰撞或剧情。

校验命令：`shasum -a 256 -c docs/phase02-repair-locked.sha256`，11 项全部 OK。

预览需 `npm run dev`，不要直接用 file:// 打开 index.html。手机与电脑同一 Wi-Fi 时使用终端 Network 地址。
