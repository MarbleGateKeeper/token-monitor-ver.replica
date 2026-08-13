# English

## What's changed

<!-- app-update-notes:en:start -->
### Added
- **Usage ranges:** Clicking Home's `MONTH` tab opens a menu with `This week`, `Last 7 days`, and `Last 30 days`. After switching, `Tools`, `Models`, and `Devices` show token-component and cost details for the selected period; usage whose components cannot be reconstructed is grouped under `Unclassified`. (#393, #398)
- **Hub deployment status:** `Connect to a hub` now reports whether the remote `Hub`, `Node Hub`, or `Worker` is current, needs redeployment, was deployed by a newer Token Monitor version, or has unrecognized build information. (#399)
- **Tray activity source:** Tray icons and `Tokens`/`Cost` items can follow the `Most recently active tool`, while their values continue to use the selected period aggregates. (#397)

### Improved
- **Tray cost display:** Each tray cost item can use `Cost format` (`Compact` or `Full number`) and `Decimal places` (`Automatic` or 0–4). New cost items default to compact two-decimal display; existing layouts keep their previous full-number presentation. (#396)
- **Windows installer:** Locally built installers now let users choose the installation directory. (#390)

### Fixed
- **Proma usage:** Assistant messages with incomplete IDs are still counted instead of disappearing from usage totals. (#392)
- **Tray composer:** Open picker menus stay attached to the active composer item during live updates, so an in-progress selection is not lost. (#395)
- **macOS compatibility:** The host app now supports macOS 12+, while the optional native Widget remains gated to macOS 14+. (#394)
<!-- app-update-notes:en:end -->

## Build from source

This repository does not publish prebuilt installers or application archives. To use this version, download or clone the source and follow the [README build instructions](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) on the target operating system. GitHub may still show its automatically generated source-code archives; those are source snapshots, not ready-to-run applications.

---

# 中文

## 更新内容

<!-- app-update-notes:zh:start -->
### 新增
- **用量范围：**在主页顶部点击 `MONTH` 标签，会打开期间菜单，可切换到“本周”“最近 7 天”和“最近 30 天”。切换后，可按所选期间查看“工具”“模型”和“设备”的 Token 组成及成本明细；无法还原组成的用量会归入“未分类”。（#393、#398）
- **Hub 部署状态：**“连接到 Hub”现在会显示远程 `Hub`、`Node Hub` 或 `Worker` 是否为最新版本、需要重新部署、由较新的 Token Monitor 版本部署，或部署版本无法识别。（#399）
- **托盘活动来源：**托盘图标以及 Tokens/费用项目现在可以跟随“最近有活动的工具”，显示数值仍使用所选期间的聚合数据。（#397）

### 改进
- **托盘费用显示：**每个托盘费用项目都可选择“缩写”或“完整数字”，并选择“自动”或 0–4 位小数。新费用项目默认使用两位小数的缩写显示；现有布局保留之前的完整数字显示。（#396）
- **Windows 安装版：**本地构建的安装包现在允许选择安装目录。（#390）

### 修复
- **Proma 用量：**ID 信息不完整的助手消息现在也会计入用量，不再从统计总量中消失。（#392）
- **托盘编辑器：**实时更新期间，打开的选择菜单会继续附着在当前编辑项目上，不会丢失正在进行的选择。（#395）
- **macOS 兼容性：**主应用现在支持 macOS 12 及以上版本，可选原生 Widget 仍只在 macOS 14 及以上版本启用。（#394）
<!-- app-update-notes:zh:end -->

## 从源码构建

本仓库不发布预构建安装包或应用压缩包。如需使用，请下载或克隆源码，并在目标操作系统上按照 [README 构建说明](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#从源码运行与构建) 操作。GitHub 页面仍可能显示平台自动生成的源码压缩包；它们只是源码快照，不是可直接运行的应用。

---

<details>
<summary><strong>Full Changelog:</strong> <a href="https://github.com/MarbleGateKeeper/token-monitor-ver.replica/compare/0.43.0-replica.1...v0.44.0-replica.1">0.43.0-replica.1...v0.44.0-replica.1</a></summary>

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
- **用量範圍：**主頁的 `MONTH` 選單可切換「本星期」「最近 7 日」與「最近 30 日」，並在工具、模型與裝置檢視中顯示所選期間的 Token 組成及成本；無法還原組成的用量會歸入「未分類」。（#393、#398）
- **Hub 部署狀態：**「連接到 Hub」會顯示遠端 Hub、Node Hub 或 Worker 是否為最新版本、需要重新部署、來自較新的版本，或部署資訊無法辨識。（#399）
- **系統匣活動來源：**系統匣圖示與 Tokens/成本項目可以跟隨「最近有活動的工具」。（#397）

### 改進
- **系統匣成本顯示：**每個成本項目可選擇縮寫或完整數字，以及自動或 0–4 位小數。（#396）
- **Windows 安裝程式：**本機建置的安裝程式現在允許選擇安裝目錄。（#390）

### 修復
- **Proma 用量：**ID 資訊不完整的助理訊息也會計入用量。（#392）
- **系統匣編輯器：**即時更新期間，開啟的選單會保持附著在目前項目上。（#395）
- **macOS 相容性：**主 App 支援 macOS 12+，可選 Widget 仍要求 macOS 14+。（#394）
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
- **사용량 기간:** 홈의 `MONTH` 메뉴에서 이번 주, 최근 7일, 최근 30일을 선택하고 도구, 모델, 기기별 토큰 구성과 비용을 볼 수 있습니다. 복원할 수 없는 구성은 미분류로 표시됩니다. (#393, #398)
- **Hub 배포 상태:** 원격 Hub, Node Hub 또는 Worker가 최신인지, 재배포가 필요한지, 더 최신 버전에서 배포되었는지, 정보를 인식할 수 없는지 표시합니다. (#399)
- **트레이 활동 소스:** 트레이 아이콘과 토큰/비용 항목이 최근 활동한 도구를 따를 수 있습니다. (#397)

### 개선
- **트레이 비용 표시:** 각 비용 항목에서 축약/전체 숫자 형식과 자동 또는 0–4자리 소수를 설정할 수 있습니다. (#396)
- **Windows 설치 프로그램:** 로컬에서 빌드한 설치 프로그램의 설치 디렉터리를 선택할 수 있습니다. (#390)

### 수정
- **Proma 사용량:** ID가 불완전한 어시스턴트 메시지도 사용량에 포함됩니다. (#392)
- **트레이 편집기:** 실시간 업데이트 중에도 열린 선택 메뉴가 현재 항목에 유지됩니다. (#395)
- **macOS 호환성:** 호스트 앱은 macOS 12+, 선택형 Widget은 macOS 14+를 요구합니다. (#394)
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
- **使用期間:** ホームの `MONTH` メニューから今週、過去 7 日間、過去 30 日間を選択し、ツール、モデル、デバイスごとのトークン構成とコストを確認できます。復元できない構成は未分類になります。（#393、#398）
- **Hub デプロイ状態:** リモート Hub、Node Hub、Worker が最新か、再デプロイが必要か、より新しいバージョンからデプロイされたか、情報を認識できないかを表示します。（#399）
- **トレイのアクティブソース:** トレイアイコンとトークン／コスト項目が最近使用したツールに追従できます。（#397）

### 改善
- **トレイのコスト表示:** 各コスト項目で省略／完全な数値形式と、自動または 0～4 桁の小数を設定できます。（#396）
- **Windows インストーラー:** ローカルビルドしたインストーラーでインストール先を選択できます。（#390）

### 修正
- **Proma の使用量:** ID が不完全なアシスタントメッセージも使用量に含まれます。（#392）
- **トレイエディター:** ライブ更新中も開いた選択メニューが現在の項目に維持されます。（#395）
- **macOS 互換性:** ホストアプリは macOS 12+、任意の Widget は macOS 14+ が必要です。（#394）
<!-- app-update-notes:ja:end -->

## ソースからビルド

このリポジトリでは、ビルド済みのインストーラーやアプリのアーカイブを公開しません。使用する場合はソースをダウンロードまたは clone し、対象 OS で [README のビルド手順](https://github.com/MarbleGateKeeper/token-monitor-ver.replica#run-and-build-from-source) に従ってください。GitHub が自動生成するソースアーカイブは実行可能なアプリではなく、ソースのスナップショットです。

</details>

</details>
