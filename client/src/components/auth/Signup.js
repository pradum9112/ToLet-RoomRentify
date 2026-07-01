/* global google */
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import swal from "sweetalert";
import TestimonialSlider from "../testimonial/TestimonialSlider";
import { url } from "../../utils/Constants";
import { UserContext } from "../../context/UserContext.jsx";

const Signup = (props) => {
  const { setIslogin } = useContext(UserContext);

  const [credentials, setCredentials] = useState({
    fname: "",
    lname: "",
    email: props.email || "",
    password: "",
    phone: "",
    authcode: "",          // ← Changed from null to empty string
  });

  const history = useNavigate();
  const [sendOtp, setSendOtp] = useState(false);
  const [googleID, setGoogleID] = useState(0);
  const [signUpReq, setSignUpReq] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  // Google Auth
  useEffect(() => {
    if (localStorage.getItem("token")) {
      history("/");
      return;
    }

    const initGAuth = () => {
      if (typeof google === "undefined" || !google.accounts) return;

      google.accounts.id.initialize({
        client_id: "556182822054-s0199us6sdlu44chlejgodafbacs3h3s.apps.googleusercontent.com",
        callback: handleCallbackResponse,
      });

      google.accounts.id.renderButton(
        document.getElementById("googlebtn"),
        { theme: "none", longtitle: true }
      );
    };

    if (typeof google !== "undefined" && google.accounts) {
      initGAuth();
    } else {
      window.onGoogleLibraryLoad = initGAuth;
    }
  }, [history]);

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
        swal({ title: "Try Again!", text: json.message || "User already exists!", icon: "error" });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error!", icon: "error" });
    }
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Google Signup (Phone)
  const handleGoogleSubmit = async (event) => {
    event.preventDefault();
    if (!credentials.phone || credentials.phone.length < 10) return;

    try {
      const response = await fetch(`${url}/oauth/google/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fname: credentials.fname,
          lname: credentials.lname,
          phone: credentials.phone,
          email: credentials.email,
          googleId: googleID,
        }),
      });
      const json = await response.json();

      if (json.success) {
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        swal({ title: "Success!", text: "Account Created Successfully", icon: "success" });
        history("/");
      } else {
        swal({ title: "Try Again!", text: json.message, icon: "error" });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error!", icon: "error" });
    }
  };

  const sendMail = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(`${url}/auth/signup/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email }),
      });
      const json = await response.json();

      if (json.success) {
        swal({ title: "Good job!", text: "Verification code sent to email!", icon: "success" });
        setSendOtp(true);
      } else {
        swal({ title: "Try Again!", text: json.message, icon: "error" });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error!", icon: "error" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateMail()) return;

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
        swal({ title: "Success!", text: "Account Created Successfully", icon: "success" });
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        history("/");
      } else {
        swal({ title: "Try Again!", text: json.message, icon: "error" });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error!", icon: "error" });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let valid = true;

    if (!credentials.fname?.trim() || credentials.fname.length < 2) {
      newErrors.fname = "First name at least 2 characters";
      valid = false;
    }
    if (!credentials.lname?.trim() || credentials.lname.length < 2) {
      newErrors.lname = "Last name at least 2 characters";
      valid = false;
    }
    if (!credentials.email || !/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }
    if (!credentials.phone || !/^\d{10}$/.test(credentials.phone)) {
      newErrors.phone = "Enter valid 10 digit phone number";
      valid = false;
    }
    if (!credentials.password || credentials.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const validateMail = () => {
    let newErrors = {};
    let valid = true;

    if (!credentials.authcode || credentials.authcode.length !== 6) {
      newErrors.authcode = "Verification code must be 6 digits";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
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
          {sendOtp === false
            ? "Please fill out the following form to create your account"
            : "Verification code has been sent to your email"}
        </div>
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
          ) : sendOtp === false ? (
            <form onSubmit={sendMail}>
              <div className="form-group">
                <div className="row">
                  <div className="col">
                    <label>First Name <span className="required">*</span></label>
                    <input type="text" className="form-control" name="fname" value={credentials.fname} onChange={onChange} />
                    {errors.fname && <span style={{ color: "red", fontSize: "small" }}>{errors.fname}</span>}
                  </div>
                  <div className="col">
                    <label>Last Name <span className="required">*</span></label>
                    <input type="text" className="form-control" name="lname" value={credentials.lname} onChange={onChange} />
                    {errors.lname && <span style={{ color: "red", fontSize: "small" }}>{errors.lname}</span>}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Phone <span className="required">*</span></label>
                <input type="number" className="form-control" name="phone" value={credentials.phone} onChange={onChange} />
                {errors.phone && <span style={{ color: "red", fontSize: "small" }}>{errors.phone}</span>}
              </div>

              <div className="form-group">
                <div className="row">
                  <div className="col">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" className="form-control" name="email" value={credentials.email} onChange={onChange} />
                    {errors.email && <span style={{ color: "red", fontSize: "small" }}>{errors.email}</span>}
                  </div>
                  <div className="col">
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
                </div>
              </div>

              <button type="submit" className="btn btn-primary">Send Verification Code</button>

              <div className="small-text pt-3 pb-3 text-center">Or continue with</div>
              <div className="social-buttons d-flex justify-content-center pb-3">
                <button className="social-icon" id="googlebtn">
                  <i className="fa-brands fa-google fa-lg" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Verification Code <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter 6 digit code"
                  name="authcode"
                  value={credentials.authcode}
                  onChange={onChange}
                  maxLength={6}
                />
                {errors.authcode && <span style={{ color: "red", fontSize: "small" }}>{errors.authcode}</span>}
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