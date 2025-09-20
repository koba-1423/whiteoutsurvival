# Node 20 イメージを使用
FROM node:20-bullseye

# 作業ディレクトリ
WORKDIR /app

# 依存インストール
COPY package*.json ./
RUN npm install --no-progress

# ソースコードをコピー
COPY . .

# Vite が使うポート
EXPOSE 5173

# デフォルトコマンド
CMD ["npm", "run", "dev", "--", "--host"] 
