import app from './app';
import { connectToMongoDB } from './database';
import logger from './utils/logger';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port: `, `http://localhost:${PORT}/`);
    connectToMongoDB();
    // logger.info(`Server running on port ${PORT}`);
    // logger.error(`Server running on port ${PORT}`);
    // logger.debug(`Server running on port ${PORT}`);
    // logger.warn('This is a warning log');
});
