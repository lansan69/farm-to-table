import { Http } from '../http.js';

export const VendedoresService = {
  getVendedores() {
    return Http.get('vendedores.php');
  },

  getVendedor(id) {
    return Http.get('vendedores.php', { id });
  },
};
