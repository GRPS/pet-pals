import { Component, OnInit } from '@angular/core';
import { SearchService } from '../../../service/search.service';
import { AuthService } from '../../../../views/auth/services/auth.service';

@Component( {
    selector: 'app-top-menu',
    templateUrl: './top-menu.component.html',
    styleUrls: [ './top-menu.component.scss' ]
} )
export class TopMenuComponent implements OnInit {

    searchTerm: string;

    get canShow(): boolean {
        return this._searchService.canShow();
    }

    constructor( private _searchService: SearchService, private _authService: AuthService ) {
    }

    ngOnInit(): void {
    }

    startSearching(): void {
        this._searchService.setSearchTerm( this.searchTerm );
    }

    resetSearch(): void {
        this.startSearching();
    }

    logout(): void {
        this._authService.signOut();
    }

}
