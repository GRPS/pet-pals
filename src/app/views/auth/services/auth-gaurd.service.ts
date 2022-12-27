import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private _authService: AuthService,
        private _router: Router
    ) {
    }

    canActivate( next: ActivatedRouteSnapshot, state: RouterStateSnapshot ): Observable<boolean> | Promise<boolean> | boolean {
        if ( this._authService.isUserAuthenticated() ) {
            return true;
        }

        // navigate to login page
        this._router.navigate( [ '/auth' ] );

        // you can save redirect url so after authing we can move them back to the page they requested
        return false;
    }

}