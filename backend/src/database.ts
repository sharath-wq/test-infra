import { MongoClient, Db } from 'mongodb';
import logger from './utils/logger';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test';

let db: Db | null = null;

export async function connectToMongoDB(): Promise<Db> {
    if (db) return db;

    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db(DB_NAME);
        logger.info(`✅ Connected to MongoDB: ${DB_NAME}`);
        return db;
    } catch (error) {
        logger.error('❌ MongoDB connection error:', error);
        throw error;
    }
}
