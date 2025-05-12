import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormInstance, InputRef, message } from 'antd';
import { useIdleTimer } from 'react-idle-timer';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../../../providers/authContext';
import apiService from '../../../../services/apiService';
import { ApiResponse } from '../../../../types/IApiResponse';
import { AuthState } from '../../../../types/IAppUser';
import { PackageInfo } from '../../../../types/IPackageInfo';
import { PackageStatus } from '../../../../types/IPackageStatus';


interface PackageValidationState {
    open: boolean;
    packageData: PackageInfo | null | undefined;
    validationError: string | null;
    validationSuccess: string | null;
    loading: boolean;
    supervisorModalVisible: boolean;
    supervisorLoading: boolean;
}

export const usePackageValidation = (form: FormInstance, supervisorForm: FormInstance, status?: string, statusToSave?: string) => {
    const [state, setState] = useState<PackageValidationState>({
        open: false,
        packageData: null,
        validationError: null,
        validationSuccess: null,
        loading: false,
        supervisorModalVisible: false,
        supervisorLoading: false,
    });
    const { auth } = useAuth(); // auth can be AuthState | null
    const mfgPNInputRef = useRef<InputRef>(null);
    const packageInputRef = useRef<InputRef>(null);

    // Timer setup
    useEffect(() => {
        const interval = setInterval(() => {
            getRemainingTime();
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const onIdle = () => {
        if (!state.loading) {
            form.resetFields();
        }
    };

    const { getRemainingTime } = useIdleTimer({
        onIdle,
        timeout: 30_000,
        throttle: 500,
    });

    const validatePackage = useCallback(
        async (values: { packageId: string; manufacturerPartNumber: string }) => {
            if (!auth) {
                message.error('Please log in to validate packages');
                return;
            }

            setState(prev => ({ ...prev, loading: true, packageData: null, validationError: null, validationSuccess: null }));

            try {
                const processedMfgPN = values.manufacturerPartNumber.split(/ {3,}/)[0];

                const packageAVLValidationResponse = await apiService.ValidateAVLPackageInfo(values.packageId, {
                    packageId: values.packageId,
                    expectedStatus: status,
                    statusToSave: statusToSave,
                    station: status + ' PVP',
                    commercialPn: processedMfgPN,
                    processToSave: status + ' AVL Validation',
                });

                if (!packageAVLValidationResponse.succeeded || !packageAVLValidationResponse.data) {
                    throw new Error(packageAVLValidationResponse.error || 'Invalid Package ID');
                }

                setState(prev => ({
                    ...prev,
                    packageData: packageAVLValidationResponse.data,
                    validationSuccess: 'Package details validated successfully',
                }));
                message.success('Package details validated successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error during validation';
                setState(prev => ({ ...prev, validationError: errorMessage }));
                message.error(errorMessage);
            } finally {
                setState(prev => ({ ...prev, loading: false }));
                setTimeout(() => packageInputRef.current?.focus(), 10);
            }
        },
        [auth, status]
    );

    const handleSupervisorValidation = useCallback(
        async (values: { username: string; password: string }) => {
            if (!auth || !state.packageData) {
                message.error('Authentication required or no package data available');
                return;
            }

            setState(prev => ({ ...prev, supervisorLoading: true }));

            try {
                const credentials = { appName: 'PACKAGE VALIDATION', username: values.username, password: values.password };
                const supervisorResponse: ApiResponse<AuthState> = await apiService.login(credentials);

                if (!supervisorResponse.succeeded || !supervisorResponse.data) {
                    throw new Error(supervisorResponse.error || 'Invalid supervisor credentials');
                }

                const tokenData: any = jwtDecode(supervisorResponse.data.token);
                const roles: string[] = (tokenData.role || tokenData.roles).split(",");
                if (!roles.includes("SUPERVISOR")) {
                    throw new Error(supervisorResponse.error || 'Invalid supervisor permission');
                }

                const supervisorId = supervisorResponse.data.employeeId;
                const processedMfgPN = form.getFieldValue("manufacturerPartNumber").split(/ {3,}/)[0];

                const packageStatusBase: Partial<PackageStatus> = {
                    packageId: state.packageData.packageId,
                    partNumber: state.packageData.partNumber,
                    process: 'PVP Validation',
                    station: 'PVP Validation',
                    packageQty: state.packageData.updatedQty || 0,
                    employerId: supervisorId,
                    userDefined2: processedMfgPN,
                };

                const updatedPackage = {
                    ...state.packageData,
                    status: 'KIT',
                    modifiedUser: supervisorId,
                    station: 'PVP Validation',
                };

                const responsePkgUpdate = await apiService.updatePackageInfo(state.packageData.packageId, updatedPackage);
                if (!responsePkgUpdate.succeeded || !responsePkgUpdate.data) {
                    throw new Error(responsePkgUpdate.error || 'Failed to update package');
                }

                const responsePkgStatus = await apiService.addPackageStatus({
                    ...packageStatusBase,
                    passFailIndicator: 'P',
                });
                if (!responsePkgStatus.succeeded) throw new Error(responsePkgStatus.error);

                setState(prev => ({
                    ...prev,
                    packageData: responsePkgUpdate.data,
                    validationSuccess: 'Package validated successfully by supervisor',
                    supervisorModalVisible: false,
                }));
                message.success('Supervisor validation successful');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error during supervisor validation';
                setState(prev => ({ ...prev, validationError: errorMessage }));
                message.error(errorMessage);
            } finally {
                setState(prev => ({ ...prev, supervisorLoading: false }));
                supervisorForm.resetFields();
                setTimeout(() => packageInputRef.current?.focus(), 10);
            }
        },
        [auth, state.packageData, supervisorForm, form]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        setState(prev => ({ ...prev, packageData: null, validationError: null, validationSuccess: null }));
    }, [form]);

    const toggleSupervisorModal = useCallback((visible: boolean) => () => {
        setState(prev => ({ ...prev, supervisorModalVisible: visible }));
        if (!visible) {
            handleReset();
        }
    }, [handleReset]);

    const inputHandlers = useMemo(() => ({
        handleReset,
        handleFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
        handlePackageKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const errors = form.getFieldError('packageId');
                if (errors.length === 0) {
                    mfgPNInputRef.current?.focus();
                } else {
                    packageInputRef.current?.select();
                }
            }
        },
    }), [form, handleReset]);

    return {
        state,
        form,
        supervisorForm,
        validatePackage,
        handleSupervisorValidation,
        inputHandlers,
        toggleSupervisorModal,
        mfgPNInputRef,
        packageInputRef,
    };
};