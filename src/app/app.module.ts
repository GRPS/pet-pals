import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AlertService } from './shared/service/alert.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientsService } from './views/clients/services/clients.service';

@NgModule( {
    declarations: [
        AppComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        AngularFireModule.initializeApp( environment.firebase, 'petpals' ),
        AngularFirestoreModule,
    ],
    providers: [
        AlertService,
        // ClientsService,
    ],
    bootstrap: [ AppComponent ]
} )
export class AppModule {
}
