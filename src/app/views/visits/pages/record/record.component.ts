import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../../shared/service/alert.service';
import { take, takeUntil, tap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { CanComponentDeactivate } from '../../../../shared/directives/can-deactivate-guard.service';
import { IVisit } from '../../models/entities/visits';
import { VisitsService } from '../../services/visits.service';
import { VISITS } from '../../enums/visits.enum';

@Component( {
    selector: 'app-record',
    templateUrl: './record.component.html',
    styleUrls: [ './record.component.scss' ]
} )
export class RecordComponent implements OnInit, OnDestroy, CanComponentDeactivate {

    form: FormGroup;
    paramId: string;
    paramClientId: string;
    isNew: boolean = false;
    isEditMode: boolean = false;

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
        return ( this.isNew ? 'Add ' : '' ) + 'Visit';
    }

    get formNoValid(): boolean {
        return this.form.invalid;
    }

    constructor(
        private formBuilder: FormBuilder,
        private _visitsService: VisitsService,
        private _alertService: AlertService,
        private _route: ActivatedRoute,
        private _router: Router,
    ) {
    }

    ngOnInit(): void {

        // Parameters have changed, so let's do something.
        this._route.paramMap
            .pipe(
                tap( ( params: ParamMap ) => {
                    this.paramId = params.get( VISITS.ID );
                    this.paramClientId = params.get( VISITS.CLIENTID );
                    this.isNew = this.paramId === null;
                    if ( this.isNew ) { // Create a new visit form.
                        this._createForm( null );
                        this.form.get( VISITS.CLIENTID ).setValue( this.paramClientId, { emitEvent: false } );
                        this.watchControlDtForChanges();
                        this.setEditMode();
                    } else { // Update an existing visit form.
                        this._visitsService.getItemById( this.paramId )
                            .pipe(
                                take( 1 ),
                                tap( ( item: IVisit ) => {
                                    // We could have been passed either 1 or 2 parameters: '/add/<clientId>' or '/<clientId>'.
                                    this.paramClientId = this.paramClientId ? this.paramClientId : item.clientId;

                                    this._createForm( item );
                                    this.watchControlDtForChanges();
                                    this.setReadMode();
                                } )
                            ).subscribe();
                    }
                } )
            ).subscribe();

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
     * Save changes to existing visit OR create a new visit.
     * @return void
     */
    onSubmit(): void {
        const item: IVisit = this.form.value;
        if ( this.form.valid ) {
            if ( this.isNew ) {
                this._visitsService.addItem( item )
                    .pipe(
                        take( 1 ),
                        tap( () => {
                            this._alertService.toast( 'Item Added!' );
                            this.back();
                        } )
                    ).subscribe();
            } else {
                this._visitsService.updateItem( item )
                    .pipe(
                        take( 1 ),
                        tap( () => {
                            this._alertService.toast( 'Item Updated!' );
                            this.back();
                        } )
                    ).subscribe();
            }
            this.back();
        }
    }

    /**
     * Delete a visit.
     * @return void
     */
    delete(): void {
        this._alertService.areYouSure( 'Delete Visit?',  this.form.get( VISITS.NAME ).value + ' visit on ' + this.form.get( VISITS.DT ).value )
            .then( ( response: boolean ) => {
                if ( response ) {
                    this._visitsService.deleteItem( this.form.value )
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

    /**
     * Go back to client visits list.
     * @return void
     */
    back(): void {
        setTimeout( () => {
            this._router.navigate( [ '/visits/list/', this.paramClientId ] )
                .then( ( succeeded: boolean ) => {
                } )
                .catch( error => {
                    console.log( 'Navigate from visit record back to client\'s visit list', error );
                } );
        }, 10 );
    }

    /**
     * Define the visit form with defaults or real values.
     * @param item
     * @return void
     * @private
     */
    private _createForm( item: IVisit = null ): void {
        this.form = this.formBuilder.group( {
            id: [ item ? item.id : '', Validators.compose( [] ) ],
            clientId: [ item && item.clientId ? item.clientId : this.paramClientId, Validators.compose( [ Validators.required ] ) ],
            dt: [ item ? item.dt : '', Validators.compose( [ Validators.required ] ) ],
            dtDate: [ item ? item.dtDate : '', Validators.compose( [] ) ],
            dtMonth: [ item ? item.dtMonth : '', Validators.compose( [] ) ],
            dtYear: [ item ? item.dtYear : '', Validators.compose( [] ) ],
            foodIntakeAm: [ item ? item.foodIntakeAm : '', Validators.compose( [] ) ],
            foodIntakePm: [ item ? item.foodIntakePm : '', Validators.compose( [] ) ],
            liquidIntake: [ item ? item.liquidIntake : '', Validators.compose( [] ) ],
            medication: [ item ? item.medication : '', Validators.compose( [] ) ],
            name: [ item ? item.name : '', Validators.compose( [] ) ],
            notes: [ item ? item.notes : '', Validators.compose( [] ) ],
            securityCheck: [ item ? item.securityCheck : '', Validators.compose( [] ) ],
            visualCheckAm: [ item ? item.visualCheckAm : '', Validators.compose( [] ) ],
            visualCheckPm: [ item ? item.visualCheckPm : '', Validators.compose( [] ) ]
        } );
    }

    /**
     * Watch for control 'dt' for changes.
     * @private
     */
    private watchControlDtForChanges(): void {
        this.form.get( 'dt' ).valueChanges
            .pipe(
                takeUntil( this._unsubscribeAll ),
                tap( ( value: string ) => {
                    const newDate: Date = new Date( value );
                    this.form.get( VISITS.DTDATE ).setValue( newDate.getDate(), { emitEvent: false } );
                    this.form.get( VISITS.DTMONTH ).setValue( newDate.getMonth() + 1, { emitEvent: false } );
                    this.form.get( VISITS.DTYEAR ).setValue( newDate.getFullYear(), { emitEvent: false } );
                } )
            ).subscribe();
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
