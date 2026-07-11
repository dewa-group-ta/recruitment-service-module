export interface LocationApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface Province {
  id: string;
  name: string;
  code?: string;
  countryId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface LocationApiResponse<T> {
  responseCode: number;
  responseDesc: string;
  data: T;
  page?: number;
  limit?: number;
  total_items?: number;
  total_pages?: number;
}

export interface ILocationService {
  getProvinces(
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<Province[]>>;

  getProvinceById(id: string): Promise<LocationApiResponse<Province>>;

  getCitiesByProvince(
    provinceId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<City[]>>;

  getCityById(id: string): Promise<LocationApiResponse<City>>;

  getDistrictsByCity(
    cityId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<District[]>>;

  getDistrictById(id: string): Promise<LocationApiResponse<District>>;

  getSubDistrictsByDistrict(
    districtId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<SubDistrict[]>>;

  getSubDistrictById(id: string): Promise<LocationApiResponse<SubDistrict>>;

  searchLocations(
    query: string,
    type?: "province" | "city" | "district" | "sub-district",
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<any[]>>;
}

export interface ILocationApiClient {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;

  post<T>(endpoint: string, data?: Record<string, any>): Promise<T>;
}

export const LOCATION_API_CLIENT = "LOCATION_API_CLIENT";
