import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { PerfilService }        from '../../../../assets/js/services/perfil.js';
import { VendedoresService }    from '../../../../assets/js/services/vendedores.js';
import { NegociacionesService } from '../../../../assets/js/services/negociaciones.js';
import { ChatsService }         from '../../../../assets/js/services/chats.js';
import { LotesService }         from '../../../../assets/js/services/lotes.js';
import { MarketplaceService }   from '../../../../assets/js/services/marketplace.js';
import { ReportesService }      from '../../../../assets/js/services/reportes.js'; // <-- Importado
import { toastLoading, toastSuccess } from '../../../../assets/js/toast.js'; 

export const farmerCache = {
  userId:        null,
  perfil:        null,
  vendedor:      null,
  lotes:         [],
  negociaciones: [],
  chats:         [],
  categorias:    [],
  reportes:      []
};

export async function init(container) {
  const userId = parseInt(localStorage.getItem('token'), 10) || null;
  farmerCache.userId = userId;

  const navContainer = container.querySelector('#nav-container');
  const navLoad = loadComponent('app/logged/farmer/nav', navContainer);

  const [perfil, vendedor, lotes, negociaciones, chats, categorias, reportes] = await Promise.all([
    userId ? PerfilService.getPerfilProductor(userId).catch(e => { console.error('[farmer] perfil:', e); return null; })         : null,
    userId ? VendedoresService.getVendedor(userId).catch(e => { console.error('[farmer] vendedor:', e); return null; })          : null,
    userId ? LotesService.getLotesProductor(userId).catch(e => { console.error('[farmer] lotes:', e); return []; })              : [],
    userId ? NegociacionesService.getByProductor(userId).catch(e => { console.error('[farmer] negociaciones:', e); return []; }) : [],
    userId ? ChatsService.getChats(userId).catch(e => { console.error('[farmer] chats:', e); return []; })                       : [],
    MarketplaceService.getCategorias().catch(() => []),
    ReportesService.getReportes().catch(e => { console.error('[farmer] reportes:', e); return []; }) // <-- Añadido al array
  ]);

  farmerCache.perfil        = perfil;
  farmerCache.vendedor      = Array.isArray(vendedor) ? (vendedor[0] ?? null) : vendedor;
  farmerCache.lotes         = Array.isArray(lotes) ? lotes : (lotes?.data ?? []);
  farmerCache.negociaciones = Array.isArray(negociaciones) ? negociaciones : (negociaciones?.data ?? []);
  farmerCache.chats         = Array.isArray(chats) ? chats : (chats?.data ?? []);
  farmerCache.categorias    = categorias;
  farmerCache.reportes      = Array.isArray(reportes) ? reportes : (reportes?.data ?? []); // <-- Asignado al caché
  
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
  farmerCache.reportes      = [];
}

export async function updatePerfil() {
  const loading = toastLoading('Actualizando perfil...');
  farmerCache.perfil = farmerCache.userId 
    ? await PerfilService.getPerfilProductor(farmerCache.userId).catch(e => { console.error('[farmer] perfil:', e); return null; }) 
    : null;
  loading.hide();
  toastSuccess('Perfil actualizado correctamente.');
}

export async function updateVendedor() {
  if (!farmerCache.userId) {
    farmerCache.vendedor = null;
    return;
  }
  const loading = toastLoading('Actualizando vendedor...');
  const vendedor = await VendedoresService.getVendedor(farmerCache.userId).catch(e => { console.error('[farmer] vendedor:', e); return null; });
  farmerCache.vendedor = Array.isArray(vendedor) ? (vendedor[0] ?? null) : vendedor;
  loading.hide();
  toastSuccess('Vendedor actualizado correctamente.');
}

export async function updateNegociaciones() {
  if (!farmerCache.userId) {
    farmerCache.negociaciones = [];
    return;
  }
  const loading = toastLoading('Actualizando negociaciones...');
  const negociaciones = await NegociacionesService.getByProductor(farmerCache.userId).catch(e => { console.error('[farmer] negociaciones:', e); return []; });
  farmerCache.negociaciones = Array.isArray(negociaciones) ? negociaciones : (negociaciones?.data ?? []);
  loading.hide();
  toastSuccess('Negociaciones actualizadas correctamente.');
}

export async function updateCategorias() {
  const loading = toastLoading('Actualizando categorías...');
  farmerCache.categorias = await MarketplaceService.getCategorias().catch(e => { console.error('[farmer] categorias:', e); return []; });
  loading.hide();
  toastSuccess('Categorías actualizadas correctamente.');
}

export async function updateChats() {
  if (!farmerCache.userId) {
    farmerCache.chats = [];
    return;
  }
  const loading = toastLoading('Actualizando chats...');
  const chats = await ChatsService.getChats(farmerCache.userId).catch(e => { console.error('[farmer] chats:', e); return []; });
  farmerCache.chats = Array.isArray(chats) ? chats : (chats?.data ?? []);
  loading.hide();
  toastSuccess('Chats actualizados correctamente.');
}

export async function updateLotes() {
  const loading = toastLoading('Actualizando lotes...');
  farmerCache.lotes = farmerCache.userId 
    ? await LotesService.getLotesProductor(farmerCache.userId).catch(e => { console.error('[farmer] lotes:', e); return []; }) 
    : [];
  loading.hide();
  toastSuccess('Lotes actualizados correctamente.');
}

// ── Nueva función updateReportes ──────────────────────────────────────────────
export async function updateReportes() {

  const reportes = await ReportesService.getReportes().catch(e => { 
    console.error('[farmer] reportes:', e); 
    return []; 
  });
  
  farmerCache.reportes = Array.isArray(reportes) ? reportes : (reportes?.data ?? []);
}