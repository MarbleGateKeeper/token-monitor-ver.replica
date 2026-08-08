<div align="center">
  <img src=".github/assets/app.png" alt="Token Monitor logo" width="120">
  <h1>Token Monitor Replica</h1>
  <p>Token Monitor 的下游自用 fork / A downstream personal fork of Token Monitor</p>
  <p>
    <a href="#中文">中文</a> · <a href="#english">English</a>
  </p>
  <p>
    <a href="https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases"><img src="https://img.shields.io/github/v/release/MarbleGateKeeper/token-monitor-ver.replica?include_prereleases&style=flat-square&label=replica&color=22c55e" alt="Replica release"></a>
    <img src="https://img.shields.io/badge/version-0.42.0--replica.1-64748b?style=flat-square" alt="Version 0.42.0-replica.1">
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-A855F7?style=flat-square" alt="MIT License"></a>
  </p>
  <img src=".github/assets/demo.gif" alt="Token Monitor demo">
</div>

> [!IMPORTANT]
> 本仓库是 [Javis603/token-monitor](https://github.com/Javis603/token-monitor) 的下游 fork，不是上游官方发行版。本 fork 的源码、问题反馈、发行包和更新提示均位于 [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica)。
>
> This repository is a downstream fork of [Javis603/token-monitor](https://github.com/Javis603/token-monitor), not an official upstream distribution. Source, issues, releases, and update notices for this variant belong to [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica).

## 中文

### 项目关系

- **上游项目：** [Javis603/token-monitor](https://github.com/Javis603/token-monitor)，提供 Token Monitor 的主体架构、采集器、桌面组件、多设备 Hub、AI 工具额度和绝大多数功能。
- **本仓库：** [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica)，用于保留个人需要但尚未进入上游的修复与功能。
- **Git 远程：** 通常以 `upstream` 跟踪原项目，以 `origin` 跟踪本 fork。同步上游时应先审阅差异，再保留下文列出的 fork 功能。
- **版本规则：** 使用 `<上游版本>-replica.<修订号>`，例如当前版本 `0.42.0-replica.1`。同一上游版本继续发布时递增修订号；同步到新的上游版本后从 `replica.1` 重新开始。
- **更新来源：** 应用内更新检查、发行说明、下载链接、关于页面和打包元数据都指向本 fork，不会把本 fork 用户引导到上游安装包。
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
- 不改写采集器原始数据、Hub 设备记录或保留的原始统计快照；删除映射后即可恢复原始模型拆分。

### 本 fork 的发行与维护改动

- 应用和 Worker 版本统一使用 `replica` 后缀。
- GitHub 更新源、仓库链接、站点下载入口和发行模板全部指向本 fork。
- GitHub Release 会明确发布为本仓库的 latest release，使源码模式和打包模式都能找到更新。
- Windows 预打包签名脚本支持 `replica` SemVer 后缀，同时保留更新包签名校验。
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

### 安装与更新

从本 fork 的 [GitHub Releases](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases) 下载对应平台的发行包。Windows 提供安装版和便携版；其他平台是否提供预构建包，以具体 Release 的附件为准。

需要注意：

- 本 fork 与上游沿用相同应用 ID 和数据目录，因此安装时会被系统视为同一个 Token Monitor，而不是并排安装。
- 自行本地构建的 Windows EXE 默认没有 Authenticode 签名，Windows 可能显示 SmartScreen 警告。
- 应用仍校验自动更新包的签名。要发布可自动安装的更新，fork 维护者必须配置自己的 Windows/macOS 签名凭证；不要通过关闭签名校验来发布不受信任的更新。

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

输出位于 `dist/`。macOS 正式包需要 Developer ID 签名；Windows 本地构建若没有证书则为未签名包。

---

## English

### Relationship to upstream

- **Upstream:** [Javis603/token-monitor](https://github.com/Javis603/token-monitor) provides the core architecture, collectors, desktop widget, multi-device Hub, AI Tool Limits, and most product functionality.
- **This repository:** [MarbleGateKeeper/token-monitor-ver.replica](https://github.com/MarbleGateKeeper/token-monitor-ver.replica) carries personal fixes and features that have not been incorporated upstream.
- **Git remotes:** `upstream` normally tracks the original project and `origin` tracks this fork. Review upstream changes before merging and preserve the fork behavior documented below.
- **Versioning:** releases use `<upstream-version>-replica.<revision>`, currently `0.42.0-replica.1`. Increment the replica revision on the same upstream base; restart at `replica.1` after adopting a new upstream version.
- **Updates:** in-app release checks, release notes, downloads, About links, and packaged updater metadata all point to this fork.
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
- Collector output, Hub device records, and retained raw snapshots are not rewritten, so removing a mapping restores the original split.

### Distribution and maintenance changes

- App and Worker versions share the `replica` suffix.
- GitHub update providers, repository links, website downloads, and release templates point to this fork.
- Releases are explicitly marked as this repository's latest release for both source and packaged update checks.
- The Windows prepackaged signing path accepts replica SemVer suffixes while retaining update signature verification.
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

### Install and update

Download releases from this fork's [GitHub Releases](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases). Windows releases may include setup and portable executables; availability for other platforms depends on the assets attached to each release.

Important details:

- This fork retains the upstream app ID and data directory, so the operating system treats it as the same Token Monitor installation rather than a side-by-side variant.
- Locally built Windows executables are unsigned unless you configure an Authenticode certificate, and Windows may show a SmartScreen warning.
- Automatic update packages are still signature-verified. A fork maintainer must configure Windows/macOS signing credentials before publishing installable automatic updates; do not disable verification to ship untrusted artifacts.

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

Artifacts are written to `dist/`. Production macOS artifacts require Developer ID signing; local Windows artifacts remain unsigned without a configured certificate.

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
- [Windows 代码签名 / Windows code signing](docs/code-signing.md)
- [Cloudflare Worker](worker/README.md)

## 致谢与许可证 / Credits and license

- 上游项目 / Upstream: [Javis603/token-monitor](https://github.com/Javis603/token-monitor)
- 用量解析 / Usage parsing: [tokscale](https://github.com/junhoyeo/tokscale)
- AI 工具额度研究 / AI Tool Limits research: [CodexBar](https://github.com/steipete/CodexBar)
- 许可证 / License: [MIT](LICENSE), Copyright (c) 2026 Javis

本 fork 保留上游版权和 MIT 许可文本。MIT 允许使用、修改和分发，但分发源码或实质性副本时必须同时保留版权声明与许可声明。

This fork preserves the upstream copyright and MIT license text. The MIT license permits use, modification, and distribution provided that the copyright and permission notices remain with copies or substantial portions of the software.
