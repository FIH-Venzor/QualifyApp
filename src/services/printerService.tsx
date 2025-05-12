import axios from 'axios';

interface PrintModel {
    data: string;
    mimeType: string;
    settings: {
        destination: string;
    };
}

const PrinterService = {
    getPrinters: async (yokaUrl: string): Promise<string[]> => {
        try {
            const response = await axios.get<string[]>(`${yokaUrl}/print/all`);
            return response.data;
        } catch (error) {
            throw new Error('Failed to load printers');
        }
    },
    print: async (printModel: PrintModel, yokaUrl: string): Promise<boolean> => {
        try {
            await axios.post(`${yokaUrl}/print`, printModel);
            return true;
        } catch (error) {
            throw new Error('Failed to send print job');
        }
    },
};

export default PrinterService;