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
        private _datepipe: DatePipe
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
        this._router.navigate( [ '../../' + item.id ], { relativeTo: this._route } )
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

            let data: string = ''
            checkedItems.forEach( ( item: IVisit ) => data +=
                'Date: ' + this._datepipe.transform( item.dt, 'EEEE, dd MMMM yyyy' ) + '\n' +
                'Visual Check AM: ' + item.visualCheckAm + '\n' +
                'Visual Check PM: ' + item.visualCheckPm + '\n' +
                'Food Intake AM: ' + item.foodIntakeAm + '\n' +
                'Food Intake PM: ' + item.foodIntakePm + '\n' +
                'Medication: ' + item.medication + '\n' +
                'Security Check: ' + item.securityCheck + '\n' +
                'Notes: ' + item.notes + '\n\n\n'
            );

            const val: string = 'poo\tnwee\n\nbag';
            const selBox = document.createElement( 'textarea' );
            selBox.style.position = 'fixed';
            selBox.style.left = '0';
            selBox.style.top = '0';
            selBox.style.opacity = '0';
            selBox.value = data;
            document.body.appendChild( selBox );
            selBox.focus();
            selBox.select();
            document.execCommand( 'copy' );
            document.body.removeChild( selBox );

            this._alertService.areYouSure( 'Clipboard Updated', 'The clipboard now contains your selected visits data.<br><br>You can now paste the clipboard content to where ever you wish. ', false, 'success', 'OK' );
        }

    }

}
