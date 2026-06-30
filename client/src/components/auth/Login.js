import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import swal from "sweetalert";
import TestimonialSlider from "../testimonial/TestimonialSlider";
import { url } from "../../utils/Constants";

import { UserContext } from "../../context/UserContext.jsx";

const Login = () => {
  const { setIslogin } = useContext(UserContext);

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [googleID, setGoogleID] = useState(null);
  const [signUpReq, setSignUpReq] = useState(false);
  const [errors, setErrors] = useState({});

  const onChange = (event) => {
    if (event.target.name === "phone") {
      const phoneValue = event.target.value.substring(0, 10);
      setCredentials({ ...credentials, [event.target.name]: phoneValue });
    } else {
      setCredentials({
        ...credentials,
        [event.target.name]: event.target.value,
      });
    }
  };

  // Normal Login
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (validateForm()) {
      try {
        const response = await fetch(`${url}/auth/signin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          mode: "cors",
        });

        const json = await response.json();

        if (json.success === true) {
          swal({
            title: "Welcome!",
            text: "Logged in Successfully",
            icon: "success",
            button: "Ok!",
          });
          localStorage.setItem("token", json.authToken);
          localStorage.setItem("userInfo", JSON.stringify(json));
          setIslogin(true);
          navigate("/");
        } else {
          swal({
            title: "Try Again!",
            text: json.error || "Invalid credentials",
            icon: "error",
            button: "Ok!",
          });
        }
      } catch (err) {
        swal({
          title: "Try Again!",
          text: "Server error!",
          icon: "error",
          button: "Ok!",
        });
      }
    }
  };

  // Google Login Callback
  const handleCallbackResponse = async (response) => {
    try {
      const userObject = jwt_decode(response.credential);

      setCredentials({
        email: userObject.email,
        fname: userObject.given_name,
        lname: userObject.family_name,
      });
      setGoogleID(userObject.sub);

      const res = await fetch(`${url}/oauth/google/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          googleId: userObject.sub,
          email: userObject.email,
        }),
        mode: "cors",
      });

      const json = await res.json();

      if (json.success === true) {
        swal({
          title: "Welcome!",
          text: "Logged in Successfully",
          icon: "success",
          button: "Ok!",
        });
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        navigate("/");
      } else if (json.requireSignup) {
        setSignUpReq(true);
      } else {
        swal({
          title: "Try Again!",
          text: json.error || "Something went wrong",
          icon: "error",
          button: "Ok!",
        });
      }
    } catch (err) {
      swal({
        title: "Try Again!",
        text: "Server error!",
        icon: "error",
        button: "Ok!",
      });
    }
  };

  // Google Signup (Phone Required)
  const handleGoogleSubmit = async (event) => {
    event.preventDefault();

    if (!credentials.phone) {
      swal({ title: "Error", text: "Phone number is required", icon: "error" });
      return;
    }

    try {
      const response = await fetch(`${url}/oauth/google/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          fname: credentials.fname,
          lname: credentials.lname,
          phone: credentials.phone,
          email: credentials.email,
          googleId: googleID,
        }),
        mode: "cors",
      });

      const json = await response.json();

      if (json.success === true) {
        swal({
          title: "Welcome!",
          text: "Account created successfully",
          icon: "success",
          button: "Ok!",
        });
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        navigate("/");
      } else {
        swal({
          title: "Try Again!",
          text: json.error || "Error creating account",
          icon: "error",
        });
      }
    } catch (err) {
      swal({
        title: "Try Again!",
        text: "Server error!",
        icon: "error",
      });
    }
  };

  // Google Button Initialize
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }

    /* global google */
    const initGAuth = () => {
      google.accounts.id.initialize({
        client_id: "556182822054-ais047hrpg45kcb2o0b9v682s66hn69c.apps.googleusercontent.com",
        callback: handleCallbackResponse,
      });

      google.accounts.id.renderButton(
        document.getElementById("googlebtn"),
        { theme: "outline", size: "large", longtitle: true }
      );
    };

    initGAuth();
  }, [navigate]);

  // Password Toggle
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showPassword);

  // Form Validation
  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!credentials.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    if (!credentials.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (credentials.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  return (
    <div className="container-fluid d-flex px-0 section">
      <section className="left-panel">
        <TestimonialSlider />
      </section>

      <section className="right-panel">
        <div className="main-heading">Welcome Back</div>
        <div className="regular-text">Please enter your details to login</div>
        <div className="sep" />

        <div className="page-form">
          {signUpReq ? (
            // Google Phone Signup Form
            <form onSubmit={handleGoogleSubmit}>
              <div className="form-group">
                <label>Phone <span className="required">*</span></label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter phone number"
                  value={credentials.phone || ""}
                  onChange={onChange}
                  name="phone"
                  maxLength={10}
                />
              </div>
              <div className="pt-3" />
              <button type="submit" className="btn btn-primary">
                Create Account
              </button>
            </form>
          ) : (
            // Normal Login Form
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter email"
                    value={credentials.email}
                    onChange={onChange}
                    name="email"
                  />
                  {errors.email && <span style={{ color: "red", fontSize: "small" }}>{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Password"
                      value={credentials.password}
                      onChange={onChange}
                      name="password"
                    />
                    <i
                      className="password-icon"
                      style={{ position: "absolute", top: "50%", right: "0.75rem", transform: "translateY(-50%)", cursor: "pointer" }}
                      onClick={togglePassword}
                    >
                      {showPassword ? <i className="fa-solid fa-eye-slash" /> : <i className="fa-solid fa-eye" />}
                    </i>
                  </div>
                  {errors.password && <span style={{ color: "red", fontSize: "small" }}>{errors.password}</span>}
                </div>

                <div className="form-settings d-flex justify-content-between">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="exampleCheck1" />
                    <label className="form-check-label" htmlFor="exampleCheck1">Remember Me</label>
                  </div>
                  <div>
                    <Link to="/forgotpassword">Forgot Password?</Link>
                  </div>
                </div>

                <div className="pt-3" />
                <button type="submit" className="btn btn-primary text-black">Login</button>
              </form>

              <div className="small-text pt-3 pb-3 text-center">Or continue with</div>

              <div className="social-buttons d-flex justify-content-center pb-3">
                <div id="googlebtn" className="social-icon" />
              </div>
            </>
          )}
        </div>

        <div className="regular-text text-center">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </section>
    </div>
  );
};

export default Login;