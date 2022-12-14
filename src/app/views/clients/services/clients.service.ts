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

@Injectable()
export class ClientsService {

    /**
     * Batch number to load.
     * @private
     */
    private _maxPerPage = 5;

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
    addItem( item: IClient ): Observable<boolean> {
        const newId: string = this.store.createId();
        // return from(
        //     this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( newId ).set( { ... item, id: newId } )
        //         .then( function() {
        //             this.updateClientCountInFirebase();
        //             return Promise.resolve( true );
        //         } )
        //         .catch( function( error ) {
        //             console.log( 'Client service add item error', error );
        //             return Promise.reject( false );
        //         } )
        // );
        this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( newId ).set( { ... item, id: newId } );
        this.updateClientCountInFirebase();
        return of( true );
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
                                this.updateClientCountInFirebase( false );
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
     * @param isIncrement boolean should we increment or decrement the count.
     * @param isIncrement
     */
    updateClientCountInFirebase( isIncrement: boolean = true ): void {
        const newCountClient: string = isIncrement ? ( +this._countClientSubject.value + 1 ).toString() : ( +this._countClientSubject.value - 1 ).toString();
        // this.store.collection<IClientCount>( CollectionEnum.SETTINGS ).doc( CLIENTS.CLIENTCOUNT ).set( { counter: newCountClient } )
        //     .then( function( success ) {
        //         this._countClientSubject.next( newCountClient );
        //         return true;
        //     } )
        //     .catch( function( error ) {
        //         return false;
        //     } );
        this.store.collection<IClientCount>( CollectionEnum.SETTINGS ).doc( CLIENTS.CLIENTCOUNT ).set( { counter: newCountClient } );
        this._countClientSubject.next( newCountClient );
    }

    getMaxPerPage(): number {
        return this._maxPerPage;
    }

    areClientsLoaded(): boolean {
        return this._countClientSubject.value.length > 0;
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

    deleteDummy( item: IClient ): Observable<boolean> {
        // return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).delete()
        //     .then( function( success ) {
        //         this.updateClientCountInFirebase( false );
        //         return true;
        //     } )
        //     .catch( function( error ) {
        //         return false;
        //     } )
        // );
        this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).delete();
        this.updateClientCountInFirebase( false );
        return of( true );
    }

}
