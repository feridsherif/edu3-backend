const { createApp } = require("../dist/main");

let server;

module.exports = async (req, res) => {
  if (!server) {
    const app = await createApp();
    server = app.getHttpAdapter().getInstance();
  }

  return server(req, res);
};