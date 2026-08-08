# English

## What's changed

<!-- app-update-notes:en:start -->
### Added
- **LongCat and Hy3 vendor recognition:** LongCat models are now classified under Meituan and Hy3 models under Tencent, with distinct vendor colors and Appearance controls.
- **Manual model mappings:** Settings > Collection can now merge exact, case-insensitive model IDs for all dashboard, history, and export views without rewriting raw usage data.
- **Diagnostics & support:** Settings > About Token Monitor now lets you generate a redacted diagnostic report, view its preview, and copy it for issue reports. It includes app, collection, AI tool health, AI Tool Limits, Hub, workload, configuration, resources, and Cursor/Antigravity sync-failure stage, detail code, and exit code when available, without including credentials, conversations, accounts, full paths, or raw errors. (#340, #342)

### Improved
- **MiMo Code usage:** Tracking now watches the SQLite database files and WAL/SHM sidecars it uses instead of recursively watching rotating log trees, reducing redundant refreshes and keeping the app responsive during log rotation. (#338)

### Fixed
- **Kimi Code model identity:** The official Kimi Code model IDs `k3` and `k3-256` are now classified as Kimi models.
- **Trends (DAY):** Completed-day totals now retain the highest complete live value after local midnight when history is rebuilt, instead of regressing after date rollover or collector handoff. (#341)
- **Kimi weekly quota:** Kimi now shows the 7-day used/limit from the Kimi console instead of letting a membership percentage replace it when both sources provide data. (#344)
<!-- app-update-notes:en:end -->

## Download

- **macOS Apple Silicon** — [Token-Monitor-0.42.0-replica.1-arm64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-arm64.dmg)
- **macOS Intel** — [Token-Monitor-0.42.0-replica.1-x64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-x64.dmg)
- **Windows Installer** — [Token-Monitor-Setup-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-Setup-0.42.0-replica.1.exe) (recommended)
- **Windows Portable** — [Token-Monitor-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.exe) (no install required)
- **Linux x64** — [Token-Monitor-0.42.0-replica.1.AppImage](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.AppImage)

<details>
<summary><strong>First launch and other notes</strong></summary>

### First launch

**macOS:** the app is Developer ID-signed and notarized by Apple. Open the `.dmg`, then drag Token Monitor to Applications.

**Windows:** both executables are signed ([how to verify](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/blob/main/docs/code-signing.md#verify-a-download)).

**Linux:** mark the AppImage executable, then run it:

```bash
chmod +x "Token Monitor"*.AppImage
./"Token Monitor"*.AppImage
```

### Other notes

Other platforms are not pre-built — run from source per the [README](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#readme). The macOS `.zip` is the same app repackaged; ignore it unless you specifically need it.

### tokscale dependency

Tokscale is bundled with this app. See **Settings → Tokscale** for the exact version
and the option to download a newer version directly from npm. Tokscale is MIT,
open-source: https://github.com/junhoyeo/tokscale

</details>

---

# 中文

## 更新内容

<!-- app-update-notes:zh:start -->
### 新增
- **LongCat 与 Hy3 厂商识别：** LongCat 系列模型现在识别为美团，Hy3 系列模型识别为腾讯，并提供独立厂商配色和外观设置。
- **手动模型映射：** 「设置 > 采集」现在可以按不区分大小写的精确模型 ID 合并仪表盘、历史和导出视图，且不会改写原始用量数据。
- **诊断与支持：** 「设置 > 关于 Token Monitor」现在可以「生成报告」、查看预览并「复制报告」来反馈问题。报告包含应用、采集、AI 工具状态、AI 工具额度、Hub、工作负载、配置、资源，以及 Cursor/Antigravity 同步失败的阶段、详情代码和退出码（如有）；不包含凭证、对话、账号、完整路径或原始错误输出。（#340、#342）

### 改进
- **MiMo Code 用量：** 用量追踪现在只监控其使用的 SQLite 数据库及其 WAL/SHM 伴随文件，不再递归监控轮转日志目录；日志轮转时会减少重复刷新，让应用保持响应。（#338）

### 修复
- **Kimi Code 模型识别：** 官方 Kimi Code 模型 ID `k3` 和 `k3-256` 现在会识别为 Kimi 模型。
- **趋势（DAY）：** 跨过本地午夜重建历史后，已完成日期的总量现在会保留最高的完整实时值，不再因日期切换或采集器交接而回退。（#341）
- **Kimi 每周额度：** 当两个来源都返回数据时，现在优先显示 Kimi 控制台中的 7 天已用/上限，不再被会员比例覆盖。（#344）
<!-- app-update-notes:zh:end -->

## 下载

- **macOS Apple Silicon** — [Token-Monitor-0.42.0-replica.1-arm64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-arm64.dmg)
- **macOS Intel** — [Token-Monitor-0.42.0-replica.1-x64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-x64.dmg)
- **Windows 安装版** — [Token-Monitor-Setup-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-Setup-0.42.0-replica.1.exe)（推荐）
- **Windows 便携版** — [Token-Monitor-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.exe)（免安装）
- **Linux x64** — [Token-Monitor-0.42.0-replica.1.AppImage](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.AppImage)

<details>
<summary><strong>首次启动与其他说明</strong></summary>

### 首次启动

**macOS：** 应用已使用 Developer ID 签名并通过 Apple 公证。打开 `.dmg`，然后把 Token Monitor 拖到 Applications。

**Windows：** 两个可执行文件均已签名（[查看验证方法](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/blob/main/docs/code-signing.md#verify-a-download)）。

**Linux：** 先给 AppImage 执行权限，然后运行：

```bash
chmod +x "Token Monitor"*.AppImage
./"Token Monitor"*.AppImage
```

### 其他说明

其他平台暂不提供预构建版本，请参考 [README](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#readme) 从源码运行。macOS 的 `.zip` 只是同一个 app 的重新打包版本，除非你明确需要，否则可以忽略。

### tokscale 依赖

Tokscale 已随应用内置。你可以在 **设置 → Tokscale** 查看确切版本，
也可以直接从 npm 下载更新版本。Tokscale 是 MIT 开源项目：
https://github.com/junhoyeo/tokscale

</details>

---

**Full Changelog:** [fb430ef...v0.42.0-replica.1](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/compare/fb430ef...v0.42.0-replica.1)

<details>
<summary>繁體中文 · 한국어 · 日本語</summary>

<details>
<summary><strong>繁體中文</strong></summary>

## 繁體中文

## 更新內容

<!-- app-update-notes:zh-TW:start -->
### 新增
- **LongCat 與 Hy3 廠商識別：** LongCat 系列模型現在識別為美團，Hy3 系列模型識別為騰訊，並提供獨立廠商配色和外觀設定。
- **手動模型映射：** 「設定 > 採集」現在可以按不區分大小寫的精確模型 ID 合併儀表板、歷史和匯出檢視，且不會改寫原始用量資料。
- **診斷與支援：** 「設定 > 關於 Token Monitor」現在可以「產生報告」、查看預覽並「複製報告」來回報問題。報告包含應用程式、採集、AI 工具狀態、AI 工具額度、Hub、工作負載、設定、資源，以及 Cursor/Antigravity 同步失敗的階段、詳情代碼及退出碼（如有）；不包含憑證、對話、帳號、完整路徑或原始錯誤輸出。（#340、#342）

### 改進
- **MiMo Code 用量：** 用量追蹤現在只監控其使用的 SQLite 資料庫及其 WAL/SHM 伴隨檔案，不再遞迴監控輪轉記錄檔目錄；記錄檔輪轉時會減少重複重新整理，讓應用程式保持回應。（#338）

### 修復
- **Kimi Code 模型識別：** 官方 Kimi Code 模型 ID `k3` 和 `k3-256` 現在會識別為 Kimi 模型。
- **趨勢（DAY）：** 跨過本地午夜重建歷史後，已完成日期的總量現在會保留最高的完整即時值，不再因日期切換或採集器交接而回退。（#341）
- **Kimi 每週額度：** 當兩個來源都返回資料時，現在優先顯示 Kimi 控制台中的 7 天已用/上限，不再被會員比例覆蓋。（#344）
<!-- app-update-notes:zh-TW:end -->

## 下載

- **macOS Apple Silicon** — [Token-Monitor-0.42.0-replica.1-arm64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-arm64.dmg)
- **macOS Intel** — [Token-Monitor-0.42.0-replica.1-x64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-x64.dmg)
- **Windows 安裝版** — [Token-Monitor-Setup-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-Setup-0.42.0-replica.1.exe)（推薦）
- **Windows 便攜版** — [Token-Monitor-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.exe)（免安裝）
- **Linux x64** — [Token-Monitor-0.42.0-replica.1.AppImage](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.AppImage)

</details>

<details>
<summary><strong>한국어</strong></summary>

## 한국어

## 업데이트 내용

<!-- app-update-notes:ko:start -->
### 추가
- **LongCat 및 Hy3 공급업체 인식:** LongCat 모델은 Meituan으로, Hy3 모델은 Tencent로 분류되며 각각의 공급업체 색상과 모양 설정을 제공합니다.
- **수동 모델 매핑:** 「설정 > 수집」에서 대소문자를 구분하지 않는 정확한 모델 ID를 대시보드, 기록 및 내보내기 보기 전체에 병합할 수 있으며 원시 사용량 데이터는 변경하지 않습니다.
- **진단 및 지원:** 「설정 > Token Monitor 정보」에서 「보고서 생성」 후 「보고서 보기」 또는 「보고서 복사」로 문제 신고에 사용할 수 있습니다. 보고서에는 앱, 수집, AI 도구 상태, AI 도구 한도, Hub, 작업량, 구성, 리소스와 Cursor/Antigravity 동기화 실패 단계·세부 코드·종료 코드(있는 경우)가 포함되며, 자격 증명·대화·계정·전체 경로·원시 오류는 포함되지 않습니다. (#340, #342)

### 개선
- **MiMo Code 사용량:** 이제 사용하는 SQLite 데이터베이스와 WAL/SHM 사이드카만 감시하고 회전하는 로그 트리는 재귀적으로 감시하지 않아, 로그가 회전할 때 불필요한 새로 고침을 줄이고 앱의 응답성을 유지합니다. (#338)

### 수정
- **Kimi Code 모델 식별:** 공식 Kimi Code 모델 ID `k3` 및 `k3-256`이 이제 Kimi 모델로 분류됩니다.
- **추이 (DAY):** 현지 자정 이후 기록을 다시 구성할 때 완료된 날짜의 합계가 이제 가장 높은 완전한 실시간 값을 유지하며, 날짜가 바뀌거나 수집기가 인계될 때 더 이상 감소하지 않습니다. (#341)
- **Kimi 주간 한도:** 두 소스가 모두 데이터를 제공할 때 이제 Kimi 콘솔에 표시되는 7일 사용량/한도를 우선 표시하며, 멤버십 비율로 덮어쓰지 않습니다. (#344)
<!-- app-update-notes:ko:end -->

## 다운로드

- **macOS Apple Silicon** — [Token-Monitor-0.42.0-replica.1-arm64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-arm64.dmg)
- **macOS Intel** — [Token-Monitor-0.42.0-replica.1-x64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-x64.dmg)
- **Windows 설치 버전** — [Token-Monitor-Setup-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-Setup-0.42.0-replica.1.exe) (권장)
- **Windows 포터블 버전** — [Token-Monitor-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.exe) (설치 필요 없음)
- **Linux x64** — [Token-Monitor-0.42.0-replica.1.AppImage](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.AppImage)

</details>

<details>
<summary><strong>日本語</strong></summary>

## 日本語

## 更新内容

<!-- app-update-notes:ja:start -->
### 追加
- **LongCat と Hy3 のベンダー認識：** LongCat モデルを Meituan、Hy3 モデルを Tencent として分類し、それぞれのベンダーカラーと外観設定を追加しました。
- **手動モデルマッピング：** 「設定 > 収集」で、大文字小文字を区別しない完全一致のモデル ID をダッシュボード、履歴、エクスポート表示全体で統合でき、raw 使用量データは書き換えません。
- **診断とサポート：** 「設定 > Token Monitor について」で「レポートを作成」し、「レポートを見る」または「レポートをコピー」して問題を報告できます。レポートにはアプリ、収集、AIツールの状態、AIツール制限、Hub、ワークロード、設定、リソース、Cursor/Antigravity の同期失敗の段階・詳細コード・終了コード（利用可能な場合）が含まれ、認証情報、会話、アカウント、完全なパス、raw エラーは含まれません。（#340、#342）

### 改善
- **MiMo Code の使用量：** 使用する SQLite データベースと WAL/SHM サイドカーだけを監視し、ローテーションするログツリーを再帰的に監視しなくなりました。ログのローテーション中も不要な再更新を減らし、アプリの応答性を保ちます。（#338）

### 修正
- **Kimi Code モデル識別：** 公式 Kimi Code モデル ID `k3` と `k3-256` を Kimi モデルとして分類するようになりました。
- **トレンド（DAY）：** ローカルの午前0時をまたいで履歴を再構成した後も、完了した日の合計が最も高い完全なリアルタイム値を保持し、日付の切り替えやコレクターの引き継ぎで減少しなくなりました。（#341）
- **Kimi の週間制限：** 2つのソースが両方ともデータを返す場合、メンバーシップの割合で置き換えず、Kimi コンソールに表示される 7 日間の使用量/上限を優先して表示します。（#344）
<!-- app-update-notes:ja:end -->

## ダウンロード

- **macOS Apple Silicon** — [Token-Monitor-0.42.0-replica.1-arm64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-arm64.dmg)
- **macOS Intel** — [Token-Monitor-0.42.0-replica.1-x64.dmg](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1-x64.dmg)
- **Windows インストーラー** — [Token-Monitor-Setup-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-Setup-0.42.0-replica.1.exe)（推奨）
- **Windows ポータブル版** — [Token-Monitor-0.42.0-replica.1.exe](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.exe)（インストール不要）
- **Linux x64** — [Token-Monitor-0.42.0-replica.1.AppImage](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/download/v0.42.0-replica.1/Token-Monitor-0.42.0-replica.1.AppImage)

</details>

</details>
