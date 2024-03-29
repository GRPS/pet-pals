import { Injectable } from '@angular/core';
import { AngularFirestore, Query, QueryDocumentSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable, of, Subscription } from 'rxjs';
import { catchError, filter, take, tap } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IClient } from '../models/entities/client';
import { VisitsService } from '../../visits/services/visits.service';
import { IClientCount } from '../../../shared/models/entities/setting';
import { SearchService } from '../../../shared/service/search.service';
import { AuthService } from '../../auth/services/auth.service';

import firebase from 'firebase';
import { ClipboardService } from '../../../shared/service/clipboard.service';
import QuerySnapshot = firebase.firestore.QuerySnapshot;

@Injectable()
export class ClientsService {

    /**
     * Batch number to load.
     * @private
     */
    private _maxPerPage = 20;

    /**
     * Storage for all clients fetched from Firebase.
     */
    private _itemsSubject: BehaviorSubject<IClient[]> = new BehaviorSubject<IClient[]>( [] );
    items$: Observable<IClient[]> = this._itemsSubject.asObservable();

    /**
     * Used to load clients after the last loaded client when going to next page OR clients from last page when going to previous page.
     */
    lastInResponse: any = null;
    firstInResponse: any = null;

    /**
     * Disabled pagination buttons.
     * @param clientsService
     * @param _route
     * @param _router
     * @param _searchService
     */
    disablePrevious: boolean = true;
    disableNext: boolean = true;

    /**
     * Keep count of clients.
     * @private
     */
    private _countClientSubject: BehaviorSubject<number> = new BehaviorSubject<number>( 0 );

    // countClient$: Observable<number> = this._countClientSubject.asObservable();
    sub: Subscription;

    starts: any[] = [];
    starts2: any[] = [];

    private _waitMessage: BehaviorSubject<string> = new BehaviorSubject<string>( '' );
    waitMessage$: Observable<string> = this._waitMessage.asObservable();

    constructor(
        private store: AngularFirestore,
        private _visitService: VisitsService,
        private _searchService: SearchService,
        private _auth: AuthService,
        private _clipboardService: ClipboardService
    ) {
        this._getCurrentClientCountFromFirebase();
    }

    /**
     * Load all items from Firebase.
     * @return void.
     */
    loadBatch( searchTerm: string, reset: boolean = false, isNext: boolean = true ) {

        // In app.module.ts the enablePersistence line make this call run twice for some bizzare reason.
        // We use this variable to stop that duplicate call.
        let allowEnablePersistenceCall: boolean = true;

        if ( reset ) {
            this._itemsSubject.next( [] );
            this.lastInResponse = null;
            this.firstInResponse = null;
            this.disablePrevious = true;
            this.disableNext = true;
            isNext = true;
        }

        if ( isNext ) {
            this.firstInResponse = null;
        } else {
            if ( this.starts.length > 1 ) {
                this.starts = this.starts.slice( 0, this.starts.length - 1 );
                this.starts2 = this.starts2.slice( 0, this.starts2.length - 1 );
            }
            this.firstInResponse = this.starts.length === 0 ? null : this.starts[ this.starts.length - 1 ];
            this.lastInResponse = this.starts.length === 0 ? null : this.lastInResponse;
        }

        if ( this.firstInResponse === undefined || this.lastInResponse === undefined ) {
            return;
        }

        this.sub = this.store.collection( CollectionEnum.CLIENTS, ref => {
                let query: Query = ref;
                if ( searchTerm !== '' ) {
                    query = query.orderBy( 'customerNumber' ).startAt( searchTerm ).endAt( searchTerm + '~' );
                    this._itemsSubject.next( [] );
                    this.lastInResponse = null;
                }
                query = query.limit( this._maxPerPage );
                if ( searchTerm === '' ) {
                    query = query.orderBy( 'customerNumberDigits', 'asc' );
                }
                if ( this.firstInResponse ) {
                    query = query.startAt( this.firstInResponse );
                } else if ( this.lastInResponse ) {
                    query = query.startAfter( this.lastInResponse );
                }
                return query;
            }
        ).snapshotChanges()
            .pipe(
                // take( 1 ),
                tap( response => {
                    if ( allowEnablePersistenceCall ) {
                        if ( ! response.length ) {
                            console.log( 'No client Data Available' );
                            this.disableNext = true;
                            return false;
                        }

                        // Keeps pagination starts up-to-date.
                        if ( isNext ) {
                            // Second call want to add the same doc to starts so if it alredy exists then don't add it.
                            // This help previous button to work.
                            if ( this.starts.findIndex( item => ( item.data() as IClient ).customerNumber === ( response[ 0 ].payload.doc.data() as IClient ).customerNumber ) === -1 ) {
                                this.starts.push( response[ 0 ].payload.doc );
                                this.starts2.push( ( response[ 0 ].payload.doc.data() as IClient ).customerNumber );
                            }
                        }
                        this.lastInResponse = response[ response.length - 1 ].payload.doc;

                        const tableData: IClient[] = [];
                        for ( const item of response ) {
                            // console.log( item.payload.doc.metadata );
                            tableData.push( item.payload.doc.data() as IClient );
                        }
                        this._itemsSubject.next( tableData );
                        // allowEnablePersistenceCall = false;

                        this.disableNext = response.length < this._maxPerPage;
                        this.disablePrevious = ! ( this.starts.length > 1 );

                    } else {
                        console.log( 'Duplicate call cancelled.' );
                    }
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
        item.customerNumberDigits = this.getCustomerNumberDigits( item.customerNumber );
        return from(
            this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).set( item )
                .then( () => {
                    cdx._incrementClientCount();
                    let clients: IClient[] = cdx._itemsSubject.value;
                    clients.push( item );
                    if ( doSort ) {
                        clients = clients.sort( ( clientA: IClient, clientB: IClient ) => clientA.customerNumber > clientB.customerNumber ? 1 : -1 );
                    }
                    cdx._itemsSubject.next( clients );
                    return Promise.resolve( true );
                } )
                .catch( ( error ) => {
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
        item.customerNumberDigits = this.getCustomerNumberDigits( item.customerNumber );
        const cdx = this;
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).update( item )
            .then( () => {
                const clients: IClient[] = cdx._itemsSubject.value;
                const index: number = cdx._itemsSubject.value.findIndex( ( client: IClient ) => client.id === item.id );
                clients[ index ] = item;
                cdx._itemsSubject.next( clients.sort( ( clientA: IClient, clientB: IClient ) => clientA.customerNumber > clientB.customerNumber ? 1 : -1 ) );
                return true;
            } )
            .catch( ( error ) => {
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
                            .then( () => {
                                cdx._decrementClientCount();
                                cdx._itemsSubject.next( cdx._itemsSubject.value.filter( ( client: IClient ) => client.id !== item.id ) );
                                return true;
                            } )
                            .catch( ( error ) => {
                                console.log( 'Client service delete item error', error );
                                return false;
                            } )
                        );
                    } else {
                        console.log( 'Client service deleteItem cannot delete visits error' );
                        return false;
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
     * Export client data.
     */
    // export(): void {
    //     this.store.collection<IClientCount>( CollectionEnum.CLIENTS ).get()
    //         .pipe(
    //             take( 1 ),
    //             tap( ( clientsSnapshot: QuerySnapshot ) => {
    //                 const fullExport: string[] = [];
    //                 clientsSnapshot.docs.forEach( ( item: QueryDocumentSnapshot<IClient> ) => {
    //                     const clientDoc: IClient = item.data() as IClient;
    //                     const clientData: string = 'Customer Number: ' + clientDoc.customerNumber +
    //                         '\nName: ' + clientDoc.name +
    //                         '\nPet Name: ' + clientDoc.petName +
    //                         '\nSecured Indoors: ' + clientDoc.securedIndoors +
    //                         '\nHealth: ' + clientDoc.health +
    //                         '\nFeeding Routine: ' + clientDoc.feedingRoutine +
    //                         '\nLitter: ' + clientDoc.litter +
    //                         '\nOther: ' + clientDoc.other + '\n\n\n\n';
    //                     fullExport.push( clientData );
    //                 } );
    //
    //                 const fullExportData: IClient[] = [];
    //                 clientsSnapshot.docs.forEach( ( item: QueryDocumentSnapshot<IClient> ) => {
    //                     const clientDoc: IClient = item.data() as IClient;
    //                     fullExportData.push( clientDoc );
    //                 } );
    //                 fullExport.push( '\n\n\n\n' + JSON.stringify( fullExportData ) );
    //
    //                 this._clipboardService.add( fullExport.join( '' ), 'The clipboard has been updated with human readable client information and data export.' );
    //
    //             } )
    //         ).subscribe();
    // }

    exportText(): void {
        this.store.collection<IClientCount>( CollectionEnum.CLIENTS ).get()
            .pipe(
                take( 1 ),
                tap( ( clientsSnapshot: QuerySnapshot ) => {
                    const fullExport: string[] = [];
                    clientsSnapshot.docs.forEach( ( item: QueryDocumentSnapshot<IClient> ) => {
                        const clientDoc: IClient = item.data() as IClient;
                        const clientData: string = 'Customer Number: ' + clientDoc.customerNumber +
                            '\nName: ' + clientDoc.name +
                            '\nPet Name: ' + clientDoc.petName +
                            '\nSecured Indoors: ' + clientDoc.securedIndoors +
                            '\nHealth: ' + clientDoc.health +
                            '\nFeeding Routine: ' + clientDoc.feedingRoutine +
                            '\nLitter: ' + clientDoc.litter +
                            '\nOther: ' + clientDoc.other;
                        fullExport.push( clientData );
                    } );

                    this._clipboardService.add( fullExport.join( '\n\n\n\n' ), 'The clipboard has been updated with human readable client information.' );

                } )
            ).subscribe();
    }

    /**
     * Export client data in human readable format.
     */
    exportData(): void {
        this.store.collection<IClientCount>( CollectionEnum.CLIENTS ).get()
            .pipe(
                take( 1 ),
                tap( ( clientsSnapshot: QuerySnapshot ) => {
                    const fullExport: IClient[] = [];
                    clientsSnapshot.docs.forEach( ( item: QueryDocumentSnapshot<IClient> ) => {
                        const clientDoc: IClient = item.data() as IClient;
                        fullExport.push( clientDoc );
                    } );

                    this._clipboardService.add( JSON.stringify( fullExport ), 'The clipboard has been updated with a backup of all the client data that can be restored.' );

                } )
            ).subscribe();
    }

    /**
     * Export client data in human readable format.
     */
    import( importClients: IClient[] ): void {
        this._waitMessage.next( 'Step 1/4: Analysing clients...' );
        this.store.collection( CollectionEnum.CLIENTS ).get()
            .pipe(
                take( 1 ),
                filter( () => importClients.length > 0 ),
                tap( res => {

                    const promises = [];

                    this._waitMessage.next( 'Step 2/4: Processing...' );
                    this._itemsSubject.next( [] );
                    this._countClientSubject.next( importClients.length );

                    // Delete all existing docs.
                    let counter: number = 0;
                    let inc: number = 100 / res.docs.length;
                    res.docs.forEach( doc => {
                        promises.push( doc.ref.delete().then( () => {
                            this._waitMessage.next('Step 3/4: Deleting: ' + ( counter++ * inc ) + '%' );
                            Promise.resolve();
                        } ) );
                    } );

                    // Import new clients.
                    let counter2: number = 0;
                    inc = 100 / importClients.length;
                    importClients.forEach( ( client: IClient ) => {
                        client.id = 'import_' + client.id;
                        promises.push( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( client.id ).set( client ).then( () => {
                            this._waitMessage.next( 'Step 4/4: Importing: ' + ( counter2++ * inc ) + '%' );
                            Promise.resolve();
                        } ) );
                    } );

                    Promise.all( promises )
                        .then( () => {
                            this._waitMessage.next( 'Imported completed' );
                            setTimeout( () => {
                                window.location.reload();
                            }, 500 );
                        } );

                } )
            ).subscribe();
    }

    /**
     * Get count of clients from Firebase.
     * @return void
     * @private
     */
    private _getCurrentClientCountFromFirebase(): void {
        this.store.collection<IClientCount>( CollectionEnum.CLIENTS ).get()
            .pipe(
                take( 1 ),
                tap( ( querySnapshot: QuerySnapshot ) => {
                    this._countClientSubject.next( querySnapshot.size );
                } )
            ).subscribe();
    }

    /**
     * Increment client count then update Firebase and local counts.
     * @param amount number amount to add on to current client count.
     * @return void
     */
    private _incrementClientCount( amount: number = 1 ): void {
        const newValue: number = this.getClientCountLocally() + amount;
        this._setClientCountLocally( newValue );
    }

    /**
     * Decrement client count then update Firebase and local counts.
     * @param amount number amount to take off from the current client count.
     * @return void
     */
    private _decrementClientCount( amount: number = 1 ): void {
        const newValue: number = this.getClientCountLocally() - amount;
        this._setClientCountLocally( newValue );
    }

    /**
     * Set clients and the counts.
     * @param value
     * @private
     */
    private _setClientCount( value: number ): void {
        this._setClientCountLocally( value );
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
     * Given string return the digits as a number.
     * @param value
     */
    getCustomerNumberDigits( value: string ): number {
        return Number( value.match( /\d/g ).join( '' ) );
    }

    updateAllClientCustomerNumberDigits(): void {
        this.store.collection<IClientCount>( CollectionEnum.CLIENTS ).get()
            .pipe(
                take( 1 ),
                tap( ( clientsSnapshot: QuerySnapshot ) => {
                    clientsSnapshot.docs.forEach( ( item: QueryDocumentSnapshot<IClient> ) => {
                        const clientDoc: IClient = item.data() as IClient;
                        clientDoc.customerNumberDigits = this.getCustomerNumberDigits( clientDoc.customerNumber );
                        this.updateItem( clientDoc );
                    } );
                    console.log( 'Done' );
                } )
            ).subscribe();
    }

    // /**
    //  * Get all dummy items from Firebase.
    //  * @return void.
    //  */
    // getDummyData(): Observable<IClient[]> {
    //     return this.store.collection( CollectionEnum.CLIENTS, ref => ref.where( 'petName', '==', 'Dummy' ) ).get()
    //         .pipe(
    //             take( 1 ),
    //             map( response => {
    //                 return response.docs.map( item => item.data() as IClient );
    //             }, error => {
    //                 console.log( 'Client loadItems error', error );
    //             } )
    //         );
    // }
    //
    // /**
    //  * Delete all dummy data from Firebase.
    //  * @return observable boolean.
    //  * @param item
    //  */
    // deleteDummy( item: IClient ): Observable<boolean> {
    //     return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.id ).delete()
    //         .then( () => {
    //             return true;
    //         } )
    //         .catch( ( error ) => {
    //             console.log( 'Client service delete dummy error', error );
    //             return false;
    //         } )
    //     );
    // }

}
