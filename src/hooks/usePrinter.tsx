import { useState, useEffect } from 'react';
import { message } from 'antd';
import PrinterService from '../services/PrinterService';

interface Printer {
    name: string;
}

interface PrintModel {
    data: string;
    mimeType: string;
    settings: {
        destination: string;
    };
}

interface YokaSettings {
    url: string;
    defaultDestination?: string;
}

interface PrinterHook {
    defaultPrinter: string | null;
    printers: Printer[];
    isModalOpen: boolean;
    isAuthModalOpen: boolean;
    handlePrint: (printModel: PrintModel, requireAuth: boolean) => Promise<void>;
    handlePrinterSelect: (printerName: string) => void;
    openPrinterModal: () => void;
    closeModal: () => void;
    handleAuthSubmit: (username: string, password: string) => void;
    closeAuthModal: () => void;
}

const YOKA_SETTINGS = 'YokaSettings';
const DEFAULT_YOKA_URL = 'http://localhost:9090';

const usePrinter = (): PrinterHook => {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [defaultPrinter, setDefaultPrinter] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
    const [pendingPrintModel, setPendingPrintModel] = useState<PrintModel | null>(null);
    const [pendingCredentials, setPendingCredentials] = useState<{ username: string; password: string } | null>(null);

    // Load printers and check localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem(YOKA_SETTINGS);
        let yokaSettings: YokaSettings = savedSettings
            ? JSON.parse(savedSettings)
            : { url: DEFAULT_YOKA_URL };

        if (yokaSettings.defaultDestination) {
            setDefaultPrinter(yokaSettings.defaultDestination);
        } else {
            loadPrinters(yokaSettings.url);
            setIsModalOpen(true);
        }
    }, []);

    // Fetch printers from API
    const loadPrinters = async (yokaUrl: string) => {
        try {
            const printerList = await PrinterService.getPrinters(yokaUrl);
            setPrinters(printerList.map(name => ({ name })));
        } catch (error) {
            message.error('Failed to load printers');
        }
    };

    // Open printer selection modal
    const openPrinterModal = () => {
        const savedSettings = localStorage.getItem(YOKA_SETTINGS);
        const yokaSettings: YokaSettings = savedSettings
            ? JSON.parse(savedSettings)
            : { url: DEFAULT_YOKA_URL };
        loadPrinters(yokaSettings.url);
        setIsModalOpen(true);
    };

    // Handle printer selection
    const handlePrinterSelect = async (printerName: string) => {
        setDefaultPrinter(printerName);
        const savedSettings = localStorage.getItem(YOKA_SETTINGS);
        const yokaSettings: YokaSettings = savedSettings
            ? JSON.parse(savedSettings)
            : { url: DEFAULT_YOKA_URL };
        yokaSettings.defaultDestination = printerName;
        localStorage.setItem(YOKA_SETTINGS, JSON.stringify(yokaSettings));
        setIsModalOpen(false);
        message.success('Printer configured successfully');

        // If there's a pending print job, proceed to auth or print
        if (pendingPrintModel) {
            if (pendingCredentials) {
                // If credentials are already provided, send print job
                try {
                    await PrinterService.print(
                        { ...pendingPrintModel, settings: { destination: printerName } },
                        yokaSettings.url
                    );
                    message.success('Print job sent successfully');
                    setPendingPrintModel(null);
                    setPendingCredentials(null);
                } catch (error) {
                    message.error('Failed to send print job');
                    setPendingPrintModel(null);
                    setPendingCredentials(null);
                }
            } else {
                // Open auth modal if required
                setIsAuthModalOpen(true);
            }
        }
    };

    // Handle print action
    const handlePrint = async (printModel: PrintModel, requireAuth: boolean) => {

        try {
            const savedSettings = localStorage.getItem(YOKA_SETTINGS);

            if (!savedSettings) {
            setPendingPrintModel(printModel);
            setIsModalOpen(true);
            return;
        }

        if (requireAuth) {
            setPendingPrintModel(printModel);
            setIsAuthModalOpen(true);
            return;
        }

        
            const yokaSettings: YokaSettings = savedSettings
                ? JSON.parse(savedSettings)
                : { url: DEFAULT_YOKA_URL };
            await PrinterService.print(
                { ...printModel, settings: { destination: defaultPrinter || ""} },
                yokaSettings.url
            );
            message.success('Print job sent successfully');
        } catch (error) {
            message.error('Failed to send print job');
        }
    };

    // Handle authentication submission
    const handleAuthSubmit = async (username: string, password: string) => {
        // Basic client-side validation (extend for server-side if needed)
        if (!username || !password) {
            message.warning('Please enter both username and password');
            return;
        }

        setPendingCredentials({ username, password });
        setIsAuthModalOpen(false);

        if (pendingPrintModel && defaultPrinter) {
            try {
                const savedSettings = localStorage.getItem(YOKA_SETTINGS);
                const yokaSettings: YokaSettings = savedSettings
                    ? JSON.parse(savedSettings)
                    : { url: DEFAULT_YOKA_URL };
                await PrinterService.print(
                    { ...pendingPrintModel, settings: { destination: defaultPrinter } },
                    yokaSettings.url
                );
                message.success('Print job sent successfully');
                setPendingPrintModel(null);
                setPendingCredentials(null);
            } catch (error) {
                message.error('Failed to send print job');
                setPendingPrintModel(null);
                setPendingCredentials(null);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPendingPrintModel(null);
        setPendingCredentials(null);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
        setPendingPrintModel(null);
        setPendingCredentials(null);
    };

    return {
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
    };
};

export default usePrinter;