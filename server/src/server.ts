import { env } from './config/env'; // Must be first to validate env vars
import express, { Application, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import connectDB from './config/db';
import { connectTelegram } from './services/telegram.service';
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import telegramRoutes from './routes/telegram.routes';
import albumRoutes from './routes/album.routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { globalErrorHandler } from './middleware/error.middleware';
import { mongoSanitize } from './middleware/security.middleware';
import { AppError } from './utils/AppError';
import http from 'http';

// Handle uncaught exceptions (synchronous)
process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(`${err.name}: ${err.message}`);
    process.exit(1);
});

const app: Application = express();

// Security Headers
app.use(helmet());

// Global Rate Limiting
const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);


// Compression middleware
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6,
}));

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize);

// Prevent Parameter Pollution
app.use(hpp());

// Enable CORS
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true
}));

// Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.http(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/albums', albumRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

// Handle unhandled routes (Express 5 compatible wildcard)
app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

const PORT = env.PORT;

let server: http.Server;

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();
        await connectTelegram();



        server = app.listen(PORT, () => {
            logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// Handle unhandled rejections (asynchronous)
process.on('unhandledRejection', (err: any) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(`${err.name}: ${err.message}`);
    // graceful shutdown
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    if (server) {
        server.close(() => {
            logger.info('💥 Process terminated!');
        });
    }
});
