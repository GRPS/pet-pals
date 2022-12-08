import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { TopMenuComponent } from './shared/layout/partials/top-menu/top-menu.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { AlertService } from './shared/service/alert.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,

    TopMenuComponent,
    LayoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp( environment.firebase, 'petpals' ),
    AngularFirestoreModule,
  ],
  providers: [
    AlertService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
