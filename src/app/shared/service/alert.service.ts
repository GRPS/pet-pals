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
    areYouSure( title: string = 'Are you sure?', text: string = 'You won\'t be able to revert this!' ): Promise<boolean> {
        return Swal.mixin( {
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger mr-4'
            },
            buttonsStyling: false
        } ).fire( {
            title,
            text,
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
