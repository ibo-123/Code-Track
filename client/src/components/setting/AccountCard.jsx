import { Card, CardContent } from "../ui/card";
import { User, Trash2 } from "lucide-react";
import ChangePassword from "./ChangePassword";

function AccountCard() {
  return (
    <Card>
      <CardContent className="p-6">

        <div className="flex items-center gap-3 mb-6">
          <User className="text-blue-600" />
          <h2 className="text-xl font-bold">
            Account
          </h2>
        </div>

        <ChangePassword />

        <button
          className="
            w-full
            mt-6
            text-left
            p-3
            rounded-lg
            hover:bg-red-50
            text-red-600
            transition
          "
        >
          <div className="flex items-center gap-3">
            <Trash2 size={18} />
            Delete Account
          </div>
        </button>

      </CardContent>
    </Card>
  );
}

export default AccountCard;