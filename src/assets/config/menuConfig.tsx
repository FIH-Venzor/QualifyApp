import React from 'react';
import Overview from '../../pages/Dashboard/Overview';
import { Package, CheckCircle, CheckSquare, Crosshair, BarChart2 } from 'react-feather';
import PackageValidation from '../../pages/Package/PackageValidation';
import QualityEntry from '../../pages/Quality/QualityEntry';
import PackageReport from '../../pages/Package/PackageReport';
import PackageSplit from '../../pages/Package/PackageSplit';

// Definición de tipos para los ítems del menú
interface MenuItem<T = {}> {
    key: string;
    icon: React.ReactNode;
    labelKey: string; // Clave para traducción en i18n
    path?: string; // Ruta asociada (opcional para ítems padres)
    params?: {},
    component?: React.ComponentType<T>; // Componente para la ruta (opcional para ítems padres)
    children?: MenuItem<any>[];
}

// Configuración del menú
const menuConfig: MenuItem[] = [
    {
        key: '1',
        icon: <Crosshair />,
        labelKey: 'menu.dashboard',
        children: [
            {
                key: '1-1',
                icon: <BarChart2 />,
                labelKey: 'menu.overview',
                path: '/overview',
                component: Overview,
            },
        ],
    },
    {
        key: '2',
        icon: <CheckSquare />,
        labelKey: 'menu.quality.menu',
        children: [
            {
                key: '2-1',
                icon: <CheckCircle />,
                labelKey: 'menu.quality.entry',
                path: '/quality/entry',
                component: QualityEntry,
                params: { status: ['OUT','2QI'], statusToSave: 'QIN' },
            },
        ],
    },
    {
        key: '3',
        icon: <Package />,
        labelKey: 'menu.package.title',
        children: [
            {
                key: '3-1',
                icon: <CheckCircle />,
                labelKey: 'menu.package.report',
                path: '/package/report',
                component: PackageReport,
            },
            {
                key: '3-2',
                icon: <CheckCircle />,
                labelKey: 'menu.package.QINValidation',
                path: '/package/validation/QIN',
                component: PackageValidation,
                params: { status: 'QIN', statusToSave: 'QIN' },
            },
            {
                key: '3-3',
                icon: <CheckCircle />,
                labelKey: 'menu.package.Split',
                path: '/package/split',
                component: PackageSplit,
            },
        ],
    },
];

export default menuConfig;