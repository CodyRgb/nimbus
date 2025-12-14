"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env"); // Must be first to validate env vars
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const db_1 = __importDefault(require("./config/db"));
const telegram_service_1 = require("./services/telegram.service");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const telegram_routes_1 = __importDefault(require("./routes/telegram.routes"));
const album_routes_1 = __importDefault(require("./routes/album.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const error_middleware_1 = require("./middleware/error.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
const AppError_1 = require("./utils/AppError");
// Handle uncaught exceptions (synchronous)
process.on('uncaughtException', (err) => {
    logger_1.logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger_1.logger.error(`${err.name}: ${err.message}`);
    process.exit(1);
});
const app = (0, express_1.default)();
// Enable trust proxy for Render/Heroku etc.
app.set('trust proxy', 1);
// Security Headers
app.use((0, helmet_1.default)());
// Global Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    max: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!',
    validate: { xForwardedForHeader: false }
});
app.use('/api', limiter);
// Compression middleware
app.use((0, compression_1.default)({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
    level: 6,
}));
// Body parser
app.use(express_1.default.json({ limit: '10kb' })); // Limit body size
app.use((0, cookie_parser_1.default)());
// Data Sanitization against NoSQL query injection
app.use(security_middleware_1.mongoSanitize);
// Prevent Parameter Pollution
app.use((0, hpp_1.default)());
// Enable CORS
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true
}));
// Logging Middleware
app.use((req, res, next) => {
    logger_1.logger.http(`${req.method} ${req.url}`);
    next();
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/files', file_routes_1.default);
app.use('/api/telegram', telegram_routes_1.default);
app.use('/api/albums', album_routes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is healthy' });
});
app.get('/', (req, res) => {
    res.send('API is running...');
});
// Handle unhandled routes (Express 5 compatible wildcard)
app.all(/(.*)/, (req, res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global Error Handler
app.use(error_middleware_1.globalErrorHandler);
const PORT = env_1.env.PORT;
let server;
// Connect to database and start server
const startServer = async () => {
    try {
        await (0, db_1.default)();
        await (0, telegram_service_1.connectTelegram)();
        server = app.listen(PORT, () => {
            logger_1.logger.info(`Server running in ${env_1.env.NODE_ENV} mode on port ${PORT}`);
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start server:', err);
        process.exit(1);
    }
};
startServer();
// Handle unhandled rejections (asynchronous)
process.on('unhandledRejection', (err) => {
    logger_1.logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger_1.logger.error(`${err.name}: ${err.message}`);
    // graceful shutdown
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
// Graceful Shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    if (server) {
        server.close(() => {
            logger_1.logger.info('💥 Process terminated!');
        });
    }
});
