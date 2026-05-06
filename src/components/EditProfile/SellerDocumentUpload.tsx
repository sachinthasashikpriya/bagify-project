import { CheckCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cloudinaryService } from "../../services/cloudinaryservice";

interface SellerDocumentUploadProps {
  label: string;
  description: string;
  hint?: string;
  /** Cloudinary URL already stored (if re-editing) */
  currentUrl?: string;
  /** Accept string for the file input */
  accept?: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function SellerDocumentUpload({
  label,
  description,
  hint,
  currentUrl,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  onUploadComplete,
  onRemove,
  disabled = false,
}: SellerDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [fileName, setFileName] = useState<string | undefined>();
  const [isPdf, setIsPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, WebP image or a PDF.");
      return;
    }

    const pdf = file.type === "application/pdf";
    setIsPdf(pdf);
    setFileName(file.name);

    // Show local preview for images
    if (!pdf) {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
    }

    setIsUploading(true);

    try {
      // For PDFs, upload as raw resource to Cloudinary
      const folder = "bagify_verification";

      let uploadResult: { ok: boolean; data?: { secure_url: string }; error?: string };

      if (pdf) {
        // Upload PDF as raw file via Cloudinary
        const formData = new FormData();
        const CLOUDINARY_CLOUD_NAME =
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
        const CLOUDINARY_UPLOAD_PRESET =
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "bagify_profiles";

        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", folder);
        formData.append("resource_type", "raw");

        const resp = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
          { method: "POST", body: formData }
        );

        if (!resp.ok) {
          const err = await resp.json();
          uploadResult = {
            ok: false,
            error: err.error?.message || "PDF upload failed",
          };
        } else {
          const json = await resp.json();
          uploadResult = { ok: true, data: { secure_url: json.secure_url } };
        }
      } else {
        uploadResult = await cloudinaryService.uploadImage(file, folder);
      }

      if (!uploadResult.ok || !uploadResult.data) {
        toast.error(uploadResult.error || "Upload failed");
        setPreviewUrl(currentUrl);
        setFileName(undefined);
        return;
      }

      const url = uploadResult.data.secure_url;
      setPreviewUrl(url);
      onUploadComplete(url);
      toast.success(`${label} uploaded successfully!`);
    } catch (err) {
      console.error("Document upload error:", err);
      toast.error("Upload failed. Please try again.");
      setPreviewUrl(currentUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setFileName(undefined);
    setIsPdf(false);
    onRemove();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-500">{description}</p>

      {/* Upload zone */}
      {!previewUrl ? (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-xl p-6 cursor-pointer
            transition-all duration-200
            ${disabled || isUploading
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : "border-purple-300 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400"
            }
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm text-purple-600 font-medium">Uploading…</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-purple-400" />
              <p className="text-sm text-gray-600 font-medium">
                Click to upload {label}
              </p>
              <p className="text-xs text-gray-400">
                {hint || "JPEG, PNG, WebP or PDF — max 10 MB"}
              </p>
            </>
          )}
        </div>
      ) : (
        /* Preview */
        <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          {isPdf ? (
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {fileName || "Document.pdf"}
                </p>
                <p className="text-xs text-gray-400">PDF uploaded</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-40 object-cover"
            />
          )}

          {/* Remove button */}
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-500 hover:shadow-md transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Uploaded badge */}
          {!isPdf && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
              <CheckCircle className="w-3 h-3" />
              Uploaded
            </div>
          )}
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
