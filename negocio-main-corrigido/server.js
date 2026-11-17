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
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");

const db = require("./models/db");
const usuarios = require("./models/usuarios"); // <- faltava importar isso!

const server = express();
const port = process.env.PORT || 3000;

// Hospedado (Render etc.) o site fica ATRAS de um proxy: sem isto o req.ip seria
// sempre o IP interno do proxy, e o limitador anti-spam trataria TODOS os
// visitantes como uma pessoa so. Em producao defina TRUST_PROXY=true nas
// variaveis de ambiente. No seu computador deixe sem (nao precisa).
if (process.env.TRUST_PROXY === "true") {
  server.set("trust proxy", true);
}

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
// (a hospedagem tambem usa esta rota pra saber se o site subiu direito)
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

// =========================================================
// PAINEL ADMIN  -  http://localhost:3000/admin
// =========================================================
// Pagina so pra equipe: lista os pedidos, muda o status e anota quem
// esta atendendo. Protegida por senha (variavel ADMIN_SENHA no .env).
//
// O arquivo da pagina fica na pasta "admin/" (e NAO em "negocio/") de
// proposito: tudo que esta em "negocio/" e publico pra qualquer visitante.

// Status que um pedido pode ter (o painel e o servidor usam esta mesma lista)
const STATUS_VALIDOS = ["novo", "em_contato", "fechado", "pago", "perdido"];

// Transforma qualquer texto em um "hash" de tamanho fixo. Serve pra comparar
// senhas com timingSafeEqual, que exige dois valores do mesmo tamanho.
function hashear(texto) {
  return crypto.createHash("sha256").update(String(texto)).digest();
}

// Horarios das senhas ERRADAS no ultimo periodo. E uma contagem GERAL (nao por
// IP) de proposito: atras de proxy o IP pode ser falsificado, e assim ninguem
// consegue ficar testando senha sem parar.
let senhasErradas = [];

// Middleware: so deixa passar quem mandou a senha certa (login do navegador).
function protegerAdmin(req, res, next) {
  const senhaCorreta = process.env.ADMIN_SENHA;

  // Sem senha configurada o painel fica DESLIGADO (melhor que ficar aberto).
  if (!senhaCorreta) {
    return res.status(503).send("Painel desativado: defina ADMIN_SENHA no .env e reinicie.");
  }

  const agora = Date.now();
  senhasErradas = senhasErradas.filter((t) => t > agora - 15 * 60 * 1000);
  if (senhasErradas.length >= 20) {
    return res.status(429).send("Muitas senhas erradas. Espere 15 minutos.");
  }

  // O navegador manda "Authorization: Basic base64(usuario:senha)".
  // Ignoramos o usuario e conferimos so a senha.
  const cabecalho = req.headers.authorization || "";
  let senhaDigitada = "";
  if (cabecalho.startsWith("Basic ")) {
    const decodificado = Buffer.from(cabecalho.slice(6), "base64").toString("utf8");
    senhaDigitada = decodificado.slice(decodificado.indexOf(":") + 1);
  }

  const acertou =
    cabecalho !== "" && crypto.timingSafeEqual(hashear(senhaDigitada), hashear(senhaCorreta));

  if (!acertou) {
    if (cabecalho !== "") senhasErradas.push(agora); // so conta se tentou uma senha
    // Este cabecalho faz o navegador abrir a janelinha de usuario/senha
    res.set("WWW-Authenticate", 'Basic realm="Painel SiteExpress"');
    return res.status(401).send("Senha necessaria.");
  }

  res.set("Cache-Control", "no-store"); // dados de clientes: nao guardar em cache
  next();
}

// Tudo que comeca com /admin passa pela senha antes de qualquer rota abaixo
server.use("/admin", protegerAdmin);

// A pagina do painel
server.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

// Lista todos os pedidos, do mais novo pro mais antigo
server.get("/admin/api/pedidos", async (req, res) => {
  try {
    const pedidos = await usuarios.findAll({ order: [["createdAt", "DESC"]] });
    res.json(pedidos);
  } catch (error) {
    console.error("erro ao listar pedidos:", error);
    res.status(500).json({ error: "erro interno no servidor." });
  }
});

// Atualiza um pedido. Corpo (JSON): { status?, responsavel? } - manda so o que mudou.
server.patch("/admin/api/pedidos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id invalido" });
    }

    const { status, responsavel } = req.body;

    if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ error: `status invalido (use: ${STATUS_VALIDOS.join(", ")})` });
    }

    const pedido = await usuarios.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ error: "pedido nao encontrado" });
    }

    if (status !== undefined) pedido.status = status;
    if (responsavel !== undefined) {
      // texto vazio vira "sem responsavel" (null); limita o tamanho
      pedido.responsavel = String(responsavel).trim().slice(0, 100) || null;
    }

    await pedido.save();
    res.json(pedido);
  } catch (error) {
    console.error("erro ao atualizar pedido:", error);
    res.status(500).json({ error: "erro interno no servidor." });
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

    // O sync() acima NAO adiciona colunas novas em tabela que ja existe.
    // Entao, se a tabela e antiga (criada antes do painel), adicionamos aqui
    // as colunas "status" e "responsavel". Os pedidos antigos viram "novo".
    const qi = db.sequelize.getQueryInterface();
    const tabela = usuarios.getTableName();
    const colunas = await qi.describeTable(tabela);
    if (!colunas.status) {
      await qi.addColumn(tabela, "status", {
        type: db.Sequelize.STRING,
        allowNull: false,
        defaultValue: "novo",
      });
      console.log('Coluna "status" adicionada.');
    }
    if (!colunas.responsavel) {
      await qi.addColumn(tabela, "responsavel", { type: db.Sequelize.STRING, allowNull: true });
      console.log('Coluna "responsavel" adicionada.');
    }

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
