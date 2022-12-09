import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable( {
    providedIn: 'root'
} )
export class AlertService {

    constructor() {
    }

    /**
     * Are uou sure prompt.
     * @return
     */
    areYouSure(): Promise<boolean> {
        return Swal.mixin( {
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger mr-4'
            },
            buttonsStyling: false
        } ).fire( {
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            reverseButtons: true
        } ).then( ( result ) => {
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
            icon,
            title,
            showConfirmButton: false,
            timer,
            toast: true,
            position: 'center'
        } );
    }

}
