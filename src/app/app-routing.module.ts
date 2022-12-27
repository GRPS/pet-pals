import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { AuthGuard } from './views/auth/services/auth-gaurd.service';


const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth'
    },
    {
        path: 'auth',
        loadChildren: () => import( './views/auth/auth.module' ).then( m => m.AuthModule )
    },
    {
        path: 'clients',
        canActivate: [ AuthGuard ],
        component: LayoutComponent,
        loadChildren: () => import( './views/clients/clients.module' ).then( m => m.ClientsModule )
    },
    {
        path: 'visits',
        canActivate: [ AuthGuard ],
        component: LayoutComponent,
        loadChildren: () => import( './views/visits/visits.module' ).then( m => m.VisitsModule )
    }
];

@NgModule( {
    imports: [ RouterModule.forRoot( routes ) ],
    exports: [ RouterModule ]
} )
export class AppRoutingModule {
}
