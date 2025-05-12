export interface ApiResponse<T> {
    succeeded: boolean;
    data?: T;
    error?: string;
    errorDetails?: string[];
}