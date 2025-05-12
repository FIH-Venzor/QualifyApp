export interface PackageStatus {
    packageId: string;
    partNumber: string;
    process: string;
    passFailIndicator: string;
    modifiedDate: Date;
    slot: number;
    sideTable: string;
    station: string;
    line: string;
    product: string;
    boardKit: string;
    packageQty: number;
    machine: string;
    program: string;
    bomRevision: string;
    employerId: string;
    scale: number;
    userDefined1: string;
    userDefined2: string;
    userDefined3: string;
}