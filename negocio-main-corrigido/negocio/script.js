// =========================================================
// SiteExpress
// Troque pelo número do WhatsApp da empresa:
// 55 (Brasil) + DDD + número, só os dígitos.
// =========================================================
const WHATSAPP = "5511999999999";

const PARCELAS = 10;

// ---------- configuracao da API (backend) ----------
// Endereco do servidor que salva os pedidos (server.js).
// - Abrindo o site por http://localhost:3000 (jeito normal): fica vazio e o
//   navegador usa o mesmo endereco do site.
// - Abrindo o HTML direto do disco (file://) ou pelo Live Server do VS Code
//   (porta 5500): aponta pro servidor em localhost:3000.
const API_URL =
  window.location.protocol === "file:" || window.location.port === "5500"
    ? "http://localhost:3000"
    : "";

// O que fazer se der erro ao SALVAR o pedido no servidor (banco fora do ar etc.)?
//   true  -> abre o WhatsApp mesmo assim (o pedido completo vai na mensagem,
//            entao nao perdemos o cliente)
//   false -> trava e so mostra o erro
// Obs: se o erro for de validacao (email/telefone invalido) sempre trava.
const ABRIR_WHATSAPP_MESMO_SE_FALHAR = true;

const real = (valor) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  });

const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- menu do celular ----------
const menuBotao = document.querySelector(".menu-botao");
const menu = document.getElementById("menu");

menuBotao.addEventListener("click", () => {
  const aberto = menu.classList.toggle("aberto");
  menuBotao.setAttribute("aria-expanded", String(aberto));
  menuBotao.textContent = aberto ? "Fechar" : "Menu";
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("aberto");
    menuBotao.setAttribute("aria-expanded", "false");
    menuBotao.textContent = "Menu";
  });
});

// ---------- filtro de modelos ----------
const filtros = document.querySelectorAll("[data-filtro]");
const cartoes = document.querySelectorAll(".modelo");

filtros.forEach((botao) => {
  botao.addEventListener("click", () => {
    const filtro = botao.dataset.filtro;
    filtros.forEach((b) => b.setAttribute("aria-pressed", String(b === botao)));
    cartoes.forEach((cartao) => {
      cartao.hidden = filtro !== "todos" && cartao.dataset.categoria !== filtro;
    });
  });
});

// ---------- dados lidos da própria página ----------
const modelos = [...cartoes].map((c) => ({
  nome: c.dataset.modelo,
  preco: Number(c.dataset.preco),
  categoria: c.dataset.categoria,
}));

const planos = [...document.querySelectorAll(".plano")].map((p) => ({
  nome: p.dataset.plano,
  preco: Number(p.dataset.preco),
}));

const extras = [...document.querySelectorAll(".extras-lista li")].map((e) => ({
  nome: e.dataset.extra,
  preco: Number(e.dataset.preco),
  texto: e.querySelector("strong").textContent,
}));

// ---------- formulário ----------
const campoNome = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoNegocio = document.getElementById("negocio");
const campoModelo = document.getElementById("modelo");
const campoPlano = document.getElementById("plano");
const campoObs = document.getElementById("obs");
const caixaExtras = document.getElementById("extras-opcoes");
const botaoEnviar = document.getElementById("enviar");
const erro = document.getElementById("erro");

const grupos = { sites: "Sites", sistemas: "Sistemas" };
Object.entries(grupos).forEach(([categoria, rotulo]) => {
  const grupo = document.createElement("optgroup");
  grupo.label = rotulo;
  modelos
    .filter((m) => m.categoria === categoria)
    .forEach((m) => grupo.append(new Option(`${m.nome} (${real(m.preco)})`, m.nome)));
  campoModelo.append(grupo);
});

planos.forEach((p) => campoPlano.append(new Option(`${p.nome} (${real(p.preco)}/mês)`, p.nome)));
campoPlano.append(new Option("Decidir depois", ""));
campoPlano.value = "Profissional";

extras.forEach((e, i) => {
  const rotulo = document.createElement("label");
  rotulo.className = "extra-opcao";
  rotulo.innerHTML = `<input type="checkbox" value="${i}"><span></span><span></span>`;
  rotulo.querySelector("span").textContent = e.nome;
  rotulo.querySelector("span:last-child").textContent = e.texto;
  caixaExtras.append(rotulo);
});

function atualizar() {
  const modelo = modelos.find((m) => m.nome === campoModelo.value);
  const plano = planos.find((p) => p.nome === campoPlano.value);
  const escolhidos = [...caixaExtras.querySelectorAll("input:checked")].map((c) => extras[c.value]);

  const somaExtras = escolhidos.reduce((total, e) => total + e.preco, 0);
  const total = modelo.preco + somaExtras;
  const parcela = Math.round((total / PARCELAS) * 100) / 100;

  document.getElementById("r-modelo-nome").textContent = modelo.nome;
  document.getElementById("r-modelo-valor").textContent = real(modelo.preco);
  document.getElementById("r-extras").textContent = escolhidos.length ? real(somaExtras) : "nenhum";
  document.getElementById("r-total").textContent = real(total);
  document.getElementById("r-parcela").textContent = `ou ${PARCELAS}x de ${real(parcela)} no cartão`;
  document.getElementById("r-mensal").textContent = plano ? `${real(plano.preco)}/mês` : "a decidir";

  const linhas = [
    "Olá, SiteExpress! Quero fazer um pedido.",
    "",
    `Nome: ${campoNome.value.trim()}`,
  ];
  if (campoNegocio.value.trim()) linhas.push(`Negócio: ${campoNegocio.value.trim()}`);
  linhas.push(`Modelo: ${modelo.nome} (${real(modelo.preco)})`);
  linhas.push(`Plano mensal: ${plano ? `${plano.nome} (${real(plano.preco)}/mês)` : "decidir depois"}`);
  if (escolhidos.length) linhas.push(`Extras: ${escolhidos.map((e) => `${e.nome} (${e.texto})`).join(", ")}`);
  linhas.push(`Total: ${real(total)}`);
  if (campoObs.value.trim()) linhas.push("", `Sobre o negócio: ${campoObs.value.trim()}`);

  botaoEnviar.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join("\n"))}`;
}

document.getElementById("pedido-form").addEventListener("input", atualizar);
document.getElementById("pedido-form").addEventListener("change", atualizar);
document.getElementById("pedido-form").addEventListener("submit", (e) => e.preventDefault());

// ---------- envio do pedido ----------
// Fluxo ao clicar em "Enviar pedido pelo WhatsApp":
//   1. valida nome, email e telefone
//   2. salva o pedido no banco (POST /criarUsuario no server.js)
//   3. abre o WhatsApp com a mensagem pronta
//
// POR QUE NAO DEIXAMOS O LINK (<a href>) ABRIR SOZINHO?
// O navegador decide se segue o link NO MOMENTO do clique. Como salvar no
// servidor demora (usa "await"), quando o codigo chamava evento.preventDefault()
// depois do await ja era tarde: o WhatsApp abria antes de salvar, mesmo com erro.
// Entao agora cancelamos o clique logo de cara e abrimos o WhatsApp na mao
// no final, quando sabemos que deu tudo certo.

let enviando = false; // evita duplo clique criando pedido repetido

// Mostra uma mensagem de erro e marca o campo com problema
function mostrarErro(mensagem, campo) {
  erro.textContent = mensagem;
  if (campo) {
    campo.setAttribute("aria-invalid", "true");
    campo.focus();
  }
}

// Confere os campos obrigatorios. Devolve true se estiver tudo certo.
function validarFormulario() {
  [campoNome, campoEmail, campoTelefone].forEach((c) => c.removeAttribute("aria-invalid"));

  if (!campoNome.value.trim()) {
    mostrarErro("Escreva seu nome para enviar o pedido.", campoNome);
    return false;
  }
  // formato basico: algo@algo.algo (o servidor confere de novo)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value.trim())) {
    mostrarErro("Escreva um email válido para enviar o pedido.", campoEmail);
    return false;
  }
  // telefone: DDD + numero = 10 ou 11 digitos
  const digitos = campoTelefone.value.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) {
    mostrarErro("Escreva seu telefone com DDD, ex: (41) 99999-9999.", campoTelefone);
    return false;
  }
  return true;
}

// Limpa o erro quando a pessoa corrige o campo
[campoNome, campoEmail, campoTelefone].forEach((campo) => {
  campo.addEventListener("input", () => {
    erro.textContent = "";
    campo.removeAttribute("aria-invalid");
  });
});

botaoEnviar.addEventListener("click", async (evento) => {
  evento.preventDefault(); // cancela o link: quem abre o WhatsApp e este codigo, la embaixo
  if (enviando) return;

  if (!validarFormulario()) return;
  erro.textContent = "";

  // Abre uma aba em branco AGORA (dentro do clique). Navegadores, principalmente
  // Safari/celular, bloqueiam janelas abertas depois de um "await". Depois que
  // salvar, so trocamos o endereco dessa aba pelo link do WhatsApp.
  const abaWhatsapp = window.open("", "_blank");

  // Extras marcados (so os nomes, separados por virgula)
  const extrasMarcados = [...caixaExtras.querySelectorAll("input:checked")].map(
    (c) => extras[c.value].nome
  );

  // Dados que o servidor espera (os nomes dos campos tem que bater com o server.js)
  const dados = {
    nome: campoNome.value.trim(),
    email: campoEmail.value.trim(),
    telefone: campoTelefone.value.trim(),
    modelo: campoModelo.value,
    plano: campoPlano.value, // vazio ("") = "Decidir depois"
    negocio: campoNegocio.value.trim(),
    obs: campoObs.value.trim(),
    extrasOpcoes: extrasMarcados.join(", ") || "nenhum",
  };

  enviando = true;
  botaoEnviar.textContent = "Enviando...";
  let podeAbrirWhatsapp = true;

  try {
    const resposta = await fetch(`${API_URL}/criarUsuario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      // 4xx = problema nos dados / limite de tentativas. 5xx = erro do servidor.
      const corpo = await resposta.json().catch(() => ({}));
      console.error("Erro retornado pelo servidor:", resposta.status, corpo.error);
      mostrarErro(corpo.error || "Não foi possível registrar o pedido.");
      // erro de validacao (4xx) sempre trava; erro do servidor (5xx) depende da configuracao
      if (resposta.status < 500 || !ABRIR_WHATSAPP_MESMO_SE_FALHAR) podeAbrirWhatsapp = false;
    } else {
      console.log("Pedido salvo no banco!", await resposta.json());
    }
  } catch (err) {
    // fetch so cai aqui quando nao conseguiu falar com o servidor (desligado, sem internet...)
    console.error("Erro de conexão:", err);
    mostrarErro("Não foi possível conectar ao servidor.");
    if (!ABRIR_WHATSAPP_MESMO_SE_FALHAR) podeAbrirWhatsapp = false;
  } finally {
    enviando = false;
    botaoEnviar.textContent = "Enviar pedido pelo WhatsApp";
  }

  // Passo final: abre o WhatsApp (link montado pela funcao atualizar()) ou fecha a aba vazia
  if (podeAbrirWhatsapp) {
    if (abaWhatsapp) abaWhatsapp.location.href = botaoEnviar.href;
    else window.location.href = botaoEnviar.href; // popup bloqueado: abre na mesma aba
  } else if (abaWhatsapp) {
    abaWhatsapp.close();
  }
});

// ---------- botões “Quero este” e “Escolher plano” ----------
function irParaPedido() {
  document.getElementById("pedido").scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth" });
  // no computador, já deixa o cursor no campo do nome
  if (!campoNome.value.trim() && window.matchMedia("(pointer: fine)").matches) {
    campoNome.focus({ preventScroll: true });
  }
}

document.querySelectorAll("[data-escolher-modelo]").forEach((botao) => {
  botao.addEventListener("click", () => {
    campoModelo.value = botao.dataset.escolherModelo;
    atualizar();
    irParaPedido();
  });
});

document.querySelectorAll("[data-escolher-plano]").forEach((botao) => {
  botao.addEventListener("click", () => {
    campoPlano.value = botao.dataset.escolherPlano;
    atualizar();
    irParaPedido();
  });
});

atualizar();
