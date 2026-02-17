# Grainrad Style Image Modifier - Code Guide

このドキュメントは「このコードがどう動いているか」を把握するための説明書です。

## 1. 全体像

- アプリは Vanilla JS + Canvas で構成されています。
- 画像を読み込み、選択中エフェクトを `canvas` に再描画します。
- UI は以下3ブロックです。
1. ステージ（`#previewCanvas`）
2. 調整メニュー（Effects / Settings）
3. Export モーダル

エントリポイントは `js/main.js` です。

## 2. ファイル責務

- `index.html`
  - 画面構造（ステージ、ドック、Export モーダル、操作ボタン）。
  - JS の読み込み順を管理。
- `styles.css`
  - レイアウト・配色・レスポンシブ（特にモバイル時の中央メニュー表示）。
- `js/config/effects.js`
  - エフェクト一覧、表示名、コントロール定義（`EFFECT_SCHEMA`）、書き出し形式定義。
- `js/core/state.js`
  - 初期状態の生成、エフェクト単位のリセット処理。
- `js/utils/file.js`
  - ファイル入力/ドラッグ&ドロップから画像読込。
- `js/ui/controls.js`
  - Effects ラジオ、Settings フォーム、Export 形式ラジオの描画。
- `js/render/renderer.js`
  - 実際のエフェクト描画ロジック本体。
  - PNG/GIF 出力。
- `js/main.js`
  - 各モジュールの接続、イベント登録、再描画制御。
- `js/vendor/gif.worker.loader.js`
  - GIF エンコーダ用 worker ローダー。

## 3. 初期化フロー

`index.html` の script 読込順でグローバルを構築し、最後に `js/main.js` が起動します。

`js/main.js` がやること:

1. `createInitialState()` で状態作成
2. `new Renderer(canvas)` で描画器作成
3. Effects/Settings/Export UI を描画 (`renderPanels`)
4. ファイル入力、D&D、モーダル開閉、Reset、Export などのイベントを登録
5. Matrix エフェクト用のアニメーションループ開始

## 4. 状態モデル

状態は `state` に集約されています。

- `sourceImage`: 読み込んだ画像
- `selectedEffect`: 現在のエフェクトID
- `params[effectId][key]`: エフェクトごとの現在値
- `defaults[effectId][key]`: 初期値
- `selectedExportFormat`: `png` or `gif`

`resetEffectParams(state, effectId)` は現在エフェクトの `params` を `defaults` へ戻します。

## 5. 再描画の仕組み

- UI変更時は `requestRender()` を呼びます。
- `requestAnimationFrame` で1フレームにまとめる設計です（連続入力時の無駄描画抑制）。
- 実際の描画は `renderer.render(effectId, params, time)`。

Matrix だけは時間依存なので、`animationLoop` で継続描画されます。

## 6. Renderer の設計

`Renderer` は3枚の canvas を使います。

- `canvas`: 画面表示先
- `base`: 元画像の作業用
- `buffer`: 中間処理用（必要なエフェクトで使用）

主要メソッド:

- `setSourceImage(image)`: 画像セット + サイズ調整
- `fitToViewport()`: 画面/ドック幅を考慮してキャンバスサイズ決定
- `render(...)`: エフェクト分岐
- `exportPNG(...)`: PNG Data URL を返す
- `exportMatrixGIF(...)`: Matrix のみ GIF 生成（`gif.js`）

GIF の制約:

- `file://` では実行不可（HTTP(S) 必須）
- 現在は Matrix エフェクト時のみ有効

## 7. UI生成ロジック

`js/ui/controls.js` は宣言的データ (`EFFECT_SCHEMA`) をもとに HTML を動的生成します。

- `range/select/check/color` の4種入力をサポート
- `color` はカラーピッカー + HEX テキスト入力
- Export はラジオ2択（PNG/GIF）
- GIF は条件未達時に無効化

この構成なので、UI追加時は `EFFECT_SCHEMA` を編集するのが基本です。

## 8. Export 実装の現状

現在の実装は以下です。

- PNG: 可能
- GIF: Matrix + HTTP(S) のとき可能

`requirements.md` の古い記述（JPEG/Video/SVG/Text/Three.js）は現行コードとは一致していません。現状コードを正とするなら要件書の更新が必要です。

## 9. エフェクトを追加する手順

1. `js/config/effects.js`
   - `EFFECT_ORDER` にID追加
   - `EFFECT_LABELS` に表示名追加
   - `EFFECT_SCHEMA` に設定項目追加
2. `js/render/renderer.js`
   - `render()` の `switch` に分岐追加
   - `renderYourEffect(params)` 実装
3. 必要なら Export 条件を `js/ui/controls.js` / `js/main.js` で拡張

## 10. 変更時に壊れやすい点

- `index.html` のID変更: `main.js` の `getElementById` が直で依存
- `EFFECT_SCHEMA` のキー名変更: state の `params/defaults` と不整合が出る
- モバイルUI: `styles.css` の `@media (max-width: 760px)` でまとまって管理
- GIF: `gif.js` CDN と `js/vendor/gif.worker.loader.js` の両方が必要

## 11. 読み進め順（おすすめ）

1. `index.html`
2. `js/main.js`
3. `js/config/effects.js`
4. `js/ui/controls.js`
5. `js/render/renderer.js`
6. `styles.css`（最後に見た方が全体と繋がりやすい）

