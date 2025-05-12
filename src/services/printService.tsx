import axios, { AxiosResponse } from 'axios';
import { PrintModel } from '../models/PrintModel';
import { YokaSettingsModel } from '../models/YokaSettingsModel';

const YOKA_SETTINGS_KEY = 'YokaSettings';
const DEFAULT_YOKA_URL = 'http://localhost:9090';

interface PrinterListResponse {
    [key: string]: string; // O define una interfaz más específica si conoces la estructura
}

const printService = {
    print: async (printModel: PrintModel, yokaUrl: string = DEFAULT_YOKA_URL): Promise<void> => {
        try {
            await axios.post(`${yokaUrl}/print`, printModel);
        } catch (error: any) {
            console.error('Error al imprimir:', error);
            throw error; // Re-lanza el error para que el componente pueda manejarlo
        }
    },

    getDefaultPrinter: async (yokaUrl: string = DEFAULT_YOKA_URL): Promise<any | null> => {
        try {
            const response: AxiosResponse<any> = await axios.get(`${yokaUrl}/print`);
            return response.data;
        } catch (error: any) {
            console.error('Error al obtener la impresora por defecto:', error);
            return null;
        }
    },

    getPrinters: async (yokaUrl: string = DEFAULT_YOKA_URL): Promise<string[]> => {
        try {
            const response: AxiosResponse<string[]> = await axios.get(`${yokaUrl}/print/all`);
            return response.data;
        } catch (error: any) {
            console.error('Error al obtener la lista de impresoras:', error);
            return [];
        }
    },

    printDefault: async (data: any, mimeType: string = 'application/octet-stream'): Promise<void> => {
        const printModel = new PrintModel();
        let yokaSettings: YokaSettingsModel | null = JSON.parse(localStorage.getItem(YOKA_SETTINGS_KEY || ''));

        if (!yokaSettings) {
            yokaSettings = new YokaSettingsModel();
            yokaSettings.url = DEFAULT_YOKA_URL;
        }

        if (!yokaSettings.defaultDestination) {
            const selectedPrinter = await printService.printDialog(yokaSettings.url);
            if (selectedPrinter) {
                yokaSettings.defaultDestination = selectedPrinter;
                localStorage.setItem(YOKA_SETTINGS_KEY, JSON.stringify(yokaSettings));
            } else {
                return; // El usuario canceló el diálogo
            }
        }

        printModel.data = data;
        printModel.mimeType = mimeType;
        printModel.settings.destination = yokaSettings.defaultDestination;
        await printService.print(printModel, yokaSettings.url);
    },

    printDialog: async (yokaUrl: string = DEFAULT_YOKA_URL): Promise<string | undefined> => {
        return new Promise(async (resolve) => {
            const printers = await printService.getPrinters(yokaUrl);
            return resolve(await printService.showPrintDialog(printers));
        });
    },

    showPrintDialog: (printers: string[]): Promise<string | undefined> => {
        return new Promise((resolve) => {
            // Esta función se implementará en el componente PrintDialog para mostrar el modal
            // y resolver la promesa con la impresora seleccionada.
            // Por ahora, devolvemos una promesa que nunca se resuelve aquí.
            // La lógica real estará en el componente.
        });
    },
};

export default printService;