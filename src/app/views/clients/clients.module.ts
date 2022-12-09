import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientsListComponent } from './pages/list/clients-list.component';
import { ClientsService } from './services/clients.service';
import { RecordComponent } from './pages/record/record.component';
import { HeaderComponent } from '../../shared/layout/partials/header/header.component';
import { CanDeactivateGuard } from '../../shared/directives/can-deactivate-guard.service';

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
                canDeactivate: [ CanDeactivateGuard ],
                component: RecordComponent
            },
            {
                path: 'add',
                canDeactivate: [ CanDeactivateGuard ],
                component: RecordComponent
            }
        ] ),
    ],
    exports: [],
    providers: [
        ClientsService
    ]
} )
export class ClientsModule {
}
