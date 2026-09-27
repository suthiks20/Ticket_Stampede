// seller/src/modules/sales/routes/index.js
const resetHandler = require('../handlers/reset');
// If your schema file is empty or causing errors, you can temporarily remove `, { schema: resetSchema }`
const resetSchema = require('../schemas/reset'); 

async function salesRoutes(fastify) {
  fastify.post('/reset', { schema: resetSchema }, resetHandler);
}

module.exports = salesRoutes;