const products = [
  {
    name: "NOMBRE PRODUCTO",
    location: "UBICACIÓN",
    category: "frutas",
    price: "$20.00",
    rating: "★★★★★ 4.5",
    image: "assets/images/login/frutas.jpeg"
  },
  {
    name: "NOMBRE PRODUCTO",
    location: "UBICACIÓN",
    category: "vegetales",
    price: "$20.00",
    rating: "★★★★★ 4.5",
    image: "assets/images/login/frutas.jpeg"
  }
];

export function init(container) {
  const productsGrid = container.querySelector('#productsGrid');
  const searchInput  = container.querySelector('#searchInput');
  const filters      = container.querySelectorAll('.filter');

  let currentCategory = 'todo';

  function renderProducts() {
    productsGrid.innerHTML = '';

    const filtered = products.filter(product => {
      const matchCategory = currentCategory === 'todo' || product.category === currentCategory;
      const matchSearch   = product.name.toLowerCase().includes(searchInput.value.toLowerCase());
      return matchCategory && matchSearch;
    });

    for (let i = 0; i < 12; i++) {
      const product = filtered[i % filtered.length];
      productsGrid.innerHTML += `
        <article class="product-card">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="location">📍 ${product.location}</p>
            <p class="rating">${product.rating}</p>
            <p class="price">${product.price}</p>
            <div class="card-bottom">
              <span class="status">Activo</span>
              <div class="icons">
                <button title="Favorito">☆</button>
                <button title="Mensaje">▢</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }
  }

  filters.forEach(button => {
    button.addEventListener('click', () => {
      filters.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = button.dataset.category;
      renderProducts();
    });
  });

  searchInput.addEventListener('input', renderProducts);

  renderProducts();
}
