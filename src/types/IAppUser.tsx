export interface AppUser {
    username: string;
    isActive: boolean;
    created: string;
    roles: AppUserRole[]; // Added roles array
}

export interface AppRole {
    roleName: string;
    description: string;
}

export interface AppUserRole {
    roleName: string;
    appName: string;
    assignedDate: string;
}

export interface AuthState {
    employeeId: string;
    name: string;
    username: string;
    email: string;
    isAuthenticated: boolean;
    token: string;
    roles: string[];
}