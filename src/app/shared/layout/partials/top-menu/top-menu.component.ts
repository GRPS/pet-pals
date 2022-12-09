import { Component, OnInit } from '@angular/core';
import { PetPalsService } from '../../../service/petpals.service';

@Component( {
    selector: 'app-top-menu',
    templateUrl: './top-menu.component.html',
    styleUrls: [ './top-menu.component.scss' ]
} )
export class TopMenuComponent implements OnInit {

    searchTerm: string;

    constructor( private _petPalsService: PetPalsService ) {
    }

    ngOnInit(): void {
    }

    go(): void {
        this._petPalsService.setSearchTerm( this.searchTerm );
    }

}
