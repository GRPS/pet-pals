import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedComponentsModule } from '../../shared/layout/shared-components.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/auth/login.component';

@NgModule( {
    declarations: [
        LoginComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SharedComponentsModule,
        RouterModule.forChild( [
            {
                path: '',
                component: LoginComponent
            }
        ] ),
    ],
    exports: [],
    providers: [
    ]
} )
export class AuthModule {
}
