# English

## What's changed

<!-- app-update-notes:en:start -->
### Added
- **LongCat and Hy3 vendor recognition:** LongCat models are now classified under Meituan and Hy3 models under Tencent, with color-tinted vendor icons, distinct vendor colors, and Appearance controls.
- **Manual model mappings:** Settings > Collection can now merge exact, case-insensitive model IDs for all dashboard, history, and export views without rewriting raw usage data.
- **Diagnostics & support:** Settings > About Token Monitor now lets you generate a redacted diagnostic report, view its preview, and copy it for issue reports. It includes app, collection, AI tool health, AI Tool Limits, Hub, workload, configuration, resources, and Cursor/Antigravity sync-failure stage, detail code, and exit code when available, without including credentials, conversations, accounts, full paths, or raw errors. (#340, #342)

### Improved
- **Replica and upstream version tracking:** Fork updates now accept only `*-replica.N` tags, so upstream `0.42.0` no longer outranks `0.42.0-replica.1`. A separate upstream reminder appears only when the upstream base is genuinely newer. Both notices open Release pages without downloading or installing anything, and tagged releases attach no project-built binaries.
- **Live collection sources:** Watch roots now match Tokscale 4.11 sources, including Codex archives, Cline local sessions, Grok unified logs, Copilot's database, and ZCode SQLite. Overlapping custom roots now keep the union of every source instead of depending on declaration order. (#352, #353)
- **Tool source diagnostics:** Missing optional Codex headless-capture roots are hidden, while configured or active roots remain visible; exact-file sources reveal the file in its folder. (#354)
- **MiMo Code usage:** Tracking now watches the SQLite database files and WAL/SHM sidecars it uses instead of recursively watching rotating log trees, reducing redundant refreshes and keeping the app responsive during log rotation. (#338)

### Fixed
- **GLM Coding Plan quotas:** Personal and team accounts now recognize `CREDIT_LIMIT` token windows instead of showing a valid quota response as unavailable. (#351)
- **Kimi Code model identity:** The official Kimi Code model IDs `k3` and `k3-256` are now classified as Kimi models.
- **Trends (DAY):** Completed-day totals now retain the highest complete live value after local midnight when history is rebuilt, instead of regressing after date rollover or collector handoff. (#341)
- **Kimi weekly quota:** Kimi now shows the 7-day used/limit from the Kimi console instead of letting a membership percentage replace it when both sources provide data. (#344)
<!-- app-update-notes:en:end -->

## Build from source

This repository does not publish prebuilt installers or application archives. To use this version, download or clone the source and follow the [README build instructions](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) on the target operating system. GitHub may still show its automatically generated source-code archives; those are source snapshots, not ready-to-run applications.

---

# 中文

## 更新内容

<!-- app-update-notes:zh:start -->
### 新增
- **LongCat 与 Hy3 厂商识别：** LongCat 系列模型现在识别为美团，Hy3 系列模型识别为腾讯，并提供随厂商颜色着色的图标、独立配色和外观设置。
- **手动模型映射：** 「设置 > 采集」现在可以按不区分大小写的精确模型 ID 合并仪表盘、历史和导出视图，且不会改写原始用量数据。
- **诊断与支持：** 「设置 > 关于 Token Monitor」现在可以「生成报告」、查看预览并「复制报告」来反馈问题。报告包含应用、采集、AI 工具状态、AI 工具额度、Hub、工作负载、配置、资源，以及 Cursor/Antigravity 同步失败的阶段、详情代码和退出码（如有）；不包含凭证、对话、账号、完整路径或原始错误输出。（#340、#342）

### 改进
- **Replica 与上游版本追踪：** 本 fork 更新现在只接受 `*-replica.N` tag，因此上游 `0.42.0` 不会再高于 `0.42.0-replica.1`；只有上游基础版本真正更高时才显示独立的上游同步提醒。两类提示都只打开 Release 页面，不会下载或安装，tag Release 也不附加本项目构建的二进制文件。
- **实时采集源：** 监听路径现在与 Tokscale 4.11 的实际数据源保持一致，包括 Codex 归档会话、Cline 本地会话、Grok 统一日志、Copilot 数据库和 ZCode SQLite；重叠的自定义路径会保留所有来源的并集，不再受声明顺序影响。（#352、#353）
- **工具源诊断：** 不存在且未启用的 Codex headless 采集目录不再显示为缺失；已配置或已有数据的目录仍会显示，精确文件来源会在所属文件夹中定位。（#354）
- **MiMo Code 用量：** 用量追踪现在只监控其使用的 SQLite 数据库及其 WAL/SHM 伴随文件，不再递归监控轮转日志目录；日志轮转时会减少重复刷新，让应用保持响应。（#338）

### 修复
- **GLM Coding Plan 额度：** 个人和团队账号现在可以识别 `CREDIT_LIMIT` token 窗口，不会再把有效额度响应显示为不可用。（#351）
- **Kimi Code 模型识别：** 官方 Kimi Code 模型 ID `k3` 和 `k3-256` 现在会识别为 Kimi 模型。
- **趋势（DAY）：** 跨过本地午夜重建历史后，已完成日期的总量现在会保留最高的完整实时值，不再因日期切换或采集器交接而回退。（#341）
- **Kimi 每周额度：** 当两个来源都返回数据时，现在优先显示 Kimi 控制台中的 7 天已用/上限，不再被会员比例覆盖。（#344）
<!-- app-update-notes:zh:end -->

## 从源码构建

本仓库不发布预构建安装包或应用压缩包。如需使用，请下载或克隆源码，并在目标操作系统上按照 [README 构建说明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#从源码运行与构建) 操作。GitHub 页面仍可能显示平台自动生成的源码压缩包；它们只是源码快照，不是可直接运行的应用。

---

**Full Changelog:** [v0.42.0-replica.1...v0.42.0-replica.2](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/compare/v0.42.0-replica.1...v0.42.0-replica.2)

<details>
<summary>繁體中文 · 한국어 · 日本語</summary>

<details>
<summary><strong>繁體中文</strong></summary>

## 繁體中文

## 更新內容

<!-- app-update-notes:zh-TW:start -->
### 新增
- **LongCat 與 Hy3 廠商識別：** LongCat 系列模型現在識別為美團，Hy3 系列模型識別為騰訊，並提供隨廠商顏色著色的圖示、獨立配色和外觀設定。
- **手動模型映射：** 「設定 > 採集」現在可以按不區分大小寫的精確模型 ID 合併儀表板、歷史和匯出檢視，且不會改寫原始用量資料。
- **診斷與支援：** 「設定 > 關於 Token Monitor」現在可以「產生報告」、查看預覽並「複製報告」來回報問題。報告包含應用程式、採集、AI 工具狀態、AI 工具額度、Hub、工作負載、設定、資源，以及 Cursor/Antigravity 同步失敗的階段、詳情代碼及退出碼（如有）；不包含憑證、對話、帳號、完整路徑或原始錯誤輸出。（#340、#342）

### 改進
- **Replica 與上游版本追蹤：** 本 fork 更新現在只接受 `*-replica.N` tag，因此上游 `0.42.0` 不會再高於 `0.42.0-replica.1`；只有上游基礎版本確實較高時才顯示獨立的上游同步提醒。兩類提示都只開啟 Release 頁面，不會下載或安裝，tag Release 也不附加本專案建置的二進位檔案。
- **即時採集來源：** 監看路徑現在與 Tokscale 4.11 的實際資料來源一致，包括 Codex 封存工作階段、Cline 本機工作階段、Grok 統一記錄檔、Copilot 資料庫和 ZCode SQLite；重疊的自訂路徑會保留所有來源的聯集，不再受宣告順序影響。（#352、#353）
- **工具來源診斷：** 不存在且未啟用的 Codex headless 採集目錄不再顯示為缺失；已設定或已有資料的目錄仍會顯示，精確檔案來源會在所屬資料夾中定位。（#354）
- **MiMo Code 用量：** 用量追蹤現在只監控其使用的 SQLite 資料庫及其 WAL/SHM 伴隨檔案，不再遞迴監控輪轉記錄檔目錄；記錄檔輪轉時會減少重複重新整理，讓應用程式保持回應。（#338）

### 修復
- **GLM Coding Plan 額度：** 個人和團隊帳號現在可以識別 `CREDIT_LIMIT` token 視窗，不會再把有效額度回應顯示為不可用。（#351）
- **Kimi Code 模型識別：** 官方 Kimi Code 模型 ID `k3` 和 `k3-256` 現在會識別為 Kimi 模型。
- **趨勢（DAY）：** 跨過本地午夜重建歷史後，已完成日期的總量現在會保留最高的完整即時值，不再因日期切換或採集器交接而回退。（#341）
- **Kimi 每週額度：** 當兩個來源都返回資料時，現在優先顯示 Kimi 控制台中的 7 天已用/上限，不再被會員比例覆蓋。（#344）
<!-- app-update-notes:zh-TW:end -->

## 從原始碼建置

本倉庫不發布預先建置的安裝程式或應用程式封裝。如需使用，請下載或複製原始碼，並在目標作業系統上依照 [README 建置說明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#從源码运行与构建) 操作。GitHub 自動產生的原始碼封裝只是快照，不是可直接執行的應用程式。

</details>

<details>
<summary><strong>한국어</strong></summary>

## 한국어

## 업데이트 내용

<!-- app-update-notes:ko:start -->
### 추가
- **LongCat 및 Hy3 공급업체 인식:** LongCat 모델은 Meituan으로, Hy3 모델은 Tencent로 분류되며 공급업체 색상으로 표시되는 아이콘, 개별 색상 및 모양 설정을 제공합니다.
- **수동 모델 매핑:** 「설정 > 수집」에서 대소문자를 구분하지 않는 정확한 모델 ID를 대시보드, 기록 및 내보내기 보기 전체에 병합할 수 있으며 원시 사용량 데이터는 변경하지 않습니다.
- **진단 및 지원:** 「설정 > Token Monitor 정보」에서 「보고서 생성」 후 「보고서 보기」 또는 「보고서 복사」로 문제 신고에 사용할 수 있습니다. 보고서에는 앱, 수집, AI 도구 상태, AI 도구 한도, Hub, 작업량, 구성, 리소스와 Cursor/Antigravity 동기화 실패 단계·세부 코드·종료 코드(있는 경우)가 포함되며, 자격 증명·대화·계정·전체 경로·원시 오류는 포함되지 않습니다. (#340, #342)

### 개선
- **Replica 및 업스트림 버전 추적:** Fork 업데이트는 이제 `*-replica.N` tag만 허용하므로 업스트림 `0.42.0`이 `0.42.0-replica.1`보다 높게 처리되지 않습니다. 업스트림 기반 버전이 실제로 더 높을 때만 별도의 동기화 알림이 표시됩니다. 두 알림 모두 Release 페이지만 열고 다운로드나 설치를 하지 않으며, tag Release에도 프로젝트 빌드 바이너리를 첨부하지 않습니다.
- **실시간 수집 소스:** 감시 경로가 Codex 보관 세션, Cline 로컬 세션, Grok 통합 로그, Copilot 데이터베이스, ZCode SQLite를 포함한 Tokscale 4.11의 실제 소스와 일치합니다. 겹치는 사용자 지정 경로는 선언 순서와 관계없이 모든 소스의 합집합을 유지합니다. (#352, #353)
- **도구 소스 진단:** 존재하지 않는 선택적 Codex headless 캡처 경로는 숨기고, 구성되었거나 사용 중인 경로는 계속 표시합니다. 정확한 파일 소스는 해당 폴더에서 파일을 선택합니다. (#354)
- **MiMo Code 사용량:** 이제 사용하는 SQLite 데이터베이스와 WAL/SHM 사이드카만 감시하고 회전하는 로그 트리는 재귀적으로 감시하지 않아, 로그가 회전할 때 불필요한 새로 고침을 줄이고 앱의 응답성을 유지합니다. (#338)

### 수정
- **GLM Coding Plan 한도:** 개인 및 팀 계정이 `CREDIT_LIMIT` 토큰 창을 인식하여 유효한 한도 응답을 사용할 수 없음으로 표시하지 않습니다. (#351)
- **Kimi Code 모델 식별:** 공식 Kimi Code 모델 ID `k3` 및 `k3-256`이 이제 Kimi 모델로 분류됩니다.
- **추이 (DAY):** 현지 자정 이후 기록을 다시 구성할 때 완료된 날짜의 합계가 이제 가장 높은 완전한 실시간 값을 유지하며, 날짜가 바뀌거나 수집기가 인계될 때 더 이상 감소하지 않습니다. (#341)
- **Kimi 주간 한도:** 두 소스가 모두 데이터를 제공할 때 이제 Kimi 콘솔에 표시되는 7일 사용량/한도를 우선 표시하며, 멤버십 비율로 덮어쓰지 않습니다. (#344)
<!-- app-update-notes:ko:end -->

## 소스에서 빌드

이 저장소는 미리 빌드한 설치 파일이나 앱 아카이브를 게시하지 않습니다. 사용하려면 소스를 다운로드하거나 복제한 뒤 대상 운영 체제에서 [README 빌드 안내](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source)를 따르세요. GitHub가 자동 생성하는 소스 아카이브는 실행 가능한 앱이 아니라 소스 스냅샷입니다.

</details>

<details>
<summary><strong>日本語</strong></summary>

## 日本語

## 更新内容

<!-- app-update-notes:ja:start -->
### 追加
- **LongCat と Hy3 のベンダー認識：** LongCat モデルを Meituan、Hy3 モデルを Tencent として分類し、ベンダーカラーで着色されるアイコン、個別カラー、外観設定を追加しました。
- **手動モデルマッピング：** 「設定 > 収集」で、大文字小文字を区別しない完全一致のモデル ID をダッシュボード、履歴、エクスポート表示全体で統合でき、raw 使用量データは書き換えません。
- **診断とサポート：** 「設定 > Token Monitor について」で「レポートを作成」し、「レポートを見る」または「レポートをコピー」して問題を報告できます。レポートにはアプリ、収集、AIツールの状態、AIツール制限、Hub、ワークロード、設定、リソース、Cursor/Antigravity の同期失敗の段階・詳細コード・終了コード（利用可能な場合）が含まれ、認証情報、会話、アカウント、完全なパス、raw エラーは含まれません。（#340、#342）

### 改善
- **Replica とアップストリームのバージョン追跡：** Fork 更新は `*-replica.N` tag のみを受け入れるため、アップストリーム `0.42.0` が `0.42.0-replica.1` より新しいとは判定されません。アップストリームの基準バージョンが実際に新しい場合だけ、独立した同期通知を表示します。どちらの通知も Release ページを開くだけでダウンロードやインストールは行わず、tag Release にプロジェクトのビルド済みバイナリも添付しません。
- **リアルタイム収集ソース：** 監視パスを、Codex のアーカイブ、Cline のローカルセッション、Grok の統合ログ、Copilot データベース、ZCode SQLite を含む Tokscale 4.11 の実際のソースに合わせました。重複するカスタムパスは宣言順に依存せず、すべてのソースの和集合を保持します。（#352、#353）
- **ツールソース診断：** 存在しない任意の Codex headless キャプチャルートは非表示にし、設定済みまたは使用中のルートは表示します。完全なファイルソースは所属フォルダー内で選択されます。（#354）
- **MiMo Code の使用量：** 使用する SQLite データベースと WAL/SHM サイドカーだけを監視し、ローテーションするログツリーを再帰的に監視しなくなりました。ログのローテーション中も不要な再更新を減らし、アプリの応答性を保ちます。（#338）

### 修正
- **GLM Coding Plan の制限：** 個人およびチームアカウントで `CREDIT_LIMIT` トークンウィンドウを認識し、有効な制限応答を利用不可として表示しないようになりました。（#351）
- **Kimi Code モデル識別：** 公式 Kimi Code モデル ID `k3` と `k3-256` を Kimi モデルとして分類するようになりました。
- **トレンド（DAY）：** ローカルの午前0時をまたいで履歴を再構成した後も、完了した日の合計が最も高い完全なリアルタイム値を保持し、日付の切り替えやコレクターの引き継ぎで減少しなくなりました。（#341）
- **Kimi の週間制限：** 2つのソースが両方ともデータを返す場合、メンバーシップの割合で置き換えず、Kimi コンソールに表示される 7 日間の使用量/上限を優先して表示します。（#344）
<!-- app-update-notes:ja:end -->

## ソースからビルド

このリポジトリでは、ビルド済みのインストーラーやアプリのアーカイブを公開しません。使用する場合はソースをダウンロードまたは clone し、対象 OS で [README のビルド手順](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source)に従ってください。GitHub が自動生成するソースアーカイブは実行可能なアプリではなく、ソースのスナップショットです。

</details>

</details>
