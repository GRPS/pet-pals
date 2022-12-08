import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'clients'
  },
  {
    path: 'clients',
    component: LayoutComponent,
    loadChildren: () => import( './views/clients/clients.module' ).then( m => m.ClientsModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
