const express = require ("express");
const server = express()
const port = 3000;

server.use(express.json());

server.get('/', (req, res) => {
  res.json({ mensagem: "Bem-vindo ao meu backend Node.js!" });
});

server.post('/criarUsuario', (req, res) => {
  const campos  = { nome, email, telefone, negocio, plano, extrasOpcoes, modelo }

  const camposFaltando = Object.keys(campos).find(key => !campos[key]);

  if(camposFaltando){

    console.log(`O campo '${camposFaltando}' esta faltando`);

    return res.status(400).json({ error: `o campo ${camposFaltando}, e obrigatorio`});

  }
    console.log("todos os campos foram preenchidos");
  try {

    return res.status(201).json({ message: "usuario criado com sucesso"});

  } catch (error) {

    console.error("erro ao salvar no banco:", error);
    return res.status(500).json({ error: "erro interno no servidor."});

  }


});









module.exports = server;
server.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});