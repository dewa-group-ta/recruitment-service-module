import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpCode
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery
} from "@nestjs/swagger";
import { LocationService } from "../../../shared/services/location.service";
import { Public } from "../../../shared/decorators/public.decorator";
import { LocationSearchFilter } from "../../../shared/interface/location.interface";

/**
 * Location controller
 * Provides endpoints for location data retrieval
 */
@ApiTags("Locations")
@Controller("locations")
@Public()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * Get all provinces
   */
  @Get("provinces")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all provinces",
    description: "Retrieve all provinces with optional filtering"
  })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Provinces retrieved successfully"
  })
  async getProvinces(@Query() filter: LocationSearchFilter) {
    return this.locationService.getProvinces(filter);
  }

  /**
   * Get province by ID
   */
  @Get("provinces/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get province by ID",
    description: "Retrieve a specific province by its ID"
  })
  @ApiParam({ name: "id", description: "Province ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Province retrieved successfully"
  })
  async getProvinceById(@Param("id") id: string) {
    return this.locationService.getProvinceById(id);
  }

  /**
   * Get cities by province ID
   */
  @Get("provinces/:provinceId/cities")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get cities by province ID",
    description: "Retrieve all cities within a specific province"
  })
  @ApiParam({ name: "provinceId", description: "Province ID" })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cities retrieved successfully"
  })
  async getCitiesByProvince(
    @Param("provinceId") provinceId: string,
    @Query() filter: LocationSearchFilter
  ) {
    return this.locationService.getCitiesByProvince(provinceId, filter);
  }

  /**
   * Get city by ID
   */
  @Get("cities/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get city by ID",
    description: "Retrieve a specific city by its ID"
  })
  @ApiParam({ name: "id", description: "City ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "City retrieved successfully"
  })
  async getCityById(@Param("id") id: string) {
    return this.locationService.getCityById(id);
  }

  /**
   * Get districts by city ID
   */
  @Get("cities/:cityId/districts")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get districts by city ID",
    description: "Retrieve all districts within a specific city"
  })
  @ApiParam({ name: "cityId", description: "City ID" })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Districts retrieved successfully"
  })
  async getDistrictsByCity(
    @Param("cityId") cityId: string,
    @Query() filter: LocationSearchFilter
  ) {
    return this.locationService.getDistrictsByCity(cityId, filter);
  }

  /**
   * Get district by ID
   */
  @Get("districts/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get district by ID",
    description: "Retrieve a specific district by its ID"
  })
  @ApiParam({ name: "id", description: "District ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "District retrieved successfully"
  })
  async getDistrictById(@Param("id") id: string) {
    return this.locationService.getDistrictById(id);
  }

  /**
   * Get sub-districts by district ID
   */
  @Get("districts/:districtId/sub-districts")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get sub-districts by district ID",
    description: "Retrieve all sub-districts within a specific district"
  })
  @ApiParam({ name: "districtId", description: "District ID" })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sub-districts retrieved successfully"
  })
  async getSubDistrictsByDistrict(
    @Param("districtId") districtId: string,
    @Query() filter: LocationSearchFilter
  ) {
    return this.locationService.getSubDistrictsByDistrict(districtId, filter);
  }

  /**
   * Get sub-district by ID
   */
  @Get("sub-districts/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get sub-district by ID",
    description: "Retrieve a specific sub-district by its ID"
  })
  @ApiParam({ name: "id", description: "Sub-district ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sub-district retrieved successfully"
  })
  async getSubDistrictById(@Param("id") id: string) {
    return this.locationService.getSubDistrictById(id);
  }

  /**
   * Search locations
   */
  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Search locations",
    description: "Search for locations by query and type"
  })
  @ApiQuery({ name: "q", description: "Search query", required: true })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["province", "city", "district", "sub-district"],
    description: "Location type to search"
  })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Search results retrieved successfully"
  })
  async searchLocations(
    @Query("q") query: string,
    @Query("type") type?: "province" | "city" | "district" | "sub-district",
    @Query() filter?: LocationSearchFilter
  ) {
    return this.locationService.searchLocations(query, type, filter);
  }

  /**
   * Get location hierarchy
   */
  @Get("hierarchy/:subDistrictId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get location hierarchy",
    description: "Get complete location hierarchy from sub-district to province"
  })
  @ApiParam({ name: "subDistrictId", description: "Sub-district ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Location hierarchy retrieved successfully"
  })
  async getLocationHierarchy(@Param("subDistrictId") subDistrictId: string) {
    return this.locationService.getLocationHierarchy(subDistrictId);
  }

  /**
   * Get all locations in a province
   */
  @Get("provinces/:provinceId/all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all locations in province",
    description: "Get all cities, districts, and sub-districts in a province"
  })
  @ApiParam({ name: "provinceId", description: "Province ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "All locations in province retrieved successfully"
  })
  async getAllLocationsInProvince(@Param("provinceId") provinceId: string) {
    return this.locationService.getAllLocationsInProvince(provinceId);
  }
}
