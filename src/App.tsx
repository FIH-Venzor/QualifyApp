import React, { JSX, useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Image } from 'antd';
import {
    MenuOutlined,
    UserOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Overview from './pages/Dashboard/Overview';
import './App.css';
import menuConfig from './assets/config/menuConfig';
import Login from './pages/Login';
import { useAuth } from './providers/authContext';
import logo from './assets/qualify.png';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

const App: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { auth, logout } = useAuth();

    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const languageMenu = {
        items: [
            {
                key: 'en',
                label: 'English',
                onClick: () => changeLanguage('en'),
            },
            {
                key: 'es',
                label: 'Español',
                onClick: () => changeLanguage('es'),
            },
        ],
    };


    const userMenu = {
        items: [
            {
                key: 'logout',
                label: t('menu.logout'),
                onClick: () => {
                    logout();
                    navigate('/'); // Redirigir al inicio tras logout
                },
            },
        ],
    };


    const sidebarMenuItems = menuConfig.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey),
        children: item.children?.map((child) => ({
            key: child.key,
            icon: child.icon,
            label: t(child.labelKey),
        })),
    }));

    const normalizePath = (path: string): string => {
        // Split the path and filter out dynamic segments (starting with :)
        const segments = path.split('/').map(segment =>
            segment.startsWith(':') ? '*' : segment
        );
        return segments.join('/');
    };

    const matchPathPattern = (pattern: string, path: string): boolean => {
        const patternSegments = normalizePath(pattern).split('/');
        const pathSegments = path.split('/');

        if (patternSegments.length !== pathSegments.length) return false;

        return patternSegments.every((segment, index) =>
            segment === '*' || segment === pathSegments[index]
        );
    };

    const pathToKeyMap: { [key: string]: string } = {};
    menuConfig.forEach((item) => {
        if (item.path) pathToKeyMap[normalizePath(item.path)] = item.key;
        item.children?.forEach((child) => {
            if (child.path) pathToKeyMap[normalizePath(child.path)] = child.key;
        });
    });
    pathToKeyMap['/'] = '1-1'; // Default route

    useEffect(() => {
        const currentPath = location.pathname;

        // Find matching path pattern
        let selectedKey = '1-1'; // Default
        for (const [pattern, key] of Object.entries(pathToKeyMap)) {
            const originalPattern = Object.keys(pathToKeyMap).find(k => normalizePath(k) === pattern) || pattern;
            if (matchPathPattern(originalPattern, currentPath)) {
                selectedKey = key;
                break;
            }
        }

        const parentKey = selectedKey.split('-')[0];
        setSelectedKeys([selectedKey]);
        setOpenKeys([parentKey]);
    }, [location.pathname]);


    const handleMenuClick = ({ key }: { key: string }) => {
        const findRoute = (items: typeof menuConfig): string | undefined => {
            for (const item of items) {
                if (item.key === key && item.path) {
                    if (item.path.includes(':status')) {
                        return item.path.replace(':status','QIN')
                    }
                    return item.path;
                }                    
                if (item.children) {
                    const childPath = findRoute(item.children);
                    if (childPath) return childPath;
                }
            }
        };
        const path = findRoute(menuConfig);
        if (path) navigate(path);
    };

    const onOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

    const renderRoutes = () => {
        const routes: JSX.Element[] = [];
        menuConfig.forEach((item) => {
            if (item.path && item.component) {
                routes.push(<Route key={item.key} path={item.path} element={React.createElement(item.component,  item.params )} />);
            }
            item.children?.forEach((child) => {
                if (child.path && child.component) {
                    routes.push(<Route key={child.key} path={child.path} element={React.createElement(child.component, child.params)} />);
                }
            });
        });
        routes.push(<Route key="default" path="/" element={<Overview />} />);
        routes.push(<Route key="login" path="/login" element={<Login />} />);
        return routes;
    };

    
        if (!auth?.isAuthenticated) {
            return <Routes>{[<Route key="login" path="*" element={<Login />} />]}</Routes>;
        }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={250}
            >
                <div
                    className="logo"
                    style={{
                        height: 64,
                        background: '#1a2a44',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        paddingLeft: collapsed ? 0 : 24,
                        transition: 'all 0.3s',
                    }}
                >
                    <Image src={logo} width='32px' />
                    <Text strong style={{ color: '#fff', fontSize: 18, paddingLeft:'5px' }}>
                        {collapsed ? '' : 'Qualify'} <span style={{ fontSize: '10px', color: 'yellow' }}>v 1.0.3</span>
                    </Text>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKeys}
                    openKeys={openKeys}
                    onOpenChange={onOpenChange}
                    items={sidebarMenuItems}
                    onClick={handleMenuClick}
                    style={{ background: '#1a2a44', border: 'none' }}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        background: '#ffffff',
                        padding: '0 24px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        height: 64,
                        lineHeight: '64px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                            <MenuOutlined
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ color: '#1a2a44', fontSize: 20 }}
                            />
                        </Space>
                        <Space size="middle">
                            <Dropdown menu={userMenu}>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2e4b85', cursor: 'pointer' }} />
                            </Dropdown>
                            <Text style={{ color: '#1a2a44' }}>{auth.name || 'Guest'}</Text>
                            <Dropdown menu={languageMenu}>
                                <GlobalOutlined style={{ color: '#2e4b85', fontSize: 18 }} />
                            </Dropdown>
                        </Space>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px',
                        padding: 0,
                        background: 'transparent',
                        minHeight: 280,
                        overflowY: 'auto',
                        maxHeight: 'calc(100vh - 136px)', // Ajustado para nuevo header/footer
                    }}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            padding: 24,
                            borderRadius: 8,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                            height: 'auto',
                            maxHeight: 'calc(100vh - 178px)',
                            overflow: 'auto'
                        }}
                    >
                        <Routes>{renderRoutes()}</Routes>
                    </div>
                </Content>
                <Footer
                    style={{
                        textAlign: 'center',
                        background: '#ffffff',
                        color: '#6b7280',
                        padding: '16px 24px',
                        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
                        position: 'sticky',
                        bottom: 0,
                    }}
                >
                    Qualify ©2025 Created by IT-Apps
                </Footer>
            </Layout>
        </Layout>
    );
};

export default App;