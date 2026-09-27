# Phase 04A — Route Data Audit

审计对象：当前 src/content 五路线、systems/events.ts、route-transfer.ts、LifeGame 原结尾。

| 路线 | 原有真实数据 | 已完成事件可证明的事实 | 不存在/不推算 |
|---|---|---|---|
| employment | targetIndustry / targetRole、applicationCount、interviewPrepChoice、jdFocus、friendReply、interviewChoices、quizResult | applications海投、mail邀请、assessment测评、friend无HC、preparation准备、interview面试、result阶段结果 | 无累计面试/邮件数量；不编造Offer。applicationCount确实在海投完成时写200，可显示 |
| postgrad | postgradTarget、MemoryQuizResult、EnglishQuizResult、OctoberChoice、Result | pg-memory、pg-english、pg-exam、pg-result | Quiz不决定结果；当前retest固定。旧adjustment等不解释成复试 |
| civil_service | First/Second/FinalJob、两次Filters、QuizAnswers/CompletedCount、EssayChoices、ExamOrder、First/SecondResult、InterviewChoices/Result | cs-national、cs-strategy、cs-interview、cs-first-day | 不将蒙太奇61/58/56转换成玩家成绩，不计算概率 |
| abroad | Region、ApplicationMethod、AgencyPackage、IELTSAttempts/Score、QuizResult、UploadedDocuments、RecommendationChoice/Received、AppliedSchools、ApplicationResults、AcceptedSchool | ab-teacher、ab-documents、ab-parcel、ab-accept、ab-pack | 无独立真实总花费；学校名通过已有学校数据解析。结果在申请时生成，完成路线后已查看 |
| gap | Actions、ActionCounts、SelfDescription、Experiment、TravelStyle、TravelItems、TravelStarted | gap-dinner、gap-experiment、gap-graduation、gap-message、gap-last-walk | idle次数不能换算成下午数量；普通project行动不等于untitled_project彩蛋 |

## 完成边界
- 五路线保留原结尾，原结尾后的“查看这一段人生”生成冻结快照。
- 考研stop走原returnToStation，属于transferred，不终结Run；不弹报告、不伪造进入复试。其选择及此前状态仍留在后续完成Run的快照。
- completed事件列表足够，无需新增剧情事件Flag。
- 新增runId/start时间仅是运行元数据。旧进度没有可靠开始时间，startedAt=null，不回填猜测日期。
- 本局一个sessionStorage结果槽；收好只改变记录状态，无列表、重开、跨局档案UI。
- report仅读取深拷贝并递归冻结的Snapshot。缺失数据不生成条目。
