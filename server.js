const express = require ("express");
const server = express()
const port = 3000;

server.use(express.json());

server.get('/', (req, res) => {
  res.json({ mensagem: "Bem-vindo ao meu backend Node.js!" });
});

server.post('/criarUsuario', (req, res) => {
  const campos  = { nome, email, telefone, negocio, plano, obs, extrasOpcoes, modelo }

  const camposFaltando = Object.keys(campos).find(key => !campos[key]);

  if(camposFaltando){

    console.log(`O campo '${camposFaltando}' esta faltando`);

  }else {
    console.log("todos os campos foram preenchidos");
  }



  
})









module.exports = server;
server.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});