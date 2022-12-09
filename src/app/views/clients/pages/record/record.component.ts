import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ClientsService } from '../../services/clients.service';
import { AlertService } from '../../../../shared/service/alert.service';
import { IClient } from '../../models/entities/client';
import { take, tap } from 'rxjs/operators';
import { ActivatedRoute, NavigationExtras, ParamMap, Router } from '@angular/router';

@Component( {
    selector: 'app-record',
    templateUrl: './record.component.html',
    styleUrls: [ './record.component.scss' ]
} )
export class RecordComponent implements OnInit {

    form: FormGroup;
    paramId: string;
    isNew: boolean = false;
    isEditMode: boolean = false;

    get getLabel(): string {
        return this.paramId === 'add' ? 'Add' : 'Update';
    }

    constructor(
        private formBuilder: FormBuilder,
        private _clientsService: ClientsService,
        private _alertService: AlertService,
        private _route: ActivatedRoute,
        private _router: Router,
    ) {
        this._createForm( this._router.getCurrentNavigation().extras.state as IClient );
    }

    ngOnInit(): void {

        // Are we adding a new record or loading an existing?
        this._route.paramMap
            .pipe(
                tap( ( params: ParamMap ) => {
                    this.paramId = params.get( 'id' );
                    this.isNew = this.paramId === 'add';
                    if ( this.isNew ) {
                        this.setEditMode();
                    } else {
                        this.setReadMode();
                    }
                } )
            ).subscribe();

    }

    setEditMode(): void {
        this.isEditMode = true;
        this.form.enable();
    }

    setReadMode(): void {
        this.isEditMode = false;
        this.form.disable();
    }

    onSubmit(): void {
        const item: IClient = this.form.value;
        if ( this.form.valid ) {
            if ( this.isNew ) {
                this._clientsService.addItem( item )
                    .pipe(
                        take( 1 ),
                        tap( () => this._alertService.toast( 'Item Added!' ) )
                    ).subscribe();
            } else {
                this._clientsService.updateItem( item )
                    .pipe(
                        take( 1 ),
                        tap( () => this._alertService.toast( 'Item Updated!' ) )
                    ).subscribe();
            }
            this.back();
        }
    }

    delete(): void {
        this._alertService.areYouSure()
            .then( ( response: boolean ) => {
                if ( response ) {
                    this._clientsService.deleteItem( this.form.value )
                        .pipe(
                            take( 1 ),
                            tap( () => {
                                this.back();
                                this._alertService.toast( 'Item deleted!' );
                            } )
                        ).subscribe();
                }
            } );
    }

    back(): void {
        this._router.navigate( [ '../list' ], { relativeTo: this._route } );
    }

    private _createForm( item: IClient = null ) {
        this.form = this.formBuilder.group( {
            id: [ item ? item.id : '' ],
            address: [ item ? item.address : '' ],
            customerNumber: [ item ? item.customerNumber : '' ],
            feedingRoutine: [ item ? item.feedingRoutine : '' ],
            health: [ item ? item.health : '' ],
            name: [ item ? item.name : '' ],
            other: [ item ? item.other : '' ],
            petName: [ item ? item.petName : '' ]
        } );
    }

}
