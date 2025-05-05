import { Router } from 'express';
import {
  countries,
  countriesByCode,
  countriesByRegion,
  searchCountries,
} from '../controllers/country.controller';

const router: Router = Router();

router.get('/', countries);
router.get('/search', searchCountries);
router.get('/:code', countriesByCode);
router.get('/region/:region', countriesByRegion);

export default router;
