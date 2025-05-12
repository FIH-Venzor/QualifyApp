import React, { useState, useCallback, useRef, useEffect } from 'react';
import './QualityEntry.scss';
import { Alert, Button, Card, Form, Input, Select, Space, Typography, Table, message, InputRef } from 'antd';
import { t } from 'i18next';
import { useAuth } from '../../../providers/authContext';
import apiService from '../../../services/apiService';
import { PlantInfo } from '../../../types/IPlantInfo';
import { PackageAVLValidation } from '../../../types/IPackageAVLValidation';

const { Title } = Typography;
const { Option } = Select;

export type QualityEntryProps = {
    status: string[];
    statusToSave: string;
};

const QualityEntry: React.FC<QualityEntryProps> = ({ status, statusToSave }) => {
    const [form] = Form.useForm();
    const packageInputRef = useRef<InputRef>(null);
    const { auth } = useAuth();
    const packagesRef = useRef<PackageAVLValidation[]>([]); // Referencia para rastrear packages
    const [state, setState] = useState<{
        plants: PlantInfo[] | undefined;
        selectedPlant: string | null;
        packages: PackageAVLValidation[];
        loading: boolean;
        validationError: string | null;
        validationSuccess: string | null;
    }>({
        plants: [],
        selectedPlant: null,
        packages: [],
        loading: false,
        validationError: null,
        validationSuccess: null,
    });

    // Sincronizar packagesRef con state.packages
    useEffect(() => {
        packagesRef.current = state.packages;
    }, [state.packages]);

    // Fetch plants on mount
    useEffect(() => {
        const fetchPlants = async () => {
            if (!auth) return;
            setState(prev => ({ ...prev, loading: true }));
            try {
                const response = await apiService.getPlants();
                if (response.succeeded && response.data) {
                    const sortedPlants = [...response.data].sort((a: any, b: any) =>
                        a.plantCode.localeCompare(b.plantCode)
                    );
                    setState(prev => ({
                        ...prev,
                        plants: sortedPlants,
                        loading: false,
                    }));
                } else {
                    throw new Error(response.error || t('qualityEntry.fetchPlantsError'));
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('qualityEntry.fetchPlantsError');
                setState(prev => ({
                    ...prev,
                    plants: prev.plants,
                    validationError: errorMessage,
                    loading: false,
                }));
                message.error(errorMessage);
            }
        };
        fetchPlants();
    }, [auth]);

    // Handle plant selection
    const handlePlantChange = (value: string) => {
        setState(prev => ({
            ...prev,
            selectedPlant: value,
            packages: [],
            validationError: null,
            validationSuccess: null,
        }));
        form.resetFields(['packageId']);
    };

    // Validate and add package
    const handlePackageSubmit = useCallback(async (values: { packageId: string }) => {
        if (!auth || !state.selectedPlant) {
            message.error(t('qualityEntry.selectPlantFirst'));
            return;
        }

        setState(prev => ({ ...prev, loading: true, validationError: null, validationSuccess: null }));

        try {

            if (packagesRef.current.some(pkg => pkg.packageId === values.packageId)) {
                throw new Error(t('qualityEntry.duplicatePackage', { packageId: values.packageId }));
            }

            const response = await apiService.getPackageInfo(values.packageId);
            if (!response.succeeded || !response.data) {
                throw new Error(response.error || t('qualityEntry.invalidPackage'));
            }

            const packageData = response.data;
            if (packageData.plantCode !== state.selectedPlant) {
                const selectedPlantName = state.plants?.find(p => p.plantCode === state.selectedPlant)?.name || state.selectedPlant;
                throw new Error(t('qualityEntry.wrongPlant', { packageId: values.packageId, plant: selectedPlantName }));
            }
            
            if (!status.includes(packageData.status)) {
                throw new Error(t('qualityEntry.wrongStatus', { packageId: values.packageId, status: packageData.status }));
            }

            setState(prev => ({
                ...prev,
                packages: [...prev.packages, {
                    packageId: packageData.packageId,
                    expectedStatus: packageData.status,
                    statusToSave: statusToSave,
                    station: 'QualityEntry',
                    commercialPn: packageData.commercialPn || '',
                    processToSave: 'QInsp In',
                }],
                validationSuccess: t('qualityEntry.packageAdded', { packageId: values.packageId }),
            }));

            message.success(t('qualityEntry.packageAdded', { packageId: values.packageId }));
            form.resetFields(['packageId']);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('qualityEntry.validationError');
            setState(prev => ({ ...prev, validationError: errorMessage }));
            message.error(errorMessage);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
            setTimeout(() => packageInputRef.current?.focus(), 10);
        }
    }, [auth, state.selectedPlant, state.plants, form]);

    // Submit all packages to quality area
    const handleFinalSubmit = useCallback(async () => {
        if (!auth || !state.packages.length) {
            message.error(t('qualityEntry.noPackagesToSubmit'));
            return;
        }

        setState(prev => ({ ...prev, loading: true, validationError: null, validationSuccess: null }));

        try {
            const packageValidationResponse = await apiService.ValidatePackageInfoList({ packages: state.packages });

            if (!packageValidationResponse.succeeded) {
                throw new Error(packageValidationResponse.error || t('qualityEntry.submitError'));
            }

            setState(prev => ({
                ...prev,
                packages: [],
                validationSuccess: t('qualityEntry.submitSuccess', { count: state.packages.length }),
            }));

            message.success(t('qualityEntry.submitSuccess', { count: state.packages.length }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('qualityEntry.submitError');
            setState(prev => ({ ...prev, validationError: errorMessage }));
            message.error(errorMessage);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [auth, state.packages, state.selectedPlant]);

    const handleReset = () => {
        form.resetFields(['packageId']);
        setState(prev => ({ ...prev, validationError: null, validationSuccess: null, packages:[] }));
    };

    // Table columns definition
    const columns = [
        {
            title: t('qualityEntry.packageIdLabel'),
            dataIndex: 'packageId',
            key: 'packageId',
        },
        {
            title: t('qualityEntry.partNumberLabel'),
            dataIndex: 'partNumber',
            key: 'partNumber',
        },
        {
            title: t('qualityEntry.quantityLabel'),
            dataIndex: 'updatedQty',
            key: 'quantity',
            render: (qty: number) => qty || 0,
        },
    ];

    return (
        <div className="quality-entry">
            <Title level={3} className="pt-0 mt-0">{statusToSave + ' - ' + t('menu.quality.entry')}</Title>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Select
                    placeholder={t('qualityEntry.selectPlantPlaceholder')}
                    onChange={handlePlantChange}
                    style={{ width: 200 }}
                    disabled={state.packages.length > 0}
                    value={state.selectedPlant}
                    loading={state.loading}
                >
                    {state.plants?.map(plant => (
                        <Option key={plant.plantCode} value={plant.plantCode}>{plant.plantCode}</Option>
                    ))}
                </Select>

                <Form form={form} layout="vertical" onFinish={handlePackageSubmit} disabled={!state.selectedPlant || state.loading}>
                    <Form.Item
                        label={t('qualityEntry.packageIdLabel')}
                        name="packageId"
                        rules={[
                            { required: true, message: t('qualityEntry.packageIdRequired') },
                            { pattern: /^\d{11}$/, message: t('qualityEntry.packageIdInvalid') },
                        ]}
                    >
                        <Input
                            ref={packageInputRef}
                            autoFocus
                            autoComplete="off"
                            placeholder={t('qualityEntry.packageIdPlaceholder')}
                            onFocus={(e) => e.target.select()}
                        />
                    </Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={state.loading}>
                            {t('qualityEntry.addPackageButton')}
                        </Button>
                        <Button onClick={handleReset} disabled={state.loading}>
                            {t('qualityEntry.resetButton')}
                        </Button>
                    </Space>
                </Form>

                {(state.validationError || state.validationSuccess || state.packages.length > 0) && (
                    <Card style={{ marginTop: 24 }} loading={state.loading}>
                        {(state.validationError || state.validationSuccess) && (
                            <Alert
                                message={t('qualityEntry.validationMessageTitle')}
                                description={state.validationSuccess || state.validationError}
                                type={state.validationSuccess ? 'success' : 'error'}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        {state.packages.length > 0 && (
                            <>
                                <Typography.Text>
                                    {t('qualityEntry.packagesCount', { count: state.packages.length })}
                                </Typography.Text>
                                <Table
                                    dataSource={state.packages}
                                    columns={columns}
                                    rowKey="packageId"
                                    pagination={false}
                                    size="small"
                                    style={{ marginTop: 16, marginBottom: 16 }}
                                />
                                <Button
                                    type="primary"
                                    onClick={handleFinalSubmit}
                                    loading={state.loading}
                                    style={{ marginTop: 16 }}
                                >
                                    {t('qualityEntry.submitAllButton')}
                                </Button>
                            </>
                        )}
                    </Card>
                )}
            </Space>
        </div>
    );
};

QualityEntry.displayName = 'QualityEntry';

export default React.memo(QualityEntry);