const Sequelize = require("sequelize")

const sequelize = new Sequelize('postgresql://postgres:[0badasbrtio]@db.avartzofegjvsrgxnzok.supabase.co:5432/postgres', {

    dialect: 'postgres',
    logging: false,


});
   



module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
};