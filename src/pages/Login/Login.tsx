import React, { useRef, useState } from 'react';
import './Login.scss';
import { Form, message, InputRef, Card, Input, Button, Typography, Space, Image } from 'antd';
import { useAuth } from '../../providers/authContext';
import { LoginForm } from '../../types/ILogin';
import { User, Lock } from 'react-feather';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/qualify.png';

const { Title, Text } = Typography;

export type LoginProps = {};

const Login: React.FC<LoginProps> = () => {
    const [form] = Form.useForm<LoginForm>();
    const [messageApi, contextHolder] = message.useMessage();
    const { login } = useAuth();
    const passwordInputRef = useRef<InputRef>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { t } = useTranslation();

    const handleLogin = async (values: LoginForm) => {
        setLoading(true);
        try {
            await login(values.username, values.password, 'QUALIFY');
            messageApi.success(t('login.successMessage'));
        } catch (error: any) {
            messageApi.error(error.message || t('login.errorMessage'));
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInputRef.current?.focus();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    return (
        <div className="login">
            {contextHolder}
            <Card loading={loading} className="card">
                <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 24,
                                fontWeight: 'bold',
                            }}
                        >
                            <Image src={logo} preview={false} />
                        </div>
                    </div>

                    <Title level={3} style={{ margin: 0, color: '#1a2a44' }}>
                        {t('login.title')}<span style={{ fontSize: '10px' }}> v1.0.0</span>
                    </Title>
                </Space>
                <Form form={form} layout="vertical" onFinish={handleLogin} disabled={loading}>
                    <Form.Item
                        label={t('login.username')}
                        name="username"
                        rules={[{ required: true, message: t('login.usernameRequired') }]}
                    >
                        <Input
                            prefix={<User style={{ color: '#2e4b85' }} />}
                            placeholder={t('login.usernamePlaceholder')}
                            onKeyDown={handleUsernameKeyDown}
                            onFocus={handleFocus}
                        />
                    </Form.Item>
                    <Form.Item
                        label={t('login.password')}
                        name="password"
                        rules={[{ required: true, message: t('login.passwordRequired') }]}
                    >
                        <Input.Password
                            ref={passwordInputRef}
                            prefix={<Lock style={{ color: '#2e4b85' }} />}
                            placeholder={t('login.passwordPlaceholder')}
                            onFocus={handleFocus}
                        />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                        {t('login.submit')}
                    </Button>

                    <Text style={{ display: 'block', textAlign: 'center', color: '#6b7280' }}>
                        {t('login.footerText')}
                    </Text>
                </Form>
            </Card>
        </div>
    );
};

Login.displayName = 'Login';

export default React.memo(Login);