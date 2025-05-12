import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/IApiResponse';
import { AppUser, AuthState } from '../types/IAppUser';
import { PackageInfo } from '../types/IPackageInfo';
import { PackageStatus } from '../types/IPackageStatus';
import { PackageAVLValidation } from '../types/IPackageAVLValidation';
import { PlantInfo } from '../types/IPlantInfo';
import { PackageHistory } from '../types/IPackageHistory';
import { PackageSplitFormValues } from '../types/IPackageSplitFormValues';

// Configuration constants

const apiUrl: string = import.meta.env.VITE_APP_API_URL;
const timeOut: number = import.meta.env.VITE_APP_TIMEOUT;

// External SAP API configuration
const sapUrl: string = import.meta.env.VITE_SAP_API_URL;

const API_CONFIG = {
    BASE_URL: apiUrl,
    SAP_URL: sapUrl,
    TIMEOUT: timeOut,
    HEADERS: {
        'Content-Type': 'application/json',
    },
};

// Centralized error handling
class ApiError extends Error {
    constructor(message: string, public readonly details?: string[]) {
        super(message);
        this.name = 'ApiError';
    }
}

const buildErrorMessage = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        const response = error.response?.data as { message?: string; errors?: string[] };
        const message = response?.message || error.message || 'Network error or server unavailable';
        const errors = Array.isArray(response?.errors) ? response.errors : undefined;
        return new ApiError(message, errors);
    }
    return new ApiError('Unexpected error occurred');
};

// API Service class
class ApiService {
    private readonly api: AxiosInstance;
    private readonly sapApi: AxiosInstance;

    constructor() {
        //Main API instance
        this.api = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: API_CONFIG.HEADERS,
        });

        // SAP API instance (no token, different URL)
        this.sapApi = axios.create({
            baseURL: API_CONFIG.SAP_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add response interceptors for main API
        this.api.interceptors.response.use(
            response => response,
            error => Promise.reject(buildErrorMessage(error))
        );

        // Add response interceptors for SAP API
        this.sapApi.interceptors.response.use(
            response => response,
            error => Promise.reject(buildErrorMessage(error))
        );

        const storedData = localStorage.getItem("QualifyApp");

        if (storedData) {
            try {
                const parsedData: AuthState = JSON.parse(storedData);
                this.setToken(parsedData.token);
            } catch (error) {
                console.error("Failed to parse QualifyApp from localStorage:", error);
                this.setToken(null); // Reset to null if parsing fails
            }
        }

    }

    public setToken(token: string | null) {
        if (token) {
            this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.api.defaults.headers.common['Authorization'];
        }
    }

    private async request<T>(fn: () => Promise<AxiosResponse<ApiResponse<T>>>): Promise<ApiResponse<T>> {
        try {
            const response = await fn();
            return response.data;
        } catch (error) {
            const apiError = error instanceof ApiError ? error : buildErrorMessage(error);
            return {
                succeeded: false,
                error: apiError.message,
                errorDetails: apiError.details,
            };
        }
    }

    async login(credentials: { appName: string, username: string; password: string }): Promise<ApiResponse<AuthState>> {
        return this.request(() => this.api.post('/Auth/Login', credentials));
    }

    async getAllUsers(appName: string): Promise<ApiResponse<AppUser[]>> {
        return this.request(() => this.api.get(`/Auth/All?AppName=${appName}`));
    }

    async ValidateAVLPackageInfo(packageId: string, data: Partial<PackageAVLValidation>): Promise<ApiResponse<PackageInfo>> {
        return this.request(() => this.api.post(`/PackageInfo/${packageId}/validate/AVL`, data));
    }

    async ValidatePackageInfo(packageId: string, data: Partial<PackageAVLValidation>): Promise<ApiResponse<PackageInfo>> {
        return this.request(() => this.api.post(`/PackageInfo/${packageId}/validate`, data));
    }

    async ValidatePackageInfoList(data: {}): Promise<ApiResponse<PackageInfo[]>> {
        return this.request(() => this.api.post(`/PackageInfo/validate/list`, data));
    }

    async getPackageHistory(packageId: string): Promise<ApiResponse<PackageHistory>> {
        return this.request(() => this.api.get(`/PackageInfo/${packageId}/history`));
    }

    async getPlants(): Promise<ApiResponse<PlantInfo[]>> {
        return this.request(() => this.api.get(`/PlantInfo`));
    }

    async getPackageInfo(packageId: string): Promise<ApiResponse<PackageInfo>> {
        return this.request(() => this.api.get(`/PackageInfo?PackageId=${packageId}`));
    }

    async updatePackageInfo(packageId: string, data: Partial<PackageInfo>): Promise<ApiResponse<PackageInfo>> {
        return this.request(() => this.api.put(`/PackageInfo/${packageId}`, data));
    }

    async splitPackageInfo(packageId: string, data: Partial<PackageSplitFormValues>): Promise<ApiResponse<PackageInfo[]>> {
        return this.request(() => this.api.post(`/PackageInfo/${packageId}/split`, data));
    }

    async addPackageStatus(data: Partial<PackageStatus>): Promise<ApiResponse<PackageStatus>> {
        return this.request(() => this.api.post('/PackageStatus', data));
    }

    async getPackageStatus(packageId: string): Promise<ApiResponse<PackageStatus[]>> {
        return this.request(() => this.api.get(`/PackageStatus?PackageId=${packageId}`));
    }

    async getSapMaterialVendors(planta: string, matfoxc: string, matvend: string): Promise<ApiResponse<string[]>> {
        const requestBody = {
            imports: {
                QUERY_TABLE: 'ZMXMM_AVL',
            },
            tables: {
                OPTIONS: [
                    { TEXT: `WERKS LIKE '${planta}'` },
                    { TEXT: ` AND MATFOXC LIKE '${matfoxc}'` },
                    { TEXT: ` AND MATVEND LIKE '${matvend}'` },
                    { TEXT: ` OR MATVEND LIKE '${matvend.substring(1)}'` }
                ],
                FIELDS: [
                    { FIELDNAME: 'MATVEND' }
                ],
            },
        };

        try {
            const response = await this.sapApi.post('/RFC_READ_TABLE', requestBody);
            const data = response.data;

            // Extract WA values from tables.DATA
            const materialVendors = data?.tables?.DATA?.map((item: { WA: string }) => item.WA) || [];

            return {
                succeeded: true,
                data: materialVendors,
            };
        } catch (error) {
            const apiError = error instanceof ApiError ? error : buildErrorMessage(error);
            return {
                succeeded: false,
                error: apiError.message,
                errorDetails: apiError.details,
            };
        }

    }
}

const apiService = new ApiService();
export default apiService;