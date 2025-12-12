# Amazon API Explorer

A dedicated Flask application to explore the full capabilities of the Amazon API v3.

## Features

This app provides a comprehensive interface to test and explore all Amazon API v3 endpoints:

### 🔍 Product Search
- Search Amazon products by query
- Sort by: Featured, Price (Low/High), Newest, Customer Rating
- Configurable max results

### 🔥 Best Sellers
- Browse best-selling products by category
- Available categories: Electronics, Fashion, Books, Home & Garden, Beauty, etc.

### 📁 Products by Category
- Get products from a specific category
- Explore category-based browsing

### 💰 Deals
- View current Amazon deals and promotions
- Find discounted items

### 📋 Product Details
- Get detailed information for any product by ASIN
- Full product specifications, images, descriptions

### ⭐ Product Reviews
- Fetch customer reviews for products
- Analyze product ratings and feedback

### 🛍️ Product Offers
- See all sellers offering the same product
- Compare prices from multiple sellers
- Find the best deal

### 👤 Seller Products
- Browse all products from a specific seller
- Analyze seller inventory

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   Make sure your `.env.local` file contains:
   ```
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```

3. **Run the app:**
   ```bash
   python amazon_explorer.py
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5001`

## Usage

### Product Search
1. Go to the "Product Search" tab
2. Enter a search query (e.g., "iPhone 15", "Gucci boots")
3. Set max results and sort options
4. Click "Search Products"
5. Results will show with images, prices, ratings
6. Click action buttons to get details, reviews, or offers

### Best Sellers
1. Go to the "Best Sellers" tab
2. Select a category
3. Click "Load Best Sellers"
4. Browse trending products

### Product Details
1. Go to the "Product Details" tab
2. Enter an ASIN (Amazon product ID)
3. Click "Get Details"
4. View full JSON response with all product information

### Product Offers
1. Go to the "Product Offers" tab
2. Enter an ASIN
3. Click "Get Offers"
4. See all sellers offering the same product with different prices

### And More...
Each tab provides a different way to explore Amazon's API capabilities.

## API Endpoints

The app uses these Amazon API v3 endpoints:

- `/search` - Product search
- `/best-sellers` - Best selling products
- `/products-by-category` - Category browsing
- `/deals` - Current deals
- `/product-details` - Detailed product info
- `/product-reviews` - Customer reviews
- `/product-offers` - Multiple seller offers
- `/seller-products` - Seller inventory

## Debugging

All API responses are saved to the `data/` directory for debugging:
- `data/amazon_product_details_{asin}.json` - Product details responses
- Other responses are logged in the console

## Notes

- The app runs on port **5001** (different from the main arbitrage app on port 5000)
- All endpoints use the Real-Time Amazon Data API v3
- Rate limits apply based on your RapidAPI subscription
- Some endpoints may return empty results if the API doesn't support them yet

## Next Steps

After exploring the API capabilities here, you can:
1. Identify which endpoints are most useful
2. Integrate them into the main arbitrage app
3. Build new features based on the data available

