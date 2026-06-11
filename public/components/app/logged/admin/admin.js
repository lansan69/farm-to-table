// Shell: logged/admin
// Responsible for mounting its own sub-components (nav).
// The router handles #page-content — don't touch it here.

import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';

export async function init(container) {
  const navContainer = container.querySelector('#nav-container');
  await loadComponent('app/logged/admin/nav', navContainer);
}

export async function cleanup() {
  await unloadComponent('app/logged/admin/nav');
}
