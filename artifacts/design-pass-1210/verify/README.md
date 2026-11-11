# 复验工具（2026-11-08 设计整理）

均为本地无头 Chrome 脚本（CDP），使用独立配置目录和独立端口，不读取、不覆盖 8000 端口或线上的存档。Chrome 路径写死为 `C:/Program Files/Google/Chrome/Application/chrome.exe`。

## 启动预览

```sh
python -I serve.py 8791            # 多线程、长监听队列、no-store；根目录默认 D:\06_codex\transit\dist
# 浏览器打开 http://127.0.0.1:8791/test04/
```

Python 自带的 `http.server` 单线程，监听队列只有 5。页面有 31 个脚本，并发请求时可能拒绝连接，个别脚本加载失败，会表现为「xxx is not defined」之类的假报错。复验请使用 `serve.py`。

## 临时文件位置

浏览器临时配置默认放在项目根目录的 `.verify-tmp/`（D 盘，已通过 `.git/info/exclude` 排除，不会提交），不再使用系统 `%TEMP%`（C 盘）。可用环境变量 `VERIFY_TMP` 改到其他位置。截图输出目录也请放在 `.verify-tmp/` 下，用完删除。

## 场景

| 文件 | 内容 |
|---|---|
| `setupF.js` | 东部首局：无线路，首局引导开启 |
| `setupE.js` | 东部第 96 天：3 城 2 线，资金充足 |
| `setupLate.js` | 后期网络对照：西部盆地河谷 13 城 8 线，林溪镇 5 线共站、候车 181，按用户 2026-11-08 结束局的线路结构生成（跨河建桥要求只在生成场景时临时放宽） |

## 检查

```sh
node mkassert2.cjs                                    # 生成 scenA_E / scenA_F / scenA_L.json
SETUP=setupE.js    node tour.mjs out 390x844m scenA_E.json   # 股票页签、交易保留位置与股数、科研关闭、改名取消、地震行、半展开、设施条、活动卡
SETUP=setupF.js    node tour.mjs out 390x844m scenA_F.json   # 首局引导在查看城市时让开
SETUP=setupLate.js node tour.mjs out 461x709m scenA_L.json   # 线路托盘、候车表、多线选择、结束局
node e2e2.mjs out 390x844                             # 触摸端到端：点城、展开收起、多线选择、拉线报价、取消、建设、改名取消、资金→股票
B=0 node mouse.mjs 1440x900                           # 鼠标：镜头恢复、预览清理
node reload.mjs                                       # 带候车乘客的存档重新载入后，循环仍在运行（SLOW=150 模拟慢网络）
python -I cmpjpg.py out.jpg 0.5 "标签=a.png" ...       # 同倍率对比图
```

尺寸后缀 `m` 表示模拟手机（触摸、mobile）。`tour.mjs` 默认打开 `http://127.0.0.1:8791/test04/`，可用 `URL=` 改为其他端口，例如 8792 上的上游基线。
