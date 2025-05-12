import React from 'react';
import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

import './Overview.scss';

export type OverviewProps = {

}

const Overview: React.FC<OverviewProps> = () => {
    const { t } = useTranslation();

    return (
        <div>
            <Title level={2}>{t('menu.overview')}</Title>
            <Card title="Welcome to Overview" style={{ marginBottom: 16 }}>
                <p>This is the overview page for Qualify. Here you can see a summary of your quality metrics.</p>
            </Card>
        </div>
    );
}

Overview.displayName = 'Overview';

export default React.memo(Overview);