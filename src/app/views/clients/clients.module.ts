import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientsListComponent } from './pages/list/clients-list.component';
import { ClientsService } from './services/clients.service';
import { RecordComponent } from './pages/record/record.component';
import { HeaderComponent } from '../../shared/layout/partials/header/header.component';

@NgModule( {
  declarations: [
    ClientsListComponent,
    RecordComponent,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild( [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
      },
      {
        path: 'list',
        component: ClientsListComponent
      },
      {
        path: ':id',
        component: RecordComponent
      },
      {
        path: 'add',
        component: RecordComponent
      }
    ] ),
  ],
  exports: [
  ],
  providers: [
    ClientsService
  ]
})
export class ClientsModule { }
