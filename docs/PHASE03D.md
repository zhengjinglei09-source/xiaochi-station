# Phase 03D · 留子号

本阶段以2026-09-26用户粘贴需求为准，覆盖旧PRD §10.5中不制作地区/DIY/中介选择及旧结果逻辑的约束。只做留子号；没有进入待机号，没有打磨03A/03B/03C。考研列车沿用已确认的「学术号」。

## 文件与复用

- `src/content/abroad.ts`：13个事件与分支，复用已有 Event / Dialogue / Quiz / 手机和年月推进。
- `src/content/abroad-data.ts`：4地区、12所虚构学校、预设结果池、两种文件桌面。
- `src/systems/documents.ts`、`src/ui/documents.ts`：唯一新增小游戏组件，数据定义文件id/名称/类型/目标/干扰项；支持Pointer拖拽、点文件再点栏目、撤销当前事件草稿、失焦与pointercancel清理。
- `src/ui/transition-click.ts`：卡片或文件面板在触摸提交后，拦截旧触点合成的尾随click，避免穿透到下一页按钮。
- `src/systems/activity.ts`：既有卡片增加可选存id模式；03C默认仍保存原值。
- `src/systems/events.ts`：增加留学必要字段、按状态解析内容的可选resolve和文件数据入口。旧事件不用这些配置。
- `src/life/life-game.ts`：接入文件组件、数据提供的结尾目的地；`src/content/chapters.ts` 和 `src/game/game.ts` 登记入口。
- `src/life/vignette.ts`、`src/systems/dialogue.ts`：简短行李画面，使用锁定人物绘制，不新增校园或海外地图。
- `index.html`、`src/styles.css`：文件桌面面板与像素样式。
- `tests/abroad.spec.ts`：留学流程、分支、各地区数据、结果独立性、文件/手机输入检查。旧站台与换乘测试只把未开发占位路线从留子号改成待机号。

沿用 Campus / Dorm / Library、移动/摇杆/碰撞、Interaction、Route Transfer、Dialogue、QuizMiniGame、卡片UI、通知、蒙太奇、检查点。没有留学专用引擎、真实学校接口、真实音频、签证/租房/机票或Life Report。

`docs/phase03d-frozen.sha256` 覆盖前三条路线事件、Route配置、Route Transfer、三张地图、Player/摇杆、人物渲染入口和所有人物素材，完成时核对逐字节一致。

## 实际玩法

1. 车站登上留子号，转到宿舍。地区卡选美国、英国、澳大利亚或中国香港，再选DIY/中介。
2. DIY：1→4→8→13个标签页蒙太奇；在虚构官网栏目中找到Application Deadline。中介：读所选地区、看两档虚构报价并选套餐。不从旧求职余额扣费，也不建立新的预算系统。
3. 一次3题IELTS：字幕模拟听力、短阅读、词义；两次固定6.5。选再考只播蒙太奇到7.0；选先申请以6.5继续。题目正确率不控制分数序列或Offer。
4. DIY桌面12文件，中介6文件。左右两列拖文件到栏目，手机文件分页避免长距离拖动；也可点文件后点栏目。错误显示Invalid document，不扣分。4/5后发现缺推荐信。
5. 走到校园，通过手机联系老师，3种开场均推进；急救开场收到“？”再解释。Deadline为3天后，老师稍后发邮件。回宿舍电脑，新增Recommendation_Letter.pdf；仍需玩家上传最后一份。
6. 地区决定3所虚构学校的卡片池；选2所、确认SUBMIT。返回校园短暂自由移动，朋友问结果，一次快递假通知，然后两封真实状态邮件需要主动打开。
7. 三种预设池：拒信+Offer、Offer+Offer、Waitlist+Offer。只读已保存的种子和申请顺序，不读地区、申请方式、语言成绩、题目答案。至少一份Offer，玩家必须选择并点击ACCEPT OFFER。
8. 毕业回宿舍，衣服/书/充电器/文件/用品装箱；23.0kg→再塞一件→23.8kg→拿出来→23.0kg。小迟背原双肩包，带箱子离开。结尾只显示留子号到站、余小迟2027、所接受学校及地区。

## 学校池（全部为本游戏虚构设定）

| 地区 | 学校 |
| --- | --- |
| 美国 | Paperbridge University / Cedarquay Institute / Cloudgrain University |
| 英国 | Mossquay University / Paperfen University / Cloudmere Institute |
| 澳大利亚 | Sunfold University / Reedbay Institute / Paperreef University |
| 中国香港 | 星埠学院 / 云汀大学 / 苇山学院 |

学校卡包含城市环境、生活成本感受、项目和课程特点；没有排名、概率、推荐、冲刺或保底。UI不使用真实学校Logo。

## 状态

abroadRegion、abroadApplicationMethod、abroadAgencyPackage、abroadIELTSAttempts、abroadIELTSScore、abroadIELTSQuizResult、abroadUploadedDocuments、abroadRecommendationChoice、abroadRecommendationReceived、abroadAppliedSchools、abroadApplicationResults、abroadAcceptedSchool。

地区和学校保存稳定id，显示名称由数据查表。与原检查点一起在事件完成后提交；关闭当前事件丢弃草稿，刷新回最近完成事件，避免半份材料或未确认Offer自动保存。initialRoute/currentRoute逻辑原样复用。

## 验收方法

自动化完整流程使用真实摇杆走现有地图，不传送。功能模式快速点击只验证可达性；阅读计时模式每秒6字、选项额外思考3秒，地区/方式卡停留6秒，学校卡12秒，每份文件寻找/拖动6.5秒。此计时是可复现模拟，不能替代真人阅读和手机手感。

验收覆盖1～8地区、9～15方式、16～25语言、26～43文件和老师、44～51学校、52～60等待/Offer、61～70行李结局、71～88节奏与回归。实测结果如下。

## 验收分组

| 编号 | 实现与检查 |
| --- | --- |
| 1～15 | 四个地区卡片与两种申请方式；基础/全程套餐；原车站留子号接入。 |
| 16～25 | 共用Quiz的3题，固定6.5/6.5；重考只用短片段到7.0，先申请为6.5。两条路径均走到结尾。 |
| 26～43 | 文件id到目标slot匹配；干扰文件、错误/取消、4/5和5/5、老师三个回复、最后文件手动上传。 |
| 44～51 | 每地区3所虚构学校，全部字段在数据中；选2所，无排名/概率。 |
| 52～60 | 双重Submit、自由移动等待、一次快递、主动打开两封结果、独立预设池、至少一个Offer、显式Accept。 |
| 61～70 | 保存接受的学校id；结尾查表显示对应学校及地区；23.0→23.8→23.0kg，原主角带箱子离开。 |
| 71～76 | 模拟阅读计时及实际试玩建议，只有一次完整语言Quiz，没有额外申请手续系统。 |
| 77～88 | 原系统复用；冻结文件哈希；三条旧路线、换乘、移动、车站回归；手机视口/触摸/Console检查。 |

物理手机上的握持手感、长文件名辨识、寻找正确版本的难度、等待节奏和新玩家的真实总时长，需要用户试玩确认。自动化手机视口和触摸注入不能替代真机。

## 实测结果（2026-09-27核对）

- Chrome：30项旧路线/通用系统回归通过；03A、03B（包括统一复试和换乘）、03C、站台、移动、碰撞、Onboarding均通过。
- 留学功能：DIY＋7.0重考、中介＋6.5先申请均到结尾；四地区卡片、基础/全程套餐、老师三种开场、单/双Offer显式接受验证通过。
- Chrome真实Touch事件注入：文件拖拽、点击替代、双指归属、pointercancel和页面不滚动通过。320×568、390×844、430×932文件面板检查通过。
- 完整DIY路径，从车站出发到结尾并检查刷新恢复：**373.092秒，即6分13秒**。
- 中介＋先申请路径：**329.584秒，即5分30秒**；这条计时从已选地区/申请方式的检查点开始，未包含车站走路和首次地区选择，因此不标为从车站完整计时。
- 计时采用说明中的阅读与寻找文件节奏；不是保证任何玩家都在5～7分钟完成。真人阅读、误拖、探索会改变时长。详见 [计时日志](PHASE03D_TIMING.txt)。
- 测试中修复了触摸提交跨面板时尾随click穿透的问题。另一次回归因并行测试共享的预览服务器先退出而中断，改为常驻服务器后重新通过；没有为此改动旧路线剧情。
- WebKit（Safari引擎）：4项留学测试通过，1项仅支持Chrome CDP的多指注入测试按预期跳过；该触摸测试已在Chrome单独通过。两条完整功能路径、地区/结果池/上传校验、手机尺寸、明确接受Offer均通过，未捕获新增Console或页面错误。已人工查看320px文件面板和结尾截图。
- 最终 `npm run build` 通过；`shasum -a 256 -c docs/phase03d-frozen.sha256` 全部通过，冻结剧情、地图、路线换乘、人物和输入文件保持一致。
- 当前预览 `http://192.168.110.117:5173/` 已返回HTTP 200。手机需与电脑同一局域网，电脑保持开发服务运行。首次体验可用无痕窗口，避免覆盖已有浏览器检查点。

需要人工试玩：小屏文件名是否清楚、换页找最终版文件是否自然、英文题目与材料阶段的节奏、等待是否过长或过短、实体手机的触摸手感及Safe Area。
