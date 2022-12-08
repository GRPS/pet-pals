import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IClient } from '../../models/entities/client';
import { ClientsService } from '../../services/clients.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PetPalsService } from '../../../../shared/service/petpals.service';
import { filter, map, reduce, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.scss']
})
export class ClientsListComponent implements OnInit, OnDestroy {

  items$: Observable<IClient[]>;

  private _unsubscribeAll = new Subject();

  constructor(
    private _clientsService: ClientsService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _petPalsService: PetPalsService
  ) {}

  ngOnInit(): void {
    this._petPalsService.searchTerm$
      .pipe(
        takeUntil( this._unsubscribeAll ),
        tap(( searchTerm: string ) => {
          console.log('Search: ' + searchTerm );
          this.items$ = this._clientsService.getItems();
          //   .pipe(
          //     reduce( ( items: IClient[] ) => {
          //       return items.filter( ( item: IClient ) => item.address.includes( searchTerm ) );
          //     } )
          //   );
        } )
      ).subscribe();

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  open(item, event: MouseEvent): void {
    this._router.navigate( [ '../' + item.id ], { state: item, relativeTo: this._route } );
  }

}
