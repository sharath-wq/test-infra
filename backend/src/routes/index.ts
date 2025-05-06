import { Router } from 'express';
const router: Router = require('express').Router();
import v1 from '../v1.0/routes';

// api version 1.0 routes
router.use('/1.0', v1);

export default router;
