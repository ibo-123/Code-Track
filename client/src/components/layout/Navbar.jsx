import { Bell } from "lucide-react";


function Navbar(){

  return (

    <header
      className="
      h-16
      bg-white
      border-b
      flex
      items-center
      justify-between
      px-6
      "
    >

      <h2 className="font-semibold text-xl">
        Dashboard
      </h2>


      <div className="
        flex
        items-center
        gap-5
      ">


        <Bell size={22}/>


        <div className="
          flex
          items-center
          gap-3
        ">

          <div className="
            w-10
            h-10
            rounded-full
            bg-blue-600
            text-white
            flex
            items-center
            justify-center
            font-bold
          ">
            I
          </div>


          <span>
            Ibrahim
          </span>


        </div>


      </div>


    </header>

  )
}


export default Navbar;