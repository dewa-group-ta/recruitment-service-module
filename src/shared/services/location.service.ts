import { Injectable, Logger, Inject } from "@nestjs/common";
import {
  ILocationService,
  ILocationApiClient,
  LocationApiResponse,
  Province,
  City,
  District,
  SubDistrict,
  LocationSearchFilter,
  LOCATION_API_CLIENT
} from "../interface/location.interface";

/**
 * Location service implementation
 * Handles location data retrieval from external location API
 */
@Injectable()
export class LocationService implements ILocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @Inject(LOCATION_API_CLIENT)
    private readonly apiClient: ILocationApiClient
  ) {}

  /**
   * Get all provinces
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<Province[]>> List of provinces
   */
  async getProvinces(
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<Province[]>> {
    this.logger.debug("Fetching provinces", { filter });

    const params = this.buildSearchParams({
      ...filter,
      sort_by: "name",
      order: "ASC"
    });
    const response = await this.apiClient.get<LocationApiResponse<Province[]>>(
      "/provinces",
      params
    );

    this.logger.debug(
      `Successfully fetched ${response.data?.length || 0} provinces`
    );
    return response;
  }

  /**
   * Get province by ID
   * @param id Province ID
   * @returns Promise<LocationApiResponse<Province>> Province data
   */
  async getProvinceById(id: string): Promise<LocationApiResponse<Province>> {
    this.logger.debug("Fetching province by ID", { id });

    const response = await this.apiClient.get<LocationApiResponse<Province>>(
      `/provinces/${id}`
    );

    this.logger.debug("Successfully fetched province", { id });
    return response;
  }

  /**
   * Get cities by province ID
   * @param provinceId Province ID
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<City[]>> List of cities
   */
  async getCitiesByProvince(
    provinceId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<City[]>> {
    this.logger.debug("Fetching cities by province", { provinceId, filter });

    const params = this.buildSearchParams({
      ...filter,
      province_code: provinceId,
      sort_by: "name",
      order: "ASC"
    });
    const response = await this.apiClient.get<LocationApiResponse<City[]>>(
      `/cities`,
      params
    );

    this.logger.debug(
      `Successfully fetched ${response.data?.length || 0} cities for province ${provinceId}`
    );
    return response;
  }

  /**
   * Get city by ID
   * @param id City ID
   * @returns Promise<LocationApiResponse<City>> City data
   */
  async getCityById(id: string): Promise<LocationApiResponse<City>> {
    this.logger.debug("Fetching city by ID", { id });

    const response = await this.apiClient.get<LocationApiResponse<City>>(
      `/cities/${id}`
    );

    this.logger.debug("Successfully fetched city", { id });
    return response;
  }

  /**
   * Get districts by city ID
   * @param cityId City ID
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<District[]>> List of districts
   */
  async getDistrictsByCity(
    cityId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<District[]>> {
    this.logger.debug("Fetching districts by city", { cityId, filter });

    const params = this.buildSearchParams({
      ...filter,
      city_code: cityId,
      sort_by: "name",
      order: "ASC"
    });
    const response = await this.apiClient.get<LocationApiResponse<District[]>>(
      `/districts`,
      params
    );

    this.logger.debug(
      `Successfully fetched ${response.data?.length || 0} districts for city ${cityId}`
    );
    return response;
  }

  /**
   * Get district by ID
   * @param id District ID
   * @returns Promise<LocationApiResponse<District>> District data
   */
  async getDistrictById(id: string): Promise<LocationApiResponse<District>> {
    this.logger.debug("Fetching district by ID", { id });

    const response = await this.apiClient.get<LocationApiResponse<District>>(
      `/districts/${id}`
    );

    this.logger.debug("Successfully fetched district", { id });
    return response;
  }

  /**
   * Get sub-districts by district ID
   * @param districtId District ID
   * @param filter Search filter options
   * @returns Promise<LocationApiResponse<SubDistrict[]>> List of sub-districts
   */
  async getSubDistrictsByDistrict(
    districtId: string,
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<SubDistrict[]>> {
    this.logger.debug("Fetching sub-districts by district", {
      districtId,
      filter
    });

    const params = this.buildSearchParams({
      ...filter,
      district_code: districtId,
      sort_by: "name",
      order: "ASC"
    });
    const response = await this.apiClient.get<
      LocationApiResponse<SubDistrict[]>
    >(`/villages`, params);

    this.logger.debug(
      `Successfully fetched ${response.data?.length || 0} sub-districts for district ${districtId}`
    );
    return response;
  }

  /**
   * Get sub-district by ID
   * @param id Sub-district ID
   * @returns Promise<LocationApiResponse<SubDistrict>> Sub-district data
   */
  async getSubDistrictById(
    id: string
  ): Promise<LocationApiResponse<SubDistrict>> {
    this.logger.debug("Fetching sub-district by ID", { id });

    const response = await this.apiClient.get<LocationApiResponse<SubDistrict>>(
      `/sub-districts/${id}`
    );

    this.logger.debug("Successfully fetched sub-district", { id });
    return response;
  }

  /**
   * Search locations by query
   * @param query Search query
   * @param type Location type (province, city, district, sub-district)
   * @param filter Additional search filter options
   * @returns Promise<LocationApiResponse<any[]>> Search results
   */
  async searchLocations(
    query: string,
    type?: "province" | "city" | "district" | "sub-district",
    filter?: LocationSearchFilter
  ): Promise<LocationApiResponse<any[]>> {
    this.logger.debug("Searching locations", { query, type, filter });

    const searchParams = {
      ...this.buildSearchParams(filter),
      q: query,
      type: type || "all"
    };

    const response = await this.apiClient.get<LocationApiResponse<any[]>>(
      "/locations/search",
      searchParams
    );

    this.logger.debug(
      `Successfully found ${response.data?.length || 0} locations for query: ${query}`
    );
    return response;
  }

  /**
   * Build search parameters from filter
   * @param filter Search filter options
   * @returns Record<string, any> Query parameters
   * @private
   */
  private buildSearchParams(
    filter?: LocationSearchFilter
  ): Record<string, any> {
    if (!filter) return {};

    const params: Record<string, any> = {};

    if (filter.keyword) {
      params.keyword = filter.keyword;
    }

    if (filter.province_code) {
      params.province_code = filter.province_code;
    }

    if (filter.city_code) {
      params.city_code = filter.city_code;
    }

    if (filter.district_code) {
      params.district_code = filter.district_code;
    }

    if (filter.sub_district_code) {
      params.sub_district_code = filter.sub_district_code;
    }

    if (filter.page !== undefined) {
      params.page = filter.page;
    }

    if (filter.limit !== undefined) {
      params.limit = filter.limit;
    }

    if (filter.sort_by) {
      params.sort_by = filter.sort_by;
    }

    if (filter.order) {
      params.order = filter.order;
    }

    return params;
  }

  /**
   * Get location hierarchy (province -> city -> district -> sub-district)
   * @param subDistrictId Sub-district ID
   * @returns Promise<{province: Province, city: City, district: District, subDistrict: SubDistrict}> Complete location hierarchy
   */
  async getLocationHierarchy(subDistrictId: string): Promise<{
    province: Province;
    city: City;
    district: District;
    subDistrict: SubDistrict;
  }> {
    this.logger.debug("Fetching location hierarchy", { subDistrictId });

    // Get sub-district first
    const subDistrictResponse = await this.getSubDistrictById(subDistrictId);
    const subDistrict = subDistrictResponse.data;

    // Get district
    const districtResponse = await this.getDistrictById(subDistrict.districtId);
    const district = districtResponse.data;

    // Get city
    const cityResponse = await this.getCityById(district.cityId);
    const city = cityResponse.data;

    // Get province
    const provinceResponse = await this.getProvinceById(city.provinceId);
    const province = provinceResponse.data;

    this.logger.debug("Successfully fetched location hierarchy", {
      subDistrictId
    });

    return {
      province,
      city,
      district,
      subDistrict
    };
  }

  /**
   * Get all locations in a province (cities, districts, sub-districts)
   * @param provinceId Province ID
   * @returns Promise<{cities: City[], districts: District[], subDistricts: SubDistrict[]}> All locations in province
   */
  async getAllLocationsInProvince(provinceId: string): Promise<{
    cities: City[];
    districts: District[];
    subDistricts: SubDistrict[];
  }> {
    this.logger.debug("Fetching all locations in province", { provinceId });

    // Get all cities in province
    const citiesResponse = await this.getCitiesByProvince(provinceId, {
      limit: 1000
    });
    const cities = citiesResponse.data;

    // Get all districts for each city
    const districts: District[] = [];
    const subDistricts: SubDistrict[] = [];

    for (const city of cities) {
      const districtsResponse = await this.getDistrictsByCity(city.id, {
        limit: 1000
      });
      districts.push(...districtsResponse.data);

      // Get all sub-districts for each district
      for (const district of districtsResponse.data) {
        const subDistrictsResponse = await this.getSubDistrictsByDistrict(
          district.id,
          { limit: 1000 }
        );
        subDistricts.push(...subDistrictsResponse.data);
      }
    }

    this.logger.debug(
      `Successfully fetched all locations in province: ${cities.length} cities, ${districts.length} districts, ${subDistricts.length} sub-districts`,
      {
        provinceId
      }
    );

    return {
      cities,
      districts,
      subDistricts
    };
  }
}
