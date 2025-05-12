import React, { useState } from 'react';
import { Modal, Select, message } from 'antd';

interface Printer {
    name: string;
}

interface PrinterSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    printers: Printer[];
    onSelect: (printerName: string) => void;
}

const PrinterSelectModal: React.FC<PrinterSelectModalProps> = ({ isOpen, onClose, printers, onSelect }) => {
    const [selected, setSelected] = useState<string | null>(null);

    const handleOk = () => {
        if (selected) {
            onSelect(selected);
        } else {
            message.warning('Please select a printer');
        }
    };

    return (
        <Modal
            title="Select Printer"
            open={isOpen}
            onOk={handleOk}
            onCancel={onClose}
            okText="Confirm"
            cancelText="Cancel"
        >
            <Select
                style={{ width: '100%' }}
                placeholder="Select a printer"
                onChange={(value: string) => setSelected(value)}
                options={printers.map(printer => ({
                    value: printer.name,
                    label: printer.name,
                }))}
            />
        </Modal>
    );
};

export default PrinterSelectModal;