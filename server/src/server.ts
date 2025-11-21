import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app: Application = express();

// Body parser
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
