import { useState, useEffect } from "react";
import { 
  Shield, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Mail, 
  User, 
  Briefcase, 
  Hash, 
  Calendar, 
  ExternalLink,
  Eye,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { adminService } from "../services/adminService";
import type { User as UserType } from "../types";

export function AdminVerificationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [pendingSellers, setPendingSellers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<UserType | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Lightbox document preview state
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const result = await adminService.getPendingVerifications();
      if (result.ok && result.data) {
        setPendingSellers(result.data);
      } else {
        toast.error(result.error || "Failed to load pending verifications");
      }
    } catch (err) {
      toast.error("An error occurred while fetching verifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchPendingVerifications();
    }
  }, [currentUser]);

  // Protect page inline just in case
  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-md text-center max-w-md w-full border border-gray-100">
          <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have the required administrative permissions to access this area.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-xl transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleApprove = async (sellerId: string) => {
    if (!window.confirm("Are you sure you want to APPROVE this seller? They will get instant selling access.")) {
      return;
    }

    setActioningId(sellerId);
    try {
      const result = await adminService.approveVerification(sellerId);
      if (result.ok) {
        toast.success("Seller verification approved successfully!");
        // Instantly remove from pending list
        setPendingSellers((prev) => prev.filter((s) => s.id !== sellerId));
      } else {
        toast.error(result.error || "Failed to approve verification");
      }
    } catch (err) {
      toast.error("An error occurred during approval");
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectClick = (seller: UserType) => {
    setSelectedSeller(seller);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;
    if (!rejectionReason.trim()) {
      toast.error("Please enter a valid rejection reason");
      return;
    }

    setActioningId(selectedSeller.id);
    setShowRejectModal(false);

    try {
      const result = await adminService.rejectVerification(selectedSeller.id, rejectionReason.trim());
      if (result.ok) {
        toast.success(`Verification for ${selectedSeller.name} rejected.`);
        // Instantly remove from pending list
        setPendingSellers((prev) => prev.filter((s) => s.id !== selectedSeller.id));
      } else {
        toast.error(result.error || "Failed to reject verification");
      }
    } catch (err) {
      toast.error("An error occurred during rejection");
      console.error(err);
    } finally {
      setActioningId(null);
      setSelectedSeller(null);
      setRejectionReason("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back and Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="p-2 bg-white rounded-xl hover:bg-gray-100 text-gray-700 shadow-sm border border-gray-200 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Seller Verifications
              </h1>
              <p className="text-gray-500 mt-1">
                Review, approve, or reject business certificates and credentials for pending sellers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-medium border border-purple-100 self-start sm:self-auto shadow-sm">
            <Shield className="w-4 h-4" />
            <span>Admin Portal</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-gray-200 rounded-xl" />
                  <div className="h-32 bg-gray-200 rounded-xl" />
                </div>
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                  <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : pendingSellers.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              There are no pending seller verification requests to review at the moment. Excellent work!
            </p>
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl transition duration-150 border border-gray-200"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Requests Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pendingSellers.map((seller) => {
              const businessName = seller.verification?.businessName || "Not Provided";
              const regNumber = seller.verification?.registrationNumber || "Not Provided";
              const submittedDate = seller.verification?.submittedAt 
                ? new Date(seller.verification.submittedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : "Unknown submitted date";

              return (
                <div 
                  key={seller.id}
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative"
                >
                  {/* Top info card body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Header: Avatar, Name, Email */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {seller.profileImage ? (
                          <img 
                            src={seller.profileImage} 
                            alt={seller.name} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-purple-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xl flex items-center justify-center shadow-inner">
                            {seller.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {seller.name}
                          </h3>
                          <a 
                            href={`mailto:${seller.email}`}
                            className="text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1.5 text-sm mt-0.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {seller.email}
                          </a>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                        Pending
                      </span>
                    </div>

                    {/* Business specific Details */}
                    <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-3.5">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-500 shadow-sm">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Business Name</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{businessName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-500 shadow-sm">
                          <Hash className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Registration Number</p>
                          <p className="text-sm font-mono font-semibold text-gray-800 truncate">{regNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-500 shadow-sm">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Submitted On</p>
                          <p className="text-sm font-semibold text-gray-800">{submittedDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Document Previews Section */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        Verification Documents
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {/* BR Certificate */}
                        <div className="group relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] flex flex-col justify-end shadow-sm">
                          {seller.verification?.brCertificateUrl ? (
                            <>
                              <img
                                src={seller.verification.brCertificateUrl}
                                alt="BR Certificate"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ 
                                    url: seller.verification?.brCertificateUrl || "", 
                                    title: `${seller.name} - BR Certificate` 
                                  })}
                                  className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors shadow"
                                  title="Quick View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a
                                  href={seller.verification.brCertificateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors shadow"
                                  title="Open Original"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                              <AlertCircle className="w-6 h-6 mb-1 text-red-400" />
                              <span className="text-xs">No BR Uploaded</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                            <span className="text-xs font-semibold text-white truncate block">BR Certificate</span>
                          </div>
                        </div>

                        {/* NIC Image */}
                        <div className="group relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] flex flex-col justify-end shadow-sm">
                          {seller.verification?.nicImageUrl ? (
                            <>
                              <img
                                src={seller.verification.nicImageUrl}
                                alt="NIC Image"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ 
                                    url: seller.verification?.nicImageUrl || "", 
                                    title: `${seller.name} - NIC / Identity card` 
                                  })}
                                  className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors shadow"
                                  title="Quick View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a
                                  href={seller.verification.nicImageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors shadow"
                                  title="Open Original"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                              <AlertCircle className="w-6 h-6 mb-1 text-red-400" />
                              <span className="text-xs">No NIC Uploaded</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                            <span className="text-xs font-semibold text-white truncate block">National Identity Card</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 bg-gray-50 border-t border-gray-150 flex gap-4">
                    <button
                      type="button"
                      disabled={actioningId === seller.id}
                      onClick={() => handleRejectClick(seller)}
                      className="flex-1 flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 bg-white font-medium py-3 px-4 rounded-xl transition duration-150 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === seller.id}
                      onClick={() => handleApprove(seller.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition duration-150 disabled:opacity-50"
                    >
                      {actioningId === seller.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      Approve Seller
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / Document Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col border border-gray-100 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 truncate pr-4">{previewDoc.title}</h3>
              <div className="flex items-center gap-3">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Full Resolution
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-gray-500 hover:text-gray-700 font-semibold p-1 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-900 p-2 overflow-y-auto flex items-center justify-center min-h-[50vh]">
              <img
                src={previewDoc.url}
                alt="Document Preview"
                className="max-w-full max-h-[70vh] object-contain shadow-md rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedSeller && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setShowRejectModal(false);
            setSelectedSeller(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-150 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3.5 mb-4 text-red-600">
                <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Reject Verification</h3>
              </div>

              <p className="text-gray-500 text-sm mb-6">
                You are rejecting the seller verification request for <strong className="text-gray-800">{selectedSeller.name}</strong> ({selectedSeller.verification?.businessName}). 
                Please enter a descriptive reason why their credentials were rejected. The seller will see this feedback.
              </p>

              <form onSubmit={handleRejectSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reason" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    id="reason"
                    rows={4}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. BR Certificate document is too blurry to read, or the registration number doesn't match official registries. Please re-upload a clear high-resolution scan."
                    className="w-full rounded-2xl border-gray-300 border p-4 shadow-inner text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-150"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedSeller(null);
                      setRejectionReason("");
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl border border-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!rejectionReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
