// Delegates to the compiled NestJS lambda handler.
// All NestJS imports live inside inboxos-backend/node_modules so there is only
// one copy of @nestjs/core, @nestjs/common, typeorm, etc. at runtime.
module.exports = require('../inboxos-backend/dist/lambda').default;
