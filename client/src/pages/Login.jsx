import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";


function Login(){

    const navigate = useNavigate();

    const { saveToken } = useAuth();


    const [form,setForm] = useState({
        email:"",
        password:""
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

            const data = await loginUser(form);


            saveToken(data.token);


            navigate("/dashboard");


        }catch(error){

            console.log(
                error.response?.data ||
                error.message
            );

        }

    };


    return(
        <div>

            <h1>
                Login
            </h1>


            <form onSubmit={handleSubmit}>


                <input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                />


                <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                />


                <button>
                    Login
                </button>


            </form>


        </div>
    );

}


export default Login;