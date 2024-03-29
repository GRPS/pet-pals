import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable( {
    providedIn: 'root'
} )
export class AlertService {

    constructor() {
    }

    alert( title: string, html: string, icon: SweetAlertIcon = 'warning' ): void {
        Swal.fire(
            title,
            html,
            icon,
        ).then( ( result ) => {
        } );
    }

    prompt( title: string, html: string = '' ): Promise<string> {
        return Swal.fire( {
            title,
            html,
            input: 'textarea',
            showCancelButton: true,
            showConfirmButton: true
        } ).then( function( result ) {
            if ( result.isConfirmed ) {
                return result.value;
            } else {
                return null;
            }
        } );
    }

    /**
     * Are uou sure prompt.
     * @return
     */
    areYouSure( title: string = 'Delete Record', html: string = 'Are you sure?', showCancelButton: boolean = true, icon: SweetAlertIcon = 'warning', confirmButtonText: string = 'Yes' ): Promise<boolean> {
        return Swal.mixin( {
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger mr-4'
            },
            buttonsStyling: false
        } ).fire( {
            title,
            html: '<small>' + html + '</small>',
            icon,
            showCancelButton,
            confirmButtonText,
            cancelButtonText: 'No',
            reverseButtons: true
        } ).then( ( result ) => {
            if ( result.value ) {
                return result.isConfirmed;
                setTimeout( function() {
                    Swal.close();
                }, 1000 );
            }
            return result.isConfirmed;
        } );
    }

    /**
     * Show popup toast message.
     * @param title string
     * @param icon SweetAlertIcon
     * @param timer number
     * @return void
     */
    toast( title: string = 'Success', icon: SweetAlertIcon = 'success', timer: number = 2000 ): void {
        Swal.fire( {
            customClass: {
                popup: 'colored-toast'
            },
            toast: true,
            icon,
            title,
            showConfirmButton: false,
            timer,
            timerProgressBar: true,
            position: 'bottom'
        } );
    }

}
