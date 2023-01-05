import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AlertService } from '../../../shared/service/alert.service';

@Injectable()
export class AuthService {

    sessionKey: string = 'petpals';
    sessionAuthenticated: string = 'authenticated';

    /**
     * Used to determine if user is logged in.
     * @private
     */
    private _isAuthenticated: boolean = false;

    private _errorsSubject: BehaviorSubject<string> = new BehaviorSubject<string>( null );
    errors$: Observable<string> = this._errorsSubject.asObservable();

    constructor(
        private angularFireAuth: AngularFireAuth,
        private _router: Router,
        private _alertService: AlertService
    ) {
        this._isAuthenticated = this.checkIfSessionIsAuthenticated();
    }

    /**
     * Log user in.
     * @param email
     * @param password
     * @return void
     */
    signIn( email: string, password: string ): Observable<boolean> {
        return from(
            this.angularFireAuth.signInWithEmailAndPassword( email, password )
                .then( res => {
                    this.setAuthenticated();
                    this._errorsSubject.next( null );
                    // console.log( 'You are Successfully logged in!', res );
                    return Promise.resolve( true );
                } )
                .catch( err => {
                    this.clearAuthentication();
                    this._errorsSubject.next( err.message );
                    // console.log( 'Something is wrong:', err.message );
                    return Promise.reject( false );
                } )
        );
    }

    /**
     * Sign user out.
     * @return void
     */
    signOut(): void {
        this.angularFireAuth.signOut()
            .then( res => {
                this.clearAuthentication();
                this._router.navigate( [ '/' ] );
                // console.log( 'You are Successfully logged out!' );
            } )
            .catch( err => {
                this._alertService.areYouSure( 'Logout Error!', err.message, false, 'warning', 'OK' );
            } );
    }

    /**
     * Is user authenticated.
     * @return boolean as to the user being authenticated.
     */
    isUserAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    /**
     * Set session value. We are authenticated.
     * @return void
     */
    setAuthenticated(): void {
        this._isAuthenticated = true;
        sessionStorage.setItem( this.sessionKey, this.sessionAuthenticated );
    }

    /**
     * Delete session value. We are not authenticated.
     * @return void
     */
    clearAuthentication(): void {
        this._isAuthenticated = false;
        sessionStorage.removeItem( this.sessionKey );
    }

    /**
     * Is the session storage authenticated?
     * @return boolean are we?
     */
    checkIfSessionIsAuthenticated(): boolean {
        return sessionStorage.getItem( this.sessionKey ) === this.sessionAuthenticated;
    }

}
