<div align="center">
  <img src=".github/assets/app.png" alt="Token Monitor logo" width="120">
  <h1>Token Monitor Replica</h1>
  <p>Token Monitor 的下游自用 fork / A downstream personal fork of Token Monitor</p>
  <p>
    <a href="#中文">中文</a> · <a href="#english">English</a>
  </p>
  <p>
    <a href="https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases"><img src="https://img.shields.io/github/v/release/MarbleGateKeeper/token-monitor-ver.replica?include_prereleases&style=flat-square&label=replica&color=22c55e" alt="Replica release"></a>
    <img src="https://img.shields.io/badge/version-0.42.1--replica.2-64748b?style=flat-square" alt="Version 0.42.1-replica.2">
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-A855F7?style=flat-square" alt="MIT License"></a>
  </p>
  <img src=".github/assets/demo.gif" alt="Token Monitor demo">
</div>

> [!IMPORTANT]
> 本仓库是 [Javis603/token-monitor](https://github.com/Javis603/token-monitor) 的下游 fork，不是上游官方发行版。本 fork 的源码、问题反馈、Release 和更新提示均位于 [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica)；Release 不提供预构建应用。
>
> This repository is a downstream fork of [Javis603/token-monitor](https://github.com/Javis603/token-monitor), not an official upstream distribution. Source, issues, releases, and update notices for this variant belong to [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica).

## 中文

### 项目关系

- **上游项目：** [Javis603/token-monitor](https://github.com/Javis603/token-monitor)，提供 Token Monitor 的主体架构、采集器、桌面组件、多设备 Hub、AI 工具额度和绝大多数功能。
- **本仓库：** [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica)，用于保留个人需要但尚未进入上游的修复与功能。
- **Git 远程：** 通常以 `upstream` 跟踪原项目，以 `origin` 跟踪本 fork。同步上游时应先审阅差异，再保留下文列出的 fork 功能。
- **版本规则：** 使用 `<上游版本>-replica.<修订号>`，例如当前版本 `0.42.1-replica.2`。同一上游版本继续发布时递增修订号；同步到新的上游版本后从 `replica.1` 重新开始。
- **更新来源：** 应用只把本 fork 的 `*-replica.N` Release 当作可用版本；同时独立查询上游最新 Release，用于提醒维护者何时需要同步上游。两类提醒都只打开对应 Release 页面，不会下载或安装更新。
- **许可与署名：** 代码继续使用上游的 MIT 许可证，保留原作者 Javis 的版权声明；打包产物会携带完整 `LICENSE`。

### 本 fork 的功能改动

#### 1. 修复 Kimi Code 的 K3 模型识别

上游能够将 `kimi-k3` 识别为 Kimi 模型，但 Kimi Code 官方工具直接上报的以下模型 ID 原本会落入未知供应商：

- `k3`
- `k3-256`

本 fork 在模型供应商分类中将这两个精确 ID 识别为 Kimi，因此模型配色、图标选择和相关展示与其他 Kimi 模型保持一致。

#### 2. 补齐 LongCat 与 Hy3 的厂商识别

- [美团 LongCat](https://github.com/meituan-longcat) 系列（例如 `LongCat-Flash-Chat`、`LongCat-Flash-Thinking-2601`、`LongCat-2.0`）识别为 **Meituan**。
- [腾讯 Hy3](https://github.com/Tencent-Hunyuan/Hy3) 系列（例如 `hy3`、`hy3-fp8`）以及带 `Tencent` / `Hunyuan` 命名空间的模型识别为 **Tencent**。

识别规则不区分大小写，并要求 `LongCat` / `Hy3` 出现在完整的模型名分段中，避免仅因名称中偶然包含相同字符而误判。两个厂商都有独立的默认配色，也会出现在 **设置 → 外观 → 厂商颜色** 中供手动调整。

模型列表会分别使用 LongCat 与 Tencent 标志，并通过 CSS 遮罩染成当前厂商颜色；因此默认显示美团黄与腾讯蓝，手动调整厂商颜色后图标会同步变化。新增 SVG 来自固定版本的 MIT 许可 [Lobe Icons](https://github.com/lobehub/lobe-icons)，来源、许可证文本和商标用途声明见 [`assets/icons/THIRD_PARTY_NOTICES.md`](assets/icons/THIRD_PARTY_NOTICES.md)。

#### 3. 增加手动模型映射

在 **设置 → 采集 → 模型映射** 中，可以把多个本质相同的模型 ID 合并到一个规范名称，例如：

```text
k3       → kimi-k3
k3-256   → kimi-k3
```

映射规则具有以下约束：

- 源 ID 精确匹配，但不区分大小写，不会误合并仅仅包含相同片段的其他模型。
- 支持多条规则汇聚到同一个目标，并解析映射链。
- 拒绝重复源和循环映射。
- 合并仪表盘、设备、模型、会话、成本、缓存、输出 token、历史趋势和导出中的模型维度数据。
- 后续本机采集会按映射链最终目标的价格为源 ID 计费；解析结果缓存在 Tokscale 托管定价旁车文件中，只有映射、自定义价格或应用定价版本变化时才重新查询，不会在每次启动重复查询。
- 不改写采集器原始数据、Hub 设备记录或保留的原始统计快照；删除映射后即可恢复原始模型拆分。
- 不自动扫描或重算已经进入会话保留归档的数据；需要修正旧费用时应执行一次性迁移。

#### 4. 仅提示新 tag，不自动更新

应用启动后和手动检查时会查询本仓库最新的 GitHub Release。本 fork 的更新通道只接受 `<上游版本>-replica.<修订号>`：同一基础版本按 replica 修订号比较，基础版本不同时先比较上游版本。因此 plain 上游 `0.42.0` 永远不会被视为高于同一基础版本的 `0.42.0-replica.N`；只有更高的 replica 修订号或基于更高上游版本的 replica Release 才会触发本 fork 更新提示。

上游 [Javis603/token-monitor](https://github.com/Javis603/token-monitor) 使用独立检查和独立提醒。它把当前安装版本与本 fork 最新 replica Release 中较高的基础版本视为“本分支已跟进版本”；只有上游版本真正更高时才显示橙色“上游”提示，提醒维护者同步本分支。该提示可以单独忽略，也可直接打开上游 Release。项目不包含应用更新器，不会在后台下载安装包，也没有“重启安装”流程。

#### 5. 区分厂商默认配色

本 fork 调整了容易挤在黑色附近的默认厂商色，并让同一厂商的客户端、模型和额度入口保持一致：

- OpenAI / Codex：`#007CCB`
- 智谱 GLM / Z.ai / ZCode：`#3859FF`
- Kimi / Moonshot：`#1783FF`
- Grok / xAI：`#64748B`
- OpenCode：`#B85F00`

这些值只作为新默认值；用户在 **设置 → 外观 → 厂商颜色** 中已经保存的覆盖值不会被改写。智谱与 Kimi 采用各自视觉体系中的蓝色；Grok 的石板灰与 OpenCode 的琥珀橙是为了界面辨识度选择的中性色和产品提示色，不宣称为官方 Logo 品牌色。

OpenAI 的蓝色用于图表、色点和统计数据。根据 [OpenAI 品牌规范](https://openai.com/brand/)，Blossom 标志本身保持黑白，并直接显示 SVG，而不再作为 CSS 遮罩染成厂商色；深色和浅色主题会选择相应的单色呈现。

#### 6. 工具页内嵌模型用量

**工具**视图会在每个工具的进度条下方列出该工具使用过的全部模型，并按 Token 用量从高到低排列。模型名较长时会在窄窗口中省略显示，悬浮或辅助技术仍可读取完整名称和精确 Token；手动模型映射会在生成列表前合并等价模型。该列表直接复用现有 `clientModels` 统计，不增加采集或 Hub 协议字段，并按模型 ID 增量复用界面节点，避免每次实时刷新重建完整列表。

#### 7. 按主导模型标记主页活动

主页活动热力图继续使用用户选择的 Token 或费用强度作为填色，同时以当天 Token 用量最高模型的颜色绘制两 CSS 像素轮廓；悬浮提示会显示对应模型名。轮廓位于热度填充和聚光高亮之后的独立顶层，直接使用当前厂商色或用户覆盖色，因此不会被蓝色方格遮盖，也不会通过明暗混色改变 Claude 橙等原始颜色。颜色通过应用 CSP 允许的 SVG 属性传入，而不是会被拒绝的内联 `style`；同色日期会合并成一条 SVG path，以控制节点数量。今天使用实时模型统计，历史日期使用已经存在的逐日模型明细，并缓存主导模型结果，因此不需要增加网络负载，也不会在每次统计刷新时重新扫描全年模型。缺少模型明细的日期保持无描边。

#### 8. 补全更多工具的项目归属

Tokscale 继续负责 Token、费用、模型和会话 ID；本 fork 在本机增加独立的会话元数据补全层，将这些会话 ID 与工具已经保存的工作目录相匹配。它通过受限的目录结构、最多 64 KiB 的 JSON/JSONL 元数据前缀或只读 SQLite 查询，为 Grok Build、ZCode、Pi / Oh My Pi、CodeBuddy、OpenCode、Hermes、WorkBuddy、Qwen Code 和 Kimi Code 补全项目归属，不会解析或重新计算 Token，也不会增加 Tokscale 子进程、网络请求或 Hub 字段。

项目路径在采集进程内立即转换为哈希 ID 和末级目录名，原始绝对路径不会进入设备记录。Kimi Code 按 `wd_<名称>_<哈希>` 工作区目录生成稳定的项目名称和不透明 ID，不依赖或声称还原绝对路径；CodeBuddy 只有日志明确包含 `cwd` 时才归属项目，粗粒度 IDE 日志不会被伪装成项目。Windows 对运行中 WSL 的文件型来源仍可补全项目，而 OpenCode、Hermes 等 SQLite 工具继续需要在 WSL 内运行 headless agent。

完整扫描还会使用同一个本地解析器回填会话保留归档，以及已经从跟踪列表移除工具的归档副本，并将补全后的哈希 ID 和标签写回本地归档；因此仍有对应源元数据的历史会话不必重新出现在 Tokscale 结果中。已经被工具删除或轮转、且归档中从未保存项目身份的源记录继续保持未知。实时监听 tick 不重复扫描历史归档。

### 本 fork 的发行与维护改动

- 应用和 Worker 版本统一使用 `replica` 后缀。
- GitHub 仓库链接、更新提示和发行模板全部指向本 fork。
- 本 fork 更新和上游同步提醒是两个独立通道；plain 上游版本不会进入 replica 更新通道。
- 推送 `v*-replica.*` tag 时，GitHub Actions 只创建 latest Release 并使用仓库内的发行说明；plain 上游 tag 不触发本 fork Release，也不会构建或上传安装包、应用压缩包、更新元数据和 blockmap。
- GitHub 自动显示的 “Source code (zip/tar.gz)” 是平台生成的源码快照，不是可直接运行的应用。
- 由于仓库不发布二进制更新，发行流程不需要 Windows/macOS 代码签名凭证。
- 根 MIT 许可证作为可见的 `resources/LICENSE` 随桌面应用分发。
- 仓库只维护这一份中英双语主 README，不再同步多份语言副本。

### 功能概览

Token Monitor 是一个本地优先的 Electron 桌面组件，用于汇总 AI 编程工具的 token、成本、会话、模型和账号额度。下方工具表列出 28 种工具，其中 21 种提供 token 用量，18 种提供 AI 工具额度。

- 实时扫描本机日志，并在数秒内刷新用量。
- 按工具、设备、模型、会话、项目和账号拆分。
- 显示输入、输出、缓存命中和成本。
- 保存历史趋势、活动热力图并导出 CSV/JSON。
- 支持本地模式、内置 Hub、Node Hub 和 Cloudflare Worker 多设备同步。
- 提示词、回复、源代码和文件内容不会上传到项目维护者。
- 项目补全只在本机读取工具保存的目录、结构化元数据前缀和只读数据库字段；原始项目路径会先哈希，再进入现有本地或 Hub 统计流程。

### 安装与更新

本 fork 不提供预构建应用。如需使用，请下载或克隆仓库源码，在目标操作系统上按照下方“从源码运行与构建”操作。[GitHub Releases](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases) 只用于版本 tag、发行说明和源码快照。

需要注意：

- 本 fork 与上游沿用相同应用 ID 和数据目录，因此安装时会被系统视为同一个 Token Monitor，而不是并排安装。
- 自行本地构建的 Windows EXE 默认没有 Authenticode 签名，Windows 可能显示 SmartScreen 警告。
- 应用只提示新版本并打开 Release 页面，不会自动下载或安装；更新时请自行获取新源码并重新构建。

首次启动默认进入本地模式，无需 Hub 或配置文件。打开 **设置 → 采集** 选择要跟踪的工具；账号额度、凭证和登录入口位于 **AI 工具额度（提供方选择、额度与凭据）**。

### 多设备同步

选择一种 Hub，并让所有设备连接到同一 URL 和密钥：

- **内置 Hub：** 在一台常在线设备中选择“在此设备托管 Hub”。
- **Node Hub：** 复制 `.env.example` 为 `.env`，设置 `TOKEN_MONITOR_SECRET`，然后运行 `npm run hub`。
- **Cloudflare Worker：** 参考 [worker/README.md](worker/README.md) 部署。
- **无界面设备：** 使用 `npm run agent`；单次采集可使用 `npm run agent:once`。

### 设置、数据与隐私

- 完整 GUI、环境变量和优先级说明见 [配置参考](docs/configuration.md)。
- **WSL：** Windows 会自动合并运行中 WSL 发行版的文件型用量；OpenCode、Hermes 等 SQLite 工具需要在 WSL 内运行 headless agent，见 [WSL SQLite 指南](docs/wsl-sqlite-setup.zh-CN.md)。
- 导出格式见 [docs/export.md](docs/export.md)，Hub 协议见 [docs/API.md](docs/API.md)。
- 隐私与联网行为见 [docs/privacy.md](docs/privacy.md)。

应用数据目录：

| 平台 / Platform | 路径 / Path |
|---|---|
| Windows | `%APPDATA%/Token Monitor/` |
| macOS | `~/Library/Application Support/Token Monitor/` |
| Linux | `~/.config/Token Monitor/` |

### 从源码运行与构建

需要 Node.js 22.13 或更高版本，并应在目标操作系统上构建：

```bash
npm ci
npm start
npm run verify

npm run dist:win      # Windows x64 installer + portable
npm run dist:mac      # macOS arm64
npm run dist:mac:x64  # macOS Intel x64
npm run dist:linux    # Linux x64 AppImage
```

输出位于 `dist/`，仅保留在本机，不会被 Release 工作流上传。默认本地构建不要求签名：Windows 可能显示 SmartScreen 警告，macOS 也可能因未签名、未公证而触发 Gatekeeper；如需对外分发，请自行配置相应平台的签名与公证。

---

## English

### Relationship to upstream

- **Upstream:** [Javis603/token-monitor](https://github.com/Javis603/token-monitor) provides the core architecture, collectors, desktop widget, multi-device Hub, AI Tool Limits, and most product functionality.
- **This repository:** [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica) carries personal fixes and features that have not been incorporated upstream.
- **Git remotes:** `upstream` normally tracks the original project and `origin` tracks this fork. Review upstream changes before merging and preserve the fork behavior documented below.
- **Versioning:** releases use `<upstream-version>-replica.<revision>`, currently `0.42.1-replica.2`. Increment the replica revision on the same upstream base; restart at `replica.1` after adopting a new upstream version.
- **Updates:** only this fork's `*-replica.N` Releases enter the fork update channel. The app also checks upstream independently to tell maintainers when the fork needs syncing. Both channels only open their matching Release page and never download or install updates.
- **License and credit:** the upstream MIT license and Javis copyright notice are preserved, and packaged applications include the complete `LICENSE`.

### Functional changes in this fork

#### 1. Kimi Code K3 model recognition

Upstream recognizes `kimi-k3` as Kimi, but the official Kimi Code tool can report these direct model IDs:

- `k3`
- `k3-256`

This fork classifies both exact IDs as Kimi models, keeping vendor colors, icon selection, and related presentation consistent with other Kimi models.

#### 2. LongCat and Hy3 vendor recognition

- The [Meituan LongCat](https://github.com/meituan-longcat) family, including names such as `LongCat-Flash-Chat`, `LongCat-Flash-Thinking-2601`, and `LongCat-2.0`, is classified as **Meituan**.
- The [Tencent Hy3](https://github.com/Tencent-Hunyuan/Hy3) family, including `hy3` and `hy3-fp8`, plus models carrying a `Tencent` or `Hunyuan` namespace, is classified as **Tencent**.

Matching is case-insensitive and requires `LongCat` / `Hy3` to occupy a complete model-name segment, avoiding accidental substring matches. Both vendors have distinct default colors and appear under **Settings → Appearance → Vendor colors** for manual customization.

Model rows use the LongCat and Tencent marks as CSS masks tinted with the active vendor color. They therefore default to Meituan yellow and Tencent blue and follow any manual vendor-color override. The added SVGs come from a fixed version of the MIT-licensed [Lobe Icons](https://github.com/lobehub/lobe-icons); source, license text, and the trademark-use notice are recorded in [`assets/icons/THIRD_PARTY_NOTICES.md`](assets/icons/THIRD_PARTY_NOTICES.md).

#### 3. Manual model mappings

Use **Settings → Collection → Model mappings** to merge equivalent model IDs into one canonical name:

```text
k3       → kimi-k3
k3-256   → kimi-k3
```

Mapping behavior:

- Source IDs use exact, case-insensitive matching.
- Multiple sources may converge on one target, and mapping chains resolve to their final target.
- Duplicate sources and cycles are rejected.
- Model dimensions are combined across dashboards, devices, models, sessions, costs, cache metrics, output tokens, history, trends, and exports.
- Future local collection prices each source ID through the final target of its mapping chain. Resolved aliases are cached beside Token Monitor's managed Tokscale pricing and are looked up again only when mappings, custom prices, or the app pricing revision changes—not on every startup.
- Collector output, Hub device records, and retained raw snapshots are not rewritten, so removing a mapping restores the original split.
- Retained session archives are not scanned or repriced automatically; correcting old costs remains an explicit one-off migration.

#### 4. New-tag notices without automatic updates

On startup and on manual checks, the app queries this repository's latest GitHub Release. The fork channel accepts only `<upstream-version>-replica.<revision>` tags: replica revisions are compared within the same upstream base, while different bases compare by upstream version first. Consequently a plain upstream `0.42.0` never outranks any `0.42.0-replica.N` build; only a higher replica revision or a replica Release based on a newer upstream version triggers the fork notice.

The upstream [Javis603/token-monitor](https://github.com/Javis603/token-monitor) check has independent state and UI. It treats the higher base from the running build and the latest fork replica Release as the version already tracked by this branch. An orange Upstream notice appears only when upstream is genuinely newer, can be dismissed separately, and opens the upstream Release. The application updater, background downloads, and restart-to-install flow remain removed.

#### 5. Distinct default vendor colors

This fork separates defaults that otherwise cluster around black and keeps client, model, and limits entries for the same vendor aligned:

- OpenAI / Codex: `#007CCB`
- Zhipu GLM / Z.ai / ZCode: `#3859FF`
- Kimi / Moonshot: `#1783FF`
- Grok / xAI: `#64748B`
- OpenCode: `#B85F00`

These are new defaults only; saved overrides under **Settings → Appearance → Vendor colors** are not rewritten. Zhipu and Kimi use blues from their visual identities. Grok slate and OpenCode amber are neutral/product cues chosen for UI differentiation and are not presented as official logo brand colors.

OpenAI blue is used for charts, dots, and statistical data. Following the [OpenAI brand guidelines](https://openai.com/brand/), the Blossom mark itself stays monochrome and is rendered directly from the SVG instead of being colorized through a CSS mask; dark and light themes select the corresponding monochrome presentation.

#### 6. Per-tool model usage lists

The **Tools** view lists every model used by each tool directly below its usage bar, ordered by token usage. Long model IDs are truncated in narrow windows while hover and assistive text retain the full ID and exact token count; manual model mappings merge equivalent IDs before the list is built. The list reuses the existing `clientModels` statistics without adding collection or Hub protocol fields, and reconciles rows by model ID so live refreshes do not rebuild an unchanged list.

#### 7. Dominant-model outlines on Home activity

The Home activity heatmap keeps the selected token- or cost-intensity fill and adds a two-CSS-pixel outline using the color of the model with the most tokens on that day. Its hover tooltip also names that model. The outline is drawn in a dedicated top layer after the intensity fill and spotlight highlight, using the current vendor color or user override directly, so blue cells cannot cover it and hues such as Claude orange are not altered by contrast mixing. Colors travel through SVG attributes allowed by the app CSP rather than a rejected inline `style`; dates with the same color are combined into one SVG path to keep the node count bounded. Today uses live model totals, while past days use the existing daily model breakdown and cache their winner, adding no network payload and avoiding a full-year model scan on every stats refresh. Days without model detail remain unoutlined.

#### 8. Project attribution for additional tools

Tokscale remains responsible for tokens, cost, models, and session IDs. This fork adds a separate local metadata layer that joins those session IDs to working directories already stored by the tools. Bounded directory layouts, at most 64 KiB of JSON/JSONL metadata prefixes, or read-only SQLite queries provide project attribution for Grok Build, ZCode, Pi / Oh My Pi, CodeBuddy, OpenCode, Hermes, WorkBuddy, Qwen Code, and Kimi Code. The layer neither parses nor recalculates token usage and adds no Tokscale subprocess, network request, or Hub field.

Project paths are converted inside the collector to hashed IDs and final-directory labels, so raw absolute paths never enter device records. Kimi Code derives a stable label and opaque ID from its `wd_<name>_<hash>` workspace directory without depending on or claiming to recover an absolute path. CodeBuddy is attributed only when a record contains an explicit `cwd`; coarse IDE logs remain unknown. Windows can still enrich file-backed sources inside running WSL distributions, while SQLite-backed tools such as OpenCode and Hermes continue to require a headless agent inside WSL.

Full scans also use the same local resolver to backfill the retained-session archive and archived copies of tools removed from the tracking list, then persist only the resulting hashed IDs and labels. Historical sessions therefore do not need to reappear in Tokscale output while their source metadata still exists. Records already deleted or rotated by a tool remain unknown when no project identity was captured earlier. Live watch ticks do not rescan historical archives.

### Distribution and maintenance changes

- App and Worker versions share the `replica` suffix.
- Repository links, update notices, and release templates point to this fork.
- Fork updates and upstream-sync notices are separate channels; plain upstream versions never enter the replica update channel.
- Pushing a `v*-replica.*` tag makes GitHub Actions create a latest Release from the checked-in notes only. Plain upstream tags do not trigger a fork Release, and the workflow does not build or upload installers, app archives, updater metadata, or blockmaps.
- GitHub's automatic “Source code (zip/tar.gz)” entries are source snapshots, not ready-to-run applications.
- Because no binary updates are published, the release workflow needs no Windows or macOS signing credentials.
- The root MIT license ships visibly as `resources/LICENSE`.
- The repository maintains this single bilingual README instead of multiple translated copies.

### Highlights

Token Monitor is a local-first Electron widget for AI coding-tool tokens, cost, sessions, models, and account limits. The table below lists 28 tools: 21 provide token usage and 18 provide AI Tool Limits.

- Live local-log collection with updates appearing within seconds.
- Breakdowns by tool, device, model, session, project, and account.
- Input, output, cache-hit, and cost metrics.
- Historical trends, activity heatmaps, and CSV/JSON export.
- Local mode plus embedded, Node, or Cloudflare Worker hubs for multi-device sync.
- Prompts, responses, source code, and file contents are not sent to the project maintainer.
- Project enrichment reads only local directory structure, bounded structured-metadata prefixes, and read-only database fields; raw project paths are hashed before entering the existing local or Hub statistics flow.

### Install and update

This fork does not provide prebuilt applications. Download or clone the repository source and follow “Run and build from source” below on the target operating system. [GitHub Releases](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases) provide version tags, release notes, and source snapshots only.

Important details:

- This fork retains the upstream app ID and data directory, so the operating system treats it as the same Token Monitor installation rather than a side-by-side variant.
- Locally built Windows executables are unsigned unless you configure an Authenticode certificate, and Windows may show a SmartScreen warning.
- The app only reports a newer version and opens its Release page. It never downloads or installs an update; obtain the new source and rebuild it yourself.

The first launch uses local mode and needs no Hub or config file. Choose tracked tools under **Settings → Collection**. Provider accounts and credentials remain under **AI Tool Limits (provider selection, limits, and credentials)**.

### Multi-device sync

Choose one Hub and connect every device to the same URL and secret:

- **Embedded Hub:** select “Host hub on this device” on an always-on widget.
- **Node Hub:** copy `.env.example` to `.env`, set `TOKEN_MONITOR_SECRET`, then run `npm run hub`.
- **Cloudflare Worker:** follow [worker/README.md](worker/README.md).
- **Headless device:** run `npm run agent`, or `npm run agent:once` for one collection pass.

### Settings, data, and privacy

- See the [configuration reference](docs/configuration.md) for GUI settings, environment variables, and precedence.
- **WSL:** Windows automatically merges file-based usage from running WSL distributions; SQLite-backed tools such as OpenCode and Hermes need a headless agent inside WSL. See the [WSL SQLite guide](docs/wsl-sqlite-setup.md).
- See [docs/export.md](docs/export.md) for exports, [docs/API.md](docs/API.md) for the Hub protocol, and [docs/privacy.md](docs/privacy.md) for network and privacy behavior.

### Run and build from source

Node.js 22.13 or newer is required. Build on the target operating system:

```bash
npm ci
npm start
npm run verify

npm run dist:win      # Windows x64 installer + portable
npm run dist:mac      # macOS arm64
npm run dist:mac:x64  # macOS Intel x64
npm run dist:linux    # Linux x64 AppImage
```

Artifacts are written to `dist/` and remain local; the Release workflow does not upload them. Local builds do not require signing by default. Windows may show SmartScreen warnings, and unsigned or unnotarized macOS builds may trigger Gatekeeper. Configure platform signing and notarization yourself before distributing a build.

---

## 支持的工具 / Supported tools

| Logo | Tool | Data source | Token Usage | AI Tool Limits | Session Details |
|:---:|---|---|:---:|:---:|:---:|
| <img src=".github/assets/tools-icon/claude.png" width="28" alt="Claude Code" /> | Claude Code | `~/.claude/projects/`, `~/.claude/transcripts/` | ✅ | ✅ | ✅ |
| <img src=".github/assets/tools-icon/codex.png" width="28" alt="Codex" /> | Codex | `~/.codex/` 中的 `sessions/` 与 `archived_sessions/` | ✅ | ✅ | ✅ |
| <img src=".github/assets/tools-icon/opencode.png" width="28" alt="OpenCode" /> | OpenCode | `~/.local/share/opencode/` SQLite and message storage | ✅ | ✅ | ✅ |
| <img src=".github/assets/tools-icon/hermes-agent.png" width="28" alt="Hermes Agent" /> | Hermes Agent | `$HERMES_HOME/state.db` or `~/.hermes/state.db` | ✅ | — | — |
| <img src=".github/assets/tools-icon/openclaw.png" width="28" alt="OpenClaw" /> | OpenClaw | `~/.openclaw/agents/` | ✅ | — | — |
| <img src=".github/assets/tools-icon/cursor.png" width="28" alt="Cursor" /> | Cursor | Tokscale Cursor cache maintained by Cursor sync | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/antigravity.png" width="28" alt="Antigravity" /> | Antigravity | Tokscale Antigravity cache maintained by source sync | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/cline.png" width="28" alt="Cline" /> | Cline | VS Code globalStorage tasks 与 `~/.cline/data/sessions/` | ✅ | — | — |
| <img src=".github/assets/tools-icon/kimi.png" width="28" alt="Kimi" /> | Kimi CLI / Kimi Code | `~/.kimi/sessions/`, `~/.kimi-code/sessions/`, and Kimi API | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/qwen.png" width="28" alt="Qwen" /> | Qwen CLI | `~/.qwen/projects/` | ✅ | — | — |
| <img src=".github/assets/tools-icon/xai.png" width="28" alt="Grok Build" /> | Grok Build | `$GROK_HOME` 或 `~/.grok/` 中的 `sessions/` 与 `logs/unified.jsonl` | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/copilot.png" width="28" alt="GitHub Copilot" /> | GitHub Copilot | VS Code chat sessions，以及 `~/.copilot/otel/` 与 `~/.copilot/data.db` | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/pi.png" width="28" alt="Pi" /> | Pi | `~/.pi/agent/sessions/`, `~/.omp/agent/sessions/` | ✅ | — | — |
| <img src=".github/assets/tools-icon/zed.png" width="28" alt="Zed" /> | Zed | `~/.local/share/zed/threads/threads.db` | ✅ | — | — |
| <img src=".github/assets/tools-icon/kilocode.png" width="28" alt="Kilo Code" /> | Kilo Code | VS Code globalStorage tasks on Linux and remote/WSL | ✅ | — | — |
| <img src=".github/assets/tools-icon/mimo-code.png" width="28" alt="MiMo Code" /> | MiMo Code | `~/.local/share/mimocode/mimocode.db` | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/zcode.png" width="28" alt="ZCode" /> | ZCode / GLM | `~/.zcode/projects/`、`~/.zcode/cli/db/db.sqlite` 与 Z.ai API | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/kiro.png" width="28" alt="Kiro" /> | Kiro | Kiro CLI sessions, IDE globalStorage, and CLI database | ✅ | ✅ | — |
| <img src=".github/assets/tools-icon/codebuddy.png" width="28" alt="CodeBuddy" /> | CodeBuddy | Project data plus IDE and VS Code extension logs | ✅ | — | — |
| <img src=".github/assets/tools-icon/workbuddy.png" width="28" alt="WorkBuddy" /> | WorkBuddy | `~/.workbuddy/projects/`, `~/.workbuddy/workbuddy.db` | ✅ | — | — |
| <img src=".github/assets/tools-icon/proma.png" width="28" alt="Proma" /> | Proma | `~/.proma/agent-sessions/*.jsonl` | ✅ | — | — |
| <img src=".github/assets/tools-icon/deepseek.png" width="28" alt="DeepSeek" /> | DeepSeek | DeepSeek API key and balance API | — | ✅ | — |
| <img src=".github/assets/tools-icon/openrouter.png" width="28" alt="OpenRouter" /> | OpenRouter | OpenRouter API key, usage, limits, and authorized credits | — | ✅ | — |
| <img src=".github/assets/tools-icon/minimax.png" width="28" alt="Minimax" /> | Minimax | Minimax API key and Token Plan API | — | ✅ | — |
| <img src=".github/assets/tools-icon/volcengine.png" width="28" alt="Volcengine" /> | Volcengine | Ark API key or Volcengine AK/SK | — | ✅ | — |
| <img src=".github/assets/tools-icon/qoder.png" width="28" alt="Qoder" /> | Qoder | Qoder dashboard cookie and usage API | — | ✅ | — |
| <img src=".github/assets/tools-icon/ollama.png" width="28" alt="Ollama" /> | Ollama | Ollama Cloud cookie and settings usage | — | ✅ | — |
| <img src=".github/assets/tools-icon/newapi.png" width="28" alt="Third-party APIs" /> | Third-party APIs | New API and compatible One API forks, API-key mode, or a declarative Custom balance endpoint | — | ✅ | — |

表中路径是默认值；Token Monitor 会遵循 Tokscale 支持的 `$XDG_DATA_HOME`，以及 `$CODEX_HOME`、`$GROK_HOME`、`$HERMES_HOME`、`$KIMI_CODE_HOME` 和 `$CLINE_*` 等工具专用环境变量。

第三方 Custom 适配器只读取一个 GET 余额接口中声明的数值字段；仅兼容 OpenAI 或 Anthropic API 并不足以自动提供额度数据。

Paths in the table are defaults. Token Monitor follows Tokscale's supported `$XDG_DATA_HOME` override and tool-specific variables including `$CODEX_HOME`, `$GROK_HOME`, `$HERMES_HOME`, `$KIMI_CODE_HOME`, and the `$CLINE_*` family.

The third-party Custom adapter reads declared numeric fields from one GET balance endpoint. OpenAI or Anthropic API compatibility alone does not provide account-limit data.

## 文档 / Documentation

- [配置参考 / Configuration](docs/configuration.md)
- [Hub API](docs/API.md)
- [导出 / Export](docs/export.md)
- [隐私 / Privacy](docs/privacy.md)
- [Cloudflare Worker](worker/README.md)

## 致谢与许可证 / Credits and license

- 上游项目 / Upstream: [Javis603/token-monitor](https://github.com/Javis603/token-monitor)
- 用量解析 / Usage parsing: [tokscale](https://github.com/junhoyeo/tokscale)
- AI 工具额度研究 / AI Tool Limits research: [CodexBar](https://github.com/steipete/CodexBar)
- 许可证 / License: [MIT](LICENSE), Copyright (c) 2026 Javis

本 fork 保留上游版权和 MIT 许可文本。MIT 允许使用、修改和分发，但分发源码或实质性副本时必须同时保留版权声明与许可声明。

This fork preserves the upstream copyright and MIT license text. The MIT license permits use, modification, and distribution provided that the copyright and permission notices remain with copies or substantial portions of the software.
