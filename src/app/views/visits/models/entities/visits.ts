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
    medicationAm: string;
    medicationPm: string;
    visitorAm: string;
    visitorPm: string;
    notesAm: string;
    notesPm: string;
    securityCheckAm: string;
    securityCheckPm: string;
    visualCheckAm: string;
    visualCheckPm: string;
    checked?: boolean;
}

export interface IFireBaseDate {
    seconds: number;
    nanoseconds: number;
}