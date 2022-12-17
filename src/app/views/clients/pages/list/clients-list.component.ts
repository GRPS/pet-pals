import { ApplicationRef, Component, ComponentFactoryResolver, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { IClient } from '../../models/entities/client';
import { ClientsService } from '../../services/clients.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { skip, takeUntil, tap } from 'rxjs/operators';

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

    // Used for nextBatch
    searchTerm: string = '';

    constructor(
        public clientsService: ClientsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchService: SearchService
    ) {
        if ( !clientsService.areClientsLoaded() ) {
            this.clientsService.loadBatch( this.searchTerm, true );
        }
    }

    ngOnInit(): void {

        // Apply search term to any property within the loaded client items.
        this._searchService.searchTerm$
            .pipe(
                takeUntil( this._unsubscribeAll ),
                skip( 1 ),
                tap( ( searchTerm: string ) => {
                    console.log('Search: ' + searchTerm );
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
    nextBatch(): void {
        this.clientsService.loadBatch( this.searchTerm );
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
     * Add dummy data.
     * @return void.
     */
    dummyData(): void {
        const currentClientCount: number = this.clientsService.getClientCountLocally();
        for ( let i = 1; i <= this.clientsService.getMaxPerPage(); i++ ) {
            const item: IClient = {
                id: '',
                address: 'Dummy A ',
                customerNumber: 'Dummy CN ',
                feedingRoutine: 'Dunny fr ',
                health: 'Dummy h ',
                name: ' Dummy n ',
                other: 'Dummy o ',
                petName: 'Dummy'
            };
            item.address += i;
            item.customerNumber += i;
            item.feedingRoutine += i;
            item.health += i;
            item.name += i;
            item.other += i;
            this.clientsService.addItem( item, i === this.clientsService.getMaxPerPage() );
        }
    }

    /**
     * Delete all dummy data.
     * @return void
     */
    dummyDataDelete(): void {
        this.clientsService.getDummyData()
            .pipe(
                tap( ( items: IClient[] ) => {
                    console.log(' Deleting dummy count: ' + items.length );
                    items.forEach( ( item: IClient, index ) => {
                        this.clientsService.deleteDummy( item );
                    } );
                    const newItems: IClient[] = this.clientsService.getClients().filter( ( item: IClient ) => item.petName != 'Dummy' );
                    this.clientsService.setClients( newItems );
                } )
            ).subscribe();
    }

}
