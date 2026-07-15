import {
  LayoutDashboard,
  User,
  Trophy,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


function Sidebar(){

const logout = () => {
  console.log("logout");
};


  const links = [
    {
      name:"Dashboard",
      path:"/dashboard",
      icon:LayoutDashboard
    },
    {
      name:"Profile",
      path:"/profile",
      icon:User
    },
    {
 name:"Analytics",
 path:"/analytics",
 icon:BarChart3
},
{
 name:"Contests",
 path:"/contests",
 icon:Trophy
},
{
 name:"Settings",
 path:"/settings",
 icon:Settings
},
    {
      name:"Settings",
      path:"#",
      icon:Settings
    }
  ];


  return (
    <aside className="
      w-64 
      bg-slate-900 
      text-white 
      min-h-screen 
      p-5
      hidden
      md:block
    ">

      {/* Logo */}
      <h1 className="
        text-2xl 
        font-bold 
        mb-10
      ">
        CodeTrack
      </h1>


      {/* Links */}
      <nav className="space-y-2">

        {
          links.map((link)=>{

            const Icon = link.icon;

            return (

              <NavLink
                key={link.name}
                to={link.path}
                className={({isActive})=>
                  `
                  flex items-center gap-3
                  px-4 py-3
                  rounded-lg
                  transition
                  ${
                    isActive
                    ?
                    "bg-blue-600"
                    :
                    "hover:bg-slate-800"
                  }
                  `
                }
              >

                <Icon size={20}/>

                <span>
                  {link.name}
                </span>


              </NavLink>

            )

          })
        }

      </nav>


      {/* Logout */}
      <button
        onClick={logout}
        className="
        flex
        items-center
        gap-3
        mt-10
        px-4
        py-3
        rounded-lg
        hover:bg-red-600
        w-full
        "
      >

        <LogOut size={20}/>

        Logout

      </button>


    </aside>
  )
}


export default Sidebar;