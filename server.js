import express  from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/dbConnection.js';
import authRouter from './routes/authRoutes.js';
import pool from './config/dbConnection.js';
import userRouter from './routes/userRoutes.js';
const app = express();
const PORT = process.env.PORT || 5000;
{/* db connection */}
async function connectDB(){
    try{
        const result = await pool.query('SELECT NOW()');
        console.log('Connected to the database:', result.rows[0].now);
    }catch (error) {
        console.error('Error connecting to the database:', error);
    }
}
connectDB();
app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials: true,}));


//API ENDpoints
app.get('/', (req, res) => {res.send('Hello World!');});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port :${PORT}`);
}
);
