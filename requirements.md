# Requirements

## 1. 目的
- 参照スクリーンショットのUI構成と操作導線を再現する。
- ユーザーが画像をドラッグ&ドロップで読み込み、複数エフェクトを切り替え、パラメーター調整で即時反映できること。

## 2. レイアウト
- 全画面ステージ上にプレビューキャンバスを表示する。
- 右下に小型モーダルを重ねる。
- モーダルは独立してドラッグ移動、リサイズ可能。
- 初期位置:
  - Effects: 右下上段
  - Settings: 右下下段
  - Export: 右下中央（初期は非表示）

## 3. 入力
- 画像入力:
  - ステージ全体でドラッグ&ドロップ受付
  - Importボタンでファイル選択
  - 対応: png / jpg / jpeg / webp / gif
- 画像未読込時はガイド表示。
- ドラッグ中はステージをハイライト表示。

## 4. エフェクトメニュー
- Effectsモーダルで単一選択。
- 表示項目:
  - ASCII
  - Dithering
  - Halftone
  - Matrix Rain
  - Dots
  - Contour
  - Pixel Sort
  - Blockify
  - Threshold
  - Edge Detection
  - Crosshatch
  - Wave Lines
  - Noise Field
  - Voronoi
  - VHS

## 5. 設定メニュー
- Settingsモーダル上部に `- Settings` と `Reset`。
- 選択中エフェクトの項目をセクション単位で表示。
- 項目種別:
  - スライダー
  - セレクト
  - チェック
  - カラー（チップ + HEX入力）
- 値変更は即時再描画。

## 6. 代表項目
- Matrix Rain:
  - Character Set, Cell Size, Spacing, Speed, Trail Length, Direction, Glow, BG Opacity
  - Adjustments: Brightness, Contrast, Threshold
  - Color: Rain Color
- ASCII:
  - Scale, Spacing, Output Width, Character Set
  - Adjustments: Brightness, Contrast, Saturation, Hue Rotation, Sharpness, Gamma
  - Color: Mode, Background Intensity
  - Processing: Invert, Brightness Map
- Dots:
  - Shape, Grid Type, Size, Spacing, Invert

## 7. エクスポート
- Exportモーダルを用意し、出力フォーマット一覧を表示:
  - PNG / JPEG / GIF / Video(mp4) / SVG / Text(.txt) / Three.js(html)
- 現段階で実ファイル出力はPNGのみ実装。
- 未実装フォーマットはUI上で非アクティブ表示。

## 8. 実装構成
- `index.html`: レイアウト定義
- `styles.css`: ビジュアルとレイアウト
- `js/config/effects.js`: エフェクト定義と項目スキーマ
- `js/core/state.js`: 状態管理
- `js/ui/modals.js`: モーダル移動/リサイズ/位置制約
- `js/ui/controls.js`: エフェクト一覧と設定フォーム描画
- `js/render/renderer.js`: キャンバス描画処理
- `js/utils/file.js`: D&Dとファイル読み込み
- `js/main.js`: 初期化とイベント接続

## 9. 非機能要件
- モバイル幅でもモーダルが画面外に出ないこと。
- UI操作中にステージ側のD&D誤反応を抑止すること。
- コードはモジュール分割し、単一ファイル肥大化を避けること。
