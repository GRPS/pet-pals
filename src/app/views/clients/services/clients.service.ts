import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IClient } from '../models/entities/client';
import { VisitsService } from '../../visits/services/visits.service';
import { IClientCount } from '../../../shared/models/entities/setting';
import { SearchService } from '../../../shared/service/search.service';
import { CLIENTS } from '../enums/clients.enum';
import { async } from 'rxjs/internal/scheduler/async';

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
                    console.log('loadBatch');
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
     * @return result of adding an item observable boolean
     */
    addItem( item: IClient, updateFireBaseCount: boolean = true ): Observable<boolean> {
        const cdx = this;
        item.id = this.store.createId();
        return from(
            this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).set( item )
                .then( function() {
                    if( updateFireBaseCount ) {
                        cdx.updateClientCountInFirebase();
                    }
                    const clients: IClient[] = cdx._itemsSubject.value;
                    clients.push( item );
                    cdx._itemsSubject.next( clients.sort(( clientA: IClient, clientB: IClient ) => clientA.customerNumber > clientB.customerNumber ? 1 : -1 ) );
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
                cdx._itemsSubject.next( clients.sort(( clientA: IClient, clientB: IClient ) => clientA.customerNumber > clientB.customerNumber ? 1 : -1 ) );
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
                                cdx.updateClientCountInFirebase( 1, false );
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
    updateClientCountInFirebase( value: number = 1, isIncrement: boolean = true ): void {
        const cdx = this;
        const newCountClient: string = isIncrement ? ( +this._countClientSubject.value + value ).toString() : ( +this._countClientSubject.value - value ).toString();
        this.store.collection<IClientCount>( CollectionEnum.SETTINGS ).doc( CLIENTS.CLIENTCOUNT ).set( { counter: newCountClient } )
            .then( function( success ) {
                cdx._countClientSubject.next( newCountClient );
                return true;
            } )
            .catch( function( error ) {
                return false;
            } );
    }

    getMaxPerPage(): number {
        return this._maxPerPage;
    }

    areClientsLoaded(): boolean {
        return this._countClientSubject.value.length > 0;
    }

    getClientCountLocally(): number {
        return +this._countClientSubject.value;
    }
    setClientCountLocally( value: number ): void {
        this._countClientSubject.next( value.toString() );
    }

    setClients( items: IClient[] ): void {
        this._itemsSubject.next( items );
    }

    getClients(): IClient[] {
        return this._itemsSubject.value;
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
