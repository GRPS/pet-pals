import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '../../shared/directives/can-deactivate-guard.service';
import { VisitsListComponent } from './pages/list/visits-list.component';
import { RecordComponent } from './pages/record/record.component';
import { VisitsService } from './services/visits.service';
import { SharedComponentsModule } from '../../shared/layout/shared-components.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule( {
    declarations: [
        VisitsListComponent,
        RecordComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SharedComponentsModule,
        RouterModule.forChild( [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: '../clients'
            },
            {
                path: 'list/:clientId',
                component: VisitsListComponent
            },
            {
                path: 'add/:clientId',
                canDeactivate: [ CanDeactivateGuard ],
                component: RecordComponent
            },
            {
                path: ':clientId/:id',
                canDeactivate: [ CanDeactivateGuard ],
                component: RecordComponent
            }
        ] ),
    ],
    exports: [],
    providers: [
        VisitsService
    ]
} )
export class VisitsModule {
}
