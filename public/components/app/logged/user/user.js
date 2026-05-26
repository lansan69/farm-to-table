// Shell: unlogged
// Responsible for mounting its own sub-components (nav).
// The router handles #page-content — don't touch it here.

import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';

export async function init(container) {
  const navContainer = container.querySelector('#nav-container');
  await loadComponent('app/unlogged/nav', navContainer);
}

export async function cleanup() {
  await unloadComponent('app/unlogged/nav');
}