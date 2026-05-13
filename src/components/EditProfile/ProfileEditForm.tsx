import { Save, User, X } from "lucide-react";
import type { FormEvent } from "react";
import { ProfilePhotoUpload } from "../ProfilePhotoUpload";
import type { EditProfileFormData } from "../../hooks/useEditProfileForm";

interface ProfileEditFormProps {
  role: "BUYER" | "SELLER" | "ADMIN";
  currentUserName: string;
  formData: EditProfileFormData;
  isSaving: boolean;
  onInputChange: (field: keyof EditProfileFormData, value: string) => void;
  onImageChange: (imageUrl: string | undefined) => void;
  onSave: (e: FormEvent) => void;
  onCancel: () => void;
}

export function ProfileEditForm({
  role,
  currentUserName,
  formData,
  isSaving,
  onInputChange,
  onImageChange,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600">Update your personal information</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSave} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 capitalize">
              {role}
            </div>
            <p className="text-xs text-gray-500 mt-1">Account type cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
              {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Join date is fixed</p>
          </div>
        </div>

        <div className="flex justify-center pb-6 border-b border-gray-200">
          <ProfilePhotoUpload
            currentImage={formData.profileImage}
            userName={formData.name || currentUserName}
            onImageChange={onImageChange}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your full name"
            disabled={isSaving}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your email address"
            disabled={isSaving}
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your phone number"
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => onInputChange("address", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Enter your address"
            disabled={isSaving}
          />
        </div>

        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Profile Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep your contact information up to date</li>
            <li>• Use a professional email address</li>
            <li>• Provide accurate address for deliveries</li>
            <li>• Your profile information helps us serve you better</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
