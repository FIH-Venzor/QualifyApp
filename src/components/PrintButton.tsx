import React from 'react';
import { Button, Space } from 'antd';
import PrinterSelectModal from './PrinterSelectModal';
import usePrinter from '../hooks/usePrinter';
import AuthModal from './AuthModal';
import { List } from 'react-feather';

interface PrintModel {
    data: string;
    mimeType: string;
    settings: {
        destination: string;
    };
}

interface PrintButtonProps {
    printModel?: PrintModel;
    requireAuth?: boolean;
    [key: string]: any;
}

const PrintButton: React.FC<PrintButtonProps> = ({
    printModel = {
        data: 'Test document',
        mimeType: 'application/octet-stream',
        settings: { destination: '' },
    },
    requireAuth = false,
    ...props
}) => {
    const {
        defaultPrinter,
        printers,
        isModalOpen,
        isAuthModalOpen,
        handlePrint,
        handlePrinterSelect,
        openPrinterModal,
        closeModal,
        handleAuthSubmit,
        closeAuthModal,
    } = usePrinter();

    return (
        <>
            <Space.Compact block>
                <Button
                    type="primary"
                    onClick={() => handlePrint({ ...printModel, settings: { destination: defaultPrinter || '' } }, requireAuth)}
                    className="w-full"
                    {...props}
                >
                    Print
                </Button>
                <Button
                    onClick={openPrinterModal}
                    className="w-full"
                    icon={<List />}
                    style={{ maxWidth: '50px' }}
                >
                    
                </Button>
            </Space.Compact>
            <PrinterSelectModal
                isOpen={isModalOpen}
                onClose={closeModal}
                printers={printers}
                onSelect={handlePrinterSelect}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                onSubmit={handleAuthSubmit}
            />
        </>
    );
};

export default PrintButton;