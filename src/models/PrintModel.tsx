import { PrintSettingsModel } from './PrintSettingsModel';

export class PrintModel {
    settings: PrintSettingsModel = new PrintSettingsModel();
    data: any;
    mimeType: string | undefined;
}