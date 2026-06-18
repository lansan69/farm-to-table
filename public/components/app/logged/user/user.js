import { loadComponent, unloadComponent } from '../../../../assets/js/app.js';
import { MarketplaceService } from '../../../../assets/js/services/marketplace.js';
import { FavoritosService }   from '../../../../assets/js/services/favoritos.js';
import { VendedoresService }  from '../../../../assets/js/services/vendedores.js';
import { NegociacionesService } from '../../../../assets/js/services/negociaciones.js';
import { ChatsService }       from '../../../../assets/js/services/chats.js';
import { PerfilService }      from '../../../../assets/js/services/perfil.js';
import { ReportesService }    from '../../../../assets/js/services/reportes.js'; // <-- Importado
import { toastLoading, toastSuccess  } from '../../../../assets/js/toast.js';

// Shared cache — populated once when the user shell mounts.
// Sub-pages import this to skip redundant fetches on navigation.
export const userCache = {
  userId: null,
  categorias: [],
  lotes: [],
  favoritos: [],
  vendedores: [],
  negociaciones: [],
  chats: [],
  perfil: null,
  reportes: [] // <-- Añadido al caché
};

export async function init(container) {
  const userId = parseInt(localStorage.getItem('token'), 10) || null;
  userCache.userId = userId;

  // Load the nav and all remote data in parallel
  const navContainer = container.querySelector('#nav-container');
  const navLoad = loadComponent('app/logged/user/nav', navContainer);

  const [categorias, lotes, vendedoresRaw, favoritos, negociacionesRaw, chats, perfil, reportesRaw] =
    await Promise.all([
      MarketplaceService.getCategorias().catch(() => []),
      MarketplaceService.getLotes().catch(() => []),
      VendedoresService.getVendedores().catch(() => []),
      userId ? FavoritosService.getFavoritos(userId).catch(() => []) : [],
      userId ? NegociacionesService.getByComprador(userId).catch(() => []) : [],
      userId ? ChatsService.getChats(userId).catch(() => []) : [],
      userId ? PerfilService.getPerfilComprador(userId).catch(() => null) : null,
      userId ? ReportesService.getReportes().catch(() => []) : [] // <-- Añadido al Promise.all
    ]);

  userCache.categorias = categorias;
  userCache.lotes = lotes;
  userCache.vendedores = Array.isArray(vendedoresRaw) ? vendedoresRaw : (vendedoresRaw?.data ?? []);
  userCache.favoritos = favoritos;
  userCache.negociaciones = Array.isArray(negociacionesRaw) ? negociacionesRaw : (negociacionesRaw?.data ?? []);
  userCache.chats = chats;
  userCache.perfil = perfil;
  userCache.reportes = Array.isArray(reportesRaw) ? reportesRaw : (reportesRaw?.data ?? []); // <-- Asignado

  await navLoad;
}

export async function cleanup() {
  await unloadComponent('app/logged/user/nav');

  userCache.userId = null;
  userCache.categorias = [];
  userCache.lotes = [];
  userCache.favoritos = [];
  userCache.vendedores = [];
  userCache.negociaciones = [];
  userCache.chats = [];
  userCache.perfil = null;
  userCache.reportes = []; // <-- Limpieza
}

export async function updatePerfil() {
  const loading = toastLoading('Actualizando perfil...');
  userCache.perfil = userCache.userId 
    ? await PerfilService.getPerfilComprador(userCache.userId).catch(e => { console.error('[user] perfil:', e); return null; }) 
    : null;
  loading.hide();
  toastSuccess('Perfil actualizado correctamente.');
}

export async function updateCategorias() {
  const loading = toastLoading('Actualizando categorías...');
  userCache.categorias = await MarketplaceService.getCategorias().catch(e => { console.error('[user] categorias:', e); return []; });
  loading.hide();
  toastSuccess('Categorías actualizadas correctamente.');
}

export async function updateLotes() {
  const loading = toastLoading('Actualizando lotes...');
  userCache.lotes = await MarketplaceService.getLotes().catch(e => { console.error('[user] lotes:', e); return []; });
  loading.hide();
  toastSuccess('Lotes actualizados correctamente.');
}

export async function updateVendedores() {
  const loading = toastLoading('Actualizando vendedores...');
  const vendedoresRaw = await VendedoresService.getVendedores().catch(e => { console.error('[user] vendedores:', e); return []; });
  userCache.vendedores = Array.isArray(vendedoresRaw) ? vendedoresRaw : (vendedoresRaw?.data ?? []);
  loading.hide();
  toastSuccess('Vendedores actualizados correctamente.');
}

export async function updateFavoritos() {
  const loading = toastLoading('Actualizando favoritos...');
  userCache.favoritos = userCache.userId 
    ? await FavoritosService.getFavoritos(userCache.userId).catch(e => { console.error('[user] favoritos:', e); return []; }) 
    : [];
  loading.hide();
  toastSuccess('Favoritos actualizados correctamente.');
}

export async function updateNegociaciones() {
  if (!userCache.userId) {
    userCache.negociaciones = [];
    return;
  }
  const loading = toastLoading('Actualizando negociaciones...');
  const negociacionesRaw = await NegociacionesService.getByComprador(userCache.userId).catch(e => { console.error('[user] negociaciones:', e); return []; });
  userCache.negociaciones = Array.isArray(negociacionesRaw) ? negociacionesRaw : (negociacionesRaw?.data ?? []);
  loading.hide();
  toastSuccess('Negociaciones actualizadas correctamente.');
}

export async function updateChats() {
  const loading = toastLoading('Actualizando tus chats...');
  userCache.chats = userCache.userId 
    ? await ChatsService.getChats(userCache.userId).catch(e => { console.error('[user] chats:', e); return []; }) 
    : [];
  loading.hide();
  toastSuccess('Chats actualizados correctamente.');
}

// ── Nueva función updateReportes ──────────────────────────────────────────────
export async function updateReportes() {
  if (!userCache.userId) {
    userCache.reportes = [];
    return;
  }
  const reportesRaw = await ReportesService.getReportes().catch(e => { 
    console.error('[user] reportes:', e); 
    return []; 
  });
  
  userCache.reportes = Array.isArray(reportesRaw) ? reportesRaw : (reportesRaw?.data ?? []);
}