import { Injectable } from '@angular/core';
import { AngularFirestore, Query } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IClient } from '../models/entities/client';
import { VisitsService } from '../../visits/services/visits.service';
import { IClientCount } from '../../../shared/models/entities/setting';
import { SearchService } from '../../../shared/service/search.service';
import { CLIENTS } from '../enums/clients.enum';

@Injectable()
export class ClientsService {

    /**
     * Batch number to load.
     * @private
     */
    private _maxPerPage = 50;

    /**
     * Storage for all clients fetched from Firebase.
     */
    private _itemsSubject: BehaviorSubject<IClient[]> = new BehaviorSubject<IClient[]>( [] );
    items$: Observable<IClient[]> = this._itemsSubject.asObservable();

    /**
     * Used to load clients after the last loaded client.
     */
    lastInResponse: any = null;

    /**
     * Keep count of clients.
     * @private
     */
    private _countClientSubject: BehaviorSubject<number> = new BehaviorSubject<number>( 0 );
    // countClient$: Observable<number> = this._countClientSubject.asObservable();

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
    loadBatch( searchTerm: string, reset: boolean = false ) {
        if ( reset ) {
            this._itemsSubject.next( [] );
            this.lastInResponse = null;
        }
        this.store.collection( CollectionEnum.CLIENTS, ref => {
                let query: Query = ref;
                if ( searchTerm !== '' ) {
                    query = query.where( 'petName', '==', searchTerm );
                    this._itemsSubject.next( [] );
                    this.lastInResponse = null;
                }
                query = query.limit( this._maxPerPage );
                query = query.orderBy( 'customerNumber', 'asc' );
                if ( this.lastInResponse ) {
                    query = query.startAfter( this.lastInResponse );
                }
                return query;
            }
        ).snapshotChanges()
            .pipe(
                take( 1 ),
                tap( response => {
                    console.log( 'loadBatch' );
                    if ( ! response.length ) {
                        console.log( 'No client Data Available' );
                        return false;
                    }
                    this.lastInResponse = response[ response.length - 1 ].payload.doc;

                    let tableData: IClient[] = this._itemsSubject.value;
                    for ( let item of response ) {
                        tableData.push( item.payload.doc.data() as IClient );
                    }
                    this._itemsSubject.next( tableData );
                }, error => {
                    console.log( 'Client loadItems error', error );
                } )
            ).subscribe();
    }

    /**
     * Add a client item to Firebase.
     * @param item IClient
     * @param doSort: boolean
     * @return result of adding an item observable boolean
     */
    addItem( item: IClient, doSort: boolean = true ): Observable<boolean> {
        const cdx = this;
        item.id = this.store.createId();
        return from(
            this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).set( item )
                .then( function() {
                    cdx._incrementClientCount();
                    let clients: IClient[] = cdx._itemsSubject.value;
                    clients.push( item );
                    if ( doSort ) {
                        clients = clients.sort( ( clientA: IClient, clientB: IClient ) => clientA.customerNumber > clientB.customerNumber ? 1 : -1 );
                    }
                    cdx._itemsSubject.next( clients );
                    return Promise.resolve( true );
                } )
                .catch( function( error ) {
                    console.log( 'Client service add item error', error );
                    return Promise.reject( false );
                } )
        );
    }

    /**
     * Update an existing client item in Firebase.
     * @param item IClient
     * @return result of updating or adding an item observable boolean
     */
    updateItem( item: IClient ): Observable<boolean> {
        const cdx = this;
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).update( item )
            .then( function( success ) {
                const clients: IClient[] = cdx._itemsSubject.value;
                const index: number = cdx._itemsSubject.value.findIndex( ( client: IClient ) => client.id === item.id );
                clients[ index ] = item;
                cdx._itemsSubject.next( clients.sort( ( clientA: IClient, clientB: IClient ) => clientA.customerNumber > clientB.customerNumber ? 1 : -1 ) );
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
        const cdx = this;
        return this._visitService.deleteAllClientVisits( item.id )
            .pipe(
                tap( ( result: boolean ) => {
                    if ( result ) {
                        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).delete()
                            .then( function( success ) {
                                cdx._decrementClientCount();
                                const a = cdx._itemsSubject.value;
                                const b = a.filter( ( client: IClient ) => client.id != item.id );

                                cdx._itemsSubject.next( cdx._itemsSubject.value.filter( ( client: IClient ) => client.id != item.id ) );
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
     * Get max clients per page.
     * @return number
     */
    getMaxPerPage(): number {
        return this._maxPerPage;
    }

    /**
     * Get if clients have been loaded.
     * @return boolean
     */
    areClientsLoaded(): boolean {
        return this._itemsSubject.value.length > 0;
    }

    /**
     * Get local client count.
     * @return number
     */
    getClientCountLocally(): number {
        return +this._countClientSubject.value;
    }

    /**
     * Set clients and then the client count.
     * @param items IClient
     * @return void
     */
    setClients( items: IClient[] ): void {
        this._itemsSubject.next( items );
        this._setClientCount( items.length );
    }

    /**
     * Get local clients.
     * @return items IClient
     */
    getClients(): IClient[] {
        return this._itemsSubject.value;
    }

    /**
     * Get current client count from Firebase.
     * @return void
     * @private
     */
    private _getCurrentClientCountFromFirebase(): void {
        this.store.collection<IClientCount>( CollectionEnum.SETTINGS ).doc( CLIENTS.CLIENTCOUNT ).valueChanges()
            .pipe(
                take( 1 ),
                tap( ( response: IClientCount ) => {
                    this._countClientSubject.next( response.counter );
                } )
            ).subscribe();
    }

    /**
     * Update client count in Firebase
     * @param value
     * @param isIncrement boolean should we increment or decrement the count.
     * @param isIncrement
     */
    private _updateClientCountInFirebase( value: number ): Observable<boolean> {
        return from(
            this.store.collection<IClientCount>( CollectionEnum.SETTINGS ).doc( CLIENTS.CLIENTCOUNT ).set( { counter: value } )
                .then( function( success ) {
                    return Promise.resolve( true );
                } )
                .catch( function( error ) {
                    return Promise.reject( false );
                } )
        );
    }

    /**
     * Increment client count then update Firebase and local counts.
     * @param amount number amount to add on to current client count.
     * @return void
     */
    private _incrementClientCount( amount: number = 1 ): void {
        const newValue: number = this.getClientCountLocally() + amount;
        this._setClientCountLocally( newValue );
        this._updateClientCountInFirebase( newValue );
    }

    /**
     * Decrement client count then update Firebase and local counts.
     * @param amount number amount to take off from the current client count.
     * @return void
     */
    private _decrementClientCount( amount: number = 1 ): void {
        const newValue: number = this.getClientCountLocally() - amount;
        this._setClientCountLocally( newValue );
        this._updateClientCountInFirebase( newValue );
    }

    /**
     * Set clients and the counts.
     * @param value
     * @private
     */
    private _setClientCount( value: number ): void {
        this._setClientCountLocally( value );
        this._updateClientCountInFirebase( value );
    }

    /**
     * Set local client count.
     * @param value
     * @return void
     */
    private _setClientCountLocally( value: number ): void {
        this._countClientSubject.next( value );
    }

    /**
     * Get all dummy items from Firebase.
     * @return void.
     */
    getDummyData(): Observable<IClient[]> {
        return this.store.collection( CollectionEnum.CLIENTS, ref => ref.where( 'petName', '==', 'Dummy' ) ).get()
            .pipe(
                take( 1 ),
                map( response => {
                    return response.docs.map( item => item.data() as IClient );
                }, error => {
                    console.log( 'Client loadItems error', error );
                } )
            );
    }

    /**
     * Delete all dumy data from Firebase.
     * @return observable booelan.
     * @param item
     */
    deleteDummy( item: IClient ): Observable<boolean> {
        const cdx = this;
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).delete()
            .then( function( success ) {
                return true;
            } )
            .catch( function( error ) {
                return false;
            } )
        );
    }

}
