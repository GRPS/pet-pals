import { Injectable } from '@angular/core';
import { AngularFirestore, Query, QuerySnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IFireBaseDate, IVisit } from '../models/entities/visits';
import { VISITS } from '../enums/visits.enum';
import { IClient } from '../../clients/models/entities/client';

@Injectable()
export class VisitsService {

    /**
     * Show visits just for a client or all visits.
     * @private
     */
    private _isAllVisits: boolean = false;

    /**
     * Storage for all visits from a specific client fetched from Firebase.
     */
    private _itemsSubject: BehaviorSubject<IVisit[]> = new BehaviorSubject<IVisit[]>( [] );
    items$: Observable<IVisit[]> = this._itemsSubject.asObservable();

    constructor(
        private store: AngularFirestore
    ) {
    }

    /**
     * Load items for specific client or all items from Firebase.
     * @return void.
     */
    loadItems( clientId: string ) {
        this.store.collection( CollectionEnum.CLIENTS + '/' + clientId + '/visits', ref => {
                let query: Query = ref;
                // if ( clientId !== VISITS.ALL ) {
                //     query = query.where( VISITS.CLIENTID, '==', clientId );
                // }
                query = query.orderBy( VISITS.DT, 'desc' );
                query = query.orderBy( VISITS.DTYEAR, 'desc' );
                query = query.orderBy( VISITS.DTMONTH, 'desc' );
                query = query.orderBy( VISITS.DTDATE, 'desc' );
                return query;
            }
        ).get()
            .pipe(
                take( 1 ),
                tap( response => {
                    const tableData: IVisit[] = [];
                    for ( const doc of response.docs ) {
                        const item: IVisit = doc.data() as IVisit;
                        const fdt: IFireBaseDate = item.dt as IFireBaseDate;
                        item.dt = new Date( fdt.seconds * 1000 );
                        item.checked = false;
                        tableData.push( item );
                    }
                    this._itemsSubject.next( tableData );
                }, error => {
                    console.log( 'Visit service loadItems error', error );
                } )
            ).subscribe();
    }

    /**
     * Get if visits have been loaded.
     * @return boolean
     */
    areVisitsLoaded(): boolean {
        return this._itemsSubject.value.length > 0;
    }

    /**
     * Delete all visits for a specific client.
     * @param clientId string
     */
    deleteAllClientVisits( clientId: string ): Observable<boolean> {
        return this.store.collection( CollectionEnum.VISITS, ref => ref
            .where( VISITS.CLIENTID, '==', clientId )
        ).get()
            .pipe(
                take( 1 ),
                map( res => {
                    console.log( 'Deleting visits for client: ' + clientId );
                    res.forEach( doc => {
                        doc.ref.delete();
                    } );
                    return true;
                }, error => {
                    console.log( 'Visit service delete all for client error', error );
                    return false;
                } )
            );
    }

    /**
     * Add a visit item to Firebase.
     * @param item IVisit
     * @return result of adding an item observable boolean
     */
    addItem( item: IVisit ): Observable<boolean> {
        const cdx = this;
        item.id = this.store.createId();
        const rememberCheckedValue: boolean = item.checked;
        delete item.checked;
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.clientId ).collection<IVisit>( CollectionEnum.VISITS ).doc( item.id ).set( item )
            .then( () => {
                // item.checked = rememberCheckedValue;
                // let visits: IVisit[] = cdx._itemsSubject.value;
                // visits.push( item );
                // visits = visits.sort( ( visitA: IVisit, visitB: IVisit ) => visitA.dt > visitB.dt ? -1 : 1 );
                // cdx._itemsSubject.next( visits );
                return Promise.resolve( true );
            } )
            .catch( ( error ) => {
                console.log( 'Visit service add item error', error );
                return Promise.reject( false );
            } )
        );
    }

    /**
     * Update an existing visit item in Firebase.
     * @param item IVisit
     * @return result of updating or adding an item observable boolean
     */
    updateItem( item: IVisit ): Observable<boolean> {
        const cdx = this;
        const rememberCheckedValue: boolean = item.checked;
        delete item.checked;
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.clientId ).collection<IVisit>( CollectionEnum.VISITS ).doc( item.id ).update( item )
            .then( () => {
                item.checked = rememberCheckedValue;
                const visits: IVisit[] = cdx._itemsSubject.value;
                const index: number = cdx._itemsSubject.value.findIndex( ( client: IVisit ) => client.id === item.id );
                visits[ index ] = item;
                cdx._itemsSubject.next( visits.sort( ( visitA: IVisit, visitB: IVisit ) => visitA.dt > visitB.dt ? -1 : 1 ) );
                return true;
            } )
            .catch( ( error ) => {
                console.log( 'Visit service update item error', error );
                return false;
            } )
        );
    }

    /**
     * Delete visit item from Firebase.
     * @param item IVisit
     * @return result of deleting an item observable boolean
     */
    deleteItem( item: IVisit ): Observable<boolean> {
        const cdx = this;
        return from( this.store.collection<IClient>( CollectionEnum.CLIENTS ).doc( item.clientId ).collection<IVisit>( CollectionEnum.VISITS ).doc( item.id ).delete()
            .then( () => {
                cdx._itemsSubject.next( cdx._itemsSubject.value.filter( ( visit: IVisit ) => visit.id !== item.id ) );
                return true;
            } )
            .catch( ( error ) => {
                console.log( 'Visit service delete item error', error );
                return false;
            } )
        );
    }

    /**
     * Get a document by its id from teh relevant client.
     * @param clientId string
     * @param docId string
     * @return Observable<IVisit>
     */
    getItemById( clientId: string, docId: string ): Observable<IVisit> {
        return this.store.collection<IVisit>( CollectionEnum.CLIENTS + '/' + clientId + '/visits' ).doc( docId ).valueChanges();
    }

    /**
     * Get a document by its id from teh relevant client.
     * @param clientId string
     * @param docId string
     * @return Observable<IVisit>
     */
    getItemsByClientId( clientId: string ): Observable<QuerySnapshot<IVisit>> {
        return this.store.collection<IVisit>( CollectionEnum.CLIENTS + '/' + clientId + '/visits' ).get();
    }

    /**
     * Reset items collection.
     * @return void
     */
    reset(): void {
        this._itemsSubject.next( [] );
    }

    /**
     * Set if we are showing client visits or all visits.
     * @param response boolean
     */
    setIsAllVisits( response: boolean ): void {
        this._isAllVisits = response;
    }

    /**
     * Get if we are showing client visits or all visits.
     */
    getIsAllVisits(): boolean {
        return this._isAllVisits;
    }

    getCheckedVisits(): IVisit[] {
        return this._itemsSubject.value.filter( ( item: IVisit ) => item.checked );
    }

}
