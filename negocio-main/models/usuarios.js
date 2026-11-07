const db = require("./db");

const usuarios = db.sequelize.define("usuarios",{

    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    },

    nome_negocio: {
        type: db.Sequelize.STRING,
        allowNull: false
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

    telefone: {
        type: db.Sequelize.NUMBER,
        allowNull: false
    },

    extras: {
        type: db.Sequelize.STRING,
        allowNull: false
    },

    obs: {
        type: db.Sequelize.STRING,
        allowNull: false
    }





})