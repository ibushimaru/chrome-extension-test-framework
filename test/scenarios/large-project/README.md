# Large Project Simulation

このディレクトリは、大規模なChrome拡張機能プロジェクトをシミュレートします。

## プロジェクト構造

```
large-project/
├── manifest.json
├── src/
│   ├── background/
│   │   ├── service-worker.js
│   │   ├── modules/
│   │   └── utils/
│   ├── content/
│   │   ├── scripts/
│   │   └── styles/
│   ├── popup/
│   │   ├── index.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   └── common/
│       ├── api/
│       ├── utils/
│       └── constants/
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── _locales/
│   ├── en/
│   ├── ja/
│   ├── es/
│   ├── fr/
│   └── de/
├── lib/
│   └── third-party/
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
```

## 特徴

- 多数のファイル（100+）
- 深いディレクトリ構造
- 複数の言語サポート
- サードパーティライブラリ
- テストファイル
- ドキュメント
- 複雑な依存関係