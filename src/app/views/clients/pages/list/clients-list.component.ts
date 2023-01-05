import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { IClient } from '../../models/entities/client';
import { ClientsService } from '../../services/clients.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { skip, takeUntil, tap } from 'rxjs/operators';
import { AlertService } from '../../../../shared/service/alert.service';

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

    /**
     * Used to search.
     */
    searchTerm: string = '';

    constructor(
        public clientsService: ClientsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchService: SearchService,
        private _alertService: AlertService
    ) {
        if ( ! clientsService.areClientsLoaded() ) {
            this.clientsService.loadBatch( this.searchTerm, true );
        }
        this._searchService.showSearch();
    }

    ngOnInit(): void {

        // Apply search term to any property within the loaded client items.
        this._searchService.searchTerm$
            .pipe(
                takeUntil( this._unsubscribeAll ),
                skip( 1 ),
                tap( ( searchTerm: string ) => {
                    console.log( 'Search: ' + searchTerm );
                    this.searchTerm = searchTerm;
                    this.clientsService.loadBatch( searchTerm, true );
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
     * Load next batch of clients.
     * @return void
     */
    nextBatch( isNext: boolean = true ): void {
        this.clientsService.loadBatch( this.searchTerm, false, isNext );
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
                console.log( 'Navigate from client list to open existing client', error );
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
                console.log( 'Navigate from client list to new client error', error );
            } );
    }

    /**
     * Export data.
     */
    export(): void {
        this.clientsService.export();
    }

    /**
     * Add dummy data.
     * @return void.
     */
    dummyData(): void {
        const currentClientCount: number = this.clientsService.getClientCountLocally();
        for ( let i = 1; i <= this.clientsService.getMaxPerPage(); i++ ) {
            const newIndex: number = 1000 + currentClientCount + i;
            const item: IClient = {
                id: '',
                emailAddress: 'Dummy',
                securedIndoors: 'Dummy A ',
                customerNumber: null,
                customerNumberStr: null,
                feedingRoutine: 'Dunny fr ',
                health: 'Dummy h ',
                name: ' Dummy n ',
                other: 'Dummy o ',
                litter: 'Dummy l ',
                petName: 'Dummy'
            };
            item.emailAddress += newIndex;
            item.securedIndoors += newIndex;
            item.customerNumber = newIndex;
            item.customerNumberStr = newIndex.toString();
            item.feedingRoutine += newIndex;
            item.health += newIndex;
            item.name += newIndex;
            item.other += newIndex;
            item.litter += newIndex;
            this.clientsService.addItem( item );
        }
        this._alertService.toast( 'Please reload site!', 'warning', 3000 );
    }

    /**
     * Delete all dummy data.
     * @return void
     */
    dummyDataDelete(): void {
        this.clientsService.getDummyData()
            .pipe(
                tap( ( items: IClient[] ) => {
                    console.log( ' Deleting dummy count: ' + items.length );
                    items.forEach( ( item: IClient, index ) => {
                        this.clientsService.deleteDummy( item );
                    } );
                    const newItems: IClient[] = this.clientsService.getClients().filter( ( item: IClient ) => item.petName != 'Dummy' );
                    this.clientsService.setClients( newItems );
                } )
            ).subscribe();
    }

}
