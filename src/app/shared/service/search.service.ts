import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable( {
    providedIn: 'root'
} )
export class SearchService {

    private _canShow: boolean = false;

    /**
     * Handle the search term.
     * @private
     */
    private _searchTermSubject: BehaviorSubject<string> = new BehaviorSubject<string>( '' );
    searchTerm$: Observable<string> = this._searchTermSubject.asObservable();

    constructor() {
    }

    /**
     * Set the search term.
     * This will fire a change to searchTerm$.
     * @param value string
     * @return void
     */
    setSearchTerm( value: string ): void {
        this._searchTermSubject.next( value );
    }

    /**
     * Get the search term.
     * @return value string
     * @return void
     */
    getSearchTerm(): string {
        return this._searchTermSubject.value;
    }

    canShow(): boolean {
        return this._canShow;
    }
    hideSearch(): void {
        this._canShow = false;
    }

    showSearch(): void {
        this._canShow = true;
    }

}
