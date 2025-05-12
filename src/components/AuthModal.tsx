import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (username: string, password: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleOk = () => {
        if (!username || !password) {
            message.warning('Please enter both username and password');
            return;
        }
        onSubmit(username, password);
        setUsername('');
        setPassword('');
    };

    return (
        <Modal
            title="Printer Authentication"
            open={isOpen}
            onOk={handleOk}
            onCancel={onClose}
            okText="Submit"
            cancelText="Cancel"
        >
            <div style={{ marginBottom: 16 }}>
                <label>Username</label>
                <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                />
            </div>
            <div>
                <label>Password</label>
                <Input.Password
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                />
            </div>
        </Modal>
    );
};

export default AuthModal;