import { loadComponent } from '../../../../assets/js/app.js';

export async function init(container) {

    await loadComponent(
        'app/unlogged/nav',
        container.querySelector('#unlogged-nav')
    );

    await loadComponent(
        'app/unlogged/main-content',
        container.querySelector('#unlogged-main-content')
    );
}