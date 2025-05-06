import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/error-log', (req, res) => {
  const logPath = path.join(__dirname, '../logs/error.log');
  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading log file.');
    }
    res.send(`<pre>${data}</pre>`);
  });
});

export { router as errorRoutes };
