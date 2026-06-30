import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import swal from "sweetalert";
import TestimonialSlider from "../testimonial/TestimonialSlider";
import { url } from "../../utils/Constants";
import { UserContext } from "../../context/UserContext.jsx";

const Signup = () => {
  const { setIslogin } = useContext(UserContext);

  const [credentials, setCredentials] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    phone: "",
    authcode: "",
  });

  const navigate = useNavigate();
  const [sendOtp, setSendOtp] = useState(false);
  const [googleID, setGoogleID] = useState(null);
  const [signUpReq, setSignUpReq] = useState(false);
  const [errors, setErrors] = useState({});

  // Google Auth Setup
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

  // Google Callback
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
      } else {
        setSignUpReq(true);
      }
    } catch (err) {
      swal({
        title: "Try Again!",
        text: "Server error!",
        icon: "error",
      });
    }
  };

  // Google Signup
  const handleGoogleSubmit = async (event) => {
    event.preventDefault();

    if (!credentials.phone || credentials.phone.length < 10) {
      swal({ title: "Error", text: "Valid phone number is required", icon: "error" });
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
          title: "Success!",
          text: "Account Created Successfully",
          icon: "success",
        });
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        navigate("/");
      } else {
        swal({
          title: "Try Again!",
          text: json.error || "Failed to create account",
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

  const onChange = (event) => {
    if (event.target.name === "phone") {
      const phoneValue = event.target.value.substring(0, 10);
      setCredentials({ ...credentials, [event.target.name]: phoneValue });
    } else if (event.target.name === "authcode") {
      const authcodeValue = event.target.value.substring(0, 6);
      setCredentials({ ...credentials, [event.target.name]: authcodeValue });
    } else {
      setCredentials({
        ...credentials,
        [event.target.name]: event.target.value,
      });
    }
  };

  // Password Toggle
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showPassword);

  // Send OTP
  const sendMail = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch(`${url}/auth/signup/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email }),
        });
        const json = await response.json();

        if (json.success) {
          swal({ title: "Check your mail!", text: "Verification code sent!", icon: "success" });
          setSendOtp(true);
        } else {
          swal({ title: "Try Again!", text: json.error || "Failed", icon: "error" });
        }
      } catch (err) {
        swal({ title: "Try Again!", text: "Server error!", icon: "error" });
      }
    }
  };

  // Verify OTP
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateMail()) {
      try {
        const response = await fetch(`${url}/auth/signup/email/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fname: credentials.fname,
            lname: credentials.lname,
            phone: credentials.phone,
            email: credentials.email,
            password: credentials.password,
            authcode: Number(credentials.authcode),
          }),
        });
        const json = await response.json();

        if (json.success) {
          swal({ title: "Success!", text: "Account Created", icon: "success" });
          localStorage.setItem("token", json.authToken);
          localStorage.setItem("userInfo", JSON.stringify(json));
          setIslogin(true);
          navigate("/");
        } else {
          swal({ title: "Try Again!", text: json.error || "Failed", icon: "error" });
        }
      } catch (err) {
        swal({ title: "Try Again!", text: "Server error!", icon: "error" });
      }
    }
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!credentials.fname || credentials.fname.length < 2) {
      errors.fname = "First name must be at least 2 characters";
      isValid = false;
    }
    if (!credentials.lname || credentials.lname.length < 2) {
      errors.lname = "Last name must be at least 2 characters";
      isValid = false;
    }
    if (!credentials.email || !/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = "Valid email is required";
      isValid = false;
    }
    if (!credentials.phone || !/^\d{10}$/.test(credentials.phone)) {
      errors.phone = "Valid 10-digit phone number is required";
      isValid = false;
    }
    if (!credentials.password || credentials.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const validateMail = () => {
    let errors = {};
    let isValid = true;

    if (!credentials.authcode || credentials.authcode.length !== 6) {
      errors.authcode = "6-digit verification code is required";
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
        <div className="main-heading">Register</div>
        <div className="regular-text">
          Thank you for choosing to register with us!
          <br />
          {sendOtp === false ? "Please fill out the following form" : "Enter verification code sent to your email"}
        </div>
        <div className="sep" />

        <div className="page-form">
          {signUpReq ? (
            // Google Phone Signup
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
              <button type="submit" className="btn btn-primary">Create Account</button>
            </form>
          ) : sendOtp === false ? (
            // Normal Signup Form
            <form onSubmit={sendMail}>
              <div className="form-group">
                <div className="row">
                  <div className="col">
                    <label>First Name <span className="required">*</span></label>
                    <input type="text" className="form-control" placeholder="First name" value={credentials.fname} onChange={onChange} name="fname" />
                  </div>
                  <div className="col">
                    <label>Last Name <span className="required">*</span></label>
                    <input type="text" className="form-control" placeholder="Last name" value={credentials.lname} onChange={onChange} name="lname" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Phone <span className="required">*</span></label>
                <input type="tel" className="form-control" placeholder="Enter phone number" value={credentials.phone} onChange={onChange} name="phone" maxLength={10} />
              </div>

              <div className="form-group">
                <div className="row">
                  <div className="col">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" className="form-control" placeholder="Enter email" value={credentials.email} onChange={onChange} name="email" />
                  </div>
                  <div className="col">
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
                      <i className="password-icon" style={{ position: "absolute", top: "50%", right: "0.75rem", transform: "translateY(-50%)", cursor: "pointer" }} onClick={togglePassword}>
                        {showPassword ? <i className="fa-solid fa-eye-slash" /> : <i className="fa-solid fa-eye" />}
                      </i>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary text-black">Send Verification Code</button>

              <div className="small-text pt-3 pb-3 text-center">Or continue with</div>
              <div className="social-buttons d-flex justify-content-center pb-3">
                <div id="googlebtn" />
              </div>
            </form>
          ) : (
            // OTP Verification
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Verification Code <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter 6-digit code"
                  value={credentials.authcode}
                  onChange={onChange}
                  name="authcode"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary">Verify OTP</button>
            </form>
          )}
        </div>

        <div className="regular-text text-center">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </section>
    </div>
  );
};

export default Signup;