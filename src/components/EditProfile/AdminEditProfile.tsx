import { ArrowLeft, User, Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useEditProfileForm } from "../../hooks/useEditProfileForm";
import { ProfileEditForm } from "./ProfileEditForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function AdminEditProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sectionQuery = new URLSearchParams(location.search).get("section");
  const activeSection: "profile" | "security" = sectionQuery === "security" ? "security" : "profile";

  const {
    formData,
    isSaving,
    getDashboardPath,
    handleInputChange,
    handleProfileImageChange,
    handleCancel,
    handleSave,
    isDeleting,
    handleDeleteAccount,
  } = useEditProfileForm();

  // Check if user is logged in
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => navigate("?section=profile")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeSection === "profile"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => navigate("?section=security")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeSection === "security"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Lock className="w-4 h-4" />
            Security
          </button>
        </div>

        {activeSection === "profile" ? (
          <ProfileEditForm
            role={currentUser.role}
            currentUserName={currentUser.name}
            formData={formData}
            isSaving={isSaving}
            onInputChange={handleInputChange}
            onImageChange={handleProfileImageChange}
            onSave={handleSave}
            onCancel={handleCancel}
            onDeleteAccount={handleDeleteAccount}
            isDeleting={isDeleting}
          />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChangePasswordForm />
          </div>
        )}
      </div>
    </div>
  );
}
