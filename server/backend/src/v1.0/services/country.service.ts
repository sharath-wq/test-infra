import axios from 'axios';
import logger from '../../utils/logger';
import { createClient } from 'redis';
const redisClient = createClient();
redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err}`));
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const fetchCountryData = async (): Promise<any> => {
  try {
    // Ensure Redis client is connected
    await connectRedis();

    // Check if data exists in Redis cache
    const cachedData = await redisClient.get('countryData');
    if (cachedData) {
      logger.info('Fetched data from Redis cache');
      return JSON.parse(cachedData); // Return cached data
    }

    // Fetch data from the external API
    const response = await axios.get(`${process.env.COUNTRY_API}v3.1/all`);
    const countryData = response.data;

    // Store data in Redis cache with an expiry time (e.g., 1 hour = 3600 seconds)
    await redisClient.setEx('countryData', 3600, JSON.stringify(countryData));

    logger.info('Fetched data from REST Countries API and cached in Redis');
    return countryData; // Return the data
  } catch (error: any) {
    logger.error(`Failed to fetch data from REST Countries API: ${error.message}`);
    throw new Error('Unable to fetch country data');
  }
};
