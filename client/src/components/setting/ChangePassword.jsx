import { useState } from "react";
import { changePassword } from "../../services/settingsService";

function ChangePassword() {

  const [form,setForm]=useState({

    currentPassword:"",
    newPassword:""

  });

  const handleChange=(e)=>{

    setForm({

      ...form,

      [e.target.name]:e.target.value

    });

  };

  const handleSubmit=async(e)=>{

    e.preventDefault();

    try{

      const res=await changePassword(form);

      alert(res.message);

      setForm({

        currentPassword:"",
        newPassword:""

      });

    }

    catch(error){

      alert(
        error.response?.data?.message ||
        "Something went wrong"
      );

    }

  };

  return(

    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <input

        type="password"

        name="currentPassword"

        placeholder="Current Password"

        value={form.currentPassword}

        onChange={handleChange}

        className="
        w-full
        border
        rounded-lg
        p-3
        "

      />

      <input

        type="password"

        name="newPassword"

        placeholder="New Password"

        value={form.newPassword}

        onChange={handleChange}

        className="
        w-full
        border
        rounded-lg
        p-3
        "

      />

      <button

        className="
        bg-blue-600
        text-white
        px-6
        py-3
        rounded-lg
        "

      >

        Change Password

      </button>

    </form>

  );

}

export default ChangePassword;