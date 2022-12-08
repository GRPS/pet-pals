import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable( {
  providedIn: 'root'
} )
export class PetPalsService {

  private _searchTermSubject: BehaviorSubject<string> = new BehaviorSubject<string>( '' );
  searchTerm$: Observable<string> = this._searchTermSubject.asObservable();

  constructor() {
  }

  setSearchTerm( value: string ) : void {
    this._searchTermSubject.next( value );
  }

  getSearchTerm(): string {
    return this._searchTermSubject.value;
  }
}
