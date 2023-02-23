import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../../../shared/service/alert.service';
import { AuthService } from '../../services/auth.service';
import { take, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Component( {
    selector: 'app-auth-login',
    templateUrl: './login.component.html',
    styleUrls: [ './login.component.scss' ]
} )
export class LoginComponent implements OnInit {

    whichEnvironment: string = environment.loginWelcomeMessage;
    whichEnvironmentColour: string = environment.loginWelcomeMessagecolor;
    ver: string = environment.ver;

    form: FormGroup;
    submitted: boolean = false;

    constructor(
        private fb: FormBuilder,
        private _router: Router,
        public authService: AuthService,
        private _alertService: AlertService
    ) {
    }

    ngOnInit() {
        this.form = this.fb.group( {
            username: [ '', Validators.compose( [ Validators.email ] ) ],
            password: [ '', Validators.compose( [] ) ]
        } );
    }

    onLogin() {

        if ( this.form.invalid ) {
            return;
        }

        this.authService.signIn( this.form.get( 'username' ).value, this.form.get( 'password' ).value )
            .pipe(
                take( 1 ),
                tap( ( result: boolean ) => {
                    this.submitted = true;
                    this.form.reset();
                    if ( result ) {
                        this._router.navigate( [ '/clients/list' ] );
                    } else {
                        this._alertService.areYouSure( 'Failed to login', 'Please try again.', false, 'warning', 'OK' );
                    }
                } )
            ).subscribe();
    }

    onLogout() {
        this.authService.signOut();
    }

}
