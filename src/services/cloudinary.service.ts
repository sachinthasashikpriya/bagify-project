// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "bagify_profiles";

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export const cloudinaryService = {
  /**
   * Upload an image to Cloudinary
   * @param file - The image file to upload
   * @param folder - Optional folder name in Cloudinary
   * @returns Promise with the upload result
   */
  async uploadImage(file: File, folder: string = "profile_photos"): Promise<{
    ok: boolean;
    data?: CloudinaryResponse;
    error?: string;
  }> {
    console.log("☁️ ====== CLOUDINARY UPLOAD ======");
    console.log("☁️ File name:", file.name);
    console.log("☁️ File size:", (file.size / 1024).toFixed(2), "KB");
    console.log("☁️ File type:", file.type);

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        ok: false,
        error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        ok: false,
        error: "File is too large. Maximum size is 5MB.",
      };
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      console.log("☁️ Upload URL:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      console.log("☁️ Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("☁️ Upload error:", errorData);
        return {
          ok: false,
          error: errorData.error?.message || "Failed to upload image",
        };
      }

      const data: CloudinaryResponse = await response.json();
      console.log("☁️ Upload successful!");
      console.log("☁️ Image URL:", data.secure_url);
      console.log("☁️ Public ID:", data.public_id);

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.error("☁️ Network error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  /**
   * Get optimized image URL with transformations
   * @param imageUrl - Original Cloudinary URL
   * @param width - Desired width
   * @param height - Desired height
   * @returns Transformed image URL
   */
  getOptimizedUrl(imageUrl: string, width: number = 200, height: number = 200): string {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
      return imageUrl;
    }

    // Insert transformation parameters into the URL
    // Example: https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,g_face/sample.jpg
    const transformations = `w_${width},h_${height},c_fill,g_face,q_auto,f_auto`;
    
    return imageUrl.replace(
      "/image/upload/",
      `/image/upload/${transformations}/`
    );
  },

  /**
   * Get a placeholder avatar URL
   * @param name - User's name for generating initials
   * @returns URL for a placeholder avatar
   */
  getPlaceholderAvatar(name: string): string {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
    
    // Using UI Avatars service as fallback
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9333ea&color=fff&size=200`;
  },
};