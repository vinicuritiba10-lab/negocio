const db = require("./db");

const usuarios = db.sequelize.define("usuarios", {
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    // Ajustado de nome_negocio para negocio (conforme o front e o server)
    negocio: {
        type: db.Sequelize.STRING,
        allowNull: true // Opcional no HTML
    },
    modelo: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    plano: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    // Mudado para STRING, pois telefones com DDD, parênteses ou traços (ex: (41) 99999-9999) geram erro se forem do tipo NUMBER/INTEGER
    telefone: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    // Ajustado de extras para extrasOpcoes
    extrasOpcoes: {
        type: db.Sequelize.STRING,
        allowNull: true
    },
    obs: {
        type: db.Sequelize.STRING,
        allowNull: true // Opcional no HTML
    }
});

module.exports = usuarios;