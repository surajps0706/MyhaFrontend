
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ========================================
// EXCHANGE ITEM
// ========================================

export interface ExchangeItem {
  item_index: number;
  productId: string | null;
  name: string;
  quantity: number;
  selectedSize: string | null;
  sleeveType?: string | null;
  preferredHeight?: string | null;
  neckCustomization?: string | null;
  measurements?: Record<string, unknown> | null;
  customizationNotes?: string | null;
}

// ========================================
// EXCHANGE SUBMISSION ITEM
// ========================================

export interface ExchangeSubmissionItem {
  item_index: number;

  reason: 'size_issue' | 'defective_product';

  replacement_size?: string;

  evidenceFile?: File;
}

// ========================================
// EXCHANGE PAYMENT RESPONSE
// ========================================

export interface ExchangePaymentResponse {
  success: boolean;
  message: string;

  requestId: string;

  razorpayOrderId: string;

  amount: number; // Amount in paise

  currency: string;

  razorpayKey?: string;

  key?: string;
}

// ========================================
// EXCHANGE DELIVERY ADDRESS
// ========================================

export interface ExchangeDeliveryAddress {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

// ========================================
// EXCHANGE PAYMENT VERIFICATION RESPONSE
// ========================================

export interface ExchangePaymentVerificationResponse {
  success: boolean;
  message: string;

  requestId: string;

  status: string;

  paymentStatus: string;
}

// ========================================
// EXCHANGE VALIDATION RESPONSE
// ========================================

export interface ExchangeValidationResponse {
  eligible: boolean;

  message: string;

  orderId: string | number;

  deliveryConfirmedAt: string;

  daysSinceDelivery: number;

  items: ExchangeItem[];

  // Original order delivery address
  checkoutData?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

// ========================================
// EXCHANGE SUBMISSION RESPONSE
// ========================================

export interface ExchangeSubmissionResponse {
  success: boolean;

  message: string;

  requestId: string;

  status:
    | 'Payment Pending'
    | 'Approved'
    | 'Pending Review';

  items?: ExchangeItem[];
}

// ========================================
// PRODUCT SIZE
// ========================================

export interface ProductSize {
  label: string;
  available: boolean;
}

// ========================================
// EXCHANGE PRODUCT
// ========================================

export interface ExchangeProduct {
  id: string;

  name?: string;

  sizes?: ProductSize[];

  isSoldOut?: boolean;

  [key: string]: unknown;
}

// ========================================
// EXCHANGE SERVICE
// ========================================

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  // ========================================
  // VALIDATE ORDER
  // ========================================

  validateOrder(
    orderId: string
  ): Observable<ExchangeValidationResponse> {

    return this.http.post<ExchangeValidationResponse>(
      `${this.apiUrl}/exchange/validate-order`,
      {
        order_id: orderId.trim()
      }
    );
  }

  // ========================================
  // SUBMIT MULTIPLE EXCHANGE ITEMS
  // ========================================

  // ========================================
// SUBMIT MULTIPLE EXCHANGE ITEMS
// ========================================

submitExchangeRequest(
  orderId: string,
  items: ExchangeSubmissionItem[],
  sameAsOriginalAddress: boolean,
  exchangeAddress?: ExchangeDeliveryAddress
): Observable<ExchangeSubmissionResponse> {

  const formData = new FormData();

  // Order ID
  formData.append(
    'order_id',
    orderId.trim()
  );

  // Selected exchange items
  const exchangeItems = items.map(item => ({
    item_index: item.item_index,

    reason: item.reason,

    replacement_size:
      item.replacement_size || ''
  }));

  formData.append(
    'items',
    JSON.stringify(exchangeItems)
  );

  // Exchange delivery address selection
  formData.append(
    'same_as_original_address',
    String(sameAsOriginalAddress)
  );

  // Different delivery address
  if (!sameAsOriginalAddress && exchangeAddress) {

    formData.append(
      'exchange_address',
      JSON.stringify({
        name: exchangeAddress.name.trim(),

        phone: exchangeAddress.phone.trim(),

        addressLine1:
          exchangeAddress.addressLine1.trim(),

        city: exchangeAddress.city.trim(),

        state: exchangeAddress.state.trim(),

        pincode: exchangeAddress.pincode.trim()
      })
    );

  }

  // Individual evidence files
  items.forEach((item, index) => {

    if (item.evidenceFile) {

      formData.append(
        `evidence_${index}`,
        item.evidenceFile,
        item.evidenceFile.name
      );

    }

  });

  // Submit exchange request
  return this.http.post<ExchangeSubmissionResponse>(
    `${this.apiUrl}/exchange/submit`,
    formData
  );

}

  // ========================================
  // GET PRODUCT BY NAME
  // ========================================

  getProductByName(
    productName: string
  ): Observable<ExchangeProduct> {

    return this.http.get<ExchangeProduct>(
      `${this.apiUrl}/exchange/product-by-name`,
      {
        params: {
          name: productName
        }
      }
    );
  }

  // ========================================
  // GET PRODUCT BY ID
  // ========================================

  getProductById(
    productId: string
  ): Observable<ExchangeProduct> {

    return this.http.get<ExchangeProduct>(
      `${this.apiUrl}/product/${encodeURIComponent(productId)}`
    );
  }

  // ========================================
  // CREATE RAZORPAY PAYMENT
  // ========================================
  // One payment for the complete exchange request
  // ========================================

  createExchangePayment(
    requestId: string
  ): Observable<ExchangePaymentResponse> {

    return this.http.post<ExchangePaymentResponse>(
      `${this.apiUrl}/exchange/create-payment`,
      {
        requestId: requestId
      }
    );
  }

  // ========================================
  // VERIFY RAZORPAY PAYMENT
  // ========================================
  // Verify the payment for the complete request
  // ========================================

  verifyExchangePayment(
    requestId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Observable<ExchangePaymentVerificationResponse> {

    return this.http.post<ExchangePaymentVerificationResponse>(
      `${this.apiUrl}/exchange/verify-payment`,
      {
        requestId: requestId,

        razorpay_order_id: razorpayOrderId,

        razorpay_payment_id: razorpayPaymentId,

        razorpay_signature: razorpaySignature
      }
    );
  }

}
