import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import swal from "sweetalert";
import TestimonialSlider from "../testimonial/TestimonialSlider";
import { url } from "../../utils/Constants";
import { UserContext } from "../../context/UserContext.jsx";

const Login = () => {
  const { setIslogin } = useContext(UserContext);

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    phone: "",
  });

  const history = useNavigate();
  const [googleID, setGoogleID] = useState(0);
  const [signUpReq, setSignUpReq] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  const onChange = (event) => {
    const { name, value } = event.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Google Login Handler
  const handleCallbackResponse = async (response) => {
    try {
      const userObject = jwtDecode(response.credential);

      setCredentials(prev => ({
        ...prev,
        email: userObject.email,
        fname: userObject.given_name || "",
        lname: userObject.family_name || "",
      }));
      setGoogleID(userObject.sub);

      const res = await fetch(`${url}/oauth/google/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleId: userObject.sub, email: userObject.email }),
      });

      const json = await res.json();

      if (json.success) {
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        swal({ title: "Welcome!", text: "Logged in Successfully", icon: "success" });
        history("/");
      } else if (json.requireSignup) {
        setSignUpReq(true);
      } else {
        swal({ title: "Try Again!", text: json.message || "Something went wrong", icon: "error" });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error", icon: "error" });
    }
  };

  // Google Phone Completion
  const handleGoogleSubmit = async (event) => {
  event.preventDefault();

  if (!credentials.phone || credentials.phone.length !== 10) {
    swal({
      title: "Error",
      text: "Please enter valid 10 digit phone number",
      icon: "error"
    });
    return;
  }

  try {
    const response = await fetch(`${url}/oauth/google/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fname: credentials.fname || "",
        lname: credentials.lname || "",
        phone: credentials.phone,
        email: credentials.email,
        googleId: googleID,
      }),
    });

    const json = await response.json();
    console.log("Google Signup Response:", json);   // ← Debugging ke liye

    if (json.success === true) {
      localStorage.setItem("token", json.authToken);
      localStorage.setItem("userInfo", JSON.stringify(json));
      
      setIslogin(true);           // Important
      swal({
        title: "Success!",
        text: "Account Created Successfully",
        icon: "success"
      });
      history("/");
    } else {
      swal({
        title: "Try Again!",
        text: json.message || "Something went wrong",
        icon: "error"
      });
    }
  } catch (err) {
    console.error(err);
    swal({
      title: "Try Again!",
      text: "Server error occurred",
      icon: "error"
    });
  }
};
  // Normal Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(`${url}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      const json = await response.json();

      if (json.success) {
        console.log("Login Response:", json);
       console.log("Token Received:", json.authToken);
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        swal({ title: "Welcome!", text: "Logged in Successfully", icon: "success" });
        history("/");
      } else {
        swal({ title: "Try Again!", text: json.message || "Invalid credentials", icon: "error" });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error", icon: "error" });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let valid = true;

    if (!credentials.email || !/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }
    if (!credentials.password || credentials.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Initialize Google Button
  useEffect(() => {
    if (localStorage.getItem("token")) {
      history("/");
      return;
    }

    const initGoogle = () => {
      if (window.google?.accounts) {
        google.accounts.id.initialize({
          client_id: "556182822054-s0199us6sdlu44chlejgodafbacs3h3s.apps.googleusercontent.com",
          callback: handleCallbackResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById("googlebtn"),
          { theme: "outline", size: "large", longtitle: true }
        );
      }
    };

    initGoogle();
  }, [history]);

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
            <form onSubmit={handleGoogleSubmit}>
              <div className="form-group">
                <label>Phone <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter phone number"
                  name="phone"
                  value={credentials.phone}
                  onChange={onChange}
                />
              </div>
              <button type="submit" className="btn btn-primary">Create Account</button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={credentials.email}
                    onChange={onChange}
                  />
                  {errors.email && <span style={{ color: "red", fontSize: "small" }}>{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      name="password"
                      value={credentials.password}
                      onChange={onChange}
                    />
                    <i
                      className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} password-icon`}
                      onClick={togglePassword}
                      style={{ position: "absolute", top: "50%", right: "15px", transform: "translateY(-50%)", cursor: "pointer" }}
                    />
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

                <button type="submit" className="btn btn-primary">Login</button>
              </form>

              <div className="small-text pt-3 pb-3 text-center">Or continue with</div>
              <div className="social-buttons d-flex justify-content-center pb-3">
                <div id="googlebtn" className="social-icon"></div>
              </div>
            </>
          )}

          <div className="regular-text text-center">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;