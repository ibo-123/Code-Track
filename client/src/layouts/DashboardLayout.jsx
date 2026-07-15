import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <Navbar />

        {/* Page */}
        <main className="p-6">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;