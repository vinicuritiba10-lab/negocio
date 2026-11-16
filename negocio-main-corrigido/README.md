# SiteExpress (negocio)

Site de pedidos + backend que salva os pedidos no banco (Supabase/Postgres).

## Estrutura

```
server.js            servidor Express: serve o site e recebe os pedidos (POST /criarUsuario)
models/db.js         conexao com o banco (le DATABASE_URL do .env)
models/usuarios.js   tabela "usuarios" (1 linha por pedido)
negocio/             o site: home.html, style.css, script.js, img/
.env                 SUAS senhas (voce cria, nao vai pro GitHub)
```

## Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha o `DATABASE_URL`
   (Supabase > Project Settings > Database > Connection string > **Session pooler**).
3. `npm run dev`
4. Abra http://localhost:3000

Se aparecer "Nao consegui conectar no banco", o problema e o `DATABASE_URL`.

## Onde mexer

| Quero...                                  | Arquivo                               |
|-------------------------------------------|---------------------------------------|
| Mudar precos / modelos / planos / extras  | `negocio/home.html` (atributos `data-preco`) |
| Trocar o numero do WhatsApp               | `negocio/script.js` (constante `WHATSAPP`) |
| Mudar o que acontece se o banco falhar    | `negocio/script.js` (`ABRIR_WHATSAPP_MESMO_SE_FALHAR`) |
| Adicionar um campo no pedido              | `home.html` + `script.js` (objeto `dados`) + `server.js` + `models/usuarios.js` |
| Mudar o limite anti-spam                  | `server.js` (`LIMITE_POR_MINUTO`) |

Obs: se adicionar campo no model, a tabela ja criada no Supabase nao muda sozinha.
Adicione a coluna la (ou apague a tabela `usuarios` e reinicie o servidor).
