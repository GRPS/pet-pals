import { Component, Input, OnInit } from '@angular/core';

@Component( {
    selector: 'app-field',
    templateUrl: './field.component.html',
    styleUrls: [ './field.component.scss' ]
} )
export class FieldComponent implements OnInit {

    @Input() forValue: string = '';
    @Input() label: string = '';
    @Input() cls: string = '';
    @Input() isReadMode: boolean = true;
    @Input() readValue: string = '';

    constructor() {
    }

    ngOnInit(): void {
    }

}
