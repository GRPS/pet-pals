import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
@Injectable( {
    providedIn: 'root'
} )
export class AlertService {

  swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger mr-4'
    },
    buttonsStyling: false
  });

  constructor() {
  }

  areYouSure(): Promise<boolean> {
    return this.swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      reverseButtons: true
    }).then((result) => {
      return result.isConfirmed;
    });
  }

  toast( title: string = 'Success' ): void {
    Swal.fire({
      icon: 'success',
      title,
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      position: 'center'
    });
  }

}
