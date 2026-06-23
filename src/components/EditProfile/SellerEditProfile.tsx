import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useEditProfileForm } from "../../hooks/useEditProfileForm";
import { userService } from "../../services/userservice";
import type { User as UserType, VerificationStatus } from "../../types";
import { ProfileEditForm } from "./ProfileEditForm";
import { SellerDocumentUpload } from "./SellerDocumentUpload";
import { ChangePasswordForm } from "./ChangePasswordForm";

// ─── Status badge helper ────────────────────────────────────────────────────

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map: Record<
    VerificationStatus,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    NONE: {
      label: "Not submitted",
      icon: <AlertCircle className="w-4 h-4" />,
      className: "bg-gray-100 text-gray-600",
    },
    PENDING: {
      label: "Under review",
      icon: <Clock className="w-4 h-4" />,
      className: "bg-purple-100 text-purple-700",
    },
    APPROVED: {
      label: "Verified ✓",
      icon: <BadgeCheck className="w-4 h-4" />,
      className: "bg-green-100 text-green-700",
    },
    REJECTED: {
      label: "Rejected — please resubmit",
      icon: <AlertCircle className="w-4 h-4" />,
      className: "bg-red-100 text-red-700",
    },
  };

  const { label, icon, className } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function SellerEditProfile() {
  const { currentUser, updateUser, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const [activeSection, setActiveSection] = useState<
    "profile" | "verification" | "security"
  >(() => {
    const section = new URLSearchParams(location.search).get("section");
    if (section === "verification") return "verification";
    if (section === "security") return "security";
    return "profile";
  });

  useEffect(() => {
    const section = new URLSearchParams(location.search).get("section");
    if (section === "verification") setActiveSection("verification");
    else if (section === "security") setActiveSection("security");
    else setActiveSection("profile");
  }, [location.search]);

  /* ---- Verification state ---- */
  const existingVerification = currentUser?.verification;
  const verificationStatus: VerificationStatus =
    existingVerification?.status ?? "NONE";

  const [verificationData, setVerificationData] = useState({
    businessName: "",
    registrationNumber: "",
    brCertificateUrl: "",
    nicImageUrl: "",
  });

  // Pre-fill form when currentUser data is available
  useEffect(() => {
    if (currentUser?.verification) {
      setVerificationData({
        businessName: currentUser.verification.businessName || "",
        registrationNumber: currentUser.verification.registrationNumber || "",
        brCertificateUrl: currentUser.verification.brCertificateUrl || "",
        nicImageUrl: currentUser.verification.nicImageUrl || "",
      });
    }
  }, [currentUser]);

  const [isSubmittingVerification, setIsSubmittingVerification] =
    useState(false);

  /* ---- Guard: not logged in ---- */
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

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleVerificationInputChange = (field: string, value: string) => {
    setVerificationData((prev) => ({ ...prev, [field]: value }));
  };

  /* ---- Submit verification ---- */
  const handleSubmitVerification = async () => {
    if (!token) {
      toast.error("You must be logged in to submit verification");
      return;
    }
    if (!verificationData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }
    if (!verificationData.registrationNumber.trim()) {
      toast.error("Registration number is required");
      return;
    }
    if (!verificationData.brCertificateUrl) {
      toast.error("Please upload your BR Certificate");
      return;
    }
    if (!verificationData.nicImageUrl) {
      toast.error("Please upload your NIC photo");
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const response = await userService.submitVerification(token, {
        businessName: verificationData.businessName.trim(),
        registrationNumber: verificationData.registrationNumber.trim(),
        brCertificateUrl: verificationData.brCertificateUrl,
        nicImageUrl: verificationData.nicImageUrl,
      });

      if (!response.ok) {
        toast.error(response.error || "Failed to submit verification");
        return;
      }

      // Update local state so badge refreshes
      if (response.data) {
        updateUser(response.data);
      } else {
        const updatedUser: UserType = {
          ...currentUser,
          verification: {
            businessName: verificationData.businessName.trim(),
            registrationNumber: verificationData.registrationNumber.trim(),
            brCertificateUrl: verificationData.brCertificateUrl,
            nicImageUrl: verificationData.nicImageUrl,
            status: "PENDING",
            submittedAt: new Date().toISOString(),
          },
        };
        updateUser(updatedUser);
      }
      toast.success(
        "Verification request submitted! We'll review it shortly."
      );
    } catch (error) {
      console.error("Verification submission error:", error);
      toast.error("Failed to submit verification. Please try again.");
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Whether the verification form should be locked
  const verificationLocked =
    verificationStatus === "APPROVED" || verificationStatus === "PENDING";

  // ─── Render ─────────────────────────────────────────────────────────────

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

        {/* ── Tab Navigation ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => navigate("?section=profile")}
            className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeSection === "profile"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50 hover:text-purple-600"
            }`}
          >
            <User className="w-4 h-4" />
            Profile Info
          </button>
          <button
            onClick={() => navigate("?section=verification")}
            className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeSection === "verification"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50 hover:text-purple-600"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Business Verification
          </button>
          <button
            onClick={() => navigate("?section=security")}
            className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeSection === "security"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                : "text-gray-500 hover:bg-gray-50 hover:text-purple-600"
            }`}
          >
            <Lock className="w-4 h-4" />
            Security
          </button>
        </div>
        {/* ── Main profile card ── */}
        {activeSection === "profile" && (
          <div className="mb-6">
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
          </div>
        )}

        {/* ── Verified Seller card (SELLER role only) ── */}
        {currentUser.role === "SELLER" && activeSection === "verification" && (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Verified Seller Programme
                    </h2>
                    <p className="text-sm text-gray-500">
                      Get a verified badge to boost buyer trust
                    </p>
                  </div>
                </div>
                <VerificationBadge status={verificationStatus} />
              </div>
            </div>

            {/* Explainer banner */}
            <div className="mx-6 mt-6 flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <BadgeCheck className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <span className="font-semibold">Why get verified?</span> A
                verified badge appears on your store and products, signalling
                authenticity to buyers and helping you get more sales.
              </div>
            </div>

            {/* Rejection reason */}
            {verificationStatus === "REJECTED" &&
              existingVerification?.rejectionReason && (
                <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <span className="font-semibold">Rejection reason: </span>
                    {existingVerification.rejectionReason}
                  </div>
                </div>
              )}

            {/* Approved banner */}
            {verificationStatus === "APPROVED" && (
              <div className="mx-6 mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <BadgeCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <span className="font-semibold">
                    Your account is verified!
                  </span>{" "}
                  The verified badge is now showing on your profile and
                  listings.
                </div>
              </div>
            )}

            {/* Pending banner */}
            {verificationStatus === "PENDING" && (
              <div className="mx-6 mt-4 flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">Review in progress.</span>{" "}
                      Our team will verify your documents within 1–3 business days.
                    </div>
                    {existingVerification?.submittedAt && (
                      <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        Submitted: {new Date(existingVerification.submittedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Verification form */}
            <div className="p-6 space-y-6">
              {/* Field 1 – Business Name */}
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    Business Name *
                  </span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  value={verificationData.businessName}
                  onChange={(e) =>
                    handleVerificationInputChange("businessName", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. Luxe Bags (Pvt) Ltd"
                  disabled={verificationLocked || isSubmittingVerification}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must match the name on your Business Registration Certificate.
                </p>
              </div>

              {/* Field 2 – Registration Number */}
              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Registration Number *
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  value={verificationData.registrationNumber}
                  onChange={(e) =>
                    handleVerificationInputChange(
                      "registrationNumber",
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. W/12345 or PV 00234567"
                  disabled={verificationLocked || isSubmittingVerification}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found on your Business Registration Certificate issued by the
                  Department of the Registrar of Companies.
                </p>
              </div>

              {/* Upload 1 – BR Certificate */}
              <SellerDocumentUpload
                label="BR Certificate"
                description="Upload a clear photo or scan of your Business Registration Certificate."
                hint="JPEG, PNG, WebP or PDF — max 10 MB"
                currentUrl={verificationData.brCertificateUrl}
                onUploadComplete={(url) =>
                  handleVerificationInputChange("brCertificateUrl", url)
                }
                onRemove={() =>
                  handleVerificationInputChange("brCertificateUrl", "")
                }
                disabled={verificationLocked || isSubmittingVerification}
              />

              {/* Upload 2 – NIC */}
              <SellerDocumentUpload
                label="Owner's NIC (National Identity Card)"
                description="Upload a photo of the owner's NIC. The name must match the business registration."
                hint="JPEG, PNG or WebP — max 10 MB"
                accept="image/jpeg,image/png,image/webp"
                currentUrl={verificationData.nicImageUrl}
                onUploadComplete={(url) =>
                  handleVerificationInputChange("nicImageUrl", url)
                }
                onRemove={() =>
                  handleVerificationInputChange("nicImageUrl", "")
                }
                disabled={verificationLocked || isSubmittingVerification}
              />

              {/* Privacy note */}
              <p className="text-xs text-gray-400">
                🔒 Your documents are encrypted and only reviewed by our
                compliance team. They will never be shared with third parties.
              </p>

              {/* Submit button */}
              {!verificationLocked && (
                <div className="pt-2">
                  <button
                    type="button"
                    id="submitVerification"
                    onClick={handleSubmitVerification}
                    disabled={isSubmittingVerification}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isSubmittingVerification
                      ? "Submitting…"
                      : verificationStatus === "REJECTED"
                      ? "Resubmit Verification"
                      : "Submit for Verification"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ── Security section ── */}
        {activeSection === "security" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChangePasswordForm />
          </div>
        )}
      </div>
    </div>
  );
}
