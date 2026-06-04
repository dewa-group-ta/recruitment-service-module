/**
 * Location API configuration interface
 * Defines the structure for location API configuration
 */
export interface LocationApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Province interface
 * Defines the structure for province data from the location API
 */
export interface Province {
  id: string;
  name: string;
  code?: string;
  countryId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * City interface
 * Defines the structure for city data from the location API
 */
export interface City {
  id: string;
  name: string;
  code?: string;
  provinceId: string;
  province?: Province;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * District interface
 * Defines the structure for district data from the location API
 */
export interface District {
  id: string;
  name: string;
  code?: string;
  cityId: string;
  city?: City;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sub-district interface
 * Defines the structure for sub-district data from the location API
 */
export interface SubDistrict {
  id: string;
  name: string;
  code?: string;
  districtId: string;
  district?: District;
  postalCode?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Location search filter interface
 * Defines the structure for location search filters
 */
export interface LocationSearchFilter {
  keyword?: string;
  province_code?: string;
  city_code?: string;
  district_code?: string;
  sub_district_code?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: "ASC" | "DESC";
}

/**
 * Location API response interface
 * Defines the structure for location API responses
 */
export interface LocationApiResponse<T> {
  responseCode: number;
  responseDesc: string;
  data: T;
  page?: number;
  limit?: number;
  total_items?: number;
  total_pages?: number;
}

/**
 * Location service interface
 * Defines the contract for location services
 */
export interface ILocationService {
  /**
   * Get all provinces
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<Province[]>> List of provinces
   */
  getProvinces(
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<Province[]>>;

  /**
   * Get province by ID
   * @param id Province ID
   * @returns Promise<LocationApiResponse<Province>> Province data
   */
  getProvinceById(id: string): Promise<LocationApiResponse<Province>>;

  /**
   * Get cities by province ID
   * @param provinceId Province ID
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<City[]>> List of cities
   */
  getCitiesByProvince(
    provinceId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<City[]>>;

  /**
   * Get city by ID
   * @param id City ID
   * @returns Promise<LocationApiResponse<City>> City data
   */
  getCityById(id: string): Promise<LocationApiResponse<City>>;

  /**
   * Get districts by city ID
   * @param cityId City ID
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<District[]>> List of districts
   */
  getDistrictsByCity(
    cityId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<District[]>>;

  /**
   * Get district by ID
   * @param id District ID
   * @returns Promise<LocationApiResponse<District>> District data
   */
  getDistrictById(id: string): Promise<LocationApiResponse<District>>;

  /**
   * Get sub-districts by district ID
   * @param districtId District ID
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<SubDistrict[]>> List of sub-districts
   */
  getSubDistrictsByDistrict(
    districtId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<SubDistrict[]>>;

  /**
   * Get sub-district by ID
   * @param id Sub-district ID
   * @returns Promise<LocationApiResponse<SubDistrict>> Sub-district data
   */
  getSubDistrictById(id: string): Promise<LocationApiResponse<SubDistrict>>;

  /**
   * Search locations by query
   * @param query Search query
   * @param type Location type (province, city, district, sub-district)
   * @param filter Additional search filter options
   * @returns Promise<LocationApiResponse<any[]>> Search results
   */
  searchLocations(
    query: string,
    type?: "province" | "city" | "district" | "sub-district",
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<any[]>>;
}

/**
 * Location API client interface
 * Defines the contract for location API HTTP client
 */
export interface ILocationApiClient {
  /**
   * Make GET request to location API
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Promise<T> API response
   */
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;

  /**
   * Make POST request to location API
   * @param endpoint API endpoint
   * @param data Request data
   * @returns Promise<T> API response
   */
  post<T>(endpoint: string, data?: Record<string, any>): Promise<T>;
}

/**
 * Injection token for location API client
 */
export const LOCATION_API_CLIENT = "LOCATION_API_CLIENT";
