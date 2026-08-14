# TAS Backend API Specification

This document outlines the API specifications extracted from the old Laravel backend (`tas-backend-OLD`) to serve as the blueprint for rewriting the backend in Node.js.

## 1. Routes & Controllers

The following routes are defined in `routes/api.php`. All API routes are prefixed with `/api` and are handled by controllers in the `App\Http\Controllers\Frontend` namespace. All successful responses use a wrapped JSON format with a `result` key (e.g., `{"result": "success", ...}`).

### Associates
- **GET** `/api/associates`
  - **Controller:** `AssociateController@index`
  - **Wrapper:** `{"result": "success", "categories": [...]}`
  - **Data:** List of associate categories with nested associates.

### Sister Concern
- **GET** `/api/sister-concern`
  - **Controller:** `ConcernController@index`
  - **Wrapper:** `{"result": "success", "concerns": [...]}`
  - **Data:** List of concerns (`title`, `image`, `description`).

### Testimonials & Banners
- **GET** `/api/testimonials`
  - **Controller:** `TestimonialController@index`
  - **Wrapper:** `{"result": "success", "testimonials": [...]}`
  - **Data:** List of testimonials (`name`, `company`, `position`, `message`, `image`).
- **GET** `/api/banners`
  - **Controller:** `BannerController@index`
  - **Wrapper:** `{"result": "success", "banners": [...]}`
  - **Data:** List of banners (`title`, `image`).

### Blogs
- **GET** `/api/blogs`
  - **Controller:** `BlogController@index`
  - **Wrapper:** `{"result": "success", "blogs": [...]}`
  - **Data:** List of blogs (`slug`, `title`, `category_name`, `summary`, `image`, `date`).
- **GET** `/api/blogs/{blog}`
  - **Controller:** `BlogController@show`
  - **Wrapper:** `{"result": "success", "blog": {...}, "recentBlogs": [...]}`
  - **Data:** Single blog details and recent blogs list.
- **GET** `/api/blogs/categories/{blog_category}`
  - **Controller:** `BlogController@category`
  - **Wrapper:** `{"result": "success", "category": {...}, "blogs": [...]}`

### Brands
- **GET** `/api/brands`
  - **Controller:** `BrandController@index`
  - **Wrapper:** `{"result": "success", "brands": [...]}`
  - **Data:** List of brands (`id`, `slug`, `title`, `icon`, `image`).

### FAQs
- **GET** `/api/faqs`
  - **Controller:** `FaqController@index`
  - **Wrapper:** `{"result": "success", "categories": [...]}`
  - **Data:** FAQ categories with nested `faqs` containing `question` and `answer`.

### Categories
- **GET** `/api/categories`
  - **Controller:** `CategoryController@index`
  - **Wrapper:** `{"result": "success", "categories": [...]}`
  - **Data:** Top-level categories, with recursive `subCategory` nesting.
- **GET** `/api/category/{category}`
  - **Controller:** `CategoryController@show`
  - **Wrapper:** `{"result": "success", "category": {...}, "products": [...], "totalProducts": X, "itemsCountPerPage": X, "currentPage": X, "sort": "..."}`
  - **Data:** Details of a category and paginated products inside it.
- **GET** `/api/category/{category}/filter`
  - **Controller:** `FilterController@show`

### Products
- **GET** `/api/products`
  - **Controller:** `ProductController@product`
  - **Wrapper:** `{"result": "success", "products": [...]}`
- **GET** `/api/products/{category}`
  - **Controller:** `ProductController@index`
  - **Wrapper:** `{"result": "success", "products": [...]}`
- **GET** `/api/products/{product}/show`
  - **Controller:** `ProductController@show`
  - **Wrapper:** `{"result": "success", "product": {...}, "products": [...], "shops": [...]}`
- **POST** `/api/products/{product}` (Enquiry)
  - **Controller:** `EnquiryController@store`

### Services, Plugins, Pages, Solutions
- **GET** `/api/services` (`ServiceController@index`)
- **GET** `/api/services/{service}` (`ServiceController@show`)
- **GET** `/api/plugins` (`PluginController@index`)
- **GET** `/api/pages` (`PageController@index`)
- **GET** `/api/pages/{page}` (`PageController@show`)
- **GET** `/api/solutions` (`SolutionController@index`)
- **GET** `/api/solutions/{solution}` (`SolutionController@show`)

### Forms
- **POST** `/api/contacts` (`ContactController@store`)
- **POST** `/api/subscribers` (`SubscriberController@store`)

### Broken Routes ⚠️
- **GET** `/api/projects`
- **GET** `/api/projects/{project}`
  - **Reason for flagging:** The `projects` routes map to `ProjectController`. However, there is **no `projects` table** in the SQL database schema. The only similar tables are `products`, `references`, etc. These routes will crash if they attempt to query a missing table.

---

## 2. Exact Response Structure Examples

All responses use a top-level wrapper:
```json
{
  "result": "success",
  "...": "..."
}
```

### Products Response Format
Extracted from `get_api_product($item)` helper:
```json
{
  "slug": "string",
  "title": "string",
  "description": "string",
  "summary": "string",
  "image": "url_string",
  "brand_name": "string",
  "brand_image": "url_string",
  "brand_link": "url_string",
  "price": "string_formatted_number",
  "sale_price": "string_formatted_number",
  "category": "string",
  "brand": "string",
  "download": "url_string",
  "specification": "string",
  "installation": "string",
  "stock": 0,
  "type": "string",
  "seo_title": "string",
  "seo_keyword": "string",
  "seo_description": "string",
  "additionals": [
    {
      "title": "string",
      "description": "string",
      "image": "url_string"
    }
  ]
}
```

### Category Response Format
Extracted from `get_api_categories($items)`:
```json
{
  "slug": "string",
  "title": "string",
  "subtitle": "string",
  "icon": "string",
  "link": "string",
  "pdf": "url_string",
  "subCategory": [
     // Same structure nested recursively
  ]
}
```

---

## 3. Authentication & Middleware

- **`ApiKeyMiddleware` Existence**: In `app/Http/Kernel.php`, an `apikey` middleware is defined inside `$routeMiddleware`:
  `'apikey' => \App\Http\Middleware\ApiKeyMiddleware::class,`
- **Is it Used?**: **No.** 
  - `routes/api.php` does not apply `middleware('apikey')` anywhere. 
  - `app/Providers/RouteServiceProvider.php` only applies the built-in `api` middleware group (rate limiting and bindings) to the `routes/api.php` file.
  - Conclusion: The `ApiKeyMiddleware` is **dead code** and is not actually protecting the API routes.

---

## 4. Image URL Format

Image URLs are dynamically constructed in two ways:
1. **Via Model Accessors:** `asset("$directory" . $this->image)`
2. **Via Helpers (`general.php`):** The `get_image()` function explicitly looks up images using the pattern:
   - Base Path: `public_path() . "/frontend/images/{$location}/" . $image`
   - URL Path: `asset("frontend/images/{$location}/" . $image)`
   
When re-implementing in Node.js, the image base URL pattern should be `/frontend/images/[location]/[filename]`, where `[location]` varies by feature (e.g., `products`, `blogs`, `brands`). If an image is missing, the system falls back to `/gallery/no-image.jpg`.

---

## 5. Database Schema (Key Tables)

Below is a summary of the critical tables based on `wwwtascom_admin.sql`:

- **associations**: `id`, `slug`, `title`, `category_id`, `image`, `links`, `status`, `order`
- **association_categories**: `id`, `slug`, `title`, `status`, `order`, `description`
- **banners**: `id`, `slug`, `title`, `links`, `image`, `subtitle`, `summary`, `status`
- **blogs**: `id`, `slug`, `category_id`, `title`, `summary`, `description`, `image`, `seo_*`
- **blog_categories**: `id`, `slug`, `title`, `image`, `description`
- **brands**: `id`, `slug`, `title`, `image`, `description`, `link`
- **categories**: `id`, `slug`, `title`, `parent_category`, `image`, `description`, `pdf`, `link`, `icon`, `status`, `order`
- **products**: `id`, `slug`, `title`, `brand_id`, `category_id`, `summary`, `description`, `specification`, `installation`, `image`, `price`, `sale_price`, `stock`, `type`, `additionals` (JSON)
- **product_enquiries**: `id`, `product_id`, `name`, `email`, `phone_number`, `remarks`
- **contact_forms**: `id`, `name`, `email`, `phone`, `subject`, `message`
- **faqs**: `id`, `question`, `answer`, `type_id`, `status`
- **faq_types**: `id`, `title`, `image`, `status`
- **solutions**: `id`, `slug`, `title`, `sub_title`, `summary`, `description`, `image`, `download_pdf`, `download_doc`
- **pages**: `id`, `slug`, `title`, `description`, `summary`, `image`
- **services**: `id`, `slug`, `title`, `summary`, `description`, `image`

*Note: There is NO `projects` table in the database dump.*
