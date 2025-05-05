export interface Currency {
  name: string;
  symbol: string;
}

export interface CountryData {
  name: string;
  population: number;
  flag: string | null;
  region: string;
  currencies: Currency[];
  timezones: string[];
}

export interface ApiResponse {
  status: number;
  message: string;
  data?: CountryData | CountryData[]; // Made optional and union type to handle both single and multiple countries
}
