import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { MarketplaceService }   from '../../../../assets/js/services/marketplace.js';
import { FavoritosService }     from '../../../../assets/js/services/favoritos.js';
import { VendedoresService }    from '../../../../assets/js/services/vendedores.js';
import { NegociacionesService } from '../../../../assets/js/services/negociaciones.js';
import { ChatsService }         from '../../../../assets/js/services/chats.js';
import { PerfilService }        from '../../../../assets/js/services/perfil.js';

// Shared cache — populated once when the user shell mounts.
// Sub-pages import this to skip redundant fetches on navigation.
export const userCache = {
  userId:        null,
  categorias:    [],
  lotes:         [],
  favoritos:     [],
  vendedores:    [],
  negociaciones: [],
  chats:         [],
  perfil:        null,
};

export async function init(container) {
  console.log(userCache);
  const userId = parseInt(localStorage.getItem('token'), 10) || null;
  userCache.userId = userId;

  // Load the nav and all remote data in parallel
  const navContainer = container.querySelector('#nav-container');
  const navLoad = loadComponent('app/logged/user/nav', navContainer);

  const [categorias, lotes, vendedoresRaw, favoritos, negociacionesRaw, chats, perfil] =
    await Promise.all([
      MarketplaceService.getCategorias().catch(() => []),
      MarketplaceService.getLotes().catch(() => []),
      VendedoresService.getVendedores().catch(() => []),
      userId ? FavoritosService.getFavoritos(userId).catch(() => [])                   : [],
      userId ? NegociacionesService.getByComprador(userId).catch(() => [])             : [],
      userId ? ChatsService.getChats(userId).catch(() => [])                           : [],
      userId ? PerfilService.getPerfilComprador(userId).catch(() => null)              : null,
    ]);

  userCache.categorias    = categorias;
  userCache.lotes         = lotes;
  userCache.vendedores    = Array.isArray(vendedoresRaw)    ? vendedoresRaw    : (vendedoresRaw?.data    ?? []);
  userCache.favoritos     = favoritos;
  userCache.negociaciones = Array.isArray(negociacionesRaw) ? negociacionesRaw : (negociacionesRaw?.data ?? []);
  userCache.chats         = chats;
  userCache.perfil        = perfil;

  await navLoad;
}

export async function cleanup() {
  await unloadComponent('app/logged/user/nav');

  userCache.userId        = null;
  userCache.categorias    = [];
  userCache.lotes         = [];
  userCache.favoritos     = [];
  userCache.vendedores    = [];
  userCache.negociaciones = [];
  userCache.chats         = [];
  userCache.perfil        = null;
}

export async function updateChat() {
  console.log("Before update chat", userCache.chats);
  userCache.chats = userCache.userId ? await ChatsService.getChats(userCache.userId).catch(e => { console.error('[farmer] chats:', e); return []; }) : [];
  console.log("Update chat", userCache.chats);
}