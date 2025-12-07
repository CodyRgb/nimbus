import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import connectDB from './config/db';
import { connectTelegram } from './services/telegram.service';
import { initRedis } from './services/cache.service';
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
import telegramRoutes from './routes/telegram.routes';
import albumRoutes from './routes/album.routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app: Application = express();

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
app.use(express.json());
app.use(cookieParser());

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));


app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/albums', albumRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});


const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();
        await connectTelegram();
        
        // Initialize Redis (optional - will work without it)
        try {
            const redis = initRedis();
            await redis.connect();
            console.log('Redis cache initialized');
        } catch (redisErr) {
            console.warn('Redis not available - caching disabled:', redisErr);
        }

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

