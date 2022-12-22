import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { takeUntil, tap } from 'rxjs/operators';
import { VisitsService } from '../../services/visits.service';
import { IVisit } from '../../models/entities/visits';
import { VISITS } from '../../enums/visits.enum';

@Component( {
    selector: 'app-visits-list',
    templateUrl: './visits-list.component.html',
    styleUrls: [ './visits-list.component.scss' ]
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
        private _searchService: SearchService
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
                this.visitsService.reset();
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

}
