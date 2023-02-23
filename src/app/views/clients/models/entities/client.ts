import { IVisit } from '../../../visits/models/entities/visits';

export interface IClient {
    id: string;
    securedIndoors: string;
    customerNumber: string;
    customerNumberDigits: number;
    feedingRoutine: string;
    health: string;
    name: string;
    other: string;
    petName: string;
    litter: string;
}

export interface IExport extends IClient {
    visits: IVisit[];
}