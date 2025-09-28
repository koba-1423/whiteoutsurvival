module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    // ファイルの行数制限（300行）
    'max-lines': ['error', { 
      max: 300, 
      skipBlankLines: true, 
      skipComments: true,
      skipEmptyLines: true
    }],
    // 関数の行数制限（50行）
    'max-lines-per-function': ['error', { 
      max: 50, 
      skipBlankLines: true, 
      skipComments: true 
    }]
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  // メインファイルは例外として設定
  overrides: [
    {
      files: ['src/main.ts', 'src/index.ts', 'index.html'],
      rules: {
        'max-lines': 'off'
      }
    }
  ]
};
