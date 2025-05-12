import React from 'react';
import './PackageValidation.scss';
import { Alert, Button, Card, Descriptions, Flex, Form, Input, Modal, Spin, Typography } from 'antd';
import { t } from 'i18next';
import { usePackageValidation } from './hooks/usePackageValidation';
import { useAuth } from '../../../providers/authContext';

const { Title } = Typography;
const PACKAGE_ID_REGEX = /^\d{11}$/;

export type PackageValidationProps = {
    status: string;
    statusToSave: string;
};

const PackageValidation: React.FC<PackageValidationProps> = ({ status, statusToSave }) => {
    const [form] = Form.useForm();
    const { auth } = useAuth(); // auth can be AuthState | null
    const [supervisorForm] = Form.useForm();
    const {
        state,
        validatePackage,
        handleSupervisorValidation,
        inputHandlers,
        toggleSupervisorModal,
        mfgPNInputRef,
        packageInputRef,
    } = usePackageValidation(form, supervisorForm, status, statusToSave);

    return (
        <div className="package-validation">
            <Title level={3} className="pt-0 mt-0">{t('menu.package.QINValidation') + ' '+ t('menu.package.title')}</Title>
            <Form form={form} layout="vertical" onFinish={validatePackage} size='middle' className="mt-4">
                <Form.Item
                    label={t('packageValidation.packageIdLabel')}
                    name="packageId"
                    rules={[
                        { required: true, message: t('packageValidation.packageIdRequired') },
                        { pattern: PACKAGE_ID_REGEX, message: t('packageValidation.packageIdInvalid') },
                    ]}
                >
                    <Input
                        ref={packageInputRef}
                        autoFocus
                        autoComplete="off"
                        onKeyDown={inputHandlers.handlePackageKeyDown}
                        onFocus={inputHandlers.handleFocus}
                        placeholder={t('packageValidation.packageIdPlaceholder')}
                        disabled={state.loading}
                    />
                </Form.Item>
                <Form.Item
                    label={t('packageValidation.manufacturerPartNumberLabel')}
                    name="manufacturerPartNumber"
                    rules={[{ required: true, message: t('packageValidation.manufacturerPartNumberRequired') }]}
                >
                    <Input
                        ref={mfgPNInputRef}
                        autoComplete="off"
                        onFocus={inputHandlers.handleFocus}
                        placeholder={t('packageValidation.manufacturerPartNumberPlaceholder')}
                        disabled={state.loading}
                    />
                </Form.Item>
                <Flex gap="small" justify="space-between">
                    <Button type="primary" htmlType="submit" loading={state.loading}>
                        {t('packageValidation.validateButton')}
                    </Button>
                    <Button onClick={inputHandlers.handleReset} disabled={state.loading}>
                        {t('packageValidation.resetButton')}
                    </Button>
                </Flex>
            </Form>
            {(state.validationError || state.validationSuccess || state.packageData) && (
                <Card style={{ marginTop: 24 }} loading={state.loading}>
                    {(state.validationError || state.validationSuccess) && (
                        <Alert
                            message={t('packageValidation.validationMessageTitle')}
                            description=<>
                                {state.validationSuccess || state.validationError}
                                {false &&
                                    <Button
                                        type="primary"
                                        onClick={toggleSupervisorModal(true)}
                                        className="float-right"
                                        disabled={state.supervisorLoading}
                                    >
                                        {t('packageValidation.validateBySupervisorButton')}
                                    </Button>
                                }
                            </>
                            type={state.validationSuccess ? 'success' : 'error'}
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {state.packageData && (
                        <Descriptions title={t('packageValidation.packageDetailsTitle')} bordered column={1} size="small">
                            <Descriptions.Item label={t('packageValidation.packageIdLabel')}>
                                {state.packageData.packageId}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageValidation.statusLabel')}>
                                <span style={{ color: state.packageData.status !== status ? '#faad14' : '#52c41a' }}>
                                    {state.packageData.status}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageValidation.validatedByLabel')}>
                                {auth?.employeeId}
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Card>
            )}

            <Modal
                title={t('packageValidation.supervisorAuthorizationTitle')}
                open={state.supervisorModalVisible}
                onCancel={toggleSupervisorModal(false)}
                footer={null}
            >
                <Spin spinning={state.supervisorLoading}>
                    {state.packageData && (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label={t('packageValidation.packageIdLabel')}>
                                {state.packageData.packageId}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('packageValidation.manufacturerPartNumberLabel')}>
                                {state.packageData.commercialPn}
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                    <Form
                        form={supervisorForm}
                        layout="vertical"
                        onFinish={handleSupervisorValidation}
                        style={{ marginTop: '10px' }}
                    >
                        <Form.Item
                            label={t('packageValidation.supervisorUsernameLabel')}
                            name="username"
                            rules={[{ required: true, message: t('packageValidation.supervisorUsernameRequired') }]}
                        >
                            <Input
                                autoComplete="off"
                                placeholder={t('packageValidation.supervisorUsernamePlaceholder')}
                            />
                        </Form.Item>
                        <Form.Item
                            label={t('packageValidation.supervisorPasswordLabel')}
                            name="password"
                            rules={[{ required: true, message: t('packageValidation.supervisorPasswordRequired') }]}
                        >
                            <Input.Password
                                autoComplete="off"
                                placeholder={t('packageValidation.supervisorPasswordPlaceholder')}
                            />
                        </Form.Item>
                        <Flex gap="small" justify="space-between">
                            <Button type="primary" htmlType="submit" loading={state.supervisorLoading}>
                                {t('packageValidation.submitButton')}
                            </Button>
                            <Button onClick={toggleSupervisorModal(false)} disabled={state.supervisorLoading}>
                                {t('packageValidation.cancelButton')}
                            </Button>
                        </Flex>
                    </Form>
                </Spin>
            </Modal>
        </div>
    );
};

PackageValidation.displayName = 'PackageValidation';

export default React.memo(PackageValidation);