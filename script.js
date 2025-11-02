document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let cart = [];
    let userBalance = parseFloat(localStorage.getItem('userBalance')) || 2000;

    const productList = document.getElementById('product-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const categoryFilters = document.getElementById('category-filters');
    const searchInput = document.getElementById('search-input');
    
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const subtotalEl = document.getElementById('subtotal');
    const deliveryChargeEl = document.getElementById('delivery-charge');
    const shippingCostEl = document.getElementById('shipping-cost');
    const discountEl = document.getElementById('discount');
    const totalCostEl = document.getElementById('total-cost');
    const checkoutBtn = document.getElementById('checkout-btn');
    const balanceWarning = document.getElementById('balance-warning');
    const couponInput = document.getElementById('coupon-input');
    const couponFeedback = document.getElementById('coupon-feedback');

    const userBalanceEl = document.getElementById('user-balance');
    const addMoneyBtn = document.getElementById('add-money-btn');

    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const bannerContainer = document.getElementById('banner-container'); 
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');
    const backToTopBtn = document.getElementById('back-to-top');
    const API_URL = 'https://fakestoreapi.com/products';

    const banners = [
        { img: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop', text: 'Huge Sale on Electronics!' },
        { img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop', text: 'New Arrivals: Watches' },
        { img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1780&auto=format&fit=crop', text: 'Stylish Sunglasses' },
        { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop', text: 'Get Your Running Shoes' }
    ];


    const init = () => {
        fetchProducts();
        updateBalanceDisplay();
        setupEventListeners();
        createCarousel('banner', bannerContainer, banners.map(b => `<div class="w-full h-full flex-shrink-0 relative"><img src="${b.img}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black/40 flex items-center justify-center"><h2 class="text-white text-4xl font-bold">${b.text}</h2></div></div>`));
        createCarousel('review', reviewContainer, reviews.map(r => `
            <div class="w-full md:w-1/3 flex-shrink-0 p-4">
                <div class="bg-gray-100 p-6 rounded-lg h-full">
                    <div class="flex items-center mb-4">
                        <div class="text-yellow-400">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                        <span class="ml-auto text-sm text-gray-500">${r.date}</span>
                    </div>
                    <p class="text-gray-600 mb-4">"${r.comment}"</p>
                    <p class="font-bold text-gray-800 text-right">- ${r.name}</p>
                </div>
            </div>
        `));
        setupIntersectionObserver();
    };


    function setupEventListeners() {
        searchInput.addEventListener('input', () => filterAndRenderProducts());
        
        document.getElementById('cart-toggle-btn').addEventListener('click', toggleCart);
        document.getElementById('close-cart-btn').addEventListener('click', toggleCart);
        cartOverlay.addEventListener('click', toggleCart);

        addMoneyBtn.addEventListener('click', addMoney);

        document.getElementById('apply-coupon-btn').addEventListener('click', applyCoupon);
        cartItemsContainer.addEventListener('click', handleCartActions);

        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        
        contactForm.addEventListener('submit', handleFormSubmit);

        window.addEventListener('scroll', handleScroll);
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    async function fetchProducts() {
        try {
            loadingSpinner.style.display = 'flex';
            productList.innerHTML = '';
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            products = await response.json();
            renderProducts(products);
            populateCategoryFilters();
        } catch (error) {
            productList.innerHTML = `<p class="text-red-500 col-span-full text-center">Failed to load products. Please try again later.</p>`;
            console.error('Error fetching products:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    function renderProducts(productsToRender) {
        productList.innerHTML = '';
        if(productsToRender.length === 0) {
            productList.innerHTML = `<p class="text-gray-500 col-span-full text-center">No products found.</p>`;
            return;
        }
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'bg-white rounded-lg shadow-md overflow-hidden flex flex-col group';
            productCard.innerHTML = `
                <div class="h-64 overflow-hidden">
                    <img src="${product.image}" alt="${product.title}" class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-lg font-semibold text-gray-800 truncate" title="${product.title}">${product.title}</h3>
                    <div class="flex items-center my-2">
                        <div class="text-yellow-400">${'★'.repeat(Math.round(product.rating.rate))}${'☆'.repeat(5 - Math.round(product.rating.rate))}</div>
                        <span class="text-sm text-gray-500 ml-2">(${product.rating.count})</span>
                    </div>
                    <p class="text-2xl font-bold text-blue-600 mt-auto">${product.price.toFixed(2)} BDT</p>
                    <button data-product-id="${product.id}" class="add-to-cart-btn w-full mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Add to Cart</button>
                </div>
            `;
            productList.appendChild(productCard);
        });

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                addToCart(productId);
            });
        });
    }
    
    function populateCategoryFilters() {
        const categories = ['All', ...new Set(products.map(p => p.category))];
        categoryFilters.innerHTML = '';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `category-btn px-4 py-2 rounded-full text-sm font-semibold transition-colors`;
            button.textContent = category;
            if (category === 'All') {
                 button.classList.add('bg-blue-500', 'text-white');
            } else {
                 button.classList.add('bg-gray-200', 'text-gray-700');
            }
            button.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                button.classList.add('bg-blue-500', 'text-white');
                button.classList.remove('bg-gray-200', 'text-gray-700');
                filterAndRenderProducts();
            });
            categoryFilters.appendChild(button);
        });
    }

    function filterAndRenderProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeCategory = document.querySelector('.category-btn.bg-blue-500').textContent;
        
        let filteredProducts = products;

        if (activeCategory !== 'All') {
            filteredProducts = filteredProducts.filter(p => p.category === activeCategory);
        }

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.title.toLowerCase().includes(searchTerm));
        }

        renderProducts(filteredProducts);
    }

    function toggleCart() {
        cartSidebar.classList.toggle('translate-x-full');
        cartOverlay.classList.toggle('hidden');
    }

    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
    }
    
    function handleCartActions(e) {
        const target = e.target;
        const productId = parseInt(target.closest('.cart-item')?.dataset.productId);
        if (!productId) return;

        if (target.matches('.increase-qty')) {
            const item = cart.find(i => i.id === productId);
            if (item) item.quantity++;
        }
        if (target.matches('.decrease-qty')) {
             const item = cart.find(i => i.id === productId);
             if (item && item.quantity > 1) {
                item.quantity--;
             } else {
                cart = cart.filter(i => i.id !== productId);
             }
        }
        if (target.matches('.remove-item')) {            
            cart = cart.filter(i => i.id !== productId);
        }
        updateCart();
    }
    
    let couponApplied = false;
    function applyCoupon() {
        if(couponInput.value.trim().toUpperCase() === 'SMART10') {
            couponApplied = true;
            couponFeedback.textContent = "Coupon 'SMART10' applied!";
            couponFeedback.className = "text-sm text-center mb-2 h-4 text-green-600";
            updateCart();
        } else {
            couponApplied = false;
            couponFeedback.textContent = "Invalid coupon code.";
            couponFeedback.className = "text-sm text-center mb-2 h-4 text-red-500";
            updateCart();
        }
    }

    function updateCart() {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            cartEmptyMsg.style.display = 'block';
        } else {
            cartEmptyMsg.style.display = 'none';
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="flex items-center justify-between p-2 border-b cart-item" data-product-id="${item.id}">
                    <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain mr-4">
                    <div class="flex-grow">
                        <p class="font-semibold text-sm text-wrap truncate">${item.title}</p>
                        <p class="text-gray-500 text-xs">${item.price.toFixed(2)} BDT</p>
                         <div class="flex items-center mt-1">
                            <button class="decrease-qty w-6 h-6 bg-gray-200 rounded">-</button>
                            <span class="px-2">${item.quantity}</span>
                            <button class="increase-qty w-6 h-6 bg-gray-200 rounded">+</button>
                        </div>
                    </div>
                    <button class="remove-item text-red-500 hover:text-red-700 ml-4 fas fa-trash"></button>
                </div>
            `).join('');
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCharge = cart.length > 0 ? 50 : 0;
        const shippingCost = cart.length > 0 ? 10 : 0;
        const discount = couponApplied ? subtotal * 0.10 : 0;
        const total = subtotal + deliveryCharge + shippingCost - discount;

        subtotalEl.textContent = `${subtotal.toFixed(2)} BDT`;
        deliveryChargeEl.textContent = `${deliveryCharge.toFixed(2)} BDT`;
        shippingCostEl.textContent = `${shippingCost.toFixed(2)} BDT`;
        discountEl.textContent = `-${discount.toFixed(2)} BDT`;
        totalCostEl.textContent = `${total.toFixed(2)} BDT`;
        
        if (total > userBalance) {
            balanceWarning.style.display = 'block';
            checkoutBtn.disabled = true;
        } else {
            balanceWarning.style.display = 'none';
            checkoutBtn.disabled = cart.length === 0;
        }
    }

    function updateBalanceDisplay() {
        userBalanceEl.textContent = `${userBalance.toFixed(2)} BDT`;
    }

    function addMoney() {
        userBalance += 1000;
        localStorage.setItem('userBalance', userBalance);
        updateBalanceDisplay();
        updateCart();
    }
    
    function createCarousel(id, container, slidesHtml) {
        container.innerHTML = slidesHtml.join('');
        const slides = container.children;
        let currentIndex = 0;
        
        function showSlide(index) {
            const offset = -index * 100;
            container.style.transform = `translateX(${offset}%)`;
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(currentIndex);
        }

        document.getElementById(`next-${id}-btn`).addEventListener('click', nextSlide);
        document.getElementById(`prev-${id}-btn`).addEventListener('click', prevSlide);
        
        setInterval(nextSlide, 5000);
    }


    // function setupIntersectionObserver() {
    //     const sections = document.querySelectorAll('section');
    //     const observer = new IntersectionObserver((entries) => {
    //         entries.forEach(entry => {
    //             if (entry.isIntersecting) {
    //                 navLinks.forEach(link => {
    //                     link.classList.remove('text-blue-600', 'font-bold');
    //                     if (link.getAttribute('href').substring(1) === entry.target.id) {
    //                         link.classList.add('text-blue-600', 'font-bold');
    //                     }
    //                 });
    //             }
    //         });
    //     }, { threshold: 0.5 });

    //     sections.forEach(section => observer.observe(section));
    // }
    
    navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('text-yellow-600', 'font-semibold', 'border-b-2', 'border-yellow-700'));
      link.classList.add('text-yellow-600', 'font-semibold', 'border-b-2', 'border-yellow-700');
    });
  });

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();

    if(name && email && message) {
      formFeedback.textContent = `Thank you, ${name}! Your message has been sent.`;
      formFeedback.className = "text-center mt-4 font-semibold text-green-600 animate-fade-in";
      contactForm.reset();
    } else {
      formFeedback.textContent = "Please fill out all fields.";
      formFeedback.className = "text-center mt-4 font-semibold text-red-500 animate-fade-in";
    }

    setTimeout(() => {
      formFeedback.textContent = "";
    }, 4000);
  });


    function handleScroll() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('hidden', 'opacity-0');
        } else {
            backToTopBtn.classList.add('hidden', 'opacity-0');
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    

    init();
    
});
