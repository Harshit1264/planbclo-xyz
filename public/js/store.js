function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

document.addEventListener('DOMContentLoaded', () => {
    const categoryLinks = document.querySelectorAll('[data-category]');
    const subcategoryLinks = document.querySelectorAll('[data-subcategory]');
    const sizeButtons = document.querySelectorAll('[data-size]');
    const colorButtons = document.querySelectorAll('[data-color]');
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');

    const filters = {};

    // Function to handle filter click and active class toggle
    function handleFilterClick(elements, attribute, filterKey) {
        elements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.tagName === 'A' ? e.target : e.target.closest('a');
                const isActive = target.classList.contains('active');

                console.log(`Clicked filter: ${target.textContent}, Active: ${isActive}`);

                if (isActive) {
                    // If the clicked element is already active, remove the active class and the filter
                    target.classList.remove('active');
                    delete filters[filterKey];
                } else {
                    // If the clicked element is not active, remove active class from all elements and add to the clicked one
                    elements.forEach(el => el.classList.remove('active'));
                    target.classList.add('active');
                    filters[filterKey] = target.getAttribute(attribute);
                }

                console.log('Current Filters:', filters);
                fetchProducts(filters);
            });
        });
    }

    handleFilterClick(categoryLinks, 'data-category', 'category');
    handleFilterClick(subcategoryLinks, 'data-subcategory', 'subcategory');
    handleFilterClick(sizeButtons, 'data-size', 'size');
    handleFilterClick(colorButtons, 'data-color', 'color');

    // Handle search input
    function performSearch() {
        const query = capitalizeFirstLetter(searchInput.value.trim());
        filters.search = query || undefined; // Set search filter or remove if empty
        console.log('Performing search with query:', query);
        fetchProducts(filters);
    }

    // Trigger search on Enter key press
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Trigger search on search icon click
    searchIcon.addEventListener('click', () => {
        performSearch();
    });

    fetchProducts(); // Fetch all products on initial load
});

async function fetchProducts(filters = {}) {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const url = `/api/products?${queryString}`; // Correct URL
        console.log('Fetching products from URL:', url);

        const response = await fetch(url);
        console.log('Fetch response status:', response.status); // Log response status
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        console.log('Fetched products:', products);
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        const productList = document.getElementById('product-list');
        productList.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    console.log('Displaying products:', products);

    if (!products || products.length === 0) {
        productList.innerHTML = `
            <div class=" comm-soon ">
                <img src='/media/image/3.jpg'  alt='Comming soon'>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';

        productElement.innerHTML = `
            <div class="product-images">
                ${product.imageUrls.map((url, index) => `
                    <img src="${url}" alt="${product.name}" class="${index === 0 ? 'active' : ''}">
                `).join('')}
            </div>
            <div class="product-details">
                <h3 class="product-name">${product.name}</h3>
                <div class="price-info">
                    <span class="max-price">Rs.${(product.price * 130) / 100}</span>
                    <span class="price">Rs.${product.price}</span>
                </div>
            </div>
        `;
        productElement.addEventListener('click', () => {
            showProductModal(product._id);
        });

        productList.appendChild(productElement);
    });
}

function changeImage(button, direction) {
    const imagesContainer = button.parentElement;
    const images = imagesContainer.querySelectorAll('img');
    const currentImage = imagesContainer.querySelector('img.active');
    let currentIndex = Array.from(images).indexOf(currentImage);

    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + direction + images.length) % images.length;
    images[currentIndex].classList.add('active');
}

function setActiveImage(imgElement) {
    const allImages = imgElement.parentElement.querySelectorAll('img');
    allImages.forEach(img => img.classList.remove('active'));
    imgElement.classList.add('active');

    // Update the main image
    const modal = imgElement.closest('.modal-product');
    const activeImageContainer = modal.querySelector('.modal-active-image img');
    activeImageContainer.src = imgElement.src;
}


//     <span class="modal-close-button material-symbols-outlined">close</span>
//     <p class="path">Home / Store / ${product.name}</p>

async function showProductModal(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const product = await response.json();
        
        const modal = document.createElement('div');
        modal.className = 'modal-product';

        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close-button material-symbols-outlined">close</span>
                <p class="path">Home / Store / ${product.name}</p>
                <div class="modal-body">
                    <div class="brr modal-product-images">
        <div class="modal-active-image">
            <img src="${product.imageUrls[0]}" alt="${product.name}" class="active">
        </div>
        <div class=" modal-thumbnail-images">
            ${product.imageUrls.map((url, index) => `
                <img src="${url}" alt="${product.name}" class="${index === 0 ? 'active' : ''}" onclick="setActiveImage(this)">
            `).join('')}
        </div>
    </div>
                    <div class="brr modal-product-details">
                        <h2 class="modal-product-name">${product.name}</h2>
                        <p class="modal-product-description">${product.description}</p>
                        <p class="modal-product-price">Rs.${product.price}</p>
                        <div class="modal-product-options">
                            <div class="modal-product-colors">
                                <span>COLOR:</span>
                                <div class="color-options" id="color-select-${product._id}">
                                    ${product.colors.map(color => `
                                        <span class="color-swatch" style="background-color: ${color};" onclick="selectColor('${product._id}', this)"></span>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="modal-product-sizes">
                                <span>SIZE:</span>
                                <div class="size-options" id="size-select-${product._id}">
                                    ${product.sizes.map(size => `
                                        <button class="size-button" onclick="selectSize('${product._id}', this)">${size}</button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <button class="modal-cart-button" onclick="addToCart('${product._id}')">
                            ADD TO CART
                        </button>
                    </div>    
                    <div class="brr modal-product-info-sections">
                    <button class="modal-info-button" onclick="toggleInfoSection('details-${product._id}')">DETAILS</button>
                    <div id="details-${product._id}" class="info-content">
                    <p>${product.description}</p>
                    <p>100% Cotton T-Shirt, made from high-quality cotton designed for exceptional comfort and durability.</p>
                    <h2>Features:</h2>
                    <ul>
                    <li>Soft and breathable fabric for all-day wear</li>
                    <li>Quick-drying and moisture-wicking for active wear</li>
                    <li>Four-way stretch for a full range of motion</li>
                    <li>Classic crew neck design with a relaxed fit</li>
                    <li>Short sleeves for added comfort and versatility</li>
                    <li>High-quality stitching for a durable and long-lasting finish</li>
                    </ul>
                    <h2>Size Chart</h2>
                    <table class="size-chart">
                    <thead>
                    <tr>
                    <th>Size</th>
                    <th>Bust (inches)</th>
                    <th>Waist (inches)</th>
                    <th>Hips (inches)</th>
                    </tr>
                    </thead>
            <tbody>
                <tr>
                    <td>XS</td>
                    <td>32-34</td>
                    <td>24-26</td>
                    <td>34-36</td>
                </tr>
                <tr>
                    <td>S</td>
                    <td>34-36</td>
                    <td>26-28</td>
                    <td>36-38</td>
                </tr>
                <tr>
                    <td>M</td>
                    <td>36-38</td>
                    <td>28-30</td>
                    <td>38-40</td>
                </tr>
                <tr>
                    <td>L</td>
                    <td>38-40</td>
                    <td>30-32</td>
                    <td>40-42</td>
                </tr>
                <tr>
                    <td>XL</td>
                    <td>40-42</td>
                    <td>32-34</td>
                    <td>42-44</td>
                </tr>
                <tr>
                    <td>XXL</td>
                    <td>42-44</td>
                    <td>34-36</td>
                    <td>44-46</td>
                </tr>
            </tbody>
        </table>
    </div>
    <button class="modal-info-button" onclick="toggleInfoSection('care-${product._id}')">CARE</button>
    <div id="care-${product._id}" class="info-content">
        <h2>Care Instructions:</h2>
        <ul>
            <li>Machine wash cold, inside out to prevent fading.</li>
            <li>Use only non-chlorine bleach when needed.</li>
            <li>Tumble dry low or hang to dry for a softer finish.</li>
            <li>Do not iron decoration, prints, or embellishments.</li>
            <li>For best results, wash dark colors separately.</li>
        </ul>
    </div>
    <button class="modal-info-button" onclick="toggleInfoSection('shipping-${product._id}')">SHIPPING</button>
    <div id="shipping-${product._id}" class="info-content">
        <h2>Shipping Information:</h2>
        <p>We offer fast and reliable shipping to ensure your purchase arrives safely and promptly.</p>
        <h3>Shipping Options:</h3>
        <ul>
            <li><strong>Standard Shipping:</strong> Delivery within 5-7 business days.</li>
            <li><strong>Express Shipping:</strong> Delivery within 2-3 business days.</li>
            <li><strong>Overnight Shipping:</strong> Next business day delivery.</li>
        </ul>
        <h3>Shipping Rates:</h3>
        <ul>
            <li>Standard Shipping: Free on orders over Rs.1000, otherwise Rs.50.</li>
            <li>Express Shipping: Rs.150.</li>
            <li>Overnight Shipping: Rs.250.</li>
        </ul>
        <h3>International Shipping:</h3>
        <p>We also offer international shipping to select countries. Delivery times and shipping rates vary by destination. Please check our international shipping page for more details.</p>
        <h3>Order Processing Time:</h3>
        <p>All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.</p>
        <h3>Tracking Information:</h3>
        <p>Once your order has been shipped, you will receive an email with the tracking information. You can track your order on our website or through the carrier's website.</p>
        <h3>Shipping Restrictions:</h3>
        <p>Please note that certain items may have shipping restrictions due to size, weight, or destination. If there are any issues with your shipping address, we will contact you directly.</p>
    </div>
</div>

                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close-button').addEventListener('click', () => {
            modal.remove();
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

function toggleInfoSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

function selectColor(productId, element) {
    const colorSelect = document.getElementById(`color-select-${productId}`);
    const allColors = colorSelect.querySelectorAll('.color-swatch');
    allColors.forEach(colorElement => colorElement.classList.remove('selected'));
    element.classList.add('selected');
}

function selectSize(productId, element) {
    const sizeSelect = document.getElementById(`size-select-${productId}`);
    const allSizes = sizeSelect.querySelectorAll('.size-button');
    allSizes.forEach(sizeElement => sizeElement.classList.remove('selected'));
    element.classList.add('selected');
}

async function addToCart(productId) {
    const colorSelect = document.getElementById(`color-select-${productId}`);
    const sizeSelect = document.getElementById(`size-select-${productId}`);
    const selectedColorElement = colorSelect.querySelector('.color-swatch.selected');
    const selectedSizeElement = sizeSelect.querySelector('.size-button.selected');
    const selectedColor = selectedColorElement ? selectedColorElement.style.backgroundColor : null;
    const selectedSize = selectedSizeElement ? selectedSizeElement.innerText : null;

    if (!selectedColor || !selectedSize) {
        alert('Please select both color and size.');
        return;
    }

    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookies.get('token')}`
            },
            body: JSON.stringify({ productId, selectedColor, selectedSize })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Product added to cart');
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}



