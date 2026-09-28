// seller/src/app.js
const fastify = require('fastify')({ logger: true });

async function buildApp() {
  // 1. Test /reset
  fastify.post('/reset', async (request, reply) => {
    return { message: "Reset endpoint works!", ticket_count: request.body.ticket_count };
  });

  // 2. Test /buy
  fastify.post('/buy', async (request, reply) => {
    return { message: "Buy endpoint works!", ticket_number: 1 };
  });

  // 3. Test /status
  fastify.get('/status', async (request, reply) => {
    return { sold: 0, tickets: [] };
  });

  return fastify;
}

module.exports = buildApp;