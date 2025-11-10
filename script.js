/* Get references to DOM elements */
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearAllBtn = document.getElementById("clearAll");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Array to store selected products */
let selectedProducts = [];

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem('selectedProducts');
  if (saved) {
    selectedProducts = JSON.parse(saved);
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
}

/* Convert simple markdown formatting to HTML for better display */
function formatMessageToHTML(text) {
  let formatted = text;

  // Convert ## headers to <h2>
  formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // Convert ### headers to <h3>
  formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert bullet points - to <li> (with proper ul wrapper)
  formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Convert line breaks to <br> (but not within HTML tags)
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  formatted = formatted.replace(/\n/g, '<br>');

  // Clean up extra <br> tags around block elements
  formatted = formatted.replace(/<br><br>(<h[23]>)/g, '$1');
  formatted = formatted.replace(/(<\/h[23]>)<br><br>/g, '$1');
  formatted = formatted.replace(/<br>(<ul>)/g, '$1');
  formatted = formatted.replace(/(<\/ul>)<br>/g, '$1');

  return formatted;
}

/* Load saved products from localStorage on page load */
loadSelectedProductsFromStorage();

/* Show initial message */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Search or select a category to view products
  </div>
`;

/* Display saved selected products if any */
updateSelectedProductsList();

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => {
        /* Check if this product is already selected */
        const isSelected = selectedProducts.some(p => p.id === product.id);

        return `
    <div class="product-card ${isSelected ? 'selected' : ''}" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="brand">${product.brand}</p>
      </div>
      <!-- Description shown on hover -->
      <div class="product-description">
        <p>${product.description}</p>
      </div>
    </div>
  `;
      }
    )
    .join("");

  /* Add click event listeners to all product cards */
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('click', () => {
      const productId = parseInt(card.dataset.productId);
      toggleProductSelection(productId, products);
    });
  });
}

/* Toggle product selection when clicked */
function toggleProductSelection(productId, products) {
  /* Find the product in the products array */
  const product = products.find(p => p.id === productId);

  /* Check if product is already selected */
  const index = selectedProducts.findIndex(p => p.id === productId);

  if (index === -1) {
    /* Product not selected - add it */
    selectedProducts.push(product);
  } else {
    /* Product already selected - remove it */
    selectedProducts.splice(index, 1);
  }

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update the UI to show selected state */
  displayProducts(products);
  updateSelectedProductsList();
}

/* Update the selected products list display */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = '<p class="empty-message">No products selected yet. Click on products to add them!</p>';
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(product => `
      <div class="selected-item">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-item-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-btn" data-product-id="${product.id}">×</button>
      </div>
    `)
    .join('');

  /* Add click handlers to remove buttons */
  const removeButtons = document.querySelectorAll('.remove-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const productId = parseInt(button.dataset.productId);

      /* Remove from selected products array */
      selectedProducts = selectedProducts.filter(p => p.id !== productId);

      /* Save to localStorage */
      saveSelectedProductsToStorage();

      /* Update both displays */
      updateSelectedProductsList();

      /* Refresh the products grid to remove selected state */
      const products = await loadProducts();
      const selectedCategory = categoryFilter.value;
      const filteredProducts = products.filter(
        (product) => product.category === selectedCategory
      );
      displayProducts(filteredProducts);
    });
  });
}

/* Filter products by both search and category */
async function filterAndDisplayProducts() {
  const products = await loadProducts();
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  /* Apply both filters */
  let filteredProducts = products;

  /* Filter by category if one is selected */
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  /* Filter by search term if user typed something */
  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      /* Check if search term appears in name, brand, or description */
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    });
  }

  /* Show message if no products match */
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found. Try a different search or category.
      </div>
    `;
  } else {
    displayProducts(filteredProducts);
  }
}

/* Filter when category changes */
categoryFilter.addEventListener("change", filterAndDisplayProducts);

/* Filter as user types in search box */
searchInput.addEventListener("input", filterAndDisplayProducts);

/* Clear All button - removes all selected products */
clearAllBtn.addEventListener("click", async () => {
  /* Clear the selected products array */
  selectedProducts = [];

  /* Save empty array to localStorage */
  saveSelectedProductsToStorage();

  /* Update the selected products list display */
  updateSelectedProductsList();

  /* Refresh the products grid to remove all selected states */
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  /* Only refresh if there are products displayed */
  if (searchTerm || selectedCategory) {
    await filterAndDisplayProducts();
  }
});

// Store conversation history with system prompt
const messages = [{
  role: 'system',
  content: `You are a helpful L'Oréal beauty assistant and routine builder. Your main purpose is to help users create personalized beauty routines using L'Oréal products.

FORMATTING RULES - ALWAYS follow this exact format in your responses:

When creating routines, use this structure:
## Your Personalized Routine

**Morning Routine** (or **Evening Routine** or **Daily Routine**)

### Step 1: [Product Name]
- **Brand:** [Brand Name]
- **When:** Morning/Evening/Both
- **How to use:** [Clear, simple instructions]
- **Why:** [Brief benefit explanation]

### Step 2: [Product Name]
(repeat same format)

For regular questions, keep responses conversational but use:
- **Bold** for product names and key terms
- Bullet points with "-" for lists
- Line breaks between paragraphs

IMPORTANT:
- Use "##" for main titles
- Use "###" for product step headers
- Use "**text**" for bold
- Use "-" for bullet points
- Keep language simple and friendly
- Be concise but helpful

When users select products and request a routine, analyze what they've chosen and create a step-by-step routine with: 1) The order products should be used, 2) When to use them (AM/PM), 3) How to use each product, 4) Why this order is beneficial. You can also answer questions about L'Oréal products, skincare, makeup, haircare, and fragrances. If a user asks about topics unrelated to beauty or L'Oréal products, politely redirect them back to how you can help with their beauty needs.`
}];

// Set initial message
chatWindow.innerHTML = `<div class="msg assistant"><strong>Assistant:</strong> "👋 Hello! How can I help you today?"</div>`;

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's message
  const userMessage = userInput.value;

  // Add user message to conversation history
  messages.push({ role: 'user', content: userMessage });

  // Display user message in chat window (right-aligned)
  chatWindow.innerHTML += `<div class="msg user"><strong>You:</strong> ${userMessage}</div>`;

  // Clear input immediately
  userInput.value = '';

  const CLOUDFLARE_WORKER_URL = `https://dry-union-af10.danishnakdegree.workers.dev/`

  const response = await fetch(`${CLOUDFLARE_WORKER_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages // Send entire conversation history
    })
  });

  const result = await response.json();

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content

  // Get assistant's response
  const assistantMessage = result.choices[0].message.content;

  // Add assistant message to conversation history
  messages.push({ role: 'assistant', content: assistantMessage });

  // Format the message for better display
  const formattedMessage = formatMessageToHTML(assistantMessage);

  // Display assistant message in chat window (left-aligned)
  chatWindow.innerHTML += `<div class="msg assistant"><strong>Assistant:</strong><div class="msg-content">${formattedMessage}</div></div>`;

  // Auto-scroll to bottom of chat
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* Generate Routine button click handler */
generateRoutineBtn.addEventListener('click', async () => {
  // Check if user has selected any products
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<div class="msg assistant"><strong>Assistant:</strong> Please select at least one product before generating a routine!</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Format selected products data for the AI
  const productsData = selectedProducts.map(product => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description
  }));

  // Create a user message that includes the product data
  const userMessage = `I've selected these products. Please create a personalized routine for me:\n\n${JSON.stringify(productsData, null, 2)}`;

  // Add to conversation history
  messages.push({ role: 'user', content: userMessage });

  // Display a simplified user message in chat (not the full JSON)
  const productNames = selectedProducts.map(p => `${p.brand} ${p.name}`).join(', ');
  chatWindow.innerHTML += `<div class="msg user"><strong>You:</strong> Please create a routine with: ${productNames}</div>`;

  // Show loading indicator
  chatWindow.innerHTML += `<div class="msg assistant loading"><strong>Assistant:</strong> Creating your personalized routine...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Call OpenAI API via Cloudflare Worker
    const CLOUDFLARE_WORKER_URL = `https://dry-union-af10.danishnakdegree.workers.dev/`;

    const response = await fetch(`${CLOUDFLARE_WORKER_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages
      })
    });

    const result = await response.json();

    // Get assistant's routine response
    const routineMessage = result.choices[0].message.content;

    // Add assistant response to conversation history
    messages.push({ role: 'assistant', content: routineMessage });

    // Remove loading message
    const loadingMsg = chatWindow.querySelector('.loading');
    if (loadingMsg) {
      loadingMsg.remove();
    }

    // Format the routine for better display
    const formattedRoutine = formatMessageToHTML(routineMessage);

    // Display the routine in chat window
    chatWindow.innerHTML += `<div class="msg assistant"><strong>Assistant:</strong><div class="msg-content">${formattedRoutine}</div></div>`;

    // Auto-scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;

  } catch (error) {
    // Remove loading message
    const loadingMsg = chatWindow.querySelector('.loading');
    if (loadingMsg) {
      loadingMsg.remove();
    }

    // Show error message
    chatWindow.innerHTML += `<div class="msg assistant"><strong>Assistant:</strong> Sorry, there was an error generating your routine. Please try again.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    console.error('Error:', error);
  }
});
