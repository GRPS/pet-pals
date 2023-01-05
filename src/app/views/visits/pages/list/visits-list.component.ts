import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { takeUntil, tap } from 'rxjs/operators';
import { VisitsService } from '../../services/visits.service';
import { IVisit } from '../../models/entities/visits';
import { VISITS } from '../../enums/visits.enum';
import { AlertService } from '../../../../shared/service/alert.service';
import { DatePipe } from '@angular/common';
import { ClipboardService } from '../../../auth/services/clipboard.service';

@Component( {
    selector: 'app-visits-list',
    templateUrl: './visits-list.component.html',
    styleUrls: [ './visits-list.component.scss' ],
    providers: [ DatePipe ]
} )
export class VisitsListComponent implements OnInit, OnDestroy {

    paramClientId: string;

    /**
     * Store all subscriptions.
     * @private
     */
    private _unsubscribeAll = new Subject();

    constructor(
        public visitsService: VisitsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchService: SearchService,
        private _alertService: AlertService,
        private _datepipe: DatePipe,
        private _clipboardService: ClipboardService
    ) {
        this._searchService.hideSearch();
    }

    ngOnInit(): void {

        // Load visits.
        this._route.paramMap
            .pipe(
                takeUntil( this._unsubscribeAll ),
                tap( ( params: ParamMap ) => {
                    this.paramClientId = params.get( VISITS.CLIENTID );
                    this.visitsService.setIsAllVisits( this.paramClientId === VISITS.ALL );
                    if ( ! this.visitsService.areVisitsLoaded() ) {
                        this.visitsService.loadItems( this.paramClientId );
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
        this._unsubscribeAll.complete();
        this.visitsService.reset();
    }

    /**
     * Open a visit record.
     * @param item IVisit
     * @param event MouseEvent
     * @return void
     */
    open( item: IVisit, event: MouseEvent ): void {
        this._router.navigate( [ '../../' + this.paramClientId + '/' + item.id ], { relativeTo: this._route } )
            .then( () => {
            } )
            .catch( error => {
                console.log( 'Navigate from visit list to open existing visit', error );
            } );
    }

    /**
     * Go back to client list.
     * @return void
     */
    back(): void {
        const url: string = this.visitsService.getIsAllVisits() ? '/clients' : '/clients/' + this.paramClientId;
        this._router.navigate( [ url ] )
            .then( () => {
            } )
            .catch( error => {
                console.log( 'Navigate from visit list to specific client', error );
            } );
    }

    /**
     * Open a visit record.
     * @return void
     */
    add(): void {
        this._router.navigate( [ '../../add/' + this.paramClientId ], { relativeTo: this._route } )
            .then( () => {
            } )
            .catch( error => {
                console.log( 'Navigate from visit list to new visit error', error );
            } );
    }

    toggleCheckedItem( item ): void {
        item.checked = ! item.checked;
    }

    /**
     * Export selected visits to the clipboard.
     * @return void
     */
    export(): void {

        const checkedItems: IVisit[] = this.visitsService.getCheckedVisits();

        if ( checkedItems.length === 0 ) {
            this._alertService.areYouSure( 'Nothing to export!', 'Please select which visits you want to export.', false, 'warning', 'OK' );
        } else {
            console.log( checkedItems );

            let data: string = '';
            checkedItems.forEach( ( item: IVisit ) => data +=
                'Date: ' + this._datepipe.transform( item.dt, 'EEEE, dd MMMM yyyy' ) + '\n' +
                'Visual Check AM: ' + ( item.visualCheckAm ? item.visualCheckAm : '' ) + '\n' +
                'Visual Check PM: ' + ( item.visualCheckPm ? item.visualCheckPm : '' ) + '\n' +
                'Food Intake AM: ' + ( item.foodIntakeAm ? item.foodIntakeAm : '' ) + '\n' +
                'Food Intake PM: ' + ( item.foodIntakePm ? item.foodIntakePm : '' ) + '\n' +
                'Medication AM: ' + ( item.medicationAm ? item.medicationAm : '' ) + '\n' +
                'Medication PM: ' + ( item.medicationPm ? item.medicationPm : '' ) + '\n' +
                'Security Check AM: ' + ( item.securityCheckAm ? item.securityCheckAm : '' ) + '\n' +
                'Security Check PM: ' + ( item.securityCheckPm ? item.securityCheckPm : '' ) + '\n' +
                'Notes AM: ' + ( item.notesAm ? item.notesAm : '' ) + '\n\n\n' +
                'Notes PM: ' + ( item.notesPm ? item.notesPm : '' ) + '\n\n\n'
            );

            this._clipboardService.add( data );

        }

    }

}
