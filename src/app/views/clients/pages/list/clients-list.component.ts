import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { IClient } from '../../models/entities/client';
import { ClientsService } from '../../services/clients.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { takeUntil, tap } from 'rxjs/operators';

@Component( {
    selector: 'app-clients-list',
    templateUrl: './clients-list.component.html',
    styleUrls: [ './clients-list.component.scss' ]
} )
export class ClientsListComponent implements OnInit, OnDestroy {

    /**
     * Store all subscriptions.
     * @private
     */
    private _unsubscribeAll = new Subject();

    constructor(
        public clientsService: ClientsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchService: SearchService
    ) {
    }

    ngOnInit(): void {

        // Apply search term to any property within the loaded client items.
        this._searchService.searchTerm$
            .pipe(
                takeUntil( this._unsubscribeAll ),
                tap( ( searchTerm: string ) => {
                    console.log('Search: ' + searchTerm );
                    this.clientsService.loadItems( searchTerm );
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
     * Open a client record.
     * @param item IClient
     * @param event MouseEvent
     * @return void
     */
    open( item: IClient, event: MouseEvent ): void {
        this._router.navigate( [ '../' + item.id ], { relativeTo: this._route } )
            .then( ( succeeded: boolean ) => {
            } )
            .catch( error => {
                console.log('Navigate from client list to open existing client', error);
            } );
    }

    /**
     * Add a client record.
     * @param item IClient
     * @param event MouseEvent
     * @return void
     */
    add(): void {
        this._router.navigate( [ '/clients/add' ] )
            .then( ( succeeded: boolean ) => {
            } )
            .catch( error => {
                console.log('Navigate from client list to new client error', error);
            } );
    }

    /**
     * Load previous batch of clients.
     */
    previous(): void {
        this.clientsService.prevPage();
    }

    /**
     * Load next batch of clients.
     */
    next(): void {
        this.clientsService.nextPage();
    }

    /**
     * Get if prev is disbaled.
     * @return boolean
     */
    disable_prev(): boolean {
        return this.clientsService.disable_prev;
    }

    /**
     * Get pagination click count.
     * @return number
     */
    pagination_clicked_count(): number {
        return this.clientsService.pagination_clicked_count;
    }

    /**
     * Get if next is disbaled.
     * @return boolean
     */
    disable_next(): boolean {
        return this.clientsService.disable_next;
    }

}
