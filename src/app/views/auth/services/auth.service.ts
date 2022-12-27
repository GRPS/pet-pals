import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import firebase from 'firebase';
import { Router } from '@angular/router';
import { AlertService } from '../../../shared/service/alert.service';

@Injectable()
export class AuthService {

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
                this._isAuthenticated = true;
                this._errorsSubject.next( null );
                // console.log( 'You are Successfully logged in!', res );
                return Promise.resolve( true );
            } )
            .catch( err => {
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
                this._isAuthenticated = false;
                this._router.navigate( [ '/' ] );
                // console.log( 'You are Successfully logged out!' );
            } )
            .catch( err => {
                this._alertService.areYouSure( 'Logout Error!', err.message, false, 'warning', 'OK' );
            } );
    }

    /**
     * Return is user is logged in
     * @return boolean as to the success of login.
     */
    isUserAuthenticated(): boolean {
        return this._isAuthenticated;
    }

}
