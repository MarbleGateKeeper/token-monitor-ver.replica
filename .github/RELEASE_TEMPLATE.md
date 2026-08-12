# English

## What's changed

<!-- app-update-notes:en:start -->
### Added
- **Reasonix tracking:** Adds Tokscale-backed Reasonix usage plus local native Session and Project views. Native metadata and synthetic sessions stay out of Hub, Archive, and sync payloads.
- **Optional native macOS Widget:** Source builds can opt into Small, Medium, and Large WidgetKit views for Overview, Quota, Models, Activity, and Trend on macOS 14+.
- **Broader project attribution:** Local bounded metadata readers now enrich Grok Build, ZCode, Pi / Oh My Pi, CodeBuddy, OpenCode, Hermes, WorkBuddy, Qwen Code, and Kimi Code sessions. Model mappings also price source IDs through their canonical target.

### Changed
- **Upstream 0.43.0 base:** Uses Tokscale 4.13.0 and adopts upstream Hunyuan recognition and artwork for Hy3 models while retaining this fork's configurable vendor-color tinting.

### Fixed
- Refreshes Codex plan metadata and classifies the standard 30-day quota as Monthly, keeps Kiro's unbounded IDE storage off the live watcher, persists remote Widget history fallback, and bounds Reasonix sidecar reads.
<!-- app-update-notes:en:end -->

## Build from source

This repository does not publish prebuilt installers or application archives. To use this version, download or clone the source and follow the [README build instructions](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) on the target operating system. GitHub may still show its automatically generated source-code archives; those are source snapshots, not ready-to-run applications.

---

# 中文

## 更新内容

<!-- app-update-notes:zh:start -->
### 新增
- **Reasonix 跟踪：** 增加由 Tokscale 提供的 Reasonix 用量，以及仅限本机的原生会话与项目视图；原生元数据和合成会话不会进入 Hub、归档或同步载荷。
- **可选原生 macOS Widget：** 源码构建可在 macOS 14+ 选择启用 Small、Medium、Large WidgetKit 小组件，提供概览、额度、模型、活动和趋势页面。
- **更完整的项目归属：** 使用受限的本机元数据读取，为 Grok Build、ZCode、Pi / Oh My Pi、CodeBuddy、OpenCode、Hermes、WorkBuddy、Qwen Code 和 Kimi Code 补全项目；模型映射也会按规范目标价格为源 ID 计费。

### 变更
- **同步上游 0.43.0：** 升级 Tokscale 4.13.0，并直接采用上游对 Hy3 的 Hunyuan 识别和图标，同时保留本 fork 可配置的厂商颜色染色。

### 修复
- 刷新 Codex 套餐元数据并把标准 30 天额度归类为月额度；避免实时监听无界的 Kiro IDE 存储；持久化远端 Widget 历史回退；限制 Reasonix sidecar 读取大小。
<!-- app-update-notes:zh:end -->

## 从源码构建

本仓库不发布预构建安装包或应用压缩包。如需使用，请下载或克隆源码，并在目标操作系统上按照 [README 构建说明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#从源码运行与构建) 操作。GitHub 页面仍可能显示平台自动生成的源码压缩包；它们只是源码快照，不是可直接运行的应用。

---

**Full Changelog:** [v0.42.1-replica.2...v0.43.0-replica.1](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/compare/v0.42.1-replica.2...v0.43.0-replica.1)

<details>
<summary>繁體中文 · 한국어 · 日本語</summary>

<details>
<summary><strong>繁體中文</strong></summary>

## 繁體中文

## 更新內容

<!-- app-update-notes:zh-TW:start -->
### 新增
- **Reasonix 追蹤：** 新增 Tokscale 支援的 Reasonix 用量，以及僅限本機的原生工作階段與專案檢視；原生中繼資料和合成工作階段不會進入 Hub、封存或同步負載。
- **可選原生 macOS Widget：** 原始碼建置可在 macOS 14+ 選擇啟用 Small、Medium、Large WidgetKit 小工具，提供概覽、額度、模型、活動和趨勢頁面。
- **更完整的專案歸屬：** 以受限的本機中繼資料讀取補全更多工具的專案，模型映射也會依規範目標價格為來源 ID 計費。

### 變更
- **同步上游 0.43.0：** 升級 Tokscale 4.13.0，直接採用上游 Hy3 的 Hunyuan 識別與圖示，同時保留本 fork 可設定的廠商顏色染色。

### 修復
- 更新 Codex 方案中繼資料與月額度分類、排除 Kiro 無界 IDE 儲存的即時監聽、保存遠端 Widget 歷史備援，並限制 Reasonix sidecar 讀取大小。
<!-- app-update-notes:zh-TW:end -->

## 從原始碼建置

本儲存庫不發布預先建置的安裝程式或應用程式封裝。如需使用，請下載或複製原始碼，並在目標作業系統上依照 [README 建置說明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#從源码运行与构建) 操作。GitHub 自動產生的原始碼封裝只是快照，不是可直接執行的應用程式。

</details>

<details>
<summary><strong>한국어</strong></summary>

## 한국어

## 업데이트 내용

<!-- app-update-notes:ko:start -->
### 추가
- **Reasonix 추적:** Tokscale 기반 사용량과 로컬 전용 세션/프로젝트 보기를 추가합니다. 네이티브 메타데이터와 합성 세션은 Hub, 보관 또는 동기화 페이로드에 포함되지 않습니다.
- **선택형 macOS Widget:** macOS 14+ 소스 빌드에서 Overview, Quota, Models, Activity, Trend를 제공하는 Small, Medium, Large WidgetKit 보기를 활성화할 수 있습니다.
- **프로젝트 귀속 확대:** 제한된 로컬 메타데이터 읽기로 더 많은 도구의 프로젝트를 보완하며, 모델 매핑의 원본 ID도 정규 대상 가격으로 계산합니다.

### 변경
- **업스트림 0.43.0 동기화:** Tokscale 4.13.0과 업스트림 Hy3/Hunyuan 인식 및 아이콘을 사용하면서 이 fork의 설정 가능한 공급업체 색상 적용을 유지합니다.

### 수정
- Codex 플랜/월간 할당량 분류, Kiro 라이브 감시 범위, 원격 Widget 기록 대체 데이터, Reasonix sidecar 읽기 한계를 개선했습니다.
<!-- app-update-notes:ko:end -->

## 소스에서 빌드

이 저장소는 미리 빌드된 설치 파일이나 애플리케이션 압축 파일을 배포하지 않습니다. 사용하려면 소스를 다운로드하거나 복제한 다음 대상 운영 체제에서 [README 빌드 안내](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source)를 따르세요. GitHub가 자동 생성하는 소스 코드 압축 파일은 실행 가능한 앱이 아니라 소스 스냅샷입니다.

</details>

<details>
<summary><strong>日本語</strong></summary>

## 日本語

## 更新内容

<!-- app-update-notes:ja:start -->
### 追加
- **Reasonix 追跡：** Tokscale ベースの使用量と、ローカル専用のセッション／プロジェクト表示を追加しました。ネイティブメタデータと合成セッションは Hub、アーカイブ、同期ペイロードに入りません。
- **任意の macOS Widget：** macOS 14+ のソースビルドで、Overview、Quota、Models、Activity、Trend を備えた Small／Medium／Large WidgetKit 表示を有効化できます。
- **プロジェクト帰属の拡張：** 制限付きローカルメタデータ読み取りでより多くのツールを補完し、モデルマッピング元 ID も正規ターゲットの価格で計算します。

### 変更
- **アップストリーム 0.43.0 同期：** Tokscale 4.13.0 とアップストリームの Hy3／Hunyuan 判定・アイコンを採用しつつ、この fork の設定可能なベンダーカラー着色を維持します。

### 修正
- Codex プランと月次枠の分類、Kiro のライブ監視範囲、リモート Widget 履歴フォールバック、Reasonix sidecar 読み取り上限を改善しました。
<!-- app-update-notes:ja:end -->

## ソースからビルド

このリポジトリでは、ビルド済みのインストーラーやアプリのアーカイブを公開しません。使用する場合はソースをダウンロードまたは clone し、対象 OS で [README のビルド手順](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) に従ってください。GitHub が自動生成するソースアーカイブは実行可能なアプリではなく、ソースのスナップショットです。

</details>

</details>
