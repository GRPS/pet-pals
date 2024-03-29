// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    ver: 'TESTING 1.0.1',
    loginWelcomeMessage: 'Welcome to Petpals Basingstoke TESTING website.',
    loginWelcomeMessagecolor: 'red',
    firebase: {
        // DEV
        apiKey: 'AIzaSyCYvdCQuFrFD45VZ9KYxQpoaGOVaHANHUg',
        authDomain: 'petpals-be1ba.firebaseapp.com',
        projectId: 'petpals-be1ba',
        storageBucket: 'petpals-be1ba.appspot.com',
        messagingSenderId: '741505729620',
        appId: '1:741505729620:web:cf3484770152b56f2919c1'
        // LIVE
        // apiKey: "AIzaSyBLdnolLOXw6Hrr8NRlDWD4smJNaOXgt9Y",
        // authDomain: "petpals-cb457.firebaseapp.com",
        // projectId: "petpals-cb457",
        // storageBucket: "petpals-cb457.appspot.com",
        // messagingSenderId: "879235004132",
        // appId: "1:879235004132:web:63b023f6b8cb5cfd5d9ef1"
    }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
