export interface IVisit {
    id: string;
    clientId: string;
    dt: string | Date | IFireBaseDate;
    dtDate: number;
    dtMonth: number;
    dtYear: number;
    foodIntakeAm: string;
    foodIntakePm: string;
    liquidIntake: string;
    medication: string;
    name: string;
    notes: string;
    securityCheck: string;
    visualCheckAm: string;
    visualCheckPm: string;
}

export interface IFireBaseDate {
    seconds: number;
    nanoseconds: number;
}