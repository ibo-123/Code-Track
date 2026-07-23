import { Card, CardContent } from "../ui/card";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LogoutCard() {

  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Card>

      <CardContent className="p-6">

        <div className="flex items-center gap-3 mb-6">

          <LogOut className="text-red-500" />

          <h2 className="text-xl font-bold">
            Logout
          </h2>

        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>

      </CardContent>

    </Card>
  );
}

export default LogoutCard;