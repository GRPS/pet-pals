import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CollectionEnum } from '../../../shared/enums/collection.enum';
import { IClient } from '../models/entities/client';

@Injectable()
export class ClientsService {

  private _itemsCollections: AngularFirestoreCollection<IClient>;
  private _items: Observable<IClient[]>;

  constructor(
    private store: AngularFirestore
  ) {

    // Get all readings
    this._itemsCollections = store.collection<IClient>( CollectionEnum.CLIENTS );
    this._items = this._itemsCollections.snapshotChanges()
      .pipe(
        map(items => {
          return items.map( item => {
            const data = item.payload.doc.data() as IClient;
            const id = item.payload.doc.id;
            return { ...data, id };
          }).sort(
            (objA, objB) => objA.customerNumber > objB.customerNumber ? 1 : -1,
          );
        })
      );
  }

  getItems(): Observable<IClient[]> {
    return this._items;
  }

  addItem( item: IClient ): Observable<boolean> {
    console.log( 'New item!', item );
    this._itemsCollections.add( item );
    return of( true );
  }

  updateItem( item: IClient ): Observable<boolean> {
    console.log( 'Update item!', item );
    this._itemsCollections.doc( item.id ).update( item );
    return of( true );
  }

  deleteItem( item: IClient ): Observable<boolean> {
    console.log( 'Delete item!', item );
    this._itemsCollections.doc( item.id ).delete();
    return of( true );
  }

}
