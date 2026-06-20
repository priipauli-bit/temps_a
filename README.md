# TEMPS-A – Formulário Online

## Estrutura
- `server.js` — servidor completo (formulário + painel)
- `respostas.json` — criado automaticamente ao receber a primeira resposta
- `package.json` — configuração do projeto

## Como usar localmente

### 1. Instale o Node.js (se não tiver)
https://nodejs.org

### 2. Inicie o servidor
```bash
node server.js
```

### 3. Acesse
- **Formulário do paciente:** http://localhost:3000/
- **Painel do médico:** http://localhost:3000/medico  
  Senha padrão: `medico123` (altere no topo do server.js)

---

## Opção A — Hospedar gratuitamente no Railway (recomendado)

1. Crie conta em https://railway.app
2. Clique em **New Project → Deploy from GitHub**
3. Faça upload desta pasta ou conecte um repositório GitHub
4. O Railway detecta automaticamente o Node.js e inicia com `npm start`
5. Vá em **Settings → Networking → Generate Domain**
6. Você receberá um link público tipo:  
   `https://temps-a-production.up.railway.app`

---

## Opção B — Link público temporário com ngrok (para testes)

1. Instale ngrok: https://ngrok.com/download
2. Inicie o servidor: `node server.js`
3. Em outro terminal: `ngrok http 3000`
4. Use o link `https://xxxx.ngrok.io` gerado

---

## Alterar a senha do painel

Abra `server.js` e edite a linha:
```js
const SENHA_MEDICO = 'medico123'; // ← Altere aqui
```

---

## Dados salvos

As respostas ficam em `respostas.json` no mesmo diretório.  
Cada entrada contém: nome do paciente, data/hora, respostas individuais e scores por domínio.