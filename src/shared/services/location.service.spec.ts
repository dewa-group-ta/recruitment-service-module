import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { LocationService } from "./location.service";
import { LOCATION_API_CLIENT } from "../interface/location.interface";
import { LocationSearchFilter } from "../interface/location.interface";

describe("LocationService", () => {
  let service: LocationService;
  let apiClient: jest.Mocked<any>;

  const mockProvince = {
    id: "province-1",
    name: "DKI Jakarta",
    code: "JK"
  };

  const mockCity = {
    id: "city-1",
    name: "Jakarta Selatan",
    code: "JKS",
    provinceId: "province-1"
  };

  const mockDistrict = {
    id: "district-1",
    name: "Kebayoran Baru",
    code: "KBB",
    cityId: "city-1"
  };

  const mockSubDistrict = {
    id: "subdistrict-1",
    name: "Kramat Pela",
    code: "KMP",
    districtId: "district-1"
  };

  const mockApiResponse = {
    data: [mockProvince],
    success: true,
    message: "Success",
    total: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: LOCATION_API_CLIENT,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<LocationService>(LocationService);
    apiClient = module.get(LOCATION_API_CLIENT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProvinces", () => {
    it("should return provinces successfully", async () => {
      apiClient.get.mockResolvedValue(mockApiResponse);

      const result = await service.getProvinces();

      expect(apiClient.get).toHaveBeenCalledWith("/api/provinces", {});
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("DKI Jakarta");
    });

    it("should return provinces with search filter", async () => {
      const filter: LocationSearchFilter = {
        search: "jakarta",
        limit: 10,
        offset: 0
      };
      apiClient.get.mockResolvedValue(mockApiResponse);

      const result = await service.getProvinces(filter);

      expect(apiClient.get).toHaveBeenCalledWith("/api/provinces", {
        search: "jakarta",
        limit: 10,
        offset: 0
      });
      expect(result).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      await expect(service.getProvinces()).rejects.toThrow("API Error");
    });
  });

  describe("getProvinceById", () => {
    it("should return province by ID successfully", async () => {
      const singleProvinceResponse = {
        data: mockProvince,
        success: true,
        message: "Success"
      };
      apiClient.get.mockResolvedValue(singleProvinceResponse);

      const result = await service.getProvinceById("province-1");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/provinces/province-1",
        {}
      );
      expect(result).toBeDefined();
      expect(result.data.name).toBe("DKI Jakarta");
    });

    it("should handle province not found", async () => {
      const notFoundResponse = {
        data: null,
        success: false,
        message: "Province not found"
      };
      apiClient.get.mockResolvedValue(notFoundResponse);

      const result = await service.getProvinceById("nonexistent-id");

      expect(result.data).toBeNull();
      expect(result.success).toBe(false);
    });
  });

  describe("getCities", () => {
    it("should return cities successfully", async () => {
      const citiesResponse = {
        data: [mockCity],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(citiesResponse);

      const result = await service.getCities();

      expect(apiClient.get).toHaveBeenCalledWith("/api/cities", {});
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Jakarta Selatan");
    });

    it("should return cities by province ID", async () => {
      const citiesResponse = {
        data: [mockCity],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(citiesResponse);

      const result = await service.getCities("province-1");

      expect(apiClient.get).toHaveBeenCalledWith("/api/cities", {
        provinceId: "province-1"
      });
      expect(result).toBeDefined();
    });

    it("should return cities with search filter", async () => {
      const filter: LocationSearchFilter = {
        search: "jakarta",
        limit: 5
      };
      const citiesResponse = {
        data: [mockCity],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(citiesResponse);

      const result = await service.getCities("province-1", filter);

      expect(apiClient.get).toHaveBeenCalledWith("/api/cities", {
        provinceId: "province-1",
        search: "jakarta",
        limit: 5
      });
      expect(result).toBeDefined();
    });
  });

  describe("getCityById", () => {
    it("should return city by ID successfully", async () => {
      const singleCityResponse = {
        data: mockCity,
        success: true,
        message: "Success"
      };
      apiClient.get.mockResolvedValue(singleCityResponse);

      const result = await service.getCityById("city-1");

      expect(apiClient.get).toHaveBeenCalledWith("/api/cities/city-1", {});
      expect(result).toBeDefined();
      expect(result.data.name).toBe("Jakarta Selatan");
    });
  });

  describe("getDistricts", () => {
    it("should return districts successfully", async () => {
      const districtsResponse = {
        data: [mockDistrict],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(districtsResponse);

      const result = await service.getDistricts();

      expect(apiClient.get).toHaveBeenCalledWith("/api/districts", {});
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Kebayoran Baru");
    });

    it("should return districts by city ID", async () => {
      const districtsResponse = {
        data: [mockDistrict],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(districtsResponse);

      const result = await service.getDistricts("city-1");

      expect(apiClient.get).toHaveBeenCalledWith("/api/districts", {
        cityId: "city-1"
      });
      expect(result).toBeDefined();
    });
  });

  describe("getDistrictById", () => {
    it("should return district by ID successfully", async () => {
      const singleDistrictResponse = {
        data: mockDistrict,
        success: true,
        message: "Success"
      };
      apiClient.get.mockResolvedValue(singleDistrictResponse);

      const result = await service.getDistrictById("district-1");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/districts/district-1",
        {}
      );
      expect(result).toBeDefined();
      expect(result.data.name).toBe("Kebayoran Baru");
    });
  });

  describe("getSubDistricts", () => {
    it("should return sub-districts successfully", async () => {
      const subDistrictsResponse = {
        data: [mockSubDistrict],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(subDistrictsResponse);

      const result = await service.getSubDistricts();

      expect(apiClient.get).toHaveBeenCalledWith("/api/subdistricts", {});
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Kramat Pela");
    });

    it("should return sub-districts by district ID", async () => {
      const subDistrictsResponse = {
        data: [mockSubDistrict],
        success: true,
        message: "Success",
        total: 1
      };
      apiClient.get.mockResolvedValue(subDistrictsResponse);

      const result = await service.getSubDistricts("district-1");

      expect(apiClient.get).toHaveBeenCalledWith("/api/subdistricts", {
        districtId: "district-1"
      });
      expect(result).toBeDefined();
    });
  });

  describe("getSubDistrictById", () => {
    it("should return sub-district by ID successfully", async () => {
      const singleSubDistrictResponse = {
        data: mockSubDistrict,
        success: true,
        message: "Success"
      };
      apiClient.get.mockResolvedValue(singleSubDistrictResponse);

      const result = await service.getSubDistrictById("subdistrict-1");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/subdistricts/subdistrict-1",
        {}
      );
      expect(result).toBeDefined();
      expect(result.data.name).toBe("Kramat Pela");
    });
  });

  describe("buildSearchParams", () => {
    it("should build search params correctly", () => {
      const filter: LocationSearchFilter = {
        search: "jakarta",
        limit: 10,
        offset: 0
      };

      const params = (service as any).buildSearchParams(filter);

      expect(params).toEqual({
        search: "jakarta",
        limit: 10,
        offset: 0
      });
    });

    it("should return empty object when no filter provided", () => {
      const params = (service as any).buildSearchParams();

      expect(params).toEqual({});
    });

    it("should handle partial filter", () => {
      const filter: LocationSearchFilter = {
        search: "jakarta"
      };

      const params = (service as any).buildSearchParams(filter);

      expect(params).toEqual({
        search: "jakarta"
      });
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      apiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(service.getProvinces()).rejects.toThrow("Network error");
    });

    it("should handle API timeout", async () => {
      apiClient.get.mockRejectedValue(new Error("Request timeout"));

      await expect(service.getProvinces()).rejects.toThrow("Request timeout");
    });

    it("should handle invalid response format", async () => {
      apiClient.get.mockResolvedValue({ invalid: "response" });

      const result = await service.getProvinces();

      expect(result).toBeDefined();
      expect(result.invalid).toBe("response");
    });
  });
});
