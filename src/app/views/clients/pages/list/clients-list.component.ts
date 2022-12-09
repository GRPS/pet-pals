import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IClient } from '../../models/entities/client';
import { ClientsService } from '../../services/clients.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../../../shared/service/search.service';
import { map, takeUntil, tap } from 'rxjs/operators';

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
     * Store total client items before any filtering.
     */
    totalItems: number;

    /**
     * Store all subscriptions.
     * @private
     */
    private _unsubscribeAll = new Subject();

    /**
     * Hanlde on table element.
     */
    @ViewChild( 'tableElement', { static: false } ) tableRef: ElementRef;

    /**
     * Defines table width with model loaded.
     */
    tableWidth: number = 0;

    constructor(
        private _clientsService: ClientsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _searchService: SearchService,
        private element: ElementRef,
    ) {
    }

    ngOnInit(): void {

        // Load all client items.
        this._clientsService.loadItems();

        // Apply search term to any property within the loaded client items.
        this._searchService.searchTerm$
            .pipe(
                takeUntil( this._unsubscribeAll ),
                tap( ( searchTerm: string ) => {
                    this.items$ = this._clientsService.items$
                        .pipe(
                            map( ( items: IClient[] ) => {
                                this.totalItems = items.length;
                                return items.filter( ( item: IClient ) => {
                                    return Object.keys( item ).reduce( ( acc, curr ) => {
                                        return acc || item[ curr ].toLowerCase().includes( searchTerm.toLowerCase() );
                                    }, false );
                                } );
                            } )
                        );
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
            } );
    }

}
