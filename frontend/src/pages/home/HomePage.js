import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../images/logo2.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-600 text-white">
    <img src={logo} alt="QCD Logo" className="w-[60rem] h-[30rem] -mb-24" />
      <div className="flex space-x-20 mb-24  -mt-14">
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-2 border border-white rounded hover:bg-white hover:text-blue-600 transition"
        >
          Log in
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="px-8 py-2 border border-white rounded hover:bg-white hover:text-blue-600 transition"
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default Home;
