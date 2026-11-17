// =========================================================
// models/usuarios.js  -  tabela "usuarios" (um registro por pedido)
// =========================================================
// Cada campo aqui vira uma coluna no banco. O Sequelize cria a tabela
// sozinho quando o servidor liga (veja o sync() no server.js) e ainda
// adiciona as colunas "createdAt" e "updatedAt" automaticamente.
const db = require("./db");

const usuarios = db.sequelize.define("usuarios", {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  // Nome do negocio do cliente (opcional no formulario)
  negocio: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  // Qual modelo ele escolheu (ex: "Loja virtual")
  modelo: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  // Plano mensal escolhido (ex: "Profissional" ou "Decidir depois")
  plano: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  // STRING e nao numero: telefone tem DDD, parenteses e tracos, ex: (41) 99999-9999
  telefone: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  // Extras marcados, separados por virgula (ex: "Domínio .com.br, Criação de logotipo")
  extrasOpcoes: {
    type: db.Sequelize.TEXT,
    allowNull: true,
  },
  // TEXT (e nao STRING): STRING so aceita 255 caracteres e o cliente pode
  // escrever um textao no campo "conte sobre seu negocio"
  obs: {
    type: db.Sequelize.TEXT,
    allowNull: true,
  },
  // ---- campos do painel /admin (o cliente nao preenche, so a equipe) ----
  // Em que pe esta o atendimento: novo | em_contato | fechado | pago | perdido
  status: {
    type: db.Sequelize.STRING,
    allowNull: false,
    defaultValue: "novo", // todo pedido que chega comeca como "novo"
  },
  // Quem da equipe esta cuidando deste cliente (texto livre, ex: "Vini")
  responsavel: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = usuarios;
