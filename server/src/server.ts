import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import connectDB from './config/db';
import { connectTelegram } from './services/telegram.service';

const app: Application = express();

import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/file.routes';
// import { protect } from './middleware/auth.middleware';

import cookieParser from 'cookie-parser';
import cors from 'cors';

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

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});


const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();
        await connectTelegram();

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

