# LinkAnimation

<p align="center">
  <b>ビジュアルパスアニメーションエディタ & JavaScript SDK</b>
</p>

<p align="center">
  <a href="https://cww978.github.io/LinkAnimation/">
    <img src="https://img.shields.io/badge/Demo-%E3%82%AA%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E3%83%87%E3%83%A2-brightgreen.svg" alt="Live Demo">
  </a>
  <a href="https://www.npmjs.com/package/link-animation-editor">
    <img src="https://img.shields.io/npm/v/link-animation-editor.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/link-animation-editor">
    <img src="https://img.shields.io/npm/dm/link-animation-editor.svg" alt="npm downloads">
  </a>
  <a href="https://github.com/cww978/LinkAnimation/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/link-animation-editor.svg" alt="license">
  </a>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> | <a href="./README_EN.md">English</a> | <b>日本語</b>
</p>

---

## 🔗 オンラインデモプレビュー

👉 **[オンラインエディタデモを試す](https://cww978.github.io/LinkAnimation/)**

---

## 📖 概要

**LinkAnimation** は、ビジュアルなパスアニメーション作成ツールおよび独立して動作する JavaScript ライブラリです。直感的なキャンバス操作で複雑な移動軌跡を描画し、移動物体の回転ルールや各チェックポイントの個別属性（滞在時間、速度倍率、動的な画像切替など）を設定して、アニメーション設定 JSON を一括出力できます。

また、本プロジェクトには **UI フレームワークに依存しない軽量な JavaScript ランタイムライブラリ (`LinkAnimation`)** が内蔵されています。HTML、Vue、React、Angular、Svelte などのフロントエンド環境で独立して動作し、モバイル画面に最適化された**レスポンシブ自動等倍スケーリング**に対応しています。

---

## ⚡ クイックスタート (NPM)

### 1. npm パッケージのインストール

```bash
npm install link-animation-editor
# または pnpm / yarn
pnpm add link-animation-editor
yarn add link-animation-editor
```

### 2. プロジェクトでの使用方法 (Vue / React / TS / JS)

```typescript
import { LinkAnimation } from 'link-animation-editor'
import configJson from './route-config.json' // エディタから出力した JSON 設定ファイル

// アニメーションインスタンスの初期化
const animation = new LinkAnimation({
  container: '#animation-container', // 要素セレクタまたは DOM ノード
  config: configJson,                // 出力された JSON 設定
  responsive: true,                  // 【v1.0.3 新機能】モバイル＆多端末対応自動スケーリング
  showBg: false,                     // 背景を表示するか（false で透明背景）
  bgColor: 'transparent',           // 【v1.0.3 新機能】カスタム背景色または 'transparent'
  bgImage: '',                       // 【v1.0.3 新機能】背景画像 URL
  showLine: true,                    // パスラインを表示するか
  showPoint: true,                   // ウェイポイントを表示するか
  lineType: 'dashed',                // ラインスタイル ('solid' | 'dashed' | 'dot' | 'dashdot')
  lineColor: '#cccccc',              // 通常時のライン色
  lineActiveColor: '#1296db',        // 通過後のアクティブ色
  step: 0,                           // 初期開始ポイントのインデックス
})

// 再生制御 API
animation.start()            // 全パスアニメーションの再生開始
animation.pause()            // 一時停止
animation.stop()             // 停止して初期位置にリセット
animation.seekTo(0.5)        // 進捗割合 (0〜1) にジャンプ
animation.stepTo(2, true)    // 【スムーズ移動】指定ポイントへ滑らかに滑空移動
animation.stepAdd(1)         // 1 ポイント前進（移動アニメーション付き）
animation.stepAdd(-1)        // 1 ポイント後退（移動アニメーション付き）

// イベントリスナー
animation.on('waypoint', ({ index, point, imageSwitched }) => {
  console.log(`ポイント P${index} に到達`, point)
  if (imageSwitched) {
    console.log(`画像を切り替えました: ${imageSwitched}`)
  }
})

animation.on('end', () => {
  console.log('アニメーション再生終了')
})

// コンポーネント破棄時にインスタンスを解放
// animation.destroy()
```

### 3. CDN / HTML `<script>` タグでの直接読み込み

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>LinkAnimation Demo</title>
</head>
<body>
  <div id="animation-container" style="width: 100%; height: 100vh; position: relative;"></div>

  <script src="https://unpkg.com/link-animation-editor/dist-lib/link-animation.umd.js"></script>

  <script>
    const configData = /* 出力した JSON 設定 */;

    const animation = new window.LinkAnimation({
      container: '#animation-container',
      config: configData,
      responsive: true,
      showLine: true,
      lineType: 'dashed',
      lineActiveColor: '#1296db',
    });

    animation.start();
  </script>
</body>
</html>
```

---

## 🛠️ API リファレンス (v1.0.3)

| パラメータ | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `container` | `string \| HTMLElement` | - | ターゲットコンテナのセレクタまたは DOM 要素 |
| `config` | `object \| string` | - | エディタから出力したアニメーション設定 JSON |
| `responsive` | `boolean` | `true` | **【v1.0.3 新機能】** コンテナサイズに合わせて自動等倍スケーリング |
| `showBg` | `boolean` | `true` | 背景を表示するか（`false` で完全透明背景） |
| `bgColor` | `string` | `'#0f172a'` | **【v1.0.3 新機能】** 背景色（`'transparent'`、Hex、RGB に対応） |
| `bgImage` | `string` | `null` | **【v1.0.3 新機能】** 背景画像 URL の上書き |
| `showLine` | `boolean` | `true` | 移動パスラインを表示するか |
| `showPoint` | `boolean` | `true` | ウェイポイント（中継点）の丸印を表示するか |
| `lineType` | `'solid' \| 'dashed' \| 'dot' \| 'dashdot'` | `'dashed'` | パスラインのスタイル |
| `lineColor` | `string` | `'#cccccc'` | 未通過部分のライン色 |
| `lineActiveColor` | `string` | `'#1296db'` | 通過済み部分のハイライト色 |
| `step` | `number` | `0` | 初期開始ポイントのインデックス |
| `curveType` | `'smooth' \| 'linear'` | `'smooth'` | 軌跡アルゴリズム (ベジェ曲線 / 直線) |
| `easing` | `EasingType` | `'ease-in-out'` | アニメーションのイージング関数 (`linear`, `ease`, `ease-in`, `ease-out`, `bounce`) |
| `duration` | `number` | - | 全体のアニメーション再生時間（秒） |
| `speed` | `number` | `1` | 再生速度の倍率 |

---

## ✨ 主な機能

### 📱 1. モバイル・マルチデバイス対応自動スケーリング (`v1.0.3`)
- **座標計算不要**: `750x1624` や任意の解像度で作成したパスを、モバイル画面の `width: 100%` コンテナにそのまま指定可能。
- **自動等倍スケーリング**: 内蔵の `ResizeObserver` + CSS `transform: scale()` により、あらゆるスマートフォン画面サイズにスムーズにフィット。

### 🎨 2. 直感的なキャンバス編集
- **インタラクティブ編集**: ポイント追加・ドラッグ移動・削除。
- **動的挿入**: ライン上にホバーしてクリックすることでポイントを動的に追加。
- **背景カスタマイズ**: 背景色、画像 URL、表示モード（`contain` / `cover` / `fill`）および透明度の調整に対応。
- **グリッドアシスト**: グリッドサイズ設定と**スナップ（吸着）**機能。
- **軌跡タイプ**: **ベジェ曲線**と**直線**の切り替え。

### 🤖 3. 移動物体と画像管理
- **画像のカスタマイズ**: 移動物体の画像、サイズ、回転中心（Origin）、影、角度オフセットの設定。
- **複数画像管理**: 複数の予備画像を登録し、デフォルト画像を指定。
- **ポイント通過時の動的切替**: 特定ポイント通過時に表示画像を自動切り替え。
- **柔軟な回転制御**: 接線方向への自動回転（Auto Rotate）、回転軸のオフセットおよび 3 軸回転ロック。

### ⏱️ 4. 詳細なコントロール
- **ポイントごとの制御**: 滞在時間や速度倍率の個別設定。
- **スムーズなナビゲーション**: `stepTo(index, true)` によるポイント間のスムーズな滑空移動。

---

## 🚀 ローカル開発 & ビルド

```bash
# 1. リポジトリのクローンと依存関係のインストール
git clone https://github.com/cww978/LinkAnimation.git
cd LinkAnimation
npm install

# 2. ローカル開発サーバーの起動
npm run dev

# 3. Web エディタのビルド
npm run build

# 4. 独立 SDK のビルド (dist-lib/)
npm run build:lib

# 5. デモサイトのデプロイ (GitHub Pages)
npm run deploy
```

---

## 📄 ライセンス

[MIT License](LICENSE)
