const app = require('./app');

const PORT = process.env.SERVER_PORT || 3001;

app.listen(PORT, 'localhost', () => {
  console.log(`CryptoBot API server running on localhost:${PORT}`);
});
