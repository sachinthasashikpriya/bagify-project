import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useEditProfileForm } from "../../hooks/useEditProfileForm";
import { ProfileEditForm } from "./ProfileEditForm";

export function BuyerEditProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    formData,
    isSaving,
    getDashboardPath,
    handleInputChange,
    handleProfileImageChange,
    handleCancel,
    handleSave,
  } = useEditProfileForm();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Please Login
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to edit your profile.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(getDashboardPath())}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <ProfileEditForm
          role={currentUser.role}
          currentUserName={currentUser.name}
          formData={formData}
          isSaving={isSaving}
          onInputChange={handleInputChange}
          onImageChange={handleProfileImageChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
