import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IClient } from '../../models/entities/client';
import { ClientsService } from '../../services/clients.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { filter, map, reduce, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component( {
    selector: 'app-clients-list',
    templateUrl: './clients-list.component.html',
    styleUrls: [ './clients-list.component.scss' ]
} )
export class ClientsListComponent implements OnInit, OnDestroy {

    /**
     * Store items to show in the list.
     */
    items$: Observable<IClient[]>;

    /**
     * Store all subscriptions.
     * @private
     */
    private _unsubscribeAll = new Subject();

    constructor(
        private _clientsService: ClientsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchService: SearchService
    ) {
    }

    ngOnInit(): void {

        this._clientsService.loadItems();

        this._searchService.searchTerm$
            .pipe(
                takeUntil( this._unsubscribeAll ),
                tap( ( searchTerm: string ) => {
                    console.log( 'Search: ' + searchTerm );
                    this.items$ = this._clientsService.items$;
                    //   .pipe(
                    //     reduce( ( items: IClient[] ) => {
                    //       return items.filter( ( item: IClient ) => item.address.includes( searchTerm ) );
                    //     } )
                    //   );
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
        this._router.navigate( [ '../' + item.id ], { state: item, relativeTo: this._route } )
            .then( ( succeeded: boolean ) => {
            } )
            .catch( error => {
            } );
    }

}
