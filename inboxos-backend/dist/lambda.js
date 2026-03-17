"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const express = require('express');
const server = express();
let app;
async function bootstrap() {
    if (app)
        return;
    const nestApp = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server));
    nestApp.use((0, cookie_parser_1.default)());
    nestApp.enableCors({
        origin: [process.env.FRONTEND_URL, 'http://localhost:8080'].filter(Boolean),
        credentials: true,
    });
    nestApp.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await nestApp.init();
    app = nestApp;
}
async function handler(req, res) {
    try {
        await bootstrap();
    }
    catch (err) {
        console.error('NestJS bootstrap failed:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Bootstrap failed', message: err.message }));
        return;
    }
    req.url = req.url.replace(/^\/api/, '') || '/';
    server(req, res);
}
//# sourceMappingURL=lambda.js.map