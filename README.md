# 🏁 Corrida Maluca - Sistema de Ranking em Tempo Real

Sistema completo para acompanhar tempos de carrinhos em corridas, com ranking automático e atualizações em tempo real.

## 🚀 Como Hospedar Publicamente

### Opção 1: Railway (Recomendado - Gratuito)
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Conecte seu repositório
5. Railway detecta automaticamente Node.js e faz deploy
6. Seu site ficará disponível em `https://seu-projeto.railway.app`

### Opção 2: Render (Gratuito)
1. Acesse [render.com](https://render.com)
2. Conecte com GitHub
3. "New" → "Web Service"
4. Selecione seu repositório
5. Configurações:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
6. Deploy automático em `https://seu-projeto.onrender.com`

### Opção 3: Heroku (Gratuito com limitações)
1. Instale Heroku CLI
2. `heroku login`
3. `heroku create nome-do-projeto`
4. `git push heroku main`
5. Disponível em `https://nome-do-projeto.herokuapp.com`

### Opção 4: Vercel (Para frontend + API)
1. Acesse [vercel.com](https://vercel.com)
2. Importe repositório GitHub
3. Configure como Node.js
4. Deploy automático

## 📁 Preparação do Projeto

### 1. Criar Repositório GitHub
```bash
git init
git add .
git commit -m "Corrida Maluca - Sistema de Ranking"
git branch -M main
git remote add origin https://github.com/seu-usuario/corrida-maluca.git
git push -u origin main
```

### 2. Arquivo .gitignore
```
node_modules/
data.json
.env
*.log
.DS_Store
```

### 3. Scripts de Deploy
O `package.json` já está configurado com:
- `npm start` - Inicia o servidor
- `npm install` - Instala dependências

## 🔧 Configurações de Produção

### Variáveis de Ambiente
Crie arquivo `.env` (não commitado):
```
PORT=3000
NODE_ENV=production
```

### Persistência de Dados
- ✅ Dados salvos automaticamente em `data.json`
- ✅ Backup automático a cada alteração
- ✅ Carregamento automático no boot

## 🌐 URLs de Acesso

Após deploy:
- **Placar Público**: `https://seu-site.com/`
- **Administração**: `https://seu-site.com/admin.html`

## 📱 Como Usar

### Para Administradores:
1. Acesse `/admin.html`
2. Adicione carrinhos (nome + cor)
3. Registre tempos (formato: `58.432` ou `1:23.456`)
4. Ranking atualiza automaticamente

### Para Público:
1. Acesse a página principal
2. Veja ranking em tempo real
3. Pódio animado dos top 3
4. Atualizações automáticas

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Acessar
# http://localhost:3000 - Placar
# http://localhost:3000/admin.html - Admin
```

## 📊 Recursos

- ⚡ **Tempo Real**: Socket.IO para atualizações instantâneas
- 🏆 **Ranking Automático**: Ordenação por melhor tempo
- 💾 **Persistência**: Dados salvos em JSON
- 📱 **Responsivo**: Funciona em mobile/desktop
- 🎨 **Visual Atrativo**: Pódio animado e tema de corrida
- 🔄 **Backup**: Dados preservados entre reinicializações

## 🔒 Segurança

- Sem autenticação (público)
- Validação de entrada nos endpoints
- Sanitização de dados
- Rate limiting recomendado para produção

## 📈 Monitoramento

Para produção, considere adicionar:
- Logs de acesso
- Monitoramento de performance
- Backup automático do `data.json`
- Health checks

## 🆘 Suporte

Se precisar de ajuda com deploy ou customizações, consulte:
- Documentação da plataforma escolhida
- Logs de deploy na plataforma
- Console do navegador para erros frontend
