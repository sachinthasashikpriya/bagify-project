import { Camera, Loader, Trash2, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cloudinaryService } from "../services/cloudinary.service";

interface ProfilePhotoUploadProps {
  currentImage?: string;
  userName: string;
  onImageChange: (imageUrl: string | undefined) => void;
  disabled?: boolean;
}

export function ProfilePhotoUpload({
  currentImage,
  userName,
  onImageChange,
  disabled = false,
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📷 File selected:", file.name);

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setIsUploading(true);

    try {
      const result = await cloudinaryService.uploadImage(file, "bagify_profiles");

      if (!result.ok || !result.data) {
        toast.error(result.error || "Failed to upload image");
        setPreviewUrl(currentImage); // Revert to previous image
        return;
      }

      const imageUrl = result.data.secure_url;
      console.log("✅ Image uploaded:", imageUrl);

      setPreviewUrl(imageUrl);
      onImageChange(imageUrl);
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setPreviewUrl(currentImage);
    } finally {
      setIsUploading(false);
      // Clean up the local preview URL
      URL.revokeObjectURL(localPreview);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(undefined);
    onImageChange(undefined);
    toast.success("Profile photo removed");
  };

  const triggerFileInput = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Get display image URL
  const displayImage = previewUrl
    ? cloudinaryService.getOptimizedUrl(previewUrl, 150, 150)
    : cloudinaryService.getPlaceholderAvatar(userName);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Photo */}
      <div className="relative">
        <div
          onClick={triggerFileInput}
          className={`
            w-32 h-32 rounded-full overflow-hidden border-4 border-purple-100
            ${!disabled && !isUploading ? "cursor-pointer hover:opacity-80" : ""}
            transition-opacity
          `}
        >
          {isUploading ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : previewUrl ? (
            <img
              src={displayImage}
              alt={userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = cloudinaryService.getPlaceholderAvatar(userName);
              }}
            />
          ) : (
            <div className="w-full h-full bg-purple-100 flex items-center justify-center">
              <User className="w-12 h-12 text-purple-600" />
            </div>
          )}
        </div>

        {/* Camera Icon Overlay */}
        {!disabled && !isUploading && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-lg"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Change Photo"}
        </button>

        {previewUrl && (
          <>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={disabled || isUploading}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        JPG, PNG, GIF or WebP. Max 5MB.
      </p>
    </div>
  );
}