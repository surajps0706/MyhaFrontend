import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';


@Component({
  selector: 'app-product-upload',
  standalone: true,
  templateUrl: './product-upload.component.html',
  styleUrls: ['./product-upload.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ProductUploadComponent {
product = {
  name: '',
  price: '',
  description: '',
  category: '',
  colors: '',
  image_count: 0,
  enableFabricPrice: false,
  fabricBasePrice: '',
  stock: 10,
  enableCustomizationNotes: true
};

  uploading = false;
  fabricPriceOptions = [100, 200, 300];

  selectedFiles: File[] = [];

imagePreviews: string[] = [];

uploadProgress = 0;

dragActive = false;

readonly MAX_IMAGES = 20;

  constructor(private http: HttpClient) {}

 onFileSelected(event: any) {
  const files = event.target.files;

  if (!files || files.length === 0) return;

  Array.from(files).forEach((file: any) => {
    console.log("Name:", file.name);
    console.log("Type:", file.type);
  });

  this.processImages(Array.from(files));
}


onDragOver(event: DragEvent) {

  event.preventDefault();

  this.dragActive = true;

}

onDragLeave(event: DragEvent) {

  event.preventDefault();

  this.dragActive = false;

}

onDrop(event: DragEvent) {

  event.preventDefault();

  this.dragActive = false;

  if (!event.dataTransfer?.files.length)
    return;

  this.processImages(
      Array.from(event.dataTransfer.files)
  );

}



async processImages(files: File[]) {

  this.selectedFiles = [];

  this.imagePreviews = [];

  if (files.length > this.MAX_IMAGES) {

    alert(`Maximum ${this.MAX_IMAGES} images allowed`);

    return;

  }

  for (const file of files) {

    try {

      const processed = await this.prepareImage(file);

      this.selectedFiles.push(processed);

      this.imagePreviews.push(
        URL.createObjectURL(processed)
      );

    }

    catch(err){

      console.error(err);

    }

  }

  this.product.image_count =
      this.selectedFiles.length;

}


async prepareImage(file: File): Promise<File> {

  let workingFile = file;

  const fileName = file.name.toLowerCase();

  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif");

  if (isHeic) {

    console.log("📱 Converting HEIC:", file.name);

    try {

      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9
      });

      const jpegBlob = Array.isArray(converted)
        ? converted[0]
        : converted;

      workingFile = new File(
        [jpegBlob as Blob],
        file.name.replace(/\.(heic|heif)$/i, ".jpg"),
        {
          type: "image/jpeg"
        }
      );

    } catch (err) {

      console.error("HEIC conversion failed:", err);

      throw new Error("Unable to convert HEIC image.");

    }

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
    workingFile.name.replace(/\.(png|webp|heic|heif)$/i, ".jpg"),
    {
      type: "image/jpeg"
    }
  );

}

  increaseStock() {
    this.product.stock++;
  }

  decreaseStock() {
    if (this.product.stock > 0) this.product.stock--;
  }

 uploadProduct() {

  if (this.uploading)
    return;

  if (this.selectedFiles.length === 0) {

    alert("Please select at least one image.");

    return;

  }

  this.uploading = true;

  this.uploadProgress = 0;

  const payload = {

    name: this.product.name.trim(),

    price: Number(this.product.price),

    description: this.product.description.trim(),

    category: this.product.category.trim(),

    sizes: ["Customizable"],

    colors: this.product.colors
      ? this.product.colors.split(',').map(c => c.trim())
      : ["Default"],

    image_count: this.selectedFiles.length,

    enableFabricPrice: this.product.enableFabricPrice,

    fabricBasePrice: this.product.enableFabricPrice
      ? Number(this.product.fabricBasePrice)
      : null,

    stock: this.product.stock,

    enableCustomizationNotes:
      this.product.enableCustomizationNotes

  };

  const token =
      localStorage.getItem("admin_token");

  const headers =
      new HttpHeaders().set(
        "Authorization",
        `Bearer ${token}`
      );

  this.http.post<any>(

      `${environment.apiUrl}/add-product`,

      payload,

      {headers}

  ).subscribe({

      next:(res)=>{

          const productId = res.id;

          this.uploadImages(
              productId,
              headers
          );

      },

    error: (err) => {

    console.error("FULL ERROR:", err);

    console.log("Status:", err.status);

    console.log("Response:", err.error);

    alert(JSON.stringify(err.error));

    this.uploading = false;

}

  });

}

uploadImages(
    productId:string,
    headers:HttpHeaders
){

    const formData = new FormData();

    this.selectedFiles.forEach(file=>{

        formData.append(
            "images",
            file,
            file.name
        );

    });

    this.http.post(

        `${environment.apiUrl}/upload-product-images/${productId}`,

        formData,

        {

            headers,

            reportProgress:true,

            observe:"events"

        }

    ).subscribe({

        next:(event:any)=>{

            if(
                event.type ===
                HttpEventType.UploadProgress
            ){

                if(event.total){

                    this.uploadProgress = Math.round(

                        (event.loaded/event.total)*100

                    );

                }

            }

            if(
                event.type ===
                HttpEventType.Response
            ){

                alert("✅ Product Uploaded Successfully!");

                this.resetForm();

            }

        },

        error:(err)=>{

            console.error(err);

            alert("Image upload failed.");

            this.uploading = false;

        }

    });

}


resetForm(){

    this.product={

        name:'',

        price:'',

        description:'',

        category:'',

        colors:'',

        image_count:0,

        enableFabricPrice:false,

        fabricBasePrice:'',

        stock:10,

        enableCustomizationNotes:true

    };

    this.selectedFiles=[];

    this.imagePreviews=[];

    this.uploadProgress=0;

    this.uploading=false;

}

}
