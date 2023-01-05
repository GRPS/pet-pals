import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClientsListComponent } from './pages/list/clients-list.component';
import { ClientsService } from './services/clients.service';
import { RecordComponent } from './pages/record/record.component';
import { CanDeactivateGuard } from '../../shared/directives/can-deactivate-guard.service';
import { SharedComponentsModule } from '../../shared/layout/shared-components.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { VisitsService } from '../visits/services/visits.service';
import { SharedPipesModule } from '../../shared/pipes/shared-pipes.module';

@NgModule( {
    declarations: [
        ClientsListComponent,
        RecordComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SharedComponentsModule,
        SharedPipesModule,
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
        ClientsService,
        VisitsService
    ]
} )
export class ClientsModule {
}
