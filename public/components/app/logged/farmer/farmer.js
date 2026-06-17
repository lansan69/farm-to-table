import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { PerfilService }        from '../../../../assets/js/services/perfil.js';
import { VendedoresService }    from '../../../../assets/js/services/vendedores.js';
import { NegociacionesService } from '../../../../assets/js/services/negociaciones.js';
import { ChatsService }         from '../../../../assets/js/services/chats.js';
import { LotesService }         from '../../../../assets/js/services/lotes.js';
import { MarketplaceService } from '../../../../assets/js/services/marketplace.js';

export const farmerCache = {
  userId:        null,
  perfil:        null,
  vendedor:      null,
  lotes:         [],
  negociaciones: [],
  chats:         [],
  categorias:    []
};

export async function init(container) {
  const userId = parseInt(localStorage.getItem('token'), 10) || null;
  farmerCache.userId = userId;

  const navContainer = container.querySelector('#nav-container');
  const navLoad = loadComponent('app/logged/farmer/nav', navContainer);

  const [perfil, vendedor, lotes, negociaciones, chats, categorias] = await Promise.all([
    userId ? PerfilService.getPerfilProductor(userId).catch(e => { console.error('[farmer] perfil:', e); return null; })         : null,
    userId ? VendedoresService.getVendedor(userId).catch(e => { console.error('[farmer] vendedor:', e); return null; })          : null,
    userId ? LotesService.getLotesProductor(userId).catch(e => { console.error('[farmer] lotes:', e); return []; })              : [],
    userId ? NegociacionesService.getByProductor(userId).catch(e => { console.error('[farmer] negociaciones:', e); return []; }) : [],
    userId ? ChatsService.getChats(userId).catch(e => { console.error('[farmer] chats:', e); return []; })                      : [],
    MarketplaceService.getCategorias().catch(() => []),
  ]);

  farmerCache.perfil        = perfil;
  farmerCache.vendedor      = Array.isArray(vendedor) ? (vendedor[0] ?? null) : vendedor;
  farmerCache.lotes         = Array.isArray(lotes) ? lotes : (lotes?.data ?? []);
  farmerCache.negociaciones = Array.isArray(negociaciones) ? negociaciones : (negociaciones?.data ?? []);
  farmerCache.chats         = Array.isArray(chats) ? chats : (chats?.data ?? []);
  farmerCache.categorias    = categorias;
  
  await navLoad;
}

export async function cleanup() {
  await unloadComponent('app/logged/farmer/nav');
  farmerCache.userId        = null;
  farmerCache.perfil        = null;
  farmerCache.vendedor      = null;
  farmerCache.lotes         = [];
  farmerCache.negociaciones = [];
  farmerCache.chats         = [];
}

export async function updateChat() {
  farmerCache.chats = farmerCache.userId ? await ChatsService.getChats(farmerCache.userId).catch(e => { console.error('[farmer] chats:', e); return []; }) : [];
}

export async function updateLotes(){
  farmerCache.lotes = farmerCache.userId ? await LotesService.getLotesProductor(userId).catch(e => { console.error('[farmer] lotes:', e); return []; })              : [];
}