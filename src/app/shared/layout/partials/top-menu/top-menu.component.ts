import { Component, OnInit } from '@angular/core';
import { SearchService } from '../../../service/search.service';

@Component( {
    selector: 'app-top-menu',
    templateUrl: './top-menu.component.html',
    styleUrls: [ './top-menu.component.scss' ]
} )
export class TopMenuComponent implements OnInit {

    searchTerm: string;

    constructor( private _searchService: SearchService ) {
    }

    ngOnInit(): void {
    }

    startSearching(): void {
        this._searchService.setSearchTerm( this.searchTerm );
    }

    resetSearch(): void {
        this.startSearching();
    }

}
