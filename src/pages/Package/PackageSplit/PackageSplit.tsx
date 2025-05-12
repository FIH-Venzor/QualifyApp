import React, { useState, useEffect } from 'react';
import './PackageSplit.scss';
import { Button, Col, Form, Input, InputNumber, message, Modal, Popconfirm, Row, Table, Typography } from 'antd';
import { t } from 'i18next';
import { XCircle, Save, Printer, Search, Box, User } from 'react-feather';
import { PackageSplitFormValues } from '../../../types/IPackageSplitFormValues';
import apiService from '../../../services/apiService';
import { PackageInfo } from '../../../types/IPackageInfo';
import { useAuth } from '../../../providers/authContext';
import PrintButton from '../../../components/PrintButton';

const { Title, Text } = Typography;
const ALLOW_PROCESS = ['KIT-IN', 'PVP Validation'];
const ALLOW_STATUS = ['KIT'];
const PROCESS_TO_SAVE = 'QA SPLIT';
const STATUS_TO_SAVE = 'QAS'
const STATION_TO_SAVE = 'QA SPLIT';

// Define the columns for the Ant Design Table
const columns = [
    {
        title: 'Package ID',
        dataIndex: 'packageId',
        key: 'packageId',
    },
    {
        title: 'Part Number',
        dataIndex: 'partNumber',
        key: 'partNumber',
    },
    {
        title: 'Lot Code',
        dataIndex: 'lotCode',
        key: 'lotCode',
    },
    {
        title: 'Vendor Code',
        dataIndex: 'vendorCode',
        key: 'vendorCode',
    },
    {
        title: 'Initial Qty',
        dataIndex: 'initialQty',
        key: 'initialQty',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
    },
    // Add more columns as needed based on the 'data' structure
];


export type PackageSplitProps = {};

const PackageSplit: React.FC<PackageSplitProps> = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<PackageSplitFormValues>();
    const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
    const [modal, contextHolder] = Modal.useModal();
    const { auth } = useAuth();
    const [numPackages, setNumPackages] = useState<number | undefined>(undefined);
    const [quantityPerPackage, setQuantityPerPackage] = useState<number | undefined>(undefined);
    const [totalToSplit, setTotalToSplit] = useState(0);
    const [splitResultData, setSplitResultData] = useState<any[]>([]); // State to hold the API response data
    
    const validatePackageInput = async (packageId: string) => {
        console.log('validatePackageInput:', packageId);
        setPackageInfo(null);
        setLoading(true);
        message.open({
            type: 'loading',
            content: 'Validating package...',
            duration: 0,
        });
        try {
            const response = await apiService.getPackageHistory(packageId);
            if (!response.succeeded || !response.data) {
                throw new Error(response?.error || `Error validating package ID: ${packageId}`);
            }
            const data = response.data.packageInfo;
            const lastHistory = response.data.packageStatuses.pop();

            if (!ALLOW_STATUS.includes(data?.status?.toUpperCase())) {
                throw new Error(`Package status is "${data?.status}". Only packages in "${ALLOW_STATUS.toString()}" status can be split.`);
            }

            if (!ALLOW_PROCESS.includes(lastHistory?.process || '')) {
                throw new Error(`Package last process is "${lastHistory?.process}". Only packages with "${ALLOW_PROCESS.toString()}" process can be split.`);
            }

            if (data?.updatedQty <= 0) {
                throw new Error(`Package available quantity is "${data?.updatedQty}". Only packages with  available quantity can be split.`);
            }

            message.destroy();
            message.success(`Package with ID ${packageId} validated successfully. Status: ${data.status}`);
            setPackageInfo(data);
            form.setFieldsValue({ updatedQty: data?.updatedQty });
            setNumPackages(undefined);
            setQuantityPerPackage(undefined);
        } catch (error: any) {
            message.destroy();
            const errorMessage = `${error.message}`;
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const validatePackageSplit = async (values: PackageSplitFormValues) => {
        console.log('validatePackageSplit:', values);
        try {
            setLoading(true);
           // values.expectedStatus = STATUS_TO_SAVE;
            values.processToSave = PROCESS_TO_SAVE;
            values.station = STATION_TO_SAVE;
            const total = (values.numberOfPackages || 0) * (values.quantityPerPackage || 0);
            if (total > (values.updatedQty || 0)) {
                throw new Error(`The requested quantity is greater than the available quantity.`);
            }

            if (total < (values.updatedQty || 0)) {
                modal.confirm({
                    title: 'Confirm',
                    content: 'The total quantity to split is less than the available quantity. Do you want to proceed?',
                    okText: 'Yes',
                    cancelText: 'No',
                    async onOk() {
                        console.log('Ok - Proceeding with split');
                        const response = await apiService.splitPackageInfo(values.packageId || '', values);
                        console.log('Split API Response:', response);
                        if (response.succeeded && response.data) {
                            setSplitResultData(response.data);
                            message.success(response.error || 'Packages split successfully.');
                        } else {
                            message.error(response.error || 'Failed to split packages.');
                        }
                    },
                });
            } else {
                console.log('Proceeding with split (total matches available)');
                const response = await apiService.splitPackageInfo(values.packageId || '', values);
                console.log('Split API Response:', response);
                if (response.succeeded && response.data) {
                    setSplitResultData(response.data);
                    message.success(response.error || 'Packages split successfully.');
                } else {
                    message.error(response.error || 'Failed to split packages.');
                }
            }
        } catch (error: any) {
            message.destroy();
            const errorMessage = `${error.message}`;
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchPackage = () => {
        form.validateFields(['packageId'])
            .then((values) => {
                if (values.packageId) {
                    console.log('Validate package');
                    validatePackageInput(values.packageId);
                }
            })
            .catch(() => { });
    };

    const onFinish = async (values: PackageSplitFormValues) => {
        validatePackageSplit(values);
        console.log('Success:', values);
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    
    

    const handleCancel = () => {
        console.log('Cancel button clicked');
        setPackageInfo(null);
        form.resetFields();
        setNumPackages(undefined);
        setQuantityPerPackage(undefined);
    };

    const handleNumPackagesChange = (value: number | null) => {
        setNumPackages(value || 0);
    };

    const handleQuantityPerPackageChange = (value: number | null) => {
        setQuantityPerPackage(value || 0);
    };

    useEffect(() => {
        const total = (numPackages || 0) * (quantityPerPackage || 0);
        setTotalToSplit(total);
    }, [numPackages, quantityPerPackage]);

    const handleKeyPress = (event:any) => {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode < 48 || charCode > 57) {
            event.preventDefault();
        }
    };

    const printModel = {
        data: 'Contenido de prueba para imprimir',
        mimeType: 'application/octet-stream',
        settings: { destination: '' },
    };

    return (
        <div className={`package-split`}>
           <Title level={3} className="pt-0 mt-0">{t('menu.package.Split')} {t('menu.package.title')}</Title>
            <Form<PackageSplitFormValues>
                form={form}
                name="searchForm"
                layout="vertical"
                autoComplete="off"
                initialValues={{ packageId: '00008711270' }}
                disabled={loading}
            >
                <Row gutter={16}>
                    <Col span={12}>
                <Form.Item
                    label="Package ID"
                    name="packageId"
                    rules={[
                        { required: true, message: t('qualityEntry.packageIdRequired') },
                        { pattern: /^\d{11}$/, message: t('qualityEntry.packageIdInvalid') },
                    ]}
                >
                    <Input.Search
                        placeholder="Enter a package id"
                        enterButton
                        onSearch={handleSearchPackage}
                        loading={loading}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        disabled={packageInfo !== null || loading}
                        style={{ color: 'rgba(0, 0, 0, 0.88)' }}
                    />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            {packageInfo && (
                <Form<PackageSplitFormValues>
                    form={form}
                    name="splitForm"
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    initialValues={{
                        packageId: form.getFieldValue('packageId'),
                        partNumber: packageInfo?.partNumber,
                        updatedQty: packageInfo?.updatedQty,
                        employeeId: auth?.employeeId,
                        numberOfPackages: undefined,
                        quantityPerPackage: undefined,
                        expectedStatus: packageInfo.status,
                    }}
                >
                    <Form.Item name="packageId" style={{ display: 'none' }}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="employeeId" style={{ display: 'none' }}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="expectedStatus" style={{ display: 'none' }}>
                        <Input />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="partNumber" label="Part Number">
                                <Input disabled style={{ color: 'rgba(0, 0, 0, 0.88)' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="updatedQty" label="Available Quantity">
                                <Input disabled style={{ color: 'rgba(0, 0, 0, 0.88)' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                    <Form.Item
                        label="Number of Packages to Create"
                        name="numberOfPackages"
                        rules={[
                            { required: true, message: 'Please enter the number of packages.' },
                            { type: 'number', min: 1, message: 'Must be at least 1 package.' },
                        ]}
                    >
                                <InputNumber min={1} style={{ width: '100%' }} onChange={handleNumPackagesChange} onFocus={(e) => e.target.select()} onKeyPress={handleKeyPress} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                    <Form.Item
                        label="Quantity per New Package"
                        name="quantityPerPackage"
                        rules={[
                            { required: true, message: 'Please enter the quantity per package!' },
                            { type: 'number', min: 1, message: 'Must be at least 1.' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const numberOfPackages = getFieldValue('numberOfPackages');
                                    const availableQty = packageInfo?.updatedQty;
                                    if (numberOfPackages && value && availableQty && (numberOfPackages * value) > availableQty) {
                                        return Promise.reject('The total quantity to split exceeds the available quantity.');
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} onChange={handleQuantityPerPackageChange} onFocus={(e) => e.target.select()} onKeyPress={handleKeyPress} />
                    </Form.Item>
                        </Col>
                    </Row>
                    {numPackages !== undefined && quantityPerPackage !== undefined && packageInfo?.updatedQty !== undefined && (
                        <div className="mb-4">
                            <Text strong>Total Quantity to Split: </Text>
                            <Text type={totalToSplit > (packageInfo?.updatedQty || 0) ? 'danger' : 'success'} strong>
                                {totalToSplit}
                            </Text>
                            <Text type="secondary"> (Available: {packageInfo?.updatedQty})</Text>
                        </div>
                    )}

                    <Row gutter={16}>
                        <Col span={8}>
                            <Popconfirm
                                title="Cancel split"
                                description="Are you sure to cancel this split?"
                                onConfirm={handleCancel}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button icon={<XCircle />} style={{ width: '100%' }}>Cancel</Button>
                            </Popconfirm>
                        </Col>
                        <Col span={8}>
                            <Button type="primary" htmlType="submit" icon={<Save />} style={{ width: '100%' }}>
                                Save
                            </Button>
                        </Col>
                        <Col span={8}>
                            <PrintButton icon={<Printer />} style={{ width: '100%' }} printModel={printModel} requireAuth={true}>
                                Reprint
                            </PrintButton>
                        </Col>
                    </Row>
                </Form>
            )}
            {/* Display the table */}
            {splitResultData.length > 0 && (
                <div className="mt-4">
                    <Title level={4}>Split Result</Title>
                    <Table columns={columns} dataSource={splitResultData} rowKey="packageId" />
                </div>
            )}
            {contextHolder}
        </div>
    );
};

PackageSplit.displayName = 'PackageSplit';

export default React.memo(PackageSplit);