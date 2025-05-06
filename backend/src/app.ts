import express, { Application, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import errorMiddleware from './v1.0/middlewares/error.middleware';
import { errorRoutes } from './v1.0/controllers/error.routes';
import logger from './utils/logger';
const redis = require('redis');

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(morgan('dev'));

const redisClient = redis.createClient();

redisClient.on('connect', () => {
    logger.info('Connected to Redis');
});

redisClient.on('error', (err: any) => {
    logger.error('Redis error:', err);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing Redis client...');
    await redisClient.quit();
    logger.info('Redis client closed.');
    process.exit(0);
});

// redisClient.connect();

const limiterPublic = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 10 minutes.',
});

// Public route
app.use('/api', limiterPublic, routes);

app.use('/error', errorRoutes);

app.use(errorMiddleware);

export default app;
