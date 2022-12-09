import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IClient } from '../models/entities/client';
import firebase from 'firebase';
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;

@Injectable()
export class ClientsService {

    private _itemsCollections: AngularFirestoreCollection<IClient>;
    items$: Observable<IClient[]> = null;

    constructor(
        private store: AngularFirestore
    ) {
    }

    /**
     * Load all items from Firebase.
     * @return void.
     */
    loadItems(): void {
        this._itemsCollections = this.store.collection<IClient>( CollectionEnum.CLIENTS );
        this.items$ = this._itemsCollections.snapshotChanges()
            .pipe(
                map( items => {
                    return items.map( item => {
                        const data = item.payload.doc.data() as IClient;
                        const id = item.payload.doc.id;
                        return { ... data, id };
                    } ).sort(
                        ( objA, objB ) => objA.customerNumber > objB.customerNumber ? 1 : -1,
                    );
                } )
            );
    }

    /**
     * Add a client item to Firebase.
     * @param item IClient
     * @return result of adding an item observable boolean
     */
    addItem( item: IClient ): Observable<boolean> {
        console.log( 'New item!', item );
        return from( this._itemsCollections.add( item )
            .then( function( success ) {
                return true;
            } )
            .catch( function( error ) {
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
        console.log( 'Update item!', item );
        return from( this._itemsCollections.doc( item.id ).update( item )
            .then( function( success ) {
                return true;
            } )
            .catch( function( error ) {
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
        console.log( 'Delete item!', item );
        return from( this._itemsCollections.doc( item.id ).delete()
            .then( function( success ) {
                return true;
            } )
            .catch( function( error ) {
                return false;
            } )
        );
    }

    getItemById( id: string ): Observable<IClient> {
        return this._itemsCollections.snapshotChanges()
            .pipe(
                map( changes => changes.map( ( { payload: { doc } } ) => {
                    const data = doc.data();
                    const id = doc.id;
                    return { id, ... data };
                } ) ),
                map( ( items: IClient[] ) => items.find( item => item.id === id ) ) );
    }

}
