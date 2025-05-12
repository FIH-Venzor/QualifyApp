import { PackageInfo } from "./IPackageInfo";
import { PackageStatus } from "./IPackageStatus";

export interface PackageHistory {
    packageInfo: PackageInfo;
    packageStatuses: PackageStatus[];
}