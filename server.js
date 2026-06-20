const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'respostas.json');
const SENHA_MEDICO = 'medico123'; // ← Altere esta senha!

// Inicializa arquivo de dados
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function lerRespostas() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function salvarResposta(dados) {
  const lista = lerRespostas();
  lista.push(dados);
  fs.writeFileSync(DATA_FILE, JSON.stringify(lista, null, 2), 'utf8');
}

// ── Questões e domínios ──────────────────────────────────────────────────────
const questions = [
  "Sou uma pessoa triste, infeliz.",
  "As pessoas dizem que não consigo ver o lado mais positivo das coisas.",
  "Tenho sofrido muito na vida.",
  "Acho que as coisas sempre acabam do pior modo.",
  "Que eu me lembre, sempre me senti um fracasso.",
  "Dizem que muitas vezes fico pessimista com as coisas e esqueço os momentos felizes do passado.",
  "Sou, por natureza, uma pessoa insatisfeita.",
  "Sou impulsionado(a) por uma agitação desagradável que não consigo entender.",
  "Tenho mudanças bruscas no humor e no nível de energia.",
  "Meu humor e meu nível de energia ora estão altos, ora estão baixos; raramente estão no meio.",
  "Minha capacidade de pensar varia bastante, de muito precisa a pobre, sem motivo aparente.",
  "Muitas vezes, começo coisas, mas perco o interesse nelas antes de acabá-las.",
  "Eu oscilo constantemente entre me sentir energizado(a) e quase parando, lento.",
  "Vario muito entre me sentir superconfiante e me sentir inseguro(a) de mim mesmo.",
  "O modo como vejo as coisas às vezes é vibrante e às vezes é sem graça.",
  "Sou o tipo de pessoa que pode ficar triste e alegre ao mesmo tempo.",
  "Frequentemente, estouro com as pessoas e depois me sinto culpado(a) por isso.",
  "Sou uma pessoa rabugenta (irritável).",
  "Sou muito crítico(a) em relação aos outros.",
  "Muitas vezes eu fico tão aborrecido(a) a ponto de quebrar tudo.",
  "Quando contrariado(a), eu posso entrar numa briga.",
  "As pessoas me dizem que eu estouro por nada.",
  "Quando irritado(a), eu sou áspero(a) com as pessoas.",
  "Meu humor ferino já me causou problemas.",
  "Sinto todas as emoções intensamente.",
  "A vida é uma festa que aproveito ao máximo.",
  "Tenho muita confiança em mim mesmo.",
  "Tenho com frequência grandes ideias.",
  "Tenho o dom de falar, convencer e inspirar os outros.",
  "Adoro iniciar novos projetos, mesmo que arriscados.",
  "Uma vez que me decida a fazer algo, nada me detém.",
  "Sinto-me totalmente à vontade mesmo com pessoas que mal conheço.",
  "Quando estou estressado(a), minhas mãos muitas vezes tremem.",
  "Muitas vezes meu estômago fica embrulhado.",
  "Quando estou nervoso(a), eu posso ter diarreia.",
  "Quando estou nervoso(a), muitas vezes sinto náuseas.",
  "Tenho frequentemente medo de que alguém na minha família pegue uma doença séria.",
  "Estou sempre na expectativa de que alguém possa me trazer más notícias sobre alguém da minha família.",
  "Quando estou estressado(a), fico com uma sensação desconfortável no peito.",
  "Ruídos bruscos facilmente me deixam sobressaltado(a).",
  "Que eu me lembre, sempre fui uma pessoa preocupada.",
  "Estou sempre preocupado(a) com uma coisa ou outra.",
  "Estou sempre preocupado(a) com assuntos do dia a dia que os outros consideram sem importância.",
  "Não consigo deixar de ficar preocupado(a).",
  "Muitas pessoas já me disseram para não me preocupar tanto."
];

const domains = {
  depressivo:  { label: 'Depressivo',  qs: [0,1,2,3,4,5,6],                          max: 7  },
  ciclotimico: { label: 'Ciclotímico', qs: [7,8,9,10,11,12,13,14,15],                max: 9  },
  irritavel:   { label: 'Irritável',   qs: [16,17,18,19,20,21,22,23,24],              max: 9  },
  hipertimico: { label: 'Hipertímico', qs: [25,26,27,28,29,30,31],                    max: 7  },
  ansioso:     { label: 'Ansioso',     qs: [32,33,34,35,36,37,38,39,40,41,42,43,44], max: 13 }
};

function calcScores(answers) {
  const scores = {};
  for (const [key, d] of Object.entries(domains)) {
    scores[key] = d.qs.filter(i => answers[i] === 'V').length;
  }
  return scores;
}

// ── HTML do formulário do paciente ───────────────────────────────────────────
function htmlFormulario() {
  const qCards = questions.map((q, i) => `
    <div class="question-card" id="card-${i}">
      <div class="question-header">
        <div class="q-number">${i+1}</div>
        <div class="q-text">${q}</div>
      </div>
      <div class="options">
        <input type="radio" name="q${i}" id="q${i}_v" value="V">
        <label for="q${i}_v" class="option-label verdadeiro">
          <span class="option-dot"></span> Verdadeiro
        </label>
        <input type="radio" name="q${i}" id="q${i}_f" value="F">
        <label for="q${i}_f" class="option-label falso">
          <span class="option-dot"></span> Falso
        </label>
      </div>
      <div class="error-msg">⚠ Por favor, responda esta questão.</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>TEMPS-A – Formulário Comportamental</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;color:#2d3748;min-height:100vh}
header{background:linear-gradient(135deg,#2b6cb0,#2c5282);color:#fff;padding:32px 24px 28px;text-align:center}
header h1{font-size:1.7rem;font-weight:700}
header p{margin-top:8px;font-size:.97rem;opacity:.88;max-width:560px;margin-left:auto;margin-right:auto}
.progress-bar-wrap{background:#bee3f8;height:6px}
.progress-bar{height:6px;background:#3182ce;width:0%;transition:width .3s}
.container{max-width:720px;margin:32px auto 60px;padding:0 16px}
.instruction-box{background:#ebf8ff;border-left:4px solid #3182ce;border-radius:8px;padding:16px 20px;margin-bottom:28px;font-size:.97rem;color:#2c5282}
.name-box{background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:18px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.name-box label{font-weight:600;font-size:.95rem;display:block;margin-bottom:8px;color:#2b6cb0}
.name-box input{width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:8px;font-size:.97rem;outline:none;transition:border-color .2s}
.name-box input:focus{border-color:#90cdf4}
.question-card{background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);border:2px solid transparent;transition:border-color .2s}
.question-card.answered{border-color:#bee3f8}
.question-card.unanswered-error{border-color:#fc8181;background:#fff5f5}
.question-header{display:flex;align-items:flex-start;gap:12px}
.q-number{background:#ebf8ff;color:#2b6cb0;font-weight:700;font-size:.85rem;border-radius:50%;min-width:30px;height:30px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.q-text{font-size:.97rem;line-height:1.55;flex:1}
.options{display:flex;gap:12px;margin-top:14px;margin-left:42px}
.option-label{display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 18px;border-radius:8px;border:2px solid #e2e8f0;font-size:.93rem;font-weight:500;transition:all .18s;user-select:none;background:#f7fafc}
.option-label:hover{border-color:#90cdf4;background:#ebf8ff}
input[type=radio]{display:none}
input[type=radio]:checked+.option-label.verdadeiro{background:#ebf8ff;border-color:#3182ce;color:#2b6cb0}
input[type=radio]:checked+.option-label.falso{background:#f0fff4;border-color:#38a169;color:#276749}
.option-dot{width:14px;height:14px;border-radius:50%;border:2px solid #cbd5e0;flex-shrink:0;transition:all .18s}
input[type=radio]:checked+.option-label .option-dot{border-color:currentColor;background:currentColor}
.error-msg{color:#e53e3e;font-size:.82rem;margin-top:6px;margin-left:42px;display:none}
.question-card.unanswered-error .error-msg{display:block}
.submit-section{text-align:center;margin-top:32px}
.counter{font-size:.9rem;color:#718096;margin-bottom:16px}
.counter span{font-weight:700;color:#2b6cb0}
.btn-submit{background:linear-gradient(135deg,#2b6cb0,#2c5282);color:#fff;border:none;padding:14px 48px;font-size:1.05rem;font-weight:600;border-radius:10px;cursor:pointer;transition:opacity .2s,transform .1s;box-shadow:0 4px 12px rgba(43,108,176,.3)}
.btn-submit:hover{opacity:.92;transform:translateY(-1px)}
.btn-submit:disabled{opacity:.5;cursor:not-allowed;transform:none}
#success-section{display:none;background:#fff;border-radius:16px;padding:40px 28px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.1);margin-top:16px}
#success-section .icon{font-size:3rem;margin-bottom:16px}
#success-section h2{color:#2b6cb0;font-size:1.4rem;margin-bottom:10px}
#success-section p{color:#718096;font-size:.97rem;line-height:1.6}
footer{text-align:center;color:#a0aec0;font-size:.78rem;padding:20px}
</style>
</head>
<body>
<header>
  <h1>TEMPS-A – Formulário Comportamental</h1>
  <p>Assinale todas as alternativas que se aplicam a você durante a <strong>maior parte da sua vida</strong>.</p>
</header>
<div class="progress-bar-wrap"><div class="progress-bar" id="progressBar"></div></div>
<div class="container">
  <div class="instruction-box">
    📋 <strong>Instruções:</strong> Para cada afirmação abaixo, selecione <em>Verdadeiro</em> se ela se aplica a você na maior parte da sua vida, ou <em>Falso</em> caso contrário. Responda todas as questões antes de enviar.
  </div>
  <form id="tempsForm" novalidate>
    <div class="name-box">
      <label for="nomePaciente">Seu nome completo</label>
      <input type="text" id="nomePaciente" placeholder="Digite seu nome..." autocomplete="name"/>
    </div>
    ${qCards}
    <div class="submit-section">
      <div class="counter">Respondidas: <span id="answeredCount">0</span> de 45</div>
      <button type="submit" class="btn-submit" id="btnSubmit">✔ Enviar Respostas</button>
    </div>
  </form>
  <div id="success-section">
    <div class="icon">✅</div>
    <h2>Respostas enviadas com sucesso!</h2>
    <p>Obrigado por preencher o formulário.<br>Seu médico já recebeu suas respostas e irá analisá-las na sua próxima consulta.</p>
  </div>
</div>
<footer>TEMPS-A – Temperament Evaluation of Memphis, Pisa, Paris and San Diego</footer>
<script>
function updateProgress(){
  let n=0;
  for(let i=0;i<45;i++) if(document.querySelector('input[name="q'+i+'"]:checked')) n++;
  document.getElementById('answeredCount').textContent=n;
  document.getElementById('progressBar').style.width=(n/45*100)+'%';
  for(let i=0;i<45;i++){
    const c=document.getElementById('card-'+i);
    if(document.querySelector('input[name="q'+i+'"]:checked')){c.classList.add('answered');c.classList.remove('unanswered-error');}
  }
}
document.getElementById('tempsForm').addEventListener('change',updateProgress);
document.getElementById('tempsForm').addEventListener('submit',async function(e){
  e.preventDefault();
  let ok=true;
  const answers=[];
  for(let i=0;i<45;i++){
    const ch=document.querySelector('input[name="q'+i+'"]:checked');
    const card=document.getElementById('card-'+i);
    if(!ch){card.classList.add('unanswered-error');ok=false;answers.push(null);}
    else{card.classList.remove('unanswered-error');answers.push(ch.value);}
  }
  if(!ok){document.querySelector('.unanswered-error').scrollIntoView({behavior:'smooth',block:'center'});return;}
  const nome=document.getElementById('nomePaciente').value.trim()||'Não informado';
  const btn=document.getElementById('btnSubmit');
  btn.disabled=true;btn.textContent='Enviando...';
  try{
    const r=await fetch('/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome,answers})});
    if(r.ok){
      document.getElementById('tempsForm').style.display='none';
      document.getElementById('success-section').style.display='block';
      window.scrollTo({top:0,behavior:'smooth'});
    } else { alert('Erro ao enviar. Tente novamente.'); btn.disabled=false; btn.textContent='✔ Enviar Respostas'; }
  } catch(err){ alert('Erro de conexão. Tente novamente.'); btn.disabled=false; btn.textContent='✔ Enviar Respostas'; }
});
</script>
</body>
</html>`;
}

// ── HTML do painel do médico ─────────────────────────────────────────────────
function htmlPainel(respostas, erro) {
  const domainKeys = ['depressivo','ciclotimico','irritavel','hipertimico','ansioso'];
  const domainColors = {
    depressivo:'#e53e3e', ciclotimico:'#d69e2e', irritavel:'#dd6b20',
    hipertimico:'#38a169', ansioso:'#5a67d8'
  };

  const cards = respostas.length === 0
    ? '<p style="color:#718096;text-align:center;padding:40px 0">Nenhuma resposta recebida ainda.</p>'
    : [...respostas].reverse().map((r, idx) => {
        const scores = calcScores(r.answers);
        const total = respostas.length - idx;
        const scoresBars = domainKeys.map(k => {
          const pct = Math.round(scores[k] / domains[k].max * 100);
          return `<div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:3px">
              <span style="font-weight:600;color:${domainColors[k]}">${domains[k].label}</span>
              <span>${scores[k]}/${domains[k].max} (${pct}%)</span>
            </div>
            <div style="background:#e2e8f0;border-radius:4px;height:8px">
              <div style="background:${domainColors[k]};width:${pct}%;height:8px;border-radius:4px;transition:width .5s"></div>
            </div>
          </div>`;
        }).join('');

        const respostasDetalhe = r.answers.map((a, i) =>
          `<tr style="background:${i%2===0?'#f7fafc':'#fff'}">
            <td style="padding:5px 10px;font-size:.8rem;color:#718096;white-space:nowrap">Q${String(i+1).padStart(2,'0')}</td>
            <td style="padding:5px 10px;font-size:.82rem">${questions[i]}</td>
            <td style="padding:5px 10px;text-align:center">
              <span style="font-weight:700;color:${a==='V'?'#2b6cb0':'#718096'}">${a}</span>
            </td>
          </tr>`).join('');

        return `<div style="background:#fff;border-radius:14px;padding:24px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,.09);border-left:5px solid #3182ce">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:16px">
            <div>
              <div style="font-size:1.1rem;font-weight:700;color:#2d3748">#${total} — ${r.nome}</div>
              <div style="font-size:.82rem;color:#a0aec0;margin-top:2px">📅 ${r.dataHora}</div>
            </div>
            <div style="font-size:.82rem;color:#718096">
              ✅ Verdadeiros: <strong>${r.answers.filter(a=>a==='V').length}</strong> / 45
            </div>
          </div>
          <div style="margin-bottom:18px">${scoresBars}</div>
          <details>
            <summary style="cursor:pointer;font-size:.85rem;color:#3182ce;font-weight:600;margin-bottom:10px">Ver respostas individuais</summary>
            <div style="overflow-x:auto;margin-top:10px">
              <table style="width:100%;border-collapse:collapse;font-size:.82rem">
                <thead>
                  <tr style="background:#ebf8ff">
                    <th style="padding:6px 10px;text-align:left;color:#2b6cb0">#</th>
                    <th style="padding:6px 10px;text-align:left;color:#2b6cb0">Questão</th>
                    <th style="padding:6px 10px;color:#2b6cb0">Resp.</th>
                  </tr>
                </thead>
                <tbody>${respostasDetalhe}</tbody>
              </table>
            </div>
          </details>
        </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>TEMPS-A – Painel do Médico</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;color:#2d3748;min-height:100vh}
header{background:linear-gradient(135deg,#2c5282,#1a365d);color:#fff;padding:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
header h1{font-size:1.3rem;font-weight:700}
.badge{background:rgba(255,255,255,.15);padding:6px 14px;border-radius:20px;font-size:.85rem}
.container{max-width:820px;margin:28px auto 60px;padding:0 16px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:10px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.stat-card .val{font-size:1.8rem;font-weight:800;color:#2b6cb0}
.stat-card .lbl{font-size:.78rem;color:#718096;margin-top:4px}
.logout{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);padding:7px 16px;border-radius:7px;font-size:.85rem;cursor:pointer;text-decoration:none}
.logout:hover{background:rgba(255,255,255,.25)}
.refresh{background:#3182ce;color:#fff;border:none;padding:8px 18px;border-radius:7px;font-size:.85rem;cursor:pointer;margin-bottom:20px}
.refresh:hover{background:#2b6cb0}
</style>
</head>
<body>
<header>
  <h1>🩺 TEMPS-A – Painel do Médico</h1>
  <div style="display:flex;gap:10px;align-items:center">
    <span class="badge">${respostas.length} resposta(s) recebida(s)</span>
    <a href="/logout" class="logout">Sair</a>
  </div>
</header>
<div class="container">
  ${erro ? `<div style="background:#fff5f5;border:1px solid #fc8181;border-radius:8px;padding:14px 18px;margin-bottom:20px;color:#c53030">${erro}</div>` : ''}
  <div class="stats">
    <div class="stat-card"><div class="val">${respostas.length}</div><div class="lbl">Total de respostas</div></div>
    <div class="stat-card"><div class="val">${respostas.length > 0 ? Math.round(respostas.reduce((s,r)=>s+calcScores(r.answers).depressivo,0)/respostas.length*10)/10 : '–'}</div><div class="lbl">Média Depressivo</div></div>
    <div class="stat-card"><div class="val">${respostas.length > 0 ? Math.round(respostas.reduce((s,r)=>s+calcScores(r.answers).ansioso,0)/respostas.length*10)/10 : '–'}</div><div class="lbl">Média Ansioso</div></div>
    <div class="stat-card"><div class="val">${respostas.length > 0 ? Math.round(respostas.reduce((s,r)=>s+calcScores(r.answers).hipertimico,0)/respostas.length*10)/10 : '–'}</div><div class="lbl">Média Hipertímico</div></div>
  </div>
  <button class="refresh" onclick="location.reload()">🔄 Atualizar</button>
  ${cards}
</div>
</body>
</html>`;
}

// ── HTML de login ────────────────────────────────────────────────────────────
function htmlLogin(erro) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>TEMPS-A – Acesso do Médico</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:16px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 4px 20px rgba(0,0,0,.12);text-align:center}
.icon{font-size:2.5rem;margin-bottom:12px}
h1{font-size:1.3rem;color:#2b6cb0;margin-bottom:6px}
p{color:#718096;font-size:.9rem;margin-bottom:24px}
input{width:100%;padding:11px 14px;border:2px solid #e2e8f0;border-radius:8px;font-size:.97rem;outline:none;margin-bottom:14px;transition:border-color .2s}
input:focus{border-color:#90cdf4}
button{width:100%;background:linear-gradient(135deg,#2b6cb0,#2c5282);color:#fff;border:none;padding:12px;font-size:1rem;font-weight:600;border-radius:8px;cursor:pointer}
button:hover{opacity:.92}
.erro{background:#fff5f5;border:1px solid #fc8181;border-radius:7px;padding:10px;color:#c53030;font-size:.85rem;margin-bottom:14px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">🩺</div>
  <h1>Acesso do Médico</h1>
  <p>Digite a senha para visualizar as respostas dos pacientes.</p>
  ${erro ? `<div class="erro">❌ Senha incorreta. Tente novamente.</div>` : ''}
  <form method="POST" action="/login">
    <input type="password" name="senha" placeholder="Senha" autofocus/>
    <button type="submit">Entrar</button>
  </form>
</div>
</body>
</html>`;
}

// ── Sessões simples (em memória) ─────────────────────────────────────────────
const sessions = new Set();
function gerarToken() { return crypto.randomBytes(24).toString('hex'); }
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (req.headers['content-type'] === 'application/json') resolve(JSON.parse(body));
        else {
          const obj = {};
          body.split('&').forEach(p => { const [k,v]=p.split('='); obj[decodeURIComponent(k)]=decodeURIComponent(v||''); });
          resolve(obj);
        }
      } catch { resolve({}); }
    });
  });
}
function getCookie(req, name) {
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]*)'));
  return m ? m[1] : null;
}
function isAuth(req) { return sessions.has(getCookie(req,'session')); }

// ── Servidor ─────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // Formulário do paciente
  if (url === '/' && req.method === 'GET') {
    res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
    return res.end(htmlFormulario());
  }

  // Submissão do paciente
  if (url === '/submit' && req.method === 'POST') {
    console.log('[SUBMIT] Recebendo resposta...');
    const body = await parseBody(req);
    console.log('[SUBMIT] Nome:', body.nome);
    console.log('[SUBMIT] Respostas recebidas:', body.answers ? body.answers.length : 'NENHUMA');
    if (!body.answers || body.answers.length !== 45) {
      console.log('[SUBMIT] ERRO: dados inválidos');
      res.writeHead(400, {'Access-Control-Allow-Origin':'*'});
      return res.end('Dados inválidos');
    }
    const registro = {
      id: Date.now(),
      nome: (body.nome || 'Não informado').substring(0, 100),
      dataHora: new Date().toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo'}),
      answers: body.answers
    };
    salvarResposta(registro);
    console.log('[SUBMIT] ✅ Resposta salva com sucesso! Total:', lerRespostas().length);
    res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    return res.end(JSON.stringify({ok:true}));
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,GET','Access-Control-Allow-Headers':'Content-Type'});
    return res.end();
  }

  // Login GET
  if (url === '/medico' && req.method === 'GET') {
    if (isAuth(req)) {
      res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
      return res.end(htmlPainel(lerRespostas(), null));
    }
    res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
    return res.end(htmlLogin(false));
  }

  // Login POST
  if (url === '/login' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.senha === SENHA_MEDICO) {
      const token = gerarToken();
      sessions.add(token);
      res.writeHead(302, {'Set-Cookie':`session=${token};HttpOnly;Path=/`,'Location':'/medico'});
      return res.end();
    }
    res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
    return res.end(htmlLogin(true));
  }

  // Logout
  if (url === '/logout') {
    const tok = getCookie(req,'session');
    if (tok) sessions.delete(tok);
    res.writeHead(302, {'Set-Cookie':'session=;Max-Age=0;Path=/','Location':'/medico'});
    return res.end();
  }

  res.writeHead(404); res.end('Não encontrado');
});

server.listen(PORT, () => {
  console.log(`\n✅ Servidor TEMPS-A rodando!`);
  console.log(`   Formulário do paciente: http://localhost:${PORT}/`);
  console.log(`   Painel do médico:       http://localhost:${PORT}/medico`);
  console.log(`   Senha do painel:        ${SENHA_MEDICO}\n`);
});