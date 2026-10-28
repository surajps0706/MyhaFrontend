
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ExchangeService,
  ExchangeValidationResponse,
  ExchangeItem,
  ExchangeProduct,
  ExchangeSubmissionItem,
  ExchangeSubmissionResponse
} from '../../services/exchange.service';

import { environment } from '../../../environments/environment';

declare var Razorpay: any;

type ExchangeReason = 'size_issue' | 'defective_product';

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exchange.component.html',
  styleUrl: './exchange.component.css'
})
export class ExchangeComponent {

  orderId = '';

  // Exchange delivery address
sameAsOriginalAddress = true;

exchangeAddress = {
  name: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: ''
};
  
  isLoading = false;
  isSubmitting = false;
  isProcessingPayment = false;
  errorMessage = '';
  successMessage = '';
  exchangeCompleted = false;
  isLoadingSizes = false;
  sizeLoadError = '';

  orderValidated = false;
  orderDetails: ExchangeValidationResponse | null = null;

  selectedItemIndex: number | null = null;

  // Multiple selected dresses
selectedItemIndices: number[] = [];

// Separate exchange details for each selected dress
exchangeSelections: {
  [itemIndex: number]: {
    reason: ExchangeReason | '';
    replacementSize: string;
    availableSizes: string[];
    evidenceFile: File | null;
    evidenceError: string;
    sizeLoadError: string;
    isLoadingSizes: boolean;
  };
} = {};
  selectedReason: ExchangeReason | '' = '';

  availableSizes: string[] = [];
  selectedSize = '';

  evidenceFile: File | null = null;
  evidenceError = '';

  readonly maxEvidenceSize = 20 * 1024 * 1024;

  constructor(
    private exchangeService: ExchangeService, private router: Router
  ) {}

  // =========================================
  // Selected item
  // =========================================

  get selectedItem(): ExchangeItem | null {

    if (
      this.selectedItemIndex === null ||
      !this.orderDetails
    ) {
      return null;
    }

    return (
      this.orderDetails.items.find(
        (item: ExchangeItem) =>
          item.item_index === this.selectedItemIndex
      ) ?? null
    );
  }


 get originalAddress() {
  return this.orderDetails?.checkoutData || {};
}

  // =========================================
  // Validate order
  // =========================================

  validateOrder(): void {

    const enteredOrderId = this.orderId.trim();

    this.errorMessage = '';
    this.successMessage = '';

    this.orderDetails = null;
    this.orderValidated = false;

    this.resetExchangeSelection();

    if (!enteredOrderId) {
      this.errorMessage = 'Please enter your Order ID.';
      return;
    }

    this.isLoading = true;

    this.exchangeService
      .validateOrder(enteredOrderId)
      .subscribe({

        next: (response: ExchangeValidationResponse) => {

          this.orderDetails = response;
          this.orderValidated = response.eligible;

          this.successMessage = response.message;

          this.isLoading = false;
        },

        error: (error: any) => {

          this.isLoading = false;

          this.errorMessage =
            error?.error?.detail ||
            'Unable to validate your order right now. Please try again.';
        }

      });
  }

  // =========================================
  // Select item
  // =========================================

  selectItem(item: ExchangeItem): void {

    this.selectedItemIndex = item.item_index;

    this.selectedReason = '';
    this.selectedSize = '';

    this.evidenceFile = null;
    this.evidenceError = '';

    this.errorMessage = '';
    this.successMessage = '';

    this.sizeLoadError = '';
    this.availableSizes = [];
  }


  
  getSelection(itemIndex: number) {
    if (!this.exchangeSelections[itemIndex]) {
      this.exchangeSelections[itemIndex] = {
        reason: '',
        replacementSize: '',
        availableSizes: [],
        evidenceFile: null,
        evidenceError: '',
        sizeLoadError: '',
        isLoadingSizes: false
      };
    }

    return this.exchangeSelections[itemIndex];
  }

  isItemSelected(itemIndex: number): boolean {
    return this.selectedItemIndices.includes(itemIndex);
  }

  
canSubmitExchange(): boolean {

  if (
    !this.orderValidated ||
    !this.orderDetails ||
    this.selectedItemIndices.length === 0
  ) {
    return false;
  }

  return this.selectedItemIndices.every(itemIndex => {

    const item = this.orderDetails!.items.find(
      item => item.item_index === itemIndex
    );

    const selection = this.getSelection(itemIndex);

    if (!item || !selection.reason) {
      return false;
    }

    if (selection.isLoadingSizes) {
      return false;
    }

    if (selection.reason === 'size_issue') {

      if (!selection.replacementSize) {
        return false;
      }

      if (
        selection.replacementSize.trim().toLowerCase() ===
        (item.selectedSize || '').trim().toLowerCase()
      ) {
        return false;
      }

      if (
        !selection.availableSizes.includes(
          selection.replacementSize
        )
      ) {
        return false;
      }
    }

    if (selection.reason === 'defective_product') {

      if (!selection.evidenceFile) {
        return false;
      }

      if (
        selection.evidenceFile.size > this.maxEvidenceSize
      ) {
        return false;
      }
    }

    return true;

  });

}


  toggleItem(item: ExchangeItem): void {
    const itemIndex = item.item_index;

    if (this.isItemSelected(itemIndex)) {
      this.selectedItemIndices =
        this.selectedItemIndices.filter(
          index => index !== itemIndex
        );

      delete this.exchangeSelections[itemIndex];
    } else {
      this.selectedItemIndices = [
        ...this.selectedItemIndices,
        itemIndex
      ];

      this.getSelection(itemIndex);
    }

    this.errorMessage = '';
    this.successMessage = '';
  }

  selectItemReason(
  itemIndex: number,
  reason: ExchangeReason
): void {
  const selection = this.getSelection(itemIndex);

  selection.reason = reason;
  selection.replacementSize = '';
  selection.evidenceFile = null;
  selection.evidenceError = '';
  selection.sizeLoadError = '';
  selection.availableSizes = [];
  selection.isLoadingSizes = false;

  this.errorMessage = '';
  this.successMessage = '';

  if (reason === 'size_issue') {
  this.loadAvailableSizesForItem(itemIndex);
}
}


  // =========================================
  // Select exchange reason
  // =========================================



  // =========================================
  // Load available product sizes
  // =========================================

private loadAvailableSizesForItem(itemIndex: number): void {

  const item = this.orderDetails?.items.find(
    item => item.item_index === itemIndex
  );

  const selection = this.getSelection(itemIndex);

  if (!item) {

    selection.availableSizes = [];

    selection.sizeLoadError =
      'Please select an item first.';

    return;
  }

  selection.isLoadingSizes = true;
  selection.sizeLoadError = '';

  selection.availableSizes = [];
  selection.replacementSize = '';

  const productRequest = item.productId
    ? this.exchangeService.getProductById(item.productId)
    : this.exchangeService.getProductByName(item.name);

  productRequest.subscribe({

    next: (product: ExchangeProduct) => {

      const sizes = Array.isArray(product.sizes)
        ? product.sizes
        : [];

      const originalSize = (
        item.selectedSize || ''
      ).trim().toLowerCase();

      selection.availableSizes = sizes
        .filter((size) => {

          const label = (
            typeof size.label === 'string'
              ? size.label.trim()
              : ''
          );

          return (
            size.available === true &&
            label.length > 0 &&
            label.toLowerCase() !== originalSize
          );
        })
        .map((size) => size.label.trim());

      if (
        product.isSoldOut ||
        selection.availableSizes.length === 0
      ) {

        selection.sizeLoadError =
          'No alternative sizes are currently available for this product. Please contact customer support.';
      }

      selection.isLoadingSizes = false;
    },

    error: (error: any) => {

      console.error(
        'Failed to load exchange product:',
        error
      );

      selection.availableSizes = [];

      if (error?.status === 404) {

        selection.sizeLoadError =
          'This product could not be found. Please contact customer support.';

      } else if (error?.status === 409) {

        selection.sizeLoadError =
          'We could not uniquely identify this product. Please contact customer support.';

      } else {

        selection.sizeLoadError =
          'Unable to load available sizes. Please try again.';
      }

      selection.isLoadingSizes = false;
    }

  });
}

  // =========================================
  // Select evidence file
  // =========================================

onEvidenceSelected(event: Event, itemIndex: number): void {

  const input = event.target as HTMLInputElement;

  const file = input.files?.[0] ?? null;

  const selection = this.getSelection(itemIndex);

  selection.evidenceError = '';
  selection.evidenceFile = null;

  if (!file) {
    return;
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ];

  if (!allowedTypes.includes(file.type)) {

    selection.evidenceError =
      'Upload a JPG, PNG, WEBP, MP4, or MOV file.';

    input.value = '';

    return;
  }

  if (file.size > this.maxEvidenceSize) {

    selection.evidenceError =
      'The evidence file must be 20 MB or smaller.';

    input.value = '';

    return;
  }

  selection.evidenceFile = file;
}

  // =========================================
  // Submit exchange request
  // =========================================

 
submitExchangeRequest(): void {

  this.errorMessage = '';
  this.successMessage = '';

  if (this.isSubmitting || this.isProcessingPayment) {
    return;
  }

  if (!this.orderValidated || !this.orderDetails) {
    this.errorMessage = 'Please validate your order first.';
    return;
  }

  if (this.selectedItemIndices.length === 0) {
    this.errorMessage = 'Please select at least one item to exchange.';
    return;
  }

  // =========================================
  // VALIDATE EXCHANGE DELIVERY ADDRESS
  // =========================================

  if (!this.sameAsOriginalAddress) {

    const address = this.exchangeAddress;

    if (
      !address.name.trim() ||
      !address.phone.trim() ||
      !address.addressLine1.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.pincode.trim()
    ) {
      this.errorMessage =
        'Please complete all exchange delivery address fields.';
      return;
    }

        // Validate 10-digit phone number
    if (!/^\d{10}$/.test(address.phone.trim())) {
      this.errorMessage =
        'Please enter a valid 10-digit phone number.';
      return;
    }

    if (!/^\d{6}$/.test(address.pincode.trim())) {
      this.errorMessage =
        'Please enter a valid 6-digit pincode.';
      return;
    }

  }

  // =========================================
  // VALIDATE EACH SELECTED DRESS
  // =========================================

  const submissionItems: ExchangeSubmissionItem[] = [];

  for (const itemIndex of this.selectedItemIndices) {

    const item = this.orderDetails.items.find(
      item => item.item_index === itemIndex
    );

    const selection = this.getSelection(itemIndex);

    if (!item) {
      this.errorMessage =
        'One of the selected items could not be found. Please validate your order again.';
      return;
    }

    if (!selection.reason) {
      this.errorMessage =
        'Please select an exchange reason for every selected dress.';
      return;
    }

    // SIZE EXCHANGE VALIDATION

    if (selection.reason === 'size_issue') {

      if (!selection.replacementSize) {
        this.errorMessage =
          'Please select a replacement size for every size exchange.';
        return;
      }

      if (
        selection.replacementSize.trim().toLowerCase() ===
        (item.selectedSize || '').trim().toLowerCase()
      ) {
        this.errorMessage =
          'Please select a size different from the original size.';
        return;
      }

      if (
        !selection.availableSizes.includes(
          selection.replacementSize
        )
      ) {
        this.errorMessage =
          'One of the selected replacement sizes is no longer available. Please select another size.';
        return;
      }

    }

    // DEFECT EXCHANGE VALIDATION

    if (selection.reason === 'defective_product') {

      if (!selection.evidenceFile) {
        this.errorMessage =
          'Please upload a photo or video for every defective product.';
        return;
      }

      if (
        selection.evidenceFile.size > this.maxEvidenceSize
      ) {
        this.errorMessage =
          'Evidence files must be 20 MB or smaller.';
        return;
      }

    }

    // BUILD GROUPED SUBMISSION ITEM

    submissionItems.push({

      item_index: item.item_index,

      reason: selection.reason,

      replacement_size:
        selection.reason === 'size_issue'
          ? selection.replacementSize
          : undefined,

      evidenceFile:
        selection.reason === 'defective_product'
          ? selection.evidenceFile ?? undefined
          : undefined

    });

  }

  // =========================================
  // SUBMIT EXCHANGE REQUEST
  // =========================================

  this.isSubmitting = true;

  this.exchangeService.submitExchangeRequest(
    String(this.orderDetails.orderId),
    submissionItems,
    this.sameAsOriginalAddress,
    this.exchangeAddress
  ).subscribe({

    next: (response: ExchangeSubmissionResponse) => {

      this.isSubmitting = false;

      console.log(
        'Grouped exchange request created:',
        response.requestId,
        response.status,
        response.items
      );

      // SIZE EXCHANGE: PAYMENT REQUIRED

      const hasSizeExchange = submissionItems.some(
        item => item.reason === 'size_issue'
      );

      if (hasSizeExchange) {

        if (!response.requestId) {

          this.errorMessage =
            'Exchange request created, but request ID was not received. Please contact support.';

          return;
        }

        this.startExchangePayment(response.requestId);

        return;
      }

      // DEFECT EXCHANGE: ADMIN REVIEW

      this.successMessage =
        response.message ||
        'Your defective product exchange request has been submitted for review.';

      this.resetExchangeFormAfterSubmission();

    },

    error: (error: any) => {

      this.isSubmitting = false;

      this.errorMessage =
        error?.error?.detail ||
        error?.error?.message ||
        'Unable to submit your exchange request. Please try again.';

    }

  });

}



  // =========================================
// START SIZE EXCHANGE PAYMENT
// =========================================

private startExchangePayment(requestId: string): void {

  this.errorMessage = '';
  this.successMessage = '';

  this.isProcessingPayment = true;

  this.exchangeService
    .createExchangePayment(requestId)
    .subscribe({

      next: (payment: any) => {

        if (!payment?.razorpayOrderId) {

          this.isProcessingPayment = false;

          this.errorMessage =
            'Unable to initialize exchange payment. Please contact support.';

          return;
        }

        if (typeof Razorpay === 'undefined') {

          this.isProcessingPayment = false;

          this.errorMessage =
            'Payment checkout could not be loaded. Please refresh and try again.';

          return;
        }

        const options = {

          key: payment.razorpayKey,

          amount: payment.amount,

          currency: payment.currency || 'INR',

          order_id: payment.razorpayOrderId,

          name: 'Myha Couture',

          description: 'Size Exchange Shipping',

          handler: (response: any) => {

  // Razorpay checkout completed.
  // Backend verification is now starting.

  this.errorMessage = '';
  this.successMessage = '';

  this.verifyExchangePayment(
    requestId,
    response.razorpay_order_id,
    response.razorpay_payment_id,
    response.razorpay_signature
  );

},

        modal: {
  ondismiss: () => {
    this.isProcessingPayment = false;
    this.isSubmitting = false;

    this.errorMessage =
      'Payment was cancelled. Your exchange request is still pending payment.';
  }
}

        };

        const razorpay = new Razorpay(options);

        razorpay.on('payment.failed', (response: any) => {

          this.isProcessingPayment = false;

          this.errorMessage =
            response?.error?.description ||
            'Payment failed. Please try again.';

        });

        razorpay.open();

      },

      error: (error: any) => {

        this.isProcessingPayment = false;

        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to initialize exchange payment. Please try again.';

      }

    });

}



getProductName(itemIndex: number, items: any[]): string {
  const item = items?.find(
    (product: any) => product.item_index === itemIndex
  );

  return item?.name || 'Selected product';
}

getOriginalSize(itemIndex: number, items: any[]): string {
  const item = items?.find(
    (product: any) => product.item_index === itemIndex
  );

  return item?.selectedSize || 'N/A';
}
// =========================================
// VERIFY SIZE EXCHANGE PAYMENT
// =========================================



private verifyExchangePayment(
  requestId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): void {

  this.isProcessingPayment = true;

  this.errorMessage = '';
  this.successMessage = '';

  this.exchangeService
    .verifyExchangePayment(
      requestId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    )
    .subscribe({

      next: (response: any) => {

        this.isProcessingPayment = false;

        console.log(
          '[EXCHANGE PAYMENT VERIFIED]',
          response
        );

        // Stop if backend verification failed
        if (!response?.success) {

          this.errorMessage =
            response?.message ||
            'Payment verification failed. Please contact support.';

          return;
        }

        // Original order ID
        const originalOrderId = String(
          response.originalOrderId ||
          this.orderDetails?.orderId ||
          ''
        ).trim();

        // Exchange request ID
        const exchangeRequestId = String(
          response.requestId ||
          requestId ||
          ''
        ).trim();

        // Validate required IDs before navigation
        if (!originalOrderId || !exchangeRequestId) {

          this.errorMessage =
            'Payment was verified, but the order or exchange reference is missing. Please contact support.';

          console.error(
            '[EXCHANGE SUCCESS REFERENCES MISSING]',
            {
              originalOrderId,
              exchangeRequestId,
              response
            }
          );

          return;
        }

        // Success message
        this.successMessage =
          `Payment successful! Your size exchange for Order ID ${originalOrderId} has been approved.`;

        // Clear exchange selections
        this.resetExchangeFormAfterSubmission();

        // Navigate to EXISTING Order Success page
        this.router.navigate(
          ['/order-success'],
          {
            queryParams: {
              orderId: originalOrderId,
              type: 'exchange',
              requestId: exchangeRequestId
            }
          }
        );

      },

      error: (error: any) => {

        this.isProcessingPayment = false;

        console.error(
          '[EXCHANGE PAYMENT VERIFICATION ERROR]',
          error
        );

        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Payment verification could not be completed. Please contact support.';

      }

    });

}


onExchangePhoneInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  const digitsOnly = input.value
    .replace(/\D/g, '')
    .slice(0, 10);

  this.exchangeAddress.phone = digitsOnly;
  input.value = digitsOnly;
}

// =========================================
// RESET FORM AFTER SUCCESSFUL SUBMISSION
// =========================================

private resetExchangeFormAfterSubmission(): void {

  // Clear selected dresses
  this.selectedItemIndex = null;
  this.selectedItemIndices = [];

  // Clear per-dress exchange details
  this.exchangeSelections = {};

  // Clear old shared state
  this.selectedReason = '';
  this.selectedSize = '';

  this.evidenceFile = null;
  this.availableSizes = [];

  this.sizeLoadError = '';
  this.evidenceError = '';

  this.isLoadingSizes = false;

}

  // =========================================
  // Reset selection
  // =========================================

  resetExchangeSelection(): void {

    this.selectedItemIndex = null;
    this.selectedReason = '';

    this.availableSizes = [];
    this.selectedSize = '';

    this.evidenceFile = null;
    this.evidenceError = '';

    this.sizeLoadError = '';
  }

  // =========================================
  // Reset order
  // =========================================

  resetOrder(): void {

    this.orderId = '';

    this.orderDetails = null;
    this.orderValidated = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.isLoading = false;
    this.isSubmitting = false;

    this.resetExchangeSelection();
  }

}
