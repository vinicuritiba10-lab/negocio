const express = require ("express");
const server = express()
const port = 3000;

server.use(express.json());

server.get('/', (req, res) => {
  res.json({ mensagem: "Bem-vindo ao meu backend Node.js!" });
});

server.post('/criarUsuario', (req, res) => {
  const { nome } = req.body;
  const { email } = req.body;
  const { telefone } = req.body;
  const { negocio } = req.body;
  const { plano } = req.body;
  const { obs } = req.body;
  const { extrasOpcoes } = req.body;
  const { modelo } = req.body;

  
})









module.exports = server;
server.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});