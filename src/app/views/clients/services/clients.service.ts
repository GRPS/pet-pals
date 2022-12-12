import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IClient } from '../models/entities/client';
import { VisitsService } from '../../visits/services/visits.service';
import { IClientCount } from '../../../shared/models/entities/setting';
import { SearchService } from '../../../shared/service/search.service';

@Injectable()
export class ClientsService {

    private _maxPerPage = 2;

    tableData: any[] = [];
    /**
     * Storage for all clients fetched from Firebase.
     */
    private _itemsSubject: BehaviorSubject<IClient[]> = new BehaviorSubject<IClient[]>( [] );
    items$: Observable<IClient[]> = this._itemsSubject.asObservable();

    firstInResponse: any = null;
    lastInResponse: any = null;
    prev_start_at: any = [];
    pagination_clicked_count = 0;
    disable_next: boolean = false;
    disable_prev: boolean = false;

    searchTerm: string;

    /**
     * Keep count of clients.
     * @private
     */
    private _countClientSubject: BehaviorSubject<string> = new BehaviorSubject<string>( '' );
    countClient$: Observable<string> = this._countClientSubject.asObservable();

    constructor(
        private store: AngularFirestore,
        private _visitService: VisitsService,
        private _searchService: SearchService
    ) {
        this._getCurrentClientCountFromFirebase();
    }

    /**
     * Load all items from Firebase.
     * @return void.
     */
    loadItems( searchTerm: string ) {
        this.searchTerm = searchTerm;
        console.log( 'loadItems now!!!' );
        this.store.collection( CollectionEnum.CLIENTS, ref => {
                let query: Query = ref;
                if ( searchTerm !== '' ) {
                    query = query.where( 'petName', '==', searchTerm );
                }
                query = query.limit( this._maxPerPage );
                query = query.orderBy( 'customerNumber', 'asc' );
                return query;
            }
        ).snapshotChanges()
            .pipe(
                take( 1 ),
                tap( response => {
                    console.log( 'loadItems' );
                    if ( ! response.length ) {
                        console.log( 'No client Data Available' );
                        return false;
                    }
                    this.firstInResponse = response[ 0 ].payload.doc;
                    this.lastInResponse = response[ response.length - 1 ].payload.doc;

                    this.tableData = [];
                    for ( let item of response ) {
                        this.tableData.push( item.payload.doc.data() );
                    }
                    this._itemsSubject.next( this.tableData );

                    //Initialize values
                    this.prev_start_at = [];
                    this.pagination_clicked_count = 0;
                    this.disable_next = false;
                    this.disable_prev = false;

                    //Push first item to use for Previous action
                    this.push_prev_startAt( this.firstInResponse );
                }, error => {
                    console.log( 'Client loadItems error', error );
                } )
            ).subscribe();
    }

    // Add document
    push_prev_startAt( prev_first_doc ): void {
        this.prev_start_at.push( prev_first_doc );
    }

    // Remove not required document
    pop_prev_startAt( prev_first_doc ): void {
        this.prev_start_at.forEach( element => {
            if ( prev_first_doc.data().id == element.data().id ) {
                element = null;
            }
        } );
    }

    // Return the Doc rem where previous page will startAt
    get_prev_startAt(): void {
        if ( this.prev_start_at.length > ( this.pagination_clicked_count + 1 ) ) {
            this.prev_start_at.splice( this.prev_start_at.length - 2, this.prev_start_at.length - 1 );
        }
        return this.prev_start_at[ this.pagination_clicked_count - 1 ];
    }

    /**
     * Pagination to the next page.
     * @return void
     */
    nextPage(): void {
        this.disable_next = true;
        this.store.collection( CollectionEnum.CLIENTS, ref => {
                let query: Query = ref;
                if ( this.searchTerm ) {
                    query = query.where( 'petName', '==', this.searchTerm );
                }
                query = query.limit( this._maxPerPage );
                query = query.orderBy( 'customerNumber', 'asc' );
                query = query.startAfter( this.lastInResponse );
                return query;
            }
        ).get()
            .pipe(
                take( 1 ),
                tap( response => {
                    console.log( 'nextPage' );
                    if ( ! response.docs.length ) {
                        this.disable_next = true;
                        return;
                    }

                    this.firstInResponse = response.docs[ 0 ];
                    this.lastInResponse = response.docs[ response.docs.length - 1 ];

                    this.tableData = [];
                    for ( let item of response.docs ) {
                        this.tableData.push( item.data() );
                    }
                    this._itemsSubject.next( this.tableData );

                    this.pagination_clicked_count++;

                    this.push_prev_startAt( this.firstInResponse );

                    this.disable_next = this.tableData.length < this._maxPerPage;
                }, error => {
                    console.log( 'Client nextPage error', error );
                    this.disable_next = false;
                } )
            ).subscribe();
    }

    /**
     * Pagination to the previous page.
     * @return void
     */
    prevPage(): void {
        this.disable_prev = true;
        this.store.collection( CollectionEnum.CLIENTS, ref => {
                let query: Query = ref;
                if ( this.searchTerm ) {
                    query = query.where( 'petName', '==', this.searchTerm );
                }
                query = query.limit( this._maxPerPage );
                query = query.orderBy( 'customerNumber', 'asc' );
                query = query.startAt( this.get_prev_startAt() );
                query = query.endBefore( this.firstInResponse );
                return query;
            }
        ).get()
            .pipe(
                take( 1 ),
                tap( response => {
                    console.log( 'prevPage' );
                    this.firstInResponse = response.docs[ 0 ];
                    this.lastInResponse = response.docs[ response.docs.length - 1 ];

                    this.tableData = [];
                    for ( let item of response.docs ) {
                        this.tableData.push( item.data() );
                    }
                    this._itemsSubject.next( this.tableData );

                    //Maintaing page no.
                    this.pagination_clicked_count--;

                    //Pop not required value in array
                    this.pop_prev_startAt( this.firstInResponse );

                    //Enable buttons again
                    this.disable_prev = false;
                    this.disable_next = false;
                }, error => {
                    console.log( 'Client prevPage error', error );
                    this.disable_prev = false;
                } )
            ).subscribe();
    }

    /**
     * Add a client item to Firebase.
     * @param item IClient
     * @return result of adding an item observable boolean
     */
    addItem( item: IClient ): Observable<boolean> {
        const newId: string = this.store.createId();
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( newId ).set( { ... item, id: newId } )
            .then( function( success ) {
                // this.updateClientCount( true );
                return true;
            } )
            .catch( function( error ) {
                console.log( 'Client service add item error', error );
                return false;
            } )
        );
    }

    /**
     * Update an existing client item in Firebase.
     * @param item IClient
     * @return result of updating or adding an item observable boolean
     */
    updateItem( item: IClient ): Observable<boolean> {
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).update( item )
            .then( function( success ) {
                return true;
            } )
            .catch( function( error ) {
                console.log( 'Client service update item error', error );
                return false;
            } )
        );
    }

    /**
     * Delete client item from Firebase.
     * @param item IClient
     * @return result of deleting an item observable boolean
     */
    deleteItem( item: IClient ): Observable<boolean> {

        return this._visitService.deleteAllClientVisits( item.id )
            .pipe(
                tap( ( result: boolean ) => {
                    if ( result ) {
                        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).delete()
                            .then( function( success ) {
                                // this.updateClientCount( false );
                                return true;
                            } )
                            .catch( function( error ) {
                                return false;
                            } )
                        );
                    } else {
                        return false;
                        console.log( 'Client service deleteItem cannot delete visits error' );
                    }
                } ),
                catchError( error => {
                    console.log( 'Client service delete item error', error );
                    return of( false );
                } )
            );

    }

    /**
     * Get a document by its id.
     * @param id string
     * @return Observable<IClient>
     */
    getItemById( id: string ): Observable<IClient> {
        return this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( id ).valueChanges();
    }

    /**
     * Get current client count from Firebase.
     * @return void
     * @private
     */
    private _getCurrentClientCountFromFirebase(): void {
        this.store.collection<IClientCount>( 'settings' ).doc( 'clientCount' ).valueChanges()
            .pipe(
                take( 1 ),
                tap( ( response: IClientCount ) => {
                    this._countClientSubject.next( response.counter );
                } )
            ).subscribe();
    }

    /**
     * Update client count in Firebase
     * @param isIncrement boolean should we increment or decrement the count.
     * @param isIncrement
     */
    updateClientCountInFirebase( isIncrement: boolean = true ): void {
        const newCountClient: string = isIncrement ? ( +this._countClientSubject.value + 1 ).toString() : ( +this._countClientSubject.value - 1 ).toString();
        this.store.collection<IClientCount>( 'settings' ).doc( 'clientCount' ).set( { counter: newCountClient } )
            .then( function( success ) {
                this._countClientSubject.next( newCountClient );
                return true;
            } )
            .catch( function( error ) {
                return false;
            } );
    }

}
