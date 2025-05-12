import React, { useRef, useState } from 'react';
import { Card, Table, Typography, Descriptions, Spin, message, Form, Input, Button, Space, InputRef } from 'antd';
import { useTranslation } from 'react-i18next';
import { PackageInfo } from '../../../types/IPackageInfo';
import { PackageStatus } from '../../../types/IPackageStatus';
import apiService from '../../../services/apiService';

const { Title } = Typography;

const PackageReport: React.FC = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const packageInputRef = useRef<InputRef>(null);
    const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
    const [packageStatuses, setPackageStatuses] = useState<PackageStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchedPackageId, setSearchedPackageId] = useState<string | null>(null);

    // Función para buscar los datos del paquete
    const fetchPackageData = async (packageId: string) => {
        setLoading(true);
        try {
            const response = await apiService.getPackageHistory(packageId);

            if (!response.succeeded || !response.data) {
                throw new Error(t('packageReport.fetchPackageError', { packageId }));
            }

            // Ordenar packageStatuses por modifiedDate de más reciente a más antiguo
            const sortedStatuses = [...response.data.packageStatuses].sort((a, b) =>
                new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime()
            );

            setPackageInfo(response.data.packageInfo);
            setPackageStatuses(sortedStatuses);
            setSearchedPackageId(packageId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('packageReport.genericError');
            message.error(errorMessage);
            setPackageInfo(null);
            setPackageStatuses([]);
            setSearchedPackageId(null);
        } finally {
            setLoading(false);
            setTimeout(() => packageInputRef.current?.focus(), 10);
        }
    };

    // Manejar el envío del formulario
    const handleSearch = (values: { packageId: string }) => {
        fetchPackageData(values.packageId);
    };

    // Columnas para la tabla de PackageStatus
    const statusColumns = [
        { title: t('packageReport.process'), dataIndex: 'process', key: 'process' },
        {
            title: t('packageReport.status'),
            dataIndex: 'passFailIndicator',
            key: 'passFailIndicator',
            render: (value: string) => (value === 'P' ? 'Pass' : 'Fail')
        },
        {
            title: t('packageReport.modifiedDate'),
            dataIndex: 'modifiedDate',
            key: 'modifiedDate',
            render: (date: string) => new Date(date).toLocaleString()
        },
        { title: t('packageReport.station'), dataIndex: 'station', key: 'station' },
        { title: t('packageReport.line'), dataIndex: 'line', key: 'line' },
        { title: t('packageReport.program'), dataIndex: 'program', key: 'program' },
        { title: t('packageReport.packageQty'), dataIndex: 'packageQty', key: 'packageQty' },
        { title: t('packageReport.employerId'), dataIndex: 'employerId', key: 'employerId' },
    ];

    return (
        <div className="package-report" style={{ padding: '16px' }}>
            <Title level={3}>{t('packageReport.title', { packageId: searchedPackageId || '' })}</Title>

            {/* Formulario para consultar el packageId */}
            <Card style={{ marginBottom: '24px' }}>
                <Form
                    form={form}
                    layout="inline"
                    onFinish={handleSearch}
                    disabled={loading}
                >
                    <Form.Item
                        name="packageId"
                        label={t('packageReport.packageId')}
                        rules={[
                            { required: true, message: t('packageReport.packageIdRequired') },
                            { pattern: /^\d{11}$/, message: t('packageReport.packageIdInvalid') },
                        ]}
                    >
                        <Input
                            ref={packageInputRef}
                            autoFocus
                            placeholder={t('packageReport.packageIdPlaceholder')}
                            autoComplete="off"
                            onFocus={(e) => e.target.select()}
                            style={{ width: 200 }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {t('packageReport.searchButton')}
                            </Button>
                            <Button onClick={() => form.resetFields()} disabled={loading}>
                                {t('packageReport.resetButton')}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* Resultado del reporte */}
            {loading ? (
                <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />
            ) : packageInfo && searchedPackageId ? (
                <>
                    {/* Información General del Paquete */}
                    <Card title={t('packageReport.generalInfo')} style={{ marginBottom: '24px' }}>
                        <Descriptions bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} size="small">
                            <Descriptions.Item label={t('packageReport.packageId')}>
                                {packageInfo.packageId}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.partNumber')}>
                                {packageInfo.partNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.lotCode')}>
                                {packageInfo.lotCode}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.vendorCode')}>
                                {packageInfo.vendorCode}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.locator')}>
                                {packageInfo.locator}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.status')}>
                                {packageInfo.status}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.plantCode')}>
                                {packageInfo.plantCode}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.updatedQty')}>
                                {packageInfo.updatedQty}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.modifiedDate')}>
                                {new Date(packageInfo.modifiedDate).toLocaleString()}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.modifiedUser')}>
                                {packageInfo.modifiedUser}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.expirationDate')}>
                                {new Date(packageInfo.expirationDate).toLocaleDateString()}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.mfgDate')}>
                                {packageInfo.mfgDate ? new Date(packageInfo.mfgDate).toLocaleDateString() : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.orderNumber')}>
                                {packageInfo.orderNumber || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageReport.commercialPn')}>
                                {packageInfo.commercialPn || 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Historial de Estados */}
                    <Card title={t('packageReport.statusHistory')}>
                        <Table
                            dataSource={packageStatuses}
                            columns={statusColumns}
                            rowKey={(record) => `${record.packageId}-${record.modifiedDate}`}
                            pagination={false} // Paginación desactivada
                            size="small"
                        />
                    </Card>
                </>
            ) : searchedPackageId ? (
                <p>{t('packageReport.noData', { packageId: searchedPackageId })}</p>
            ) : null}
        </div>
    );
};

PackageReport.displayName = 'PackageReport';

export default React.memo(PackageReport);