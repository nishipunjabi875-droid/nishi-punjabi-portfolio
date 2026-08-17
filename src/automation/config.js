/**
 * Configuration for page elements, selectors, and checked attributes.
 */
module.exports = {
  pages: {
    home: {
      name: 'Home Page',
      url: 'https://www.woodenstreet.com/',
      components: [
        {
          id: 'logo',
          name: 'Header Logo',
          selector: 'header img, .logo-box img, a.logo img, .style_headerLogo__r964U img, img[src*="mob-logo.svg"], img[src*="logo.svg"]',
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'search-input',
          name: 'Search Input',
          selector: '#search, input[placeholder*="search" i], .search-box input, input[type="search"]',
          checkAttrs: ['placeholder', 'type']
        },
        {
          id: 'navigation',
          name: 'Navigation Bar',
          selector: 'nav.navigation, .menu-list, .navigation-menu, .style_headerSection___0VZL, #menutouch, .style_menu-mobile-btn__dfbgY, .style_menu-header__ILZYG',
          checkAttrs: ['innerText']
        },
        {
          id: 'hero-banner',
          name: 'Hero Banner Slider',
          selector: 'section.relative.w-full.pb-5, section.relative.pb-5, .slider-carousel, .hero-banner, .home-slider, #main-slider, .banner-section',
          checkAttrs: ['innerText'],
          optional: true
        },
        {
          id: 'deals',
          name: 'Deals Section',
          selector: 'div.bg-gray-100:has-text("sale ends in"), div[class*="bg-[#FFF2F2]"], .deal-section, .offers, [class*="deal" i], [class*="offer" i]',
          checkAttrs: ['innerText'],
          skipCompareAttrs: ['innerText'],
          optional: true
        },
        {
          id: 'product-reels',
          name: 'Product Reel',
          selector: '.swiper, div[class*="swiper-container"]',
          multi: true,
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'reel-images',
          name: 'Reel Image',
          selector: '.swiper img, div[class*="swiper-container"] img',
          multi: true,
          optional: true,
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'category-banners',
          name: 'Category Banner Image',
          selector: 'img[src*="shop-by-categories"], img[src*="mid-banners"], img[src*="mid-banner"], img[src*="category-showcase"], img[src*="popular-"]',
          multi: true,
          optional: true,
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'footer',
          name: 'Footer Section',
          selector: '.style_footerSection__KdicH, footer, #footer, section.bg-lightgrayColor, section:has-text("OUR COMPANY"), div[class*="footerSection"]',
          checkAttrs: ['innerText'],
          optional: true
        }
      ]
    },
    pdp: {
      name: 'Product Detail Page',
      url: 'https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory',
      components: [
        {
          id: 'logo',
          name: 'Header Logo',
          selector: 'header img, .logo-box img, a.logo img, .style_headerLogo__r964U img, img[src*="mob-logo.svg"], img[src*="logo.svg"]',
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'search-input',
          name: 'Search Input',
          selector: '#search, input[placeholder*="search" i], .search-box input, input[type="search"]',
          checkAttrs: ['placeholder', 'type']
        },
        {
          id: 'navigation',
          name: 'Navigation Bar',
          selector: 'nav.navigation, .menu-list, .navigation-menu, .style_headerSection___0VZL, #menutouch, .style_menu-mobile-btn__dfbgY, .style_menu-header__ILZYG',
          checkAttrs: ['innerText']
        },
        {
          id: 'product-title',
          name: 'Product Title',
          selector: 'h1.style_productName__K1G0f, h1.product-title, h1, [itemprop="name"]',
          checkAttrs: ['innerText']
        },
        {
          id: 'product-price',
          name: 'Product Price',
          selector: '.offerprice, .style_sellingPrice__Vp0g6, .selling-price, [class*="sellingPrice" i]',
          checkAttrs: ['innerText']
        },
        {
          id: 'product-gallery',
          name: 'Product Gallery',
          selector: '.image-gallery, .image-gallery-content, .product-gallery, .style_mainSlider__zUa_l',
          checkAttrs: ['classList']
        },
        {
          id: 'variant-options',
          name: 'Variant Options Swatches',
          selector: '[class*="swatch" i], [class*="attributeGroup" i], .bg-lightgrayColor',
          multi: true,
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'pincode-input',
          name: 'Pincode Check Input',
          selector: 'input[placeholder*="pincode" i], input[name*="pincode" i], #pincode',
          checkAttrs: ['placeholder']
        },
        {
          id: 'add-to-cart',
          name: 'Add to Cart Button',
          selector: 'button:has-text("ADD TO CART"), #button-cart, [class*="btnCart" i]',
          checkAttrs: ['innerText']
        },
        {
          id: 'reviews',
          name: 'Customer Reviews Section',
          selector: 'section:has-text("Customer Reviews"), div:has-text("Customer Reviews"), .style_reviewSection__c_Q4u',
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'footer',
          name: 'Footer Section',
          selector: '.style_footerSection__KdicH, footer, #footer, [class*="footer" i], section.bg-white.py-5:has-text("Woodenstreet.com")',
          checkAttrs: ['innerText'],
          optional: true
        }
      ]
    },
    category: {
      name: 'Category Page',
      url: 'https://www.woodenstreet.com/wooden-sofa',
      components: [
        {
          id: 'logo',
          name: 'Header Logo',
          selector: 'header img, .logo-box img, a.logo img, .style_headerLogo__r964U img, img[src*="mob-logo.svg"], img[src*="logo.svg"]',
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'search-input',
          name: 'Search Input',
          selector: '#search, input[placeholder*="search" i], .search-box input, input[type="search"]',
          checkAttrs: ['placeholder', 'type']
        },
        {
          id: 'navigation',
          name: 'Navigation Bar',
          selector: 'nav.navigation, .menu-list, .navigation-menu, .style_headerSection___0VZL, #menutouch, .style_menu-mobile-btn__dfbgY, .style_menu-header__ILZYG',
          checkAttrs: ['innerText']
        },
        {
          id: 'category-title',
          name: 'Category Title',
          selector: 'h1.style_categoryHeader__J_Xq9, h1, .category-header',
          checkAttrs: ['innerText']
        },
        {
          id: 'filter-panel',
          name: 'Filters Sidebar Panel',
          selector: 'section:has(div:has-text("Filters")), .filter-panel, [class*="filterContainer" i], .bg-white.shadow-md.rounded-radius4, .style_filter-links-bottom__SBa7h span:has-text("Filter"), span.style_filter_btn__ZDigM:has-text("Filter")',
          checkAttrs: ['innerText']
        },
        {
          id: 'sort-dropdown',
          name: 'Sort Dropdown Bar',
          selector: '.top-filters, div:has(span:has-text("Sort By")), [class*="sortBox" i], .style_filter-links-bottom__SBa7h span:has-text("Sort"), span.style_filter_btn__ZDigM:has-text("Sort")',
          checkAttrs: ['innerText']
        },
        {
          id: 'product-cards',
          name: 'Product Card Items',
          selector: '.productcard, .categ-card-grid, [class*="productcard" i]',
          multi: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'footer',
          name: 'Footer Section',
          selector: '.style_footerSection__KdicH, footer, #footer, [class*="footer" i], section.bg-white.py-5:has-text("Woodenstreet.com")',
          checkAttrs: ['innerText'],
          optional: true
        }
      ]
    },
    store: {
      name: 'Offline Store Page',
      url: 'https://www.woodenstreet.com/offline-furniture-store',
      components: [
        {
          id: 'logo',
          name: 'Header Logo',
          selector: 'header img, .logo-box img, a.logo img, .style_headerLogo__r964U img, img[src*="mob-logo.svg"], img[src*="logo.svg"]',
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'search-input',
          name: 'Search Input',
          selector: '#search, input[placeholder*="search" i], .search-box input, input[type="search"]',
          checkAttrs: ['placeholder', 'type']
        },
        {
          id: 'navigation',
          name: 'Navigation Bar',
          selector: 'nav.navigation, .menu-list, .navigation-menu, .style_headerSection___0VZL, #menutouch, .style_menu-mobile-btn__dfbgY, .style_menu-header__ILZYG',
          checkAttrs: ['innerText']
        },
        {
          id: 'store-title',
          name: 'Store Page Heading',
          selector: 'h1.style_subHeading__KJtt3, h1:has-text("Experience Stores"), h1',
          checkAttrs: ['innerText']
        },
        {
          id: 'city-search',
          name: 'City Search Input',
          selector: '#Search\\ city, input[placeholder*="City" i], .style_search-city-card-top__inG8m input',
          checkAttrs: ['placeholder'],
          optional: true
        },
        {
          id: 'city-list',
          name: 'City List Items',
          selector: 'ul.style_city-list__NYYom li, .style_city-list__NYYom a, [class*="city-list"] li',
          multi: true,
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'store-services',
          name: 'Services at Store Section',
          selector: 'section:has-text("Services at Store"), div:has-text("Services at Store")',
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'footer',
          name: 'Footer Section',
          selector: '.style_footerSection__KdicH, footer, #footer, [class*="footer" i], section.bg-lightgrayColor',
          checkAttrs: ['innerText'],
          optional: true
        }
      ]
    },
    cart: {
      name: 'Cart Page',
      url: 'https://www.woodenstreet.com/cart',
      components: [
        {
          id: 'logo',
          name: 'Header Logo',
          selector: 'header img, .logo-box img, a.logo img, .style_headerLogo__r964U img, img[src*="mob-logo.svg"], img[src*="logo.svg"]',
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'cart-title',
          name: 'Cart Page Heading',
          selector: 'h1:has-text("Cart"), h1:has-text("Shopping"), h1, .cart-title, .style_cartTitle__X2z9Y, div:has-text("My Cart")',
          checkAttrs: ['innerText'],
          optional: true
        },
        {
          id: 'cart-items',
          name: 'Cart Product Items',
          selector: '.cart-item, .cart-list-item, .cart-product-row, tr.product, div[class*="cartItem" i], div[class*="cart-product" i], [class*="cart-item" i], div:has(button:has-text("Remove")), div:has(span:has-text("Save For Later"))',
          multi: true,
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'empty-cart',
          name: 'Empty Cart Section',
          selector: '.empty-cart, .empty-cart-text, div:has-text("Your cart is empty"), section:has-text("cart is empty"), div:has-text("Cart is Empty")',
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'order-summary',
          name: 'Order Summary Box',
          selector: '.order-summary, .cart-totals, [class*="orderSummary" i], [class*="cartSummary" i], section:has-text("Order Summary"), div:has-text("PRICE DETAILS"), div:has-text("Price Detail")',
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'coupon-box',
          name: 'Coupon Code Input',
          selector: '#coupon, input[name="coupon"], input[placeholder*="Coupon" i], input[placeholder*="Promo" i], [class*="coupon" i], div:has-text("Coupon Applied")',
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'checkout-btn',
          name: 'Checkout / Place Order Button',
          selector: 'button#placeOrder, button:has-text("CONFIRM ORDER"), button:has-text("PLACE ORDER"), button:has-text("Place Order"), a[href*="checkout"], a[href*="/guest"], .checkout-btn',
          optional: true,
          checkAttrs: ['innerText']
        },
        {
          id: 'footer',
          name: 'Footer Section',
          selector: '.style_footerSection__KdicH, footer, #footer, [class*="footer" i], section.bg-lightgrayColor',
          checkAttrs: ['innerText'],
          optional: true
        }
      ]
    },
    guest: {
      name: 'Guest Checkout Page',
      url: 'https://www.woodenstreet.com/guest',
      components: [
        {
          id: 'logo',
          name: 'Header Logo',
          selector: 'header img, .logo-box img, a.logo img, .style_headerLogo__r964U img, img[src*="mob-logo.svg"], img[src*="logo.svg"]',
          checkAttrs: ['src', 'alt']
        },
        {
          id: 'guest-heading',
          name: 'Guest Page Heading',
          selector: 'h1:has-text("Guest"), h2:has-text("Guest"), h1, h2, .login-title, div:has-text("Login"), form h2, form h1',
          checkAttrs: ['innerText'],
          optional: true
        },
        {
          id: 'phone-input',
          name: 'Mobile / Email Input',
          selector: 'input#telephone, input[type="tel"], input[name="phone"], input[name="telephone"], input[placeholder*="Mobile" i], input[placeholder*="Phone" i]',
          checkAttrs: ['placeholder', 'type'],
          optional: true
        },
        {
          id: 'continue-btn',
          name: 'Continue Button',
          selector: 'button:has-text("CONTINUE"), button:has-text("Continue"), input[type="submit"], input:has-text("CONTINUE"), button:has-text("GET OTP"), button:has-text("Proceed")',
          checkAttrs: ['innerText'],
          optional: true
        },
        {
          id: 'guest-form',
          name: 'Guest Form Container',
          selector: 'form, div[class*="guest" i], div[class*="login" i]',
          checkAttrs: ['innerText'],
          optional: true
        },
        {
          id: 'footer',
          name: 'Footer Section',
          selector: '.style_footerSection__KdicH, footer, #footer, [class*="footer" i], section.bg-lightgrayColor',
          checkAttrs: ['innerText'],
          optional: true
        }
      ]
    }
  }
};
