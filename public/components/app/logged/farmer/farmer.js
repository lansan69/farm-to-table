import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { PerfilService }       from '../../../../assets/js/services/perfil.js';
import { VendedoresService }   from '../../../../assets/js/services/vendedores.js';
import { NegociacionesService } from '../../../../assets/js/services/negociaciones.js';
import { ChatsService }        from '../../../../assets/js/services/chats.js';

export const farmerCache = {
  userId:        null,
  perfil:        null,
  vendedor:      null,
  negociaciones: [],
  chats:         [],
};

export async function init(container) {
  const userId = parseInt(localStorage.getItem('token'), 10) || null;
  farmerCache.userId = userId;
  
  const navContainer = container.querySelector('#nav-container');
  const navLoad = loadComponent('app/logged/farmer/nav', navContainer);
  
  const [perfil, vendedor, negociaciones, chats] = await Promise.all([
    userId ? PerfilService.getPerfilProductor(userId).catch(e => { console.error('[farmer] perfil:', e); return null; })         : null,
    userId ? VendedoresService.getVendedor(userId).catch(e => { console.error('[farmer] vendedor:', e); return null; })          : null,
    userId ? NegociacionesService.getByProductor(userId).catch(e => { console.error('[farmer] negociaciones:', e); return []; }) : [],
    userId ? ChatsService.getChats(userId).catch(e => { console.error('[farmer] chats:', e); return []; })                      : [],
  ]);

  farmerCache.perfil        = perfil;
  farmerCache.vendedor      = Array.isArray(vendedor) ? (vendedor[0] ?? null) : vendedor;
  farmerCache.negociaciones = Array.isArray(negociaciones) ? negociaciones : (negociaciones?.data ?? []);
  farmerCache.chats         = Array.isArray(chats) ? chats : (chats?.data ?? []);

  console.log(farmerCache);
  await navLoad;
}

export async function cleanup() {
  await unloadComponent('app/logged/farmer/nav');
  farmerCache.userId = null;
  farmerCache.perfil = null;
  farmerCache.vendedor = null;
  farmerCache.negociaciones = [];
  farmerCache.chats = [];
}
