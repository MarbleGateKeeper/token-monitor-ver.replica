# English

## What's changed

<!-- app-update-notes:en:start -->
### Added
- **WorkBuddy Credits:** Track Credits from the signed-in WorkBuddy desktop app on macOS and Windows; headless deployments can use the documented environment fallback. (#378)
- **Trae CN Credits:** Track Trae CN and SOLO credit balances with a Trae CN access token. (#483)

### Improved
- **Tray balance display:** Credits-backed tray items can show the balance-meter percentage, while Balance remains the default. (#470)
- **Tool tracking toggles:** Changing tracked tools no longer starts a redundant usage scan.
- **Unknown model artwork:** Unrecognized models now use the Token Monitor mark instead of a generic dot.

### Fixed
- **Codex limits:** OAuth quota and reset-count data are preferred when available, with the managed account's workspace mapping preserved. (#473)
- **Targeted usage refreshes:** Refreshing one or more tools no longer clears unrelated usage when the targeted result is incomplete. (#467)
- **AI Tool Limits refreshes:** Provider process failures now finish cleanly, with supported fallback paths still available where applicable. (#464)
- **Trae account setup:** The account setup controls and status now stay aligned with the provider's access-token flow.
<!-- app-update-notes:en:end -->

## Build from source

This repository does not publish prebuilt installers or application archives. To use this version, download or clone the source and follow the [README build instructions](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) on the target operating system. GitHub may still show its automatically generated source-code archives; those are source snapshots, not ready-to-run applications.

---

# 中文

## 更新内容

<!-- app-update-notes:zh:start -->
### 新增
- **WorkBuddy Credits：** 支持在 macOS 和 Windows 上读取已登录的 WorkBuddy 桌面应用 Credits；无界面部署可使用文档中的环境变量后备配置。（#378）
- **Trae CN Credits：** 支持使用 Trae CN access token 读取 Trae CN 与 SOLO Credits。（#483）

### 改进
- **托盘余额显示：** Credits 项目可选择显示余额或额度条百分比，默认仍显示余额。（#470）
- **工具追踪开关：** 修改追踪工具时不再触发一次多余的用量扫描。
- **未知模型图标：** 无法识别厂商的模型现在使用 Token Monitor 标志，不再显示通用圆点。

### 修复
- **Codex 额度：** 优先读取 OAuth 账号的额度与重置次数，并保留管理账号的工作区对应关系。（#473）
- **定向用量刷新：** 刷新一个或多个工具时，即使返回结果不完整，也不会清除其他工具的用量。（#467）
- **AI 工具额度刷新：** 提供商进程异常时，额度刷新会正常收尾；支持后备路径的提供商会继续尝试后备方案。（#464）
- **Trae 账号设置：** 账号设置控件和状态现已与 access token 流程保持一致。
<!-- app-update-notes:zh:end -->

## 从源码构建

本仓库不发布预构建安装包或应用压缩包。如需使用，请下载或克隆源码，并在目标操作系统上按照 [README 构建说明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#从源码运行与构建) 操作。GitHub 页面仍可能显示平台自动生成的源码压缩包；它们只是源码快照，不是可直接运行的应用。

---

<details>
<summary><strong>Full Changelog:</strong> <a href="https://github.com/MarbleGateKeeper/token-monitor-ver.replica/compare/0.46.0-replica.2...v0.47.0-replica.1">0.46.0-replica.2...v0.47.0-replica.1</a></summary>

<!-- github-generated-release-notes -->

</details>

<details>
<summary>繁體中文 · 한국어 · 日本語</summary>

<details>
<summary><strong>繁體中文</strong></summary>

## 繁體中文

## 更新內容

<!-- app-update-notes:zh-TW:start -->
### 新增
- **WorkBuddy Credits：** 支援在 macOS 與 Windows 上讀取已登入的 WorkBuddy 桌面應用程式 Credits；無介面部署可使用文件中的環境變數後備設定。（#378）
- **Trae CN Credits：** 支援使用 Trae CN access token 讀取 Trae CN 與 SOLO Credits。（#483）

### 改進
- **托盤餘額顯示：** Credits 項目可選擇顯示餘額或額度條百分比，預設仍顯示餘額。（#470）
- **工具追蹤開關：** 變更追蹤工具時不再觸發多餘的用量掃描。
- **未知模型圖示：** 無法辨識供應商的模型現在使用 Token Monitor 標誌，不再顯示通用圓點。

### 修復
- **Codex 額度：** 優先讀取 OAuth 帳號的額度與重置次數，並保留管理帳號的工作區對應關係。（#473）
- **定向用量重新整理：** 重新整理一個或多個工具時，即使回傳結果不完整，也不會清除其他工具的用量。（#467）
- **AI 工具額度重新整理：** 提供者程序異常時，額度重新整理會正常收尾；支援後備路徑的提供者會繼續嘗試後備方案。（#464）
- **Trae 帳號設定：** 帳號設定控制項與狀態現在和 access token 流程保持一致。
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
- **WorkBuddy Credits:** macOS와 Windows에서 로그인된 WorkBuddy 데스크톱 앱의 Credits를 추적합니다. 헤드리스 배포에서는 문서화된 환경 변수 대체 설정을 사용할 수 있습니다. (#378)
- **Trae CN Credits:** Trae CN access token으로 Trae CN 및 SOLO Credits를 추적합니다. (#483)

### 개선
- **트레이 잔액 표시:** Credits 기반 트레이 항목에서 잔액 또는 미터 백분율을 선택할 수 있으며, 기본값은 잔액입니다. (#470)
- **도구 추적 토글:** 추적 도구를 변경할 때 중복 사용량 스캔을 더 이상 시작하지 않습니다.
- **알 수 없는 모델 아이콘:** 공급자를 인식할 수 없는 모델은 일반 점 대신 Token Monitor 마크를 사용합니다.

### 수정
- **Codex 한도:** OAuth 계정의 한도와 리셋 횟수를 우선 사용하고, 관리 계정의 워크스페이스 연결을 유지합니다. (#473)
- **대상 사용량 새로 고침:** 하나 이상의 도구를 새로 고칠 때 결과가 불완전해도 다른 도구의 사용량을 지우지 않습니다. (#467)
- **AI 도구 한도 새로 고침:** 공급자 프로세스 오류가 발생해도 새로 고침이 정상적으로 마무리되며, 지원되는 경우 대체 경로를 계속 시도합니다. (#464)
- **Trae 계정 설정:** 계정 설정 컨트롤과 상태가 access token 흐름과 일치하도록 정리되었습니다.
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
- **WorkBuddy Credits：** macOSとWindowsで、ログイン済みのWorkBuddyデスクトップアプリからCreditsを追跡できます。ヘッドレス環境では、ドキュメントに記載された環境変数のフォールバックを利用できます。（#378）
- **Trae CN Credits：** Trae CN access tokenを使用して、Trae CNとSOLO Creditsを追跡できます。（#483）

### 改善
- **トレイの残高表示：** Credits対応のトレイ項目で残高とメーターの割合を選択でき、初期値は残高です。（#470）
- **ツール追跡の切り替え：** 追跡対象のツールを変更しても、重複した使用量スキャンを開始しなくなりました。
- **不明なモデルのアイコン：** プロバイダーを認識できないモデルには、汎用の点ではなくToken Monitorのマークを表示します。

### 修正
- **Codexの制限：** OAuthアカウントの制限とリセット回数を優先して使用し、管理アカウントのワークスペースとの対応関係を維持します。（#473）
- **対象を絞った使用量の更新：** 1つ以上のツールを更新したとき、結果が不完全でも他のツールの使用量を消去しません。（#467）
- **AIツール制限の更新：** プロバイダーのプロセスでエラーが起きても更新を正常に終了し、対応するフォールバック経路がある場合は引き続き試行します。（#464）
- **Traeアカウント設定：** アカウント設定のコントロールと状態をaccess tokenフローに合わせました。
<!-- app-update-notes:ja:end -->

## ソースからビルド

このリポジトリでは、ビルド済みのインストーラーやアプリのアーカイブを公開しません。使用する場合はソースをダウンロードまたは clone し、対象 OS で [README のビルド手順](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) に従ってください。GitHub が自動生成するソースアーカイブは実行可能なアプリではなく、ソーススナップショットです。

</details>

</details>
