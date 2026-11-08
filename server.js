const express = require ("express");
const server = express()
const cors = require('cors');
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
const port = 3000;

server.get('/', (req, res) => {
  res.json({ mensagem: "Bem-vindo ao meu backend Node.js!" });
});

//para quem ler: eu sei que esta feio, nao me julgue :), o gemini e burro

server.post('/criarUsuario', async (req, res) => {
  console.log(req.body);
  const { nome, email, plano, telefone, extrasOpcoes, modelo } = req.body;
  const campos  = { nome, email, plano, telefone, extrasOpcoes, modelo };

  const camposFaltando = Object.keys(campos).find(key => !campos[key]);

  if(camposFaltando){

    console.log(`O campo '${camposFaltando}' esta faltando`);

    return res.status(400).json({ error: `o campo ${camposFaltando}, e obrigatorio`});

  }
    console.log("todos os campos foram preenchidos");
  try {

    const novoUsuario = await usuarios.create({
      nome, email, telefone, obs, negocio, plano, extrasOpcoes, modelo
    });

    return res.status(201).json({ message: "usuario criado com sucesso"});

  } catch (error) {

    console.error("erro ao salvar no banco:", error);
    return res.status(500).json({ error: "erro interno no servidor."});

  }


});









module.exports = server;
server.listen(port, () => {
  console.log(` Servidor rodando em http://localhost:${port}`);
});