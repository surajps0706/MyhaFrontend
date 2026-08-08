import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders,  HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

@Component({
  selector: 'app-product-list-admin',
  standalone: true,
  templateUrl: './product-list-admin.component.html',
  styleUrls: ['./product-list-admin.component.css'],
  imports: [CommonModule, FormsModule, DragDropModule]   // ✅ Added DragDropModule
})
export class ProductListAdminComponent implements OnInit {
  products: any[] = [];
  editingProduct: any = null;

  private baseUrl = environment.apiUrl;

  editSelectedFiles: File[] = [];
editImagePreviews: string[] = [];

editUploadingImages = false;
editDragActive = false;

readonly MAX_IMAGES = 20;

editUploading = false;
editUploadProgress = 0;
editUploadStatus = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  // 🟩 Load all products from backend
loadProducts() {
  this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({
    next: (res) => {
      this.products = res
        .map(p => ({
          ...p,

          // ✅ normalize images ONCE, safely
          images: Array.isArray(p.images)
            ? p.images
            : typeof p.images === 'string'
              ? p.images.split(',').map((i: string) => i.trim())
              : [],

          // ✅ ensure stock
          stock: p.stock ?? 10
        }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    },
    error: (err) => {
      console.error('❌ Failed to load products:', err);
      alert('Failed to load products');
    }
  });
}


async prepareEditImage(file: File): Promise<File> {

  let workingFile = file;

  const fileName = file.name.toLowerCase();

  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif');

  if (isHeic) {

    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    const jpegBlob = Array.isArray(converted)
      ? converted[0]
      : converted;

    workingFile = new File(
      [jpegBlob as Blob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      {
        type: 'image/jpeg'
      }
    );
  }


  

  const compressed = await imageCompression(
    workingFile,
    {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1800,
      initialQuality: 0.85,
      useWebWorker: true
    }
  );

  return new File(
    [compressed],
    workingFile.name.replace(
      /\.(png|webp|heic|heif)$/i,
      '.jpg'
    ),
    {
      type: 'image/jpeg'
    }
  );
}


async onEditFilesSelected(event: any) {
  const files = Array.from(event.target.files || []) as File[];

  if (!files.length) {
    return;
  }

  if (!this.editingProduct) {
    return;
  }

  this.editUploading = true;
  this.editUploadProgress = 0;
  this.editUploadStatus = 'Preparing images...';

  try {
    const processedFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {

      this.editUploadStatus =
        `Preparing image ${i + 1} of ${files.length}...`;

      const processed = await this.prepareEditImage(files[i]);

      processedFiles.push(processed);

      // Show preparation progress
      this.editUploadProgress = Math.round(
        ((i + 1) / files.length) * 30
      );
    }

    this.editUploadStatus = 'Uploading images...';

    const formData = new FormData();

    processedFiles.forEach(file => {
      formData.append('images', file, file.name);
    });

    const token = localStorage.getItem('admin_token');

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${token}`
    );

    this.http.post<any>(
      `${this.baseUrl}/products/${this.editingProduct.id}/add-images`,
      formData,
      {
        headers,
        observe: 'events',
        reportProgress: true
      }
    ).subscribe({

      next: (event: any) => {

        if (event.type === HttpEventType.UploadProgress) {

          if (event.total) {

            const uploadPercent = Math.round(
              (event.loaded / event.total) * 70
            );

            // Preparation = 30%
            // Upload = remaining 70%
            this.editUploadProgress =
              30 + uploadPercent;
          }

          this.editUploadStatus =
            `Uploading images... ${this.editUploadProgress}%`;
        }

        if (event.type === HttpEventType.Response) {

          const response = event.body;

          this.editUploadProgress = 100;
          this.editUploadStatus = 'Images added successfully!';

          this.editingProduct.images =
            response.images;

          this.editingProduct.image_count =
            response.image_count;

          // Small delay so admin sees 100%
          setTimeout(() => {
            this.editUploading = false;
            this.editUploadProgress = 0;
            this.editUploadStatus = '';
          }, 800);
        }
      },

      error: (err) => {

        console.error('❌ Image upload failed:', err);

        this.editUploading = false;
        this.editUploadProgress = 0;
        this.editUploadStatus = '';

        alert(
          err?.error?.detail ||
          'Failed to add images.'
        );
      }
    });

  } catch (err) {

    console.error('❌ Image preparation failed:', err);

    this.editUploading = false;
    this.editUploadProgress = 0;
    this.editUploadStatus = '';

    alert('Failed to prepare images.');
  }

  // Reset file input so the same file can be selected again
  event.target.value = '';
}

onEditDragOver(event: DragEvent) {

  event.preventDefault();

  this.editDragActive = true;
}

onEditDragLeave(event: DragEvent) {

  event.preventDefault();

  this.editDragActive = false;
}

async onEditDrop(event: DragEvent) {

  event.preventDefault();

  this.editDragActive = false;

  const files = Array.from(
    event.dataTransfer?.files || []
  );

  await this.processEditImages(files);
}


async processEditImages(files: File[]) {

  if (!this.editingProduct) return;

  const currentCount =
    this.editingProduct.images?.length || 0;

  if (
    currentCount +
    this.editSelectedFiles.length +
    files.length > this.MAX_IMAGES
  ) {

    alert(
      `Maximum ${this.MAX_IMAGES} images allowed`
    );

    return;
  }

  for (const file of files) {

    try {

      const processed =
        await this.prepareEditImage(file);

      this.editSelectedFiles.push(processed);

      this.editImagePreviews.push(
        URL.createObjectURL(processed)
      );

    } catch (error) {

      console.error(
        'Image processing failed:',
        error
      );

      alert(
        `Could not process ${file.name}`
      );
    }
  }
}



  // 🖱️ Handle drag-and-drop reorder
  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.products, event.previousIndex, event.currentIndex);

    // update displayOrder values locally
    this.products.forEach((p, i) => (p.displayOrder = i + 1));

    const orderData = this.products.map((p) => ({
      _id: p._id,
      displayOrder: p.displayOrder
    }));

    this.http.post(`${this.baseUrl}/update-order`, orderData).subscribe({
      next: () => console.log('✅ Product order updated successfully'),
      error: (err) => console.error('❌ Error updating product order:', err)
    });
  }

  // ✏️ Start editing a product
editProduct(product: any) {
  this.editingProduct = {
    ...product,
    image_count: product.image_count ?? 1,
      enableCustomizationNotes: product.enableCustomizationNotes ?? true,
    sizes:
      Array.isArray(product.sizes) && product.sizes.length === 8
        ? product.sizes
        : this.getDefaultSizes()
  };
}



getDefaultSizes() {
  return [
    { label: 'XXS', available: true },
    { label: 'XS', available: true },
    { label: 'S', available: true },
    { label: 'M', available: true },
    { label: 'L', available: true },
    { label: 'XL', available: true },
    { label: '2XL', available: true },
    { label: '3XL', available: true }
  ];
}


uploadNewEditImages(
  productId: string,
  headers: HttpHeaders
): Promise<void> {

  return new Promise((resolve, reject) => {

    const formData = new FormData();

    this.editSelectedFiles.forEach(file => {

      formData.append(
        'images',
        file,
        file.name
      );

    });

    this.editUploadingImages = true;

    this.http.post<any>(
      `${this.baseUrl}/products/${productId}/add-images`,
      formData,
      { headers }
    ).subscribe({

      next: (response) => {

        console.log(
          '✅ New images uploaded:',
          response
        );

        // Add newly uploaded images into editing state
        this.editingProduct.images =
          response.images;

        this.editingProduct.image_count =
          response.image_count;

        this.editUploadingImages = false;

        resolve();

      },

      error: (error) => {

        console.error(
          '❌ New image upload failed:',
          error
        );

        this.editUploadingImages = false;

        reject(error);

      }

    });

  });
}

clearEditImageState() {

  this.editImagePreviews.forEach(url => {
    URL.revokeObjectURL(url);
  });

  this.editSelectedFiles = [];
  this.editImagePreviews = [];

  this.editUploadingImages = false;
  this.editDragActive = false;
}





  // 💾 Save product changes (R2-based image system)
saveProduct() {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    alert('⚠️ Unauthorized: Please login again.');
    return;
  }

  if (!this.editingProduct) {
    return;
  }

  const headers = new HttpHeaders().set(
    'Authorization',
    `Bearer ${token}`
  );

  // ================================
  // Normalize colors
  // ================================
  if (typeof this.editingProduct.colors === 'string') {
    this.editingProduct.colors = this.editingProduct.colors
      .split(',')
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 0);
  }

  // ================================
  // Sold Out
  // ================================
  this.editingProduct.isSoldOut =
    !!this.editingProduct.isSoldOut;

  // ================================
  // Ensure sizes
  // ================================
  if (
    !Array.isArray(this.editingProduct.sizes) ||
    this.editingProduct.sizes.length !== 8
  ) {
    this.editingProduct.sizes =
      this.getDefaultSizes();
  }

  // ================================
  // Ensure images
  // ================================
  if (!Array.isArray(this.editingProduct.images)) {
    this.editingProduct.images = [];
  }

  // ================================
  // Image count ALWAYS from images
  // ================================
  this.editingProduct.image_count =
    this.editingProduct.images.length;

  // ================================
  // FINAL PRODUCT PAYLOAD
  // ================================
  const updatedProduct = {

    name: this.editingProduct.name,

    price: Number(
      this.editingProduct.price
    ),

    description:
      this.editingProduct.description,

    category:
      this.editingProduct.category,

    sizes:
      this.editingProduct.sizes,

    colors:
      this.editingProduct.colors,

    // ⭐ Existing images
    // ⭐ Reordered images
    // ⭐ Removed images
    images:
      this.editingProduct.images,

    image_count:
      this.editingProduct.images.length,

    isSoldOut:
      this.editingProduct.isSoldOut,

    enableFabricPrice:
      !!this.editingProduct.enableFabricPrice,

    fabricBasePrice:
      this.editingProduct.enableFabricPrice
        ? Number(this.editingProduct.fabricBasePrice)
        : null,

    displayOrder:
      this.editingProduct.displayOrder || 0,

    stock:
      Number(this.editingProduct.stock) || 0,

    enableCustomizationNotes:
      !!this.editingProduct.enableCustomizationNotes
  };

  console.log(
    '📦 Updating product:',
    updatedProduct
  );

  // ================================
  // STEP 1
  // Save product + image ordering
  // ================================
  this.http
    .put(
      `${this.baseUrl}/products/${this.editingProduct.id}`,
      updatedProduct,
      { headers }
    )
    .subscribe({

      next: async () => {

        // ================================
        // STEP 2
        // Upload newly added images
        // ================================
        if (
          this.editSelectedFiles &&
          this.editSelectedFiles.length > 0
        ) {

          try {

            await this.uploadNewEditImages(
              this.editingProduct.id,
              headers
            );

          } catch (error) {

            console.error(
              '❌ New image upload failed:',
              error
            );

            alert(
              '⚠️ Product saved, but new images failed to upload.'
            );

            return;
          }
        }

        // ================================
        // SUCCESS
        // ================================
        alert(
          '✅ Product updated successfully'
        );

        this.clearEditImageState();

        this.editingProduct = null;

        this.loadProducts();
      },

      error: (err) => {

        console.error(
          '❌ Update failed:',
          err
        );

        alert(
          'Update failed: ' +
          (err.error?.detail || err.message)
        );
      }

    });
}


  // ❌ Cancel edit mode
  cancelEdit() {
    this.editingProduct = null;
  }

  // 🗑️ Delete a product
  deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      alert('⚠️ Unauthorized: Please login again.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${this.baseUrl}/products/${id}`, { headers }).subscribe({
      next: () => {
        alert('🗑️ Product deleted successfully');
        this.loadProducts();
      },
      error: (err) => {
        console.error('❌ Delete failed:', err);
        alert('Delete failed: ' + err.message);
      }
    });
  }


  increaseStock() {
  if (!this.editingProduct) return;
  this.editingProduct.stock = (this.editingProduct.stock || 0) + 1;
}

decreaseStock() {
  if (!this.editingProduct) return;
  const current = this.editingProduct.stock || 0;
  this.editingProduct.stock = current > 0 ? current - 1 : 0;
}

dropEditImage(event: CdkDragDrop<any[]>) {

  if (!this.editingProduct?.images) return;

  moveItemInArray(
    this.editingProduct.images,
    event.previousIndex,
    event.currentIndex
  );

  console.log(
    'New image order:',
    this.editingProduct.images
  );
}

removeEditImage(index: number) {

  if (!this.editingProduct?.images) return;

  if (this.editingProduct.images.length <= 1) {
    alert('A product must have at least one image.');
    return;
  }

  const confirmed = confirm(
    'Remove this image from the product?'
  );

  if (!confirmed) return;

  this.editingProduct.images.splice(index, 1);

  this.editingProduct.image_count =
    this.editingProduct.images.length;
}

moveEditImageLeft(index: number) {
  if (!this.editingProduct?.images || index <= 0) return;

  const images = this.editingProduct.images;

  [images[index - 1], images[index]] =
    [images[index], images[index - 1]];

  // Trigger Angular change detection
  this.editingProduct.images = [...images];
}


// ================================
// Move image right
// ================================
moveEditImageRight(index: number) {
  if (!this.editingProduct?.images) return;

  const images = this.editingProduct.images;

  if (index >= images.length - 1) return;

  [images[index], images[index + 1]] =
    [images[index + 1], images[index]];

  // Trigger Angular change detection
  this.editingProduct.images = [...images];
}

}
