import { Router } from 'express';
const router: Router = require('express').Router();
import country from './country.routes';

router.use('/countries', country);

export default router;
