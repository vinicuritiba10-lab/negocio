// =========================================================
// SiteExpress
// Troque pelo número do WhatsApp da empresa:
// 55 (Brasil) + DDD + número, só os dígitos.
// =========================================================
const WHATSAPP = "5511999999999";

const PARCELAS = 10;

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

campoNome.addEventListener("input", () => {
  if (campoNome.value.trim()) {
    erro.textContent = "";
    campoNome.removeAttribute("aria-invalid");
  }
});

botaoEnviar.addEventListener("click", (evento) => {
  if (!campoNome.value.trim()) {
    evento.preventDefault();
    erro.textContent = "Escreva seu nome para enviar o pedido.";
    campoNome.setAttribute("aria-invalid", "true");
    campoNome.focus();
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
