import { NgModule } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { TopMenuComponent } from './partials/top-menu/top-menu.component';
import { HeaderComponent } from './partials/header/header.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        LayoutComponent,
        TopMenuComponent,
        HeaderComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    exports: [
        LayoutComponent,
        TopMenuComponent,
        HeaderComponent
    ]
})
export class SharedComponentsModule { }