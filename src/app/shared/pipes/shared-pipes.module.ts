import { NgModule } from '@angular/core';
import { RemoveCommaPipe } from './remove-comma';

const components = [
    RemoveCommaPipe
];

@NgModule( {
    imports: [],
    declarations: [
        components
    ],
    exports: [
        components
    ]
} )
export class SharedPipesModule {
}
