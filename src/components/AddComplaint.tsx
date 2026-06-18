import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Loader2, MessageSquareWarning, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "../services/orderService";
import { cloudinaryService } from "../services/cloudinaryservice";
import { complaintService } from "../services/complaintService";

interface PurchasedProduct {
  id: number;
  name: string;
  imageUrl?: string;
}

export function AddComplaint() {
  const navigate = useNavigate();
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  // Form fields
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const result = await orderService.getMyOrders();
        if (result.ok && result.data) {
          const productsMap = new Map<number, PurchasedProduct>();
          result.data.forEach((order) => {
            order.items.forEach((item) => {
              productsMap.set(item.productId, {
                id: item.productId,
                name: item.productName,
                imageUrl: item.imageUrl,
              });
            });
          });
          setPurchasedProducts(Array.from(productsMap.values()));
        } else {
          toast.error(result.error || "Failed to fetch purchased products");
        }
      } catch {
        toast.error("An error occurred while fetching your orders");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchPurchasedProducts();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length >= 5) {
      toast.warning("You can upload a maximum of 5 images");
      return;
    }

    const file = files[0];
    try {
      setIsUploading(true);
      const result = await cloudinaryService.uploadImage(file, "complaints");
      if (result.ok && result.data) {
        setUploadedImages((prev) => [...prev, result.data!.secure_url]);
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch {
      toast.error("An error occurred while uploading the image");
    } finally {
      setIsUploading(false);
      // Clear value so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    toast.success("Image removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a description of the issue");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await complaintService.submitComplaint({
        productId: Number(selectedProductId),
        description: description.trim(),
        images: uploadedImages,
      });

      if (response.ok) {
        toast.success("Your complaint has been submitted to the seller.");
        navigate("/buyer-dashboard");
      } else {
        toast.error(response.error || "Failed to submit complaint");
      }
    } catch {
      toast.error("An error occurred while submitting your complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = purchasedProducts.find(
    (p) => p.id === Number(selectedProductId)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate("/buyer-dashboard")}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-6 font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Header section */}
          <div className="px-6 py-8 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-white to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <MessageSquareWarning className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                File a Complaint
              </h1>
            </div>
            <p className="text-gray-500 max-w-xl">
              Describe your issues with a product you purchased, upload photos of any damage, and we will send this directly to the seller for resolution.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Purchased Product <span className="text-red-500">*</span>
              </label>
              
              {isLoadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3 px-4 border border-gray-200 rounded-xl bg-gray-50/50">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  Loading your purchased products...
                </div>
              ) : purchasedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <HelpCircle className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No purchased products found
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    You can only file complaints for products you have actually ordered.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="" disabled>
                      -- Choose a product --
                    </option>
                    {purchasedProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  {/* Selected product preview card */}
                  {selectedProduct && (
                    <div className="flex items-center gap-4 p-4 border border-purple-100 bg-purple-50/30 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                        <img
                          src={selectedProduct.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80"}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80";
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {selectedProduct.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Product ID: #{selectedProduct.id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What is the issue? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail. Mention details like if the product arrived damaged, if parts are missing, or if it doesn't match the description."
                className="w-full min-h-[150px] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm leading-relaxed"
                required
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Images (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload up to 5 clear images showing the issue or product condition. Max 5MB per image.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* Upload box */}
                {uploadedImages.length < 5 && (
                  <label className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-purple-50/10 transition-all aspect-square relative select-none">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        <span className="text-[10px] text-gray-500 mt-1">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 mt-1">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Uploaded thumbnails */}
                {uploadedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group border border-gray-100 rounded-xl overflow-hidden aspect-square shadow-sm bg-gray-50"
                  >
                    <img
                      src={imageUrl}
                      alt={`Complaint attachment ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/buyer-dashboard")}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingProducts || purchasedProducts.length === 0}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Complaint"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
