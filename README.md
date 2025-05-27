# Angular v18 → v19 フルマイグレーション体験サンプル

このドキュメントでは、Angular v18 アプリを新規に作成し、依存パッケージのアップデートとマイグレーションを\*\*一度に実行する「フルアップデート」\*\*の流れをメインで解説します。

最後に補足として、マイグレーションスクリプトのみを先に体験できる `--migrate-only` オプションの方法も紹介します。

---

## 1. プロジェクト作成 (v18)

```bash
# Angular CLI v18 指定でプロジェクト作成（依存は後でインストール）
npx @angular/cli@18 new angular-migration-sample --defaults --skip-install
cd angular-migration-sample
```

## 2. モジュール生成

```bash
# app.module.ts を平坦に生成
npx ng generate module app --flat
```

## 3. pre-update コード準備

### package.json (v18 ベース)

```jsonc
{
  "dependencies": {
    "@angular/core": "~18.2.0",
    "@angular/cli": "~18.2.0",
    // その他 v18 系パッケージ...
  },
  "devDependencies": {
    "typescript": "~5.4.4"
  }
}
```

### src/app/app.module.ts (v18 の例)

```ts
import { NgModule, APP_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'migration-sample' }),
    RouterModule.forRoot(routes, {
      errorHandler: (error) => console.error('Navigation Error:', error)
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

## 4. 依存パッケージのインストール

```bash
npm install
```

> `package-lock.json` が更新されるため、次のステップでコミットしてクリーンな状態を作ります。

## 5. 初期コミット (v18 ベースライン)

```bash
git add .
git commit -m "chore: initial v18 setup"
```

## 6. フルアップデート実行

```bash
npx ng update @angular/cli@19 @angular/core@19
```

* 依存パッケージのバージョン更新と、CLI schematics によるコードマイグレーションがまとめて適用されます。

### 自動的に変わるポイント

1. **AppComponent が standalone コンポーネントに移行**

   * `@Component` に `imports: [RouterOutlet]` が追加され、デフォルトで standalone になります。

2. **非スタンドアロン型コンポーネントへの `standalone:false` 挿入**

   * NgModule に宣言されているコンポーネントの `@Component` デコレータに `standalone: false` が追加されます。

   ```ts
   @Component({
     selector: 'app-root',
     standalone: false,
     imports: [RouterOutlet],
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.css']
   })
   export class AppComponent { … }
   ```

3. **NgModule の `declarations` に `standalone:false` を使用しない**

   * AppModule の `declarations` 配列は従来どおり `AppComponent` のみを指定します。
     standalone 設定はコンポーネント側に記載するため、モジュール側には不要です。

---

## 7. 手動で修正すべき箇所

フルアップデート後、自動マイグレーションだけでは適用されない変更があるため、以下の手動修正を行ってください。

### 1) BrowserModule.withServerTransition → APP\_ID トークン注入

`src/app/app.module.ts` 内の以下部分を：

```ts
imports: [
  BrowserModule.withServerTransition({ appId: 'migration-sample' }),
  …
]
```

次のように書き換えます：

```ts
imports: [BrowserModule, …],
providers: [
  { provide: APP_ID, useValue: 'migration-sample' },
],
```

**ポイント**: `import { APP_ID } from '@angular/core';` を忘れずに追加してください。

### 2) Router.errorHandler → provideRouter + withNavigationErrorHandler

もし以下のようなルーティング設定が残っていたら：

```ts
RouterModule.forRoot(routes, {
  errorHandler: (error) => console.error('Navigation Error:', error)
})
```

次のコードをモジュールの `providers` に追加し、`imports` も書き換えます：

```ts
imports: [BrowserModule, /* その他のインポート */],
providers: [
  provideRouter(routes, withNavigationErrorHandler(error => console.error('Navigation Error:', error)))
],
```

### 3) app.component.ts の挙動確認

自動マイグレーションでは `AppComponent` が standalone コンポーネントとして更新されます。もし NgModule 方式に戻したい場合は、下記を手動で修正してください：

```ts
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent { … }
```

そして `AppModule` の `declarations` に戻して再ビルドしてください。

---

## 8. post-update コード確認 (v19)

post-update コード確認 (v19)

### package.json (抜粋)

```jsonc
{
  "dependencies": {
    "@angular/core": "~19.2.0",
    // その他 v19 系パッケージ...
  },
  "devDependencies": {
    "typescript": "~5.5.2"
  }
}
```

### src/app/app.module.ts (マイグレーション後)

```ts
import { NgModule, APP_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter, withNavigationErrorHandler, Routes } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    { provide: APP_ID, useValue: 'migration-sample' },
    provideRouter(routes, withNavigationErrorHandler(error => console.error('Navigation Error:', error)))
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

---

## 補足: マイグレーションのみ体験する方法

コード変化だけをリスク少なく先に確認したい場合は、`--migrate-only` オプションを使用します。

```bash
# CLI のみ
npm install --save-dev @angular/cli@19
npx ng update @angular/cli@19 --migrate-only

# Core のみ
npm install --save @angular/core@19
npx ng update @angular/core@19 --migrate-only
```

* `--migrate-only` はソースコードを書き換えるのみで、package.json や node\_modules は更新しません。
* 依存バージョンを事前にインストールしておく必要があります。

---

## 9. ng update 実行結果の解説

### 1. 依存パッケージの更新とインストール

```
Updating package.json with dependency @angular-devkit/build-angular @ "19.2.13" (was "18.2.19")…
…
Updating package.json with dependency zone.js @ "0.15.1" (was "0.14.10")…
✔ Cleaning node modules directory
✔ Installing packages
```

* package.json の Angular CLI、Core、Router、Animations、Forms、PlatformBrowser、Zone.js、TypeScript などのバージョンが 19 系へ書き換えられ、`npm install` で一括インストールされました。

### 2. @angular/cli のマイグレーション

```
❯ Update '@angular/ssr' import paths … No changes made.
❯ Update the workspace configuration … No changes made.
Optional migration: Migrate application projects to the new build system → UPDATE tsconfig.json
```

* **必須マイグレーション**: SSR 周り／angular.json の更新は不要。
* **オプション**: 新ビルドシステム（application builder）への移行を選択すると tsconfig.json に設定が追加されました。

### 3. @angular/core のマイグレーション

```
❯ Updates non-standalone Directives, Component and Pipes to 'standalone:false' … UPDATE src/app/app.component.ts
❯ Updates ExperimentalPendingTasks to PendingTasks … No changes made.
Optional migration: Replaces APP_INITIALIZER… → No changes made.
```

* **standalone\:false の挿入**: AppComponent の @Component に standalone\:false が追加され、NgModule と併用できるようになりました。
* **API 名称変更**: 実験的 API の見直し対象は見つからず変更なし。

### 4. 次のアクション

1. 自動マイグレーション後、手動での SSR→APP\_ID トークン移行、Router errorHandler 移行、AppModule のクリーンアップを行ってください。
2. ビルド・テスト・動作確認を実施し、本番環境へのリリースに備えてください。

## Q\&A: よくある質問

**Q. CLI と Core の順序は重要ですか？**
A. CLI → Core の順序で実行するのが推奨です。CLI schematics が先に設定ファイルを更新し、その後 Core の変更を適用できるため、安全性が高まります。まとめて実行する場合は `--migrate-only` を外して一度に指定しても OK です。

**Q. 既存の app.component.ts や app.routes.ts はどうなりますか？**
A. これらは自動マイグレーション対象外なので、そのまま動作します。ただし、`RouterModule.forRoot` の `errorHandler` は必要に応じて手動で `withNavigationErrorHandler` に移行してください。

**Q. v18 と v19 でコンポーネントの standalone デフォルト動作はどう違いますか？**
A. - **Angular v18**: `@Component({ standalone: true })` と明示しない限り、スタンドアロンコンポーネントにはなりません。CLI 生成コンポーネントも全て NgModule ベースです。

* **Angular v19**: CLI で新規生成したコンポーネントはデフォルトでスタンドアロンになります（`standalone:true` を省略可能）。
  移行時は既存コンポーネントに対し、モジュール宣言の併用が必要なものには `standalone:false` を手動で追加してください。

**Q. migrate-only は必須ですか？**
A. 必須ではありません。フルアップデートで依存とコード変換をまとめて行うほうが手間は少ないですが、リスクを抑えてコード変化だけ確認したい場合に使い分けてください。
