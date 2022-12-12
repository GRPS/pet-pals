import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientsService } from '../../services/clients.service';
import { AlertService } from '../../../../shared/service/alert.service';
import { IClient } from '../../models/entities/client';
import { take, takeUntil, tap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { CanComponentDeactivate } from '../../../../shared/directives/can-deactivate-guard.service';
import { CLIENTS } from '../../enums/clients.enum';
import { VisitsService } from '../../../visits/services/visits.service';

@Component( {
    selector: 'app-record',
    templateUrl: './record.component.html',
    styleUrls: [ './record.component.scss' ],
    providers: [ VisitsService ]
} )
export class RecordComponent implements OnInit, OnDestroy, CanComponentDeactivate {

    form: FormGroup;
    paramId: string;
    isNew: boolean = false;
    isEditMode: boolean = false;
    subscription: Subscription;

    /**
     * Store all subscriptions.
     * @private
     */
    private _unsubscribeAll = new Subject();

    /**
     * Get title of this component.
     * @return title string
     */
    get getTitle(): string {
        return ( this.isNew ? 'Add ' : '' ) + 'Client';
    }

    get formNoValid(): boolean {
        return this.form.invalid;
    }

    constructor(
        private formBuilder: FormBuilder,
        private _clientsService: ClientsService,
        private _visitsService: VisitsService,
        private _alertService: AlertService,
        private _route: ActivatedRoute,
        private _router: Router,
    ) {
    }

    ngOnInit(): void {

        // Are we adding a new record or loading an existing?
        this._route.paramMap
            .pipe(
                tap( ( params: ParamMap ) => {
                    this.paramId = params.get( CLIENTS.ID );
                    this.isNew = this.paramId === 'add';
                    if ( this.isNew ) {
                        this._createForm( null );
                        this.setEditMode();
                    } else {
                        this._clientsService.getItemById( this.paramId )
                            .pipe(
                                takeUntil( this._unsubscribeAll ),
                                tap( ( item: IClient ) => {
                                    this._createForm( item );
                                    this.setReadMode();
                                } )
                            ).subscribe();
                    }
                } )
            ).subscribe();

    }

    visits(): void {
        this._router.navigate( [ '/visits/list/' + this.paramId ], { relativeTo: this._route } )
            .then( ( succeeded: boolean ) => {
            } )
            .catch( error => {
            } );
    }

    /**
     * Destroy all subscriptions.
     * @return void
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
    }

    /**
     * Put the form in edit mode.
     * @return void
     */
    setEditMode(): void {
        this.isEditMode = true;
        this.form.enable();
    }

    /**
     * Put the form in read mode.
     * @return void
     */
    setReadMode(): void {
        this.isEditMode = false;
        this.form.disable();
    }

    /**
     * Save changes to existing client OR create a new client.
     * @return void
     */
    onSubmit(): void {
        const item: IClient = this.form.value;
        if ( this.form.valid ) {
            if ( this.isNew ) {
                this._clientsService.addItem( item )
                    .pipe(
                        take( 1 ),
                        tap( () => {
                            this._clientsService.updateClientCountInFirebase( true );
                            this._alertService.toast( 'Item Added!' );
                            this.back();
                        } )
                    ).subscribe();
            } else {
                this._clientsService.updateItem( item )
                    .pipe(
                        take( 1 ),
                        tap( () => {
                            this._alertService.toast( 'Item Updated!' );
                            this.back();
                        } )
                    ).subscribe();
            }
        }
    }

    /**
     * Delete a client.
     * @return void
     */
    delete(): void {
        this._alertService.areYouSure()
            .then( ( response: boolean ) => {
                if ( response ) {
                    this._clientsService.deleteItem( this.form.value )
                        .pipe(
                            take( 1 ),
                            tap( () => {
                                this._clientsService.updateClientCountInFirebase( false );
                                this.back();
                                this._alertService.toast( 'Item deleted!' );
                            } )
                        ).subscribe();
                }
            } );
    }

    /**
     * Go back to client list.
     * @return void
     */
    back(): void {
        setTimeout( () => {
            this._router.navigate( [ '../list' ], { relativeTo: this._route } )
                .then( ( succeeded: boolean ) => {
                } )
                .catch( error => {
                    console.log( 'Navigate from client record back to client list', error );
                } );
        }, 10 );
    }

    /**
     * Define the client form with defaults or real values.
     * @param item
     * @return void
     * @private
     */
    private _createForm( item: IClient = null ): void {
        this.form = this.formBuilder.group( {
            id: [ item ? item.id : '', Validators.compose( [] ) ],
            address: [ item ? item.address : '', Validators.compose( [ Validators.required ] ) ],
            customerNumber: [ item ? item.customerNumber : '', Validators.compose( [ Validators.required ] ) ],
            feedingRoutine: [ item ? item.feedingRoutine : '', Validators.compose( [] ) ],
            health: [ item ? item.health : '', Validators.compose( [] ) ],
            name: [ item ? item.name : '', Validators.compose( [ Validators.required ] ) ],
            other: [ item ? item.other : '', Validators.compose( [] ) ],
            petName: [ item ? item.petName : '', Validators.compose( [ Validators.required ] ) ]
        } );
    }

    canDeactivate(): Observable<boolean> | boolean {
        // if ( this.form.dirty ) {
        //     this._alertService.areYouSure( 'Are you sure?', 'Changes will be lost!')
        //         .then( ( confirmed: boolean ) => {
        //           return of( confirmed );
        //         } );
        // }
        return true;
    }

}
