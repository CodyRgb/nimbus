import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Load env vars
dotenv.config();

// Connect to database
// Connect to database moved to server startup

const app: Application = express();

import authRoutes from './routes/auth.routes';
// import { protect } from './middleware/auth.middleware';

import cors from 'cors';

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));


app.use('/api/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});


const PORT = process.env.PORT || 5000;

// Connect to database and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});
