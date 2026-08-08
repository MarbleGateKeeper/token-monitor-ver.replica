# English

## What's changed

<!-- app-update-notes:en:start -->
### Improved
- **Tokscale 4.12 and custom pricing:** Free models can now use explicit zero prices, while malformed, negative, non-finite, or wrong-typed values reject the complete row instead of silently applying a partial override. Updated model aliases and pricing safeguards from Tokscale 4.12 are included. (#355)
- **Cold-start totals:** A valid collector anchor now seeds the widget and tray with the last full scan while the first new scan runs, instead of temporarily showing zero usage. (#339)
- **Upstream baseline:** Synced through `upstream/main` commit `43ebd1e` after v0.42.1 while preserving this fork's replica-only, notification-only release channel; no downloader or installer was restored.

### Fixed
- **Reliable exit:** Quitting no longer waits for large watcher trees or in-flight embedded Hub requests, preventing the application from hanging on exit. (#337)
<!-- app-update-notes:en:end -->

## Build from source

This repository does not publish prebuilt installers or application archives. To use this version, download or clone the source and follow the [README build instructions](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) on the target operating system. GitHub may still show its automatically generated source-code archives; those are source snapshots, not ready-to-run applications.

---

# 中文

## 更新内容

<!-- app-update-notes:zh:start -->
### 改进
- **Tokscale 4.12 与自定义单价：** 免费模型现在可以显式填写零价格；格式错误、负数、非有限值或类型错误会拒绝整行，不再静默应用部分覆盖。同时包含 Tokscale 4.12 更新的模型别名与计价保护。（#355）
- **冷启动总量：** 有效的采集锚点现在会在首次新扫描期间，用上一次完整扫描填充组件和托盘，不再暂时显示零用量。（#339）
- **上游基线：** 已同步至 `v0.42.1` 后的 `upstream/main` 提交 `43ebd1e`，并保留本 fork 仅接受 replica tag、只提示不下载或安装的发行通道。

### 修复
- **可靠退出：** 退出时不再等待大型监听目录树或仍在进行的内置 Hub 请求，避免应用卡在退出流程。（#337）
<!-- app-update-notes:zh:end -->

## 从源码构建

本仓库不发布预构建安装包或应用压缩包。如需使用，请下载或克隆源码，并在目标操作系统上按照 [README 构建说明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#从源码运行与构建) 操作。GitHub 页面仍可能显示平台自动生成的源码压缩包；它们只是源码快照，不是可直接运行的应用。

---

**Full Changelog:** [0.42.0-replica.3...v0.42.1-replica.1](https://github.com/MarbleGateKeeper/token-monitor-ver.replica/compare/0.42.0-replica.3...v0.42.1-replica.1)

<details>
<summary>繁體中文 · 한국어 · 日本語</summary>

<details>
<summary><strong>繁體中文</strong></summary>

## 繁體中文

## 更新內容

<!-- app-update-notes:zh-TW:start -->
### 改進
- **Tokscale 4.12 與自訂單價：** 免費模型現在可以明確填寫零價格；格式錯誤、負數、非有限值或類型錯誤會拒絕整列，不再靜默套用部分覆寫。同時包含 Tokscale 4.12 更新的模型別名與計價保護。（#355）
- **冷啟動總量：** 有效的採集錨點現在會在首次新掃描期間，以上一次完整掃描填入小工具和系統匣，不再暫時顯示零用量。（#339）
- **上游基線：** 已同步至 `v0.42.1` 之後的 `upstream/main` 提交 `43ebd1e`，並保留本 fork 僅接受 replica tag、只提示而不下載或安裝的發行通道。

### 修復
- **可靠退出：** 結束時不再等待大型監看目錄樹或仍在進行的內建 Hub 請求，避免應用程式卡在結束流程。（#337）
<!-- app-update-notes:zh-TW:end -->

## 從原始碼建置

本儲存庫不發布預先建置的安裝程式或應用程式封裝。如需使用，請下載或複製原始碼，並在目標作業系統上依照 [README 建置說明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#從源码运行与构建) 操作。GitHub 自動產生的原始碼封裝只是快照，不是可直接執行的應用程式。

</details>

<details>
<summary><strong>한국어</strong></summary>

## 한국어

## 업데이트 내용

<!-- app-update-notes:ko:start -->
### 개선
- **Tokscale 4.12 및 사용자 지정 가격:** 무료 모델에 명시적인 0 가격을 사용할 수 있으며, 형식 오류, 음수, 유한하지 않은 값 또는 잘못된 형식은 일부만 적용하지 않고 행 전체를 거부합니다. Tokscale 4.12의 갱신된 모델 별칭과 가격 보호도 포함됩니다. (#355)
- **콜드 스타트 합계:** 유효한 수집기 앵커가 첫 번째 새 스캔이 실행되는 동안 위젯과 트레이를 마지막 전체 스캔으로 채워, 사용량이 일시적으로 0으로 표시되지 않습니다. (#339)
- **업스트림 기준:** v0.42.1 이후의 `upstream/main` 커밋 `43ebd1e`까지 동기화하면서 replica tag만 허용하고 알림만 제공하는 이 fork의 릴리스 채널을 유지했습니다. 다운로드나 설치 기능은 복원하지 않았습니다.

### 수정
- **안정적인 종료:** 종료할 때 대규모 감시 디렉터리 트리나 진행 중인 내장 Hub 요청을 기다리지 않아 애플리케이션이 종료 중 멈추지 않습니다. (#337)
<!-- app-update-notes:ko:end -->

## 소스에서 빌드

이 저장소는 미리 빌드된 설치 파일이나 애플리케이션 압축 파일을 배포하지 않습니다. 사용하려면 소스를 다운로드하거나 복제한 다음 대상 운영 체제에서 [README 빌드 안내](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source)를 따르세요. GitHub가 자동 생성하는 소스 코드 압축 파일은 실행 가능한 앱이 아니라 소스 스냅샷입니다.

</details>

<details>
<summary><strong>日本語</strong></summary>

## 日本語

## 更新内容

<!-- app-update-notes:ja:start -->
### 改善
- **Tokscale 4.12 とカスタム価格：** 無料モデルに明示的なゼロ価格を設定できるようになり、形式不正、負数、非有限値、型の誤りがある場合は一部だけ適用せず行全体を拒否します。Tokscale 4.12 の更新されたモデルエイリアスと価格保護も含まれます。（#355）
- **コールドスタート時の合計：** 有効なコレクターアンカーから、最初の新しいスキャン中に直前の完全スキャンをウィジェットとトレイへ表示し、使用量が一時的にゼロになるのを防ぎます。（#339）
- **アップストリーム基準：** v0.42.1 後の `upstream/main` コミット `43ebd1e` まで同期しつつ、replica tag のみを対象に通知だけを行う本 fork のリリースチャネルを維持しました。ダウンロードやインストール機能は復元していません。

### 修正
- **安定した終了：** 終了時に大規模な監視ディレクトリツリーや処理中の内蔵 Hub リクエストを待たず、アプリが終了処理で停止しないようになりました。（#337）
<!-- app-update-notes:ja:end -->

## ソースからビルド

このリポジトリでは、ビルド済みのインストーラーやアプリのアーカイブを公開しません。使用する場合はソースをダウンロードまたは clone し、対象 OS で [README のビルド手順](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) に従ってください。GitHub が自動生成するソースアーカイブは実行可能なアプリではなく、ソースのスナップショットです。

</details>

</details>
