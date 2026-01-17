const express = require('express');
const env = require('dotenv');
env.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get('/', (req, res) => res.send('<h1>Aplicação rodando em produção com sucesso!</h1>'));
app.listen(port, () => console.log(`App rodando na porta ${port}`));