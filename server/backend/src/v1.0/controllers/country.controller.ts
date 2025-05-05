import { Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';
import logger from '../../utils/logger';
import { fetchCountryData } from '../services/country.service';
import { ApiResponse, CountryData } from '../Types/ApiResponceTypes';
import { PaginatedResponse } from '../Types/PaginationType';

interface PaginationQuery {
  page?: string;
  limit?: string;
}

export const countries = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid pagination parameters. Page and limit must be positive numbers.',
      });
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    logger.info('Fetching data from the service...');
    const countryDetails = await fetchCountryData();

    if (!countryDetails || countryDetails.length === 0) {
      logger.error('No data retrieved from the fetchCountryData service');
      return res.status(500).json({
        status: 500,
        message: 'No country data available',
      });
    }

    // Apply filtering
    const filteredData = filterDetails(countryDetails);

    // Calculate pagination values
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Slice the data array for pagination
    const paginatedData = filteredData.slice(skip, skip + limit);

    // Generate pagination URLs
    const baseUrl = `${req.protocol}://${req.get('host')}/api/1.0/countries`;

    // Prepare pagination metadata with URLs
    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      links: {
        current: `${baseUrl}?page=${page}&limit=${limit}`,
        next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
        prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
        first: `${baseUrl}?page=1&limit=${limit}`,
        last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
      },
    };

    // Send the paginated response
    const response: PaginatedResponse = {
      status: 200,
      message: 'Country data retrieved successfully',
      data: paginatedData,
      pagination: paginationData,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    logger.error(`Error fetching country data: ${error.message}`);
    next(error); // Pass error to the Express error handler
  }
};

export const countriesByCode = async (
  req: Request<{ code: string }, ApiResponse, never, never>,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      logger.warn('Country code is missing in the request');
      res.status(400).json({
        status: 400,
        message: 'Country code is required',
      });
      return;
    }

    logger.info('Fetching country data from the service...');
    const countryDetails = await fetchCountryData();

    if (!countryDetails || countryDetails.length === 0) {
      logger.error('No data retrieved from the fetchCountryData service');
      res.status(500).json({
        status: 500,
        message: 'No country data available',
      });
      return;
    }

    const country = countryDetails.find(
      (c: any) =>
        c.cca2?.toLowerCase() === code.toLowerCase() || c.cca3?.toLowerCase() === code.toLowerCase()
    );

    if (!country) {
      logger.warn(`No country found with code: ${code}`);
      res.status(404).json({
        status: 404,
        message: `No country found with code: ${code}`,
      });
      return;
    }

    const result = filterDetails(country);

    res.status(200).json({
      status: 200,
      message: 'Country data retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error(
      `Error fetching country by code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    next(error);
  }
};

export const countriesByRegion = async (
  req: Request<{ region: string }, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { region } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    // Validate region and pagination parameters
    if (!region) {
      return res.status(400).json({
        status: 400,
        message: 'Region is required',
      });
    }

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid pagination parameters. Page and limit must be positive numbers.',
      });
    }

    // Fetch data from the service
    logger.info('Fetching data from the service...');
    const countryDetails = await fetchCountryData();

    if (!countryDetails || countryDetails.length === 0) {
      logger.error('No data retrieved from the fetchCountryData service');
      return res.status(500).json({
        status: 500,
        message: 'No country data available',
      });
    }

    // Filter data by region
    const countriesInRegion = countryDetails.filter(
      (country: any) => country.region?.toLowerCase() === region.toLowerCase()
    );

    if (countriesInRegion.length === 0) {
      logger.warn(`No countries found in region: ${region}`);
      return res.status(404).json({
        status: 404,
        message: `No countries found in region: ${region}`,
      });
    }

    // Apply filtering and calculate pagination values
    const filteredData = filterDetails(countriesInRegion);
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    if (skip >= totalItems) {
      return res.status(404).json({
        status: 404,
        message: 'Page not found',
      });
    }

    const paginatedData = filteredData.slice(skip, skip + limit);

    // Generate pagination URLs
    const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;
    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      links: {
        current: `${baseUrl}?page=${page}&limit=${limit}`,
        next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
        prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
        first: `${baseUrl}?page=1&limit=${limit}`,
        last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
      },
    };

    // Prepare and send the response
    const response: PaginatedResponse = {
      status: 200,
      message: `Countries in the ${region} region retrieved successfully`,
      data: paginatedData,
      pagination: paginationData,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    logger.error(`Error fetching countries by region: ${error.message}`);
    next(error); // Pass error to the Express error handler
  }
};

// Types for pagination
interface PaginationQuery {
  page?: string;
  limit?: string;
  name?: string;
  region?: string;
  capital?: string;
  timezone?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  links: {
    current: string;
    next: string | null;
    prev: string | null;
    first: string;
    last: string;
  };
}

interface PaginatedResponse {
  status: number;
  message: string;
  data: any[];
  pagination: PaginationData;
}

export const searchCountries = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<any> => {
  console.log('Query Params:', req.query);
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid pagination parameters. Page and limit must be positive numbers.',
      });
    }

    // Extract search query parameters
    const { name, region, capital, timezone } = req.query;

    if (!name && !region && !capital && !timezone) {
      logger.warn('No valid query parameters are provided in the request');
      return res.status(400).json({
        status: 400,
        message:
          'At least one of "name", "region", "capital", or "timezone" query parameters is required',
      });
    }

    // Fetch all country data using the service
    logger.info('Fetching country data from the service...');
    const countryDetails = await fetchCountryData();

    if (!countryDetails || countryDetails.length === 0) {
      logger.error('No data retrieved from the fetchCountryData service');
      return res.status(500).json({
        status: 500,
        message: 'No country data available',
      });
    }

    // Normalize timezone format
    const normalizeTimezone = (tz: string): string => {
      tz = tz.trim().toUpperCase();
      if (!tz.startsWith('UTC')) {
        tz = 'UTC' + tz;
      }
      let timePart = tz.replace('UTC', '');
      if (!timePart.startsWith('+') && !timePart.startsWith('-')) {
        timePart = '+' + timePart;
      }
      const match = timePart.match(/^([+-])(\d{1,2}):?(\d{2})?$/);
      if (match) {
        const [, sign, hours, minutes = '00'] = match;
        const paddedHours = hours.padStart(2, '0');
        return `UTC${sign}${paddedHours}:${minutes}`;
      }
      return tz;
    };

    // Debug logging for timezone normalization
    if (timezone) {
      logger.debug(`Original timezone: ${timezone}`);
      logger.debug(`Normalized timezone: ${normalizeTimezone(timezone as string)}`);
    }

    // Filter countries by query parameters if provided
    const filteredCountries = countryDetails.filter((country: any) => {
      const matchesName =
        !name || country.name.common.toLowerCase().includes((name as string).toLowerCase());

      const matchesRegion =
        !region || country.region?.toLowerCase() === (region as string).toLowerCase();

      const matchesCapital =
        !capital ||
        country.capital?.some(
          (cap: string) => cap.toLowerCase() === (capital as string).toLowerCase()
        );

      const matchesTimeZone =
        !timezone ||
        country.timezones?.some((tz: string) => {
          const normalizedCountryTz = normalizeTimezone(tz);
          const normalizedSearchTz = normalizeTimezone(timezone as string);
          logger.debug(`Country timezone: ${tz} -> ${normalizedCountryTz}`);
          logger.debug(`Search timezone: ${timezone} -> ${normalizedSearchTz}`);
          return normalizedCountryTz === normalizedSearchTz;
        });

      return matchesName && matchesRegion && matchesCapital && matchesTimeZone;
    });

    if (filteredCountries.length === 0) {
      logger.warn(
        `No countries found for query: name="${name}", region="${region}", capital="${capital}", timezone="${timezone}"`
      );
      return res.status(404).json({
        status: 404,
        message: 'No countries found matching the search criteria',
      });
    }

    // Calculate pagination values
    const totalItems = filteredCountries.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Validate requested page number
    if (page > totalPages) {
      return res.status(400).json({
        status: 400,
        message: `Page ${page} does not exist. Total pages available: ${totalPages}`,
      });
    }

    // Slice the data array for pagination
    const paginatedData = filterDetails(filteredCountries.slice(skip, skip + limit));

    // Generate pagination URLs
    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
    const queryParams = new URLSearchParams(req.query as any);

    const createUrl = (pageNum: number): string => {
      queryParams.set('page', pageNum.toString());
      queryParams.set('limit', limit.toString());
      return `${baseUrl}?${queryParams.toString()}`;
    };

    // Prepare pagination metadata with URLs
    const paginationData: PaginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      links: {
        current: createUrl(page),
        next: page < totalPages ? createUrl(page + 1) : null,
        prev: page > 1 ? createUrl(page - 1) : null,
        first: createUrl(1),
        last: createUrl(totalPages),
      },
    };

    // Send the paginated response
    const response: PaginatedResponse = {
      status: 200,
      message: 'Country search results',
      data: paginatedData,
      pagination: paginationData,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    logger.error(`Error searching for countries: ${error.message}`);
    next(error); // Pass error to the Express error handler
  }
};

const filterDetails = (filteredData: any): CountryData[] => {
  const dataArray = Array.isArray(filteredData) ? filteredData : [filteredData];
  return dataArray.map((country: any) => ({
    name: country.name.common,
    population: country.population,
    flag: country.flags?.svg || country.flags?.png || null,
    region: country.region,
    languages: country.languages,
    code: country.cca2,
    capital: country.capital,
    currencies: Object.values(country.currencies || {}).map((currency: any) => ({
      name: currency.name,
      symbol: currency.symbol,
    })),
    timezones: country.timezones,
  }));
};
