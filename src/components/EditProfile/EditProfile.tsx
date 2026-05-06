import { useAuth } from "../../hooks/useAuth";
import { AdminEditProfile } from "./AdminEditProfile";
import { BuyerEditProfile } from "./BuyerEditProfile";
import { SellerEditProfile } from "./SellerEditProfile";
export function EditProfile() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Show login prompt
    return null;
  }

  switch(currentUser.role) {
    case 'SELLER':
      return <SellerEditProfile />;
    case 'ADMIN':
      return <AdminEditProfile />;
    default:
      return <BuyerEditProfile />;
  }
}