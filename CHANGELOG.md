# 1.6.11 · 线路编辑、镜头与失守复盘

- 选择性适配 PR #4（MayRain-Meow）的镜头、交互与反馈改进，保留1.6.8的新地图判定、手动建桥和现有报价；不接入自动造桥或自动选桥。
- 线路详情新增多站移除和整线重画。先预览、后应用，保留编号、颜色与车辆；取消不改原线，撤回恢复线路与资金。移除端点清理桥头，保留中间已选桥梁；海运支持连续多港编辑。
- 竖屏整合菜单、车辆栏、提示与撤回入口。面板定位共享镜头恢复会话，手动移动或开始编辑会接管镜头；保持三图全图缩放范围。
- 未选中的线路按地图拖动，选中后才能从线段改线；新手教程保留原操作，海港连续拉线不受快速经过城市的停留保护限制。
- 满员预警显示按倍速换算的真实秒数，并避开边缘和邻近城市；记录实际扣命车站，结算与存档可查看最后失守原因和位置。
- 港口建造和开航入口前移到城市设施栏，明确单港不能开航、港口是本城附属；游戏结束后不能建港或开线。
- 活动邀请共用单次寻路缓存，减少重复计算；不改变概率、票价、港口和船舶价格。

# 1.6.10 · 赌城成就

- 新增三连好运（铜牌）、头等奖（金牌）、白忙一场（铜牌），成就总数38。
- 三连按一次有效下注结算判定，最高奖为C/C/C；至少下注一次且整场不盈利，实际离场才解锁白忙一场。
- 沿用跨局成就保存，不附加金钱奖励，不调整老虎机概率、倍率或离场结算。

# 1.6.9 · 隧道边缘、地图兼容与轮船汽笛

- 修补山体分块接缝和斜边的车辆遮罩余量；不改变山地判定、隧道费用或洞口渐进显隐。
- 保留1.6.8河岸拖桥、海运寻路、刷新及版本化存档；PR #4的旧自动桥逻辑未覆盖新系统。
- 运营轮船偶发汽笛，全船队共享90–180秒间隔；暂停、弹窗、后台、静音时停止，间隔不受倍速影响。
- 对三图进行工程、海港、多车载客、存档及遮挡自检。

# 1.6.8 — 地图重做、刷城与河岸交互

- 图一初始三城调整到同岸，第四城在河对岸出现，恢复先接三城、再架桥的教学顺序。
- 图二移除出生区域内的小支流，按标注调整三城；扩大地图范围，在山环外留出连续平原及出入口，重新筛选城市刷新与连接成本。
- 图三保留起始三城坐标；删除内陆河流，保留五大湖。拓宽西海岸、西南可用平原，岛屿不刷城市。采用覆盖完整新大陆的候选网格及分阶段扩张，先沿海、再中部、后北部。
- 图三西、南、东外海扩展600世界单位，同时纳入船舶寻路和镜头范围；北侧仍为延伸至边缘的大陆。修复边缘海湾被世界边界封闭导致港口断航的问题。
- 河流起手、吸附、跨河、桥长与教学提示统一使用真实水域边界；拖动固定起岸，终点吸附同一水域。桥长上限320，费用仍按原公式计算；双指缩放不会改动桥头。
- 放开缩小下限，整图可完整放入操作区域，定位不再强制放大。外围使用平滑氛围背景，不拉伸山脉或河流。
- 细化现代城市楼群，城市颜色与形状标记不变。恢复被城市绘制覆盖的农田，按新地形检查田块位置，并更新田埂、作物及生长阶段表现。
- 新绘图资源未就绪时保持加载界面，避免耗时生成旧地形。旧存档保留原地形与城市、线路；重新开始所选地图使用重做版本。

# 1.6.7 — 三图连续地形、现代城市与桥梁

- 三张地图采用各自完整的连续绘制地形，取消局部图片与旧底图叠接；镜头限制覆盖地图四边和四角。双洋大陆北面仍为大陆延伸至边缘。
- 新局启用与新绘图对齐的淡水、海岸及山脚边界；丘陵不要求隧道，山地要求隧道，车辆在物理山体内隐藏。海运继续绕陆并避开近岸岛屿。
- 城市建筑采用现代楼群，保留原有颜色、形状、选中圈和乘客标记；按最大规模建筑预留山脚及河岸空地。
- 公路桥与铁路桥统一更新桥面、桥墩、护栏与阴影；桥头须位于水域两岸，海洋禁止建桥。原价、桥头节点、复用与维护规则不变。
- 新局保存独立地形版本，旧存档继续采用原地形；需要重新开始所选地图才能体验新地形。已有线路与城市不强制迁移。
- 进入地图前等待资源和第一帧；新绘图资源加载失败时停留加载界面，避免画面与判定不一致。

# 1.6.6 — 多车载客、地图加载与赌场交互

- 修复同线车辆停站配置等效但存储不同而被排除载客的问题；上客按当前到站车辆计算可达行程，新投放陆空车辆立即执行首站上客。覆盖大巴、动车、高铁、飞机、小轮船、大轮渡。
- 新开局、继续和确认重开先显示地图加载界面，等待资源、存档、地形缓存及首帧准备好后再计时；固定异步加载期间选择的地图及重开状态。
- 图一画面维持原版；图二采用确认的环山五脉盆地画面并校准山脚，新旧地形按存档版本隔离；图三加入浅水区、绘制山地、连续丘陵和平滑五大湖。丘陵不收隧道，山地仍按物理范围判断。
- 图三底色预先生成，避免入场时逐像素计算地形；地图纹理仅作绘制缓存，不在每帧重建。
- 所有陆地车辆进入物理山体时逐像素隐藏，列车逐节遮挡；出洞恢复可见，河谷地面通道保留可见。
- 赌城每10天开放均使用大通知，同一开放周期只提示一次；移除小通知。正式入场后锁定面板，只有「带钱离场」结算并退出。
- 拉杆触摸与面板下滑隔离；加入低音量转轮声，三轮分别在0.8/1.25/2.05秒停下。资金与次数在动画前保存，防止刷新重复下注或结算。
- 图三新开局9000、大轮渡8000及其他既有经济、奖励概率保持原值。

# 1.6.5

- 拉杆红色手柄随触屏下移到底，停顿后弹回；短拉或取消不下注。
- 赌城首次可以进入时显示大通知，每局只提醒一次；之后保留小提示。
- 图三新开局9000元，旧存档余额保留；大轮渡8000元。
- 汇总1.6.1–1.6.4地图、港口附属城市、海运多站航线、重开与撤回修复。

# 1.6.4 — 重新开始、多港航线与宽弧海路

- 修复竖屏确认重新开始只接受前两图、第三图确认无反应；按注册地图校验，保留最高纪录及其他地图存档。
- 海运拖线经过中间港口时即时吸附，支持快速A→B→C连续规划；已有唯一海运线路的端港可直接继续延伸，无需新建线路或重复购买首船。
- 海运长直线增加缓弧，绕岬角先留出海面空间再扩大圆角。曲线采样逐段验证在海洋内，不安全时缩小弯道或保留已验证路径。航程、天气、绘制、点选及船舶移动共用曲线路径；选中海运线时镜头包含全部港口与外海弯道。
- 拉斯维加斯出现即免费建成赌场，无额外建成通知；首次出现后10天开放，之后每10天开放，旧未建赌场存档自动补齐，已建赌场及进行中场次保留。
- 保留海陆混合换乘修复、城市附属港口和8000元大轮渡。仅更新网页版，不上传GitHub。

# 1.6.3 — 海陆换乘异常修复

- 修复海运上下客只初始化路线缓存、遗漏陆路行程缓存，导致海运与大巴并存且有旅客选路时报错暂停。海运事务保留并恢复外层缓存。
- 海上航线绘制、点选与船舶显示共用连接港口圆标的全海洋路径，缩放后端点与标识仍一致；物理航程、天气及费用继续按固定码头计算。
- 港口仍属于城市，不新增城市或独立候车队列。圆标下显示所属城市候车人数/容量，点击港口打开同一城市详情，提示共用旅客、容量与任务。
- 保留港口圆标缩小20%、大轮渡8000元及现有存档。仅发布网页版，不上传GitHub。

# 1.6.2 — 地形重绘与港航连接修复

补充调整：港口圆标、锚图案及选中外圈整体缩小20%，保留原触摸吸附范围。

- 双洋大陆使用确认后的柔和海岸、西部棱面山峰和东部圆缓丘陵；丘陵与实际减速范围一起内移480，保留沿海城市空间。北部仍为延伸到地图边缘的大陆，主海湾、半岛与初始城市位置保留。
- 港口使用独立海侧锚形圆标，固定屏幕尺寸，扩大触控范围并避开城市节点。港口只吸附海运；城市节点用于陆地和航空。已有停靠点时阻止跨海陆切换交通类型。
- 港口起拖创建海运，选中海运线路后可从港口编辑；点击海上实际路径打开船队详情。最终海路、绘制与船舶移动均按全海洋折线，绕开大陆。
- 交通工具购买页加入轮船与专属图标；航线详情可投入库存或购买并增加多艘船，可回收后出售。大轮渡8000元、250人，与飞机同步解锁；出售4800元。小船2800元/60人、港口1500元及其他经济参数保留。
- 保留1.6.1日期、退款撤线、指针清理、沿海陆路绕行、Sphere与弹窗暂停恢复修复。

验证：完整回归通过；10组原生300天城市布局、三档缩放海陆吸附隔离、实际指针拖线/改线、点击航线详情、多船投入、海洋路径、旧码头迁移、沿海城市空间及390×844竖屏界面检查通过。

发布范围：仅更新网页版，不上传GitHub。

# 1.6.1 — 沿海线路与交互修复

- 日期单独占第一行，年份与补助信息并排放在下一行，年份不再拆行。
- 双洋大陆可视边界以海洋填满；平滑海岸转角，五大湖改为各自的不规则湖岸；山地改为带分支山脊的连续明暗地形，丘陵重新绘制，保留原城市坐标与地形通行规则。
- 沿海陆路在有限范围内寻找陆地绕行并平滑弯道，海洋仍不可架桥。预览、车辆、点击判定、距离费用、天气采样与隧道标识共用实际路径。搜索有节点/范围上限，静态海岸使用纬度索引和缓存。
- 松手、取消、应用和撤回时同步清除延长指针及线路绘制缓存；全额撤回先完成路线/车辆/工程回退，再退款一次。已经回收、出售或载客的新增线路无法重复全额退款。
- 拉斯维加斯Sphere增加球面明暗、LED点阵、底座和地面阴影，避让城市节点。
- 普通弹窗记录打开前暂停状态，关闭最后一个弹窗时恢复原状态与倍速；手动暂停、后台中断、教学和结束保护继续有效。

验证：旧功能回归、原生城市布局、海运与存档测试，以及新增沿海绕行、真实建线/退款、指针清理、嵌套弹窗状态专项测试；浏览器核对日期、海岸及Sphere效果。未改变经济参数，未同步GitHub。

# 1.6.0 — 双洋大陆与港航

- 第三图：东南三城、东西海岸、中央平原、西部山地、五大湖，独立存档。8000元开局，第一年6月1日，日期显示年份。
- 第4/5/6城：第10/20/30天；第7—12城每8天，第13—24城每10天，之后每12天。沿海优先，再中央平原、北方。第10城固定拉斯维加斯，选址随机。
- 港口1500；小轮船2800/60人，速度20；大轮渡10000/250人，速度12，与飞机实际解锁条件同步。海路建线与航行免费，绕开陆地；五大湖禁港，海洋禁桥。
- 到港先下后上，逐人核销。小船下8/上20人每秒，大轮渡下20/上50；不等满员。旅程目的地符合港口城市时直接完成，否则正常换乘。
- 第一年无台风；以后夏季3—4次，范围内轮船速度−10%。12—2月寒潮北向南，空间边缘及时间后期渐弱，持续4.8—7.2天；公交受影响最大，动车高铁较轻，轮船不受寒潮影响。
- 科研与天气并排，6所大学解锁。现有研究保留，新增两种船的速度研究（＋15%），无船舶容量研究。
- 拉斯维加斯保留旅游属性与正常客流，使用球体城市外观，顶级免费获得一级枢纽。
- 赌城造价100，每10天开放1个游戏日，可选参加；自选带入和下注，最多10次，可提前退出。触屏下拉拉杆，有机械感及中奖声音。七种符号独立等概率；恰好一对总返还2倍，三同柠檬/大巴/动车/轮船/飞机/金币/C分别3/4/5/6/8/12/30倍，理论返还率320/343。资金和结果在动画前一起保存，刷新不重抽。
- 大巴同一线路同一路段双向合计上限8/12/16辆；不同线路独立。车辆页新增回收、库存出售，原价60%，整列包括加装车厢。
- 新增3项海运成就、3项股票实际累计买入金额成就、8架飞机同时飞行成就；旧成就保留。
- 普通城拥挤160秒/旅游205秒，低于容量渐恢复，80%以下双倍恢复，活动乘客不计压力。活动罚款按星级上限800/1000/1200/1600/2000/2400，保护活动保留较低处罚，按缺口扣款。
- 修复城市触控圈被临近线路抢占、理财入口卡在收益记录；图二第4城出现后20天出第5城。地形缓存包含边界、面片边缘补绘，河网绘制改为版本键与路径缓存。

验证：旧地图交通、触摸、生命周期、地形、音效、金融回归；10组第三图300天城市布局；海洋路径、逐人结算、真实建线/读档、道路名额、出售及赌城概率/余额持久化。
上述布局验证不是新版本完整经营存活率回测。默认船速、装卸速度、科研费用和寒潮参数沿用最近讨论方案，仍需真机试玩检验体感。

# v1.5.14 — Four financial return achievements

Add gold stock achievements 幸运儿 (+15% held return) and 险些腰斩 (30% held loss), plus silver wealth achievements 靠谱的经理 (+15% per-lot return) and 打水漂 (30% per-lot loss). Each uses the current position cost or original lot principal, requires an actual holding, unlocks without sale/redemption, and persists across runs under the existing achievement key. Daily settlement and pre-transaction synchronization retain threshold crossings. Existing music and sound behavior remain unchanged.

# v1.5.13 — Felicity background music

Use the uploaded Felicity MP3 in one looping player shared by map selection and gameplay. Start after a user interaction, keep playback position across screens, and pause in background/native interruptions. Add separate remembered music on/off and volume controls alongside existing effects.

# v1.5.12 — Join interior ridges to the basin rim

Extend the outward end of each of the five interior mountain groups until its physical footprint overlaps an outer mountain ridge. Choose junctions away from river valleys, preserve the inner tips, broad intervening valleys and the expanded outer ring. Rendering, city exclusion and tunnel calculation share the same polygons. Terrain revision 3 applies to new western games; earlier saves retain their exact terrain and construction.

# v1.5.11 — Quiet card flip and rarity effects

Play a short paper flip only when an unrevealed activity card is actually revealed. Five- and six-star cards get a quiet delayed chime. Opening or revisiting cards, accepting and failed activities remain silent. Reveal-all softly staggers the flips and plays at most one rarity chime. Card sounds use 30% of the existing effects volume, share its mute switch, and stop/cancel pending chimes on background interruptions. Original generated WAV assets, no external music or audio dependency.

# v1.5.10 — Restore the interior mountain groups

Restore all five interior ridges within the expanded western basin. Four are spaced farther apart, keeping broad intervening plains; the original opening ridge and the expanded outer mountain ring are unchanged. The drawing, city collision and tunnel quote use the same restored footprints. New western games use terrain revision 2; older saves retain their exact terrain and existing construction.

# v1.5.9 — Tutorial circles follow visible roads

Deletion demonstrations follow the rounded lane geometry from the end city through the prior city and slightly along the remaining road. Reconnection circles sit on the actual drawn road outside station hit areas, replacing the midpoint of the invisible straight chord. Both cues share the same road geometry used by rendering and interaction, and follow camera pan/zoom. Tutorial steps and construction behavior are unchanged.

# v1.5.8 — Western basin, regional disasters and clearer controls

New western games use an expanded mountain ring with fewer internal ridges. Existing western saves retain their original terrain, cities and construction. Full-bounds terrain tiles display the expanded footprint, and path caches clear on geometry changes. West has no typhoons (including previously scheduled events); eligible daily earthquake probability is 2%, versus east 0.8%, retaining day 150, rail, six connected cities and the 80-day cooldown.

Simultaneous facility unlocks share one notification with individual destinations. Rain and fog have bounded animated effects clipped to their actual circular influence, using simulation time and no simulation RNG. The exit sheet offers Continue or Save and return to maps; continuing restores the prior pause state and honors background interruption.

# v1.5.7 — Sound on city snap

Move the connection effect from construction confirmation to the accepted city snap while dragging. New lines and either-end extensions sound as each city joins the draft. Hover repeats, pointer release over the same city, bridge endpoints, rejected snaps, removal, cancellation and construction confirmation do not produce an extra sound. Effects settings and background protection are retained; music remains deferred.

# v1.5.6 — Connection feedback, music deferred

Successful new routes and extensions play the previously auditioned 0.24-second soft connection sound once after construction commits. Quotes, cancellation, insufficient funds, invalid routes, unchanged edits and stop removal are silent. Sound effects have their own toggle and volume in a compact settings sheet, remembered across both maps and reloads. Hidden pages and native background transitions stop playback; playback/storage failures cannot interrupt construction. Background music and its MP3 are excluded from this release.

Validation: complete existing gameplay suite plus successful/failed commit sound, preference persistence, rejected playback, touch/pan/zoom and interruption save/resume checks. Browser QA is recorded separately; no APK in this release.

# v1.5.4 — Both-map river rendering hotfix

Reproduced an inward extrapolation caused by endpoint spline overshoot: the first two nearby samples can point opposite the outward river heading. East tributaries that should extend eastward instead extended across the whole map to the west; the same estimator affected western paths. The heading now uses a meaningful 96-unit span and must point outward. Exactly recognized v1.5.3 additions are removed from saved geometry before safe extrapolation; all original centerline samples remain unchanged. Regression coverage reproduces the old reversed east tributary and checks both maps, including a genuinely constructed bridge and route through repair and save/load.

Moved the complete river network into one final drawing pass shared by both maps. Cached terrain tiles now contain land, hills, trees and valley clearance only; the scenic apron no longer draws a second water network. The final pass reads exactly the active main and tributary coordinates used by saved river paths and collision segments. Each tributary has a separate subpath and all bank/water layers are painted across the entire network in order.

Terrain caches are also keyed by map identity, bounds and river coordinates, preventing a cached tile from a previous geometry or map from surviving a load or switch. No city, line, bridge, terrain collision, economy or stored river coordinate is relocated by this rendering patch.

Validation: recorded Canvas calls on both east and west assert exactly one visible water pass, no cached water, correct separate subpaths, matching active coordinates, save/load preservation, cache reuse on unchanged geometry and automatic replacement on geometry changes. Existing gameplay regressions retained. Browser checks cover both maps in portrait. Web only; no APK.

# v1.5.3 — Portrait map and continuous drawing revision

Expanded the western spawn bounds to (-1300,-450)–(1500,1650), chiefly adding outer and southern plains. Central mountains, initial three cities, 7000 opening funds and the 5670 first-route quote are unchanged. Extended every open river end beyond the full movable scenic apron on both maps, preserving existing centerline coordinates and confluences for saved bridges.

Minimum zoom now retains vertical as well as horizontal pan room. Camera clamping uses the same scenic bounds as rendering, and same-width browser toolbar height changes no longer reset the player camera. Outer scenery fills the entire visible view; cached tree positions avoid repeated river-distance work on every frame.

New city groups must have usable width and two-dimensional spread rather than merely enough candidate towns in a narrow row. Local additions favor filling the group's short axis, retaining spacing, terrain, ownership, initial spawn dates and existing east/west maturity requirements. Existing towns are not relocated.

Continuous gestures retain each newly attached stop when extending either end of an existing line. A direct pass through a station center attaches immediately; the broader touch halo retains its dwell guard. Bridge selection and route confirmation rules remain unchanged.

Validation: full transport, opening costs, save/load, 400-day geometry growth, finance briefs, onboarding, map selection, runtime recovery and continuous pointer-drag regression suite. Browser QA at 390×844 covers portrait rendering and native vertical panning. No APK or survival-rate fitting in this revision.

# v1.5.2 hotfix

Reproduced a four-town opening with no valid short-range local spawn candidates (seed 10, fourth town -80,740). Only when the standard initial-circle pool is empty, widen the same-circle local search from 330 to 460 units, then at most 600 with center radius 760 if that pool is also empty; prefer the nearest valid sites, retaining buildability, city spacing, bridge/tunnel cost tier and region ownership checks. Existing trapped saves can continue; nominal spawn dates are unchanged.

The selector now handles raw TouchEvents from start to finish and suppresses the browser's default gesture in this area. Horizontal dragging and vertical card scrolling are both direction-locked; pointercancel from a companion pointer stream cannot discard a TouchEvent swipe. Mouse/pen, buttons and keyboard selection remain available.

# v1.5.1 hotfix

Fixed the construction preview crash introduced when PR #4 called the missing orientation helper `uprightHere` in the fixed-portrait integration. Removed that redundant orientation call; the camera remains unrotated. Reproduced the original ReferenceError before the fix. Added actual pointer-drag, preview/frame, build and save/load regression coverage on both maps.

Added explicit map-selector horizontal pointer dragging, directional lock, snap on release, post-drag click suppression and cancellation cleanup. Vertical card scrolling remains native. Confirmed both directions using browser mouse drags; real mobile touch remains a device-test limit.

No save clearing or economic changes.

# v1.5.0 — Web preview

Integrated PR #4 (a10aef5) presentation, route service commit, camera and state-scoped drawing cache changes with the deployed 25068a1 basin/transport branch. The portrait shell and actual mountain/tunnel collisions remain authoritative. PR #4 remains separate from the public repository merge workflow.

Investment and farm results now use one nonblocking bottom brief above the current network tray. The slot coalesces results, defers during gestures and construction drafts, expires after four wall-clock seconds, retains an unread funds badge, and stores up to 80 report records. Details remain available in the funds ledger. Empty holdings and zero profit do not generate earnings briefs. Explicit construction unlocks and activity offers retain their existing notification rules. Farm credits settle exactly once with no pending acknowledgement gate. Clicking details pauses; closing restores the prior running state, except after a real background interruption.

Preserved: west 7000 opening, east 5000, central basin/southeast gap/outer plains, paid tunnels, gradual city clusters, interchangeable normal destinations, exact special passengers, necessary transfers, directed bus loops, six-star card scrolling and fixed actions. No economy, returns, event chances or passenger growth tuning in this release. No APK built.

Validation: deterministic full-script transport, basin opening/paid quote/save/load/growth, real finance and farm settlement, brief merging/expiry/defer/pause restoration, PR route commit and map-switch drawing cache regressions. Browser checks at 390×844 and 360×740; mouse-driven checks do not replace physical-device touch testing.
