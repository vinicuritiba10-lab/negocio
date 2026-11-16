// =========================================================
// models/db.js  -  conexao com o banco de dados (Postgres/Supabase)
// =========================================================
// A URL de conexao (com a senha) NAO fica mais no codigo: ela vem do
// arquivo ".env" (veja o ".env.example"). Assim a senha nao vai pro GitHub.
require("dotenv").config();

const Sequelize = require("sequelize");

const url = process.env.DATABASE_URL;

// Se esquecer de criar o .env, avisa de um jeito que da pra entender
if (!url) {
  throw new Error(
    'Falta a variavel DATABASE_URL. Copie ".env.example" para ".env" e preencha.'
  );
}

const sequelize = new Sequelize(url, {
  dialect: "postgres",
  logging: false, // troque por console.log pra ver os comandos SQL no terminal

  // O Supabase exige conexao criptografada (SSL). Sem isso a conexao e recusada.
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
});

module.exports = {
  Sequelize: Sequelize, // usado nos models pra definir tipos (STRING, INTEGER...)
  sequelize: sequelize, // a conexao em si
};
