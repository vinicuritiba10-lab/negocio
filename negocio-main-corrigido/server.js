// =========================================================
// server.js  -  servidor (backend) do SiteExpress
// =========================================================
// O que ele faz:
//   1. Mostra o site (a pasta /negocio) no navegador
//   2. Recebe os pedidos do formulario na rota POST /criarUsuario
//      e salva no banco de dados (Postgres no Supabase)
//
// Como rodar:
//   npm install         (so na primeira vez)
//   npm run dev         (reinicia sozinho quando voce salva o arquivo)
//   abrir http://localhost:3000
// =========================================================

require("dotenv").config(); // le o arquivo .env (DATABASE_URL, PORT)

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./models/db");
const usuarios = require("./models/usuarios"); // <- faltava importar isso!

const server = express();
const port = process.env.PORT || 3000;

// ---------------------------------------------------------
// Configuracoes gerais (middlewares)
// Middleware = codigo que roda ANTES das rotas, em toda requisicao.
// ---------------------------------------------------------
server.use(cors()); // permite o front chamar a API mesmo de outro endereco
server.use(express.json()); // entende o corpo da requisicao em JSON
server.use(express.urlencoded({ extended: true }));

// Serve o site: arquivos da pasta "negocio" (home.html, style.css, script.js, img/)
// Assim, abrindo http://localhost:3000 ja aparece o site e o front e a API
// ficam no mesmo endereco (sem dor de cabeca com CORS).
server.use(express.static(path.join(__dirname, "negocio"), { index: "home.html" }));

// ---------------------------------------------------------
// Protecao simples contra spam
// ---------------------------------------------------------
// Como a rota de pedido e publica, qualquer um poderia mandar 1000 pedidos
// falsos por minuto e lotar o banco. Este limitador guarda na memoria
// quantas vezes cada IP chamou a rota no ultimo minuto.
// (Reiniciar o servidor zera a contagem - pro nosso tamanho, ta ok.)
const LIMITE_POR_MINUTO = 5;
const acessosPorIp = new Map(); // ip -> lista de horarios (em ms) dos acessos

function limitarRequisicoes(req, res, next) {
  const agora = Date.now();
  const umMinutoAtras = agora - 60 * 1000;

  // mantem so os acessos do ultimo minuto
  const recentes = (acessosPorIp.get(req.ip) || []).filter((t) => t > umMinutoAtras);

  if (recentes.length >= LIMITE_POR_MINUTO) {
    return res.status(429).json({ error: "muitas tentativas, espere um minuto e tente de novo." });
  }

  recentes.push(agora);
  acessosPorIp.set(req.ip, recentes);
  next(); // liberado, segue pra rota
}

// ---------------------------------------------------------
// Rota de teste: abra http://localhost:3000/saude pra ver se o servidor esta vivo
// ---------------------------------------------------------
server.get("/saude", (req, res) => {
  res.json({ mensagem: "Servidor funcionando!" });
});

// ---------------------------------------------------------
// POST /criarUsuario  -  recebe um pedido do formulario e salva no banco
// ---------------------------------------------------------
// O front (script.js) manda um JSON assim:
//   { nome, email, telefone, modelo, plano, negocio, obs, extrasOpcoes }
//
// Respostas:
//   201 -> salvou
//   400 -> faltou campo ou algum campo esta invalido (a mensagem diz qual)
//   429 -> muitas requisicoes (limitador acima)
//   500 -> erro nosso (banco fora do ar, etc.)
server.post("/criarUsuario", limitarRequisicoes, async (req, res) => {
  // 1) Pega os campos que vieram do formulario.
  //    ATENCAO: antes faltavam "negocio" e "obs" aqui, e isso causava erro
  //    (usar uma variavel que nao existe derruba a rota).
  const { nome, email, telefone, modelo, plano, negocio, obs, extrasOpcoes } = req.body;

  // 2) Campos OBRIGATORIOS. "plano" NAO esta aqui de proposito: o formulario
  //    tem a opcao "Decidir depois" que manda plano vazio ("") - antes isso
  //    era recusado como se fosse campo faltando.
  const obrigatorios = { nome, email, telefone, modelo };
  const faltando = Object.keys(obrigatorios).find((campo) => {
    const valor = obrigatorios[campo];
    return typeof valor !== "string" || !valor.trim();
  });

  if (faltando) {
    console.log(`Pedido recusado: campo '${faltando}' esta faltando`);
    return res.status(400).json({ error: `o campo ${faltando} e obrigatorio` });
  }

  // 3) Validacoes de formato (nao confie so no front: qualquer um pode
  //    chamar a API direto, sem passar pelo site)
  const emailLimpo = email.trim();
  const telefoneLimpo = telefone.trim();
  const apenasNumeros = telefoneLimpo.replace(/\D/g, ""); // tira tudo que nao e digito

  // formato basico: algo@algo.algo, sem espacos
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
    return res.status(400).json({ error: "o email informado nao parece valido" });
  }
  // telefone brasileiro: DDD + numero = 10 ou 11 digitos (com 55 na frente: 12 ou 13)
  if (apenasNumeros.length < 10 || apenasNumeros.length > 13) {
    return res.status(400).json({ error: "o telefone deve ter DDD + numero" });
  }

  // 4) Salva no banco
  try {
    const novoPedido = await usuarios.create({
      nome: nome.trim(),
      email: emailLimpo,
      telefone: telefoneLimpo,
      modelo: modelo.trim(),
      plano: String(plano || "").trim() || "Decidir depois", // vazio vira "Decidir depois"
      negocio: negocio ? String(negocio).trim() : null,
      obs: obs ? String(obs).trim() : null,
      extrasOpcoes: extrasOpcoes ? String(extrasOpcoes).trim() : "nenhum",
    });

    console.log(`Pedido #${novoPedido.id} salvo (${novoPedido.nome} - ${novoPedido.modelo})`);
    return res.status(201).json({ message: "pedido criado com sucesso", id: novoPedido.id });
  } catch (error) {
    // O erro de verdade aparece aqui no terminal; pro cliente mandamos so
    // uma mensagem generica (nao vazar detalhes do banco).
    console.error("erro ao salvar no banco:", error);
    return res.status(500).json({ error: "erro interno no servidor." });
  }
});

// ---------------------------------------------------------
// Ligando o servidor
// ---------------------------------------------------------
// Ordem certa: 1) conecta no banco  2) cria a tabela se nao existir  3) abre a porta.
// Antes o servidor abria a porta sem nunca criar a tabela "usuarios",
// entao todo pedido dava erro 500.
async function iniciar() {
  try {
    await db.sequelize.authenticate(); // testa a conexao (senha, host, SSL...)
    console.log("Conectado ao banco de dados.");

    // Cria a tabela "usuarios" se ainda nao existir. NAO apaga nem altera
    // tabelas existentes. Se um dia mudar um campo no model, precisa alterar
    // a tabela no Supabase na mao (ou apagar a tabela e deixar recriar).
    await db.sequelize.sync();
    console.log("Tabelas prontas.");
  } catch (error) {
    console.error("Nao consegui conectar no banco. Confira o DATABASE_URL no .env:");
    console.error(error.message);
    process.exit(1); // sem banco o servidor nao serve pra nada, entao para aqui
  }

  server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

// So liga o servidor se o arquivo foi executado direto (node server.js).
// Assim, da pra importar o "server" em testes sem abrir a porta.
if (require.main === module) {
  iniciar();
}

module.exports = server;
