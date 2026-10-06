export class ValidationHelper {
  /**
   * Cleans currency strings like "₹39,999", "Rs. 45,000", "39999.00" into numeric values.
   */
  public static parsePrice(priceStr: string | number | null | undefined): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^0-9.]/g, '');
    const val = parseFloat(cleanStr);
    return isNaN(val) ? 0 : val;
  }

  /**
   * Calculate expected order total based on business logic rules.
   */
  public static calculateOrderTotal(params: {
    mrp: number;
    productDiscount: number;
    couponDiscount?: number;
    deliveryCharge?: number;
  }): number {
    const { mrp, productDiscount, couponDiscount = 0, deliveryCharge = 0 } = params;
    const priceAfterProductDiscount = Math.max(0, mrp - productDiscount);
    const priceAfterCoupon = Math.max(0, priceAfterProductDiscount - couponDiscount);
    return Math.max(0, priceAfterCoupon + deliveryCharge);
  }

  /**
   * Verifies price relationship logic (MRP >= Selling Price).
   */
  public static isPriceStructureValid(mrp: number, price: number, discountPercent?: number): boolean {
    if (mrp < price) return false;
    if (discountPercent !== undefined && mrp > 0) {
      const calculatedDiscount = Math.round(((mrp - price) / mrp) * 100);
      return Math.abs(calculatedDiscount - discountPercent) <= 2; // Allow small rounding margin
    }
    return true;
  }

  /**
   * Compares API numeric response with UI text string after normalization.
   */
  public static compareApiAndUiPrice(apiPrice: number, uiPriceText: string): boolean {
    const uiPrice = this.parsePrice(uiPriceText);
    return Math.abs(apiPrice - uiPrice) < 1.0;
  }
}
