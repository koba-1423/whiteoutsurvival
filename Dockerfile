# Node 20 イメージを使用
FROM node:20-bullseye

# 作業ディレクトリ
WORKDIR /app

# 依存インストール（開発用）
COPY package*.json ./
RUN npm install --no-progress

# ソースコードをコピー（開発時はボリュームマウントで上書きされる）
COPY . .

# Vite が使うポート
EXPOSE 5173

# 開発用コマンド（ホットリロード有効）
CMD ["npm", "run", "dev", "--", "--host", "--watch"] 
