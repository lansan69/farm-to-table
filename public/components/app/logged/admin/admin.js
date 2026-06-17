// Shell: logged/admin
// Responsible for mounting its own sub-components (nav).
// The router handles #page-content — don't touch it here.

import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { CatalogoService } from '../../../../assets/js/services/catalogo.js';
import { MarketplaceService } from '../../../../assets/js/services/marketplace.js';
import { PerfilService } from '../../../../assets/js/services/perfil.js';
import { UsuariosService } from '../../../../assets/js/services/usuarios.js';

export const adminCache = {
  adminId:       null,
  usuarios:      [],
  zonas:         [],
  productos:     [],
  reportes:      [],
  categorias:    []
};

export async function init(container) {
  const navContainer = container.querySelector('#nav-container');
   const navLoad =  loadComponent('app/logged/admin/nav', navContainer);

  const adminId = parseInt(localStorage.getItem('token'), 10) || null;
  adminCache.adminId = adminId;

  const [catalogo, zonas, usuarios, reportes, categorias] = 
  await Promise.all([
    MarketplaceService.getLotes().catch(() => []),
    PerfilService.getZonas().catch(() => []),
    UsuariosService.getUsuarios().catch(() => []),
    UsuariosService.getReportes().catch(() => []),
    MarketplaceService.getCategorias().catch(() => []),
  ]);

  adminCache.usuarios = usuarios;
  adminCache.zonas = zonas;
  adminCache.productos = catalogo;
  adminCache.reportes = reportes;
  adminCache.categorias = categorias;

  await navLoad;
}

export async function cleanup() {
  await unloadComponent('app/logged/admin/nav');
}
