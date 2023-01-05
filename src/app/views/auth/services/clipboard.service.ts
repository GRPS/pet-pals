import { Injectable } from '@angular/core';
import { AlertService } from '../../../shared/service/alert.service';

@Injectable()
export class ClipboardService {

    constructor(
        private _alertService: AlertService
    ) {
    }

    add( data: string ): void {
        const selBox = document.createElement( 'textarea' );
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = data;
        document.body.appendChild( selBox );
        selBox.focus();
        selBox.select();
        document.execCommand( 'copy' );
        document.body.removeChild( selBox );

        this._alertService.areYouSure( 'Clipboard Updated', 'The clipboard has been updated.<br><br>You can now \'paste\' the clipboard content where ever you wish. ', false, 'success', 'OK' );
    }

}
