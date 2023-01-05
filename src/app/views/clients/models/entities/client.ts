export interface IClient {
    id: string;
    securedIndoors: string;
    customerNumber: number; // Searching seems to work better on a string datatype.
    customerNumberStr: string;
    feedingRoutine: string;
    health: string;
    name: string;
    other: string;
    petName: string;
    emailAddress: string;
    litter: string;
}
