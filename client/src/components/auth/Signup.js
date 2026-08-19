import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import swal from "sweetalert";
import TestimonialSlider from "../testimonial/TestimonialSlider";
import { url } from "../../utils/Constants";
import { UserContext } from "../../context/UserContext.jsx";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "../../assets/styles/signup.css"; //

// PhoneField Sub-component (Outer level so it doesn't lose focus on re-render)
const CustomPhoneField = ({ value, onChange, error }) => (
  <div className="form-group">
    <label>
      Phone <span className="required">*</span>
    </label>
    <PhoneInput
      defaultCountry="in"
      value={value}
      onChange={onChange}
      inputClassName="form-control"
      className="phone-input-box"
      style={{
        "--react-international-phone-height": "38px",
        "--react-international-phone-border-radius": "0.375rem",
        "--react-international-phone-border-color": "#ced4da",
        width: "100%",
      }}
    />
    {error && (
      <span style={{ color: "red", fontSize: "small", display: "block", marginTop: "4px" }}>
        {error}
      </span>
    )}
  </div>
);

const Signup = (props) => {
  const { setIslogin } = useContext(UserContext);
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    fname: "",
    lname: "",
    email: props.email || "",
    password: "",
    phone: "",
    authcode: "",
  });

  const [sendOtp, setSendOtp] = useState(false);
  const [googleID, setGoogleID] = useState("");
  const [signUpReq, setSignUpReq] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  // Phone Sanitizer & Helper Validator
  const isPhoneValid = (phoneNum) => {
    // Remove non-digit characters except leading plus
    const cleanNumber = (phoneNum || "").replace(/[^\d+]/g, "");
    return /^\+[1-9]\d{7,14}$/.test(cleanNumber);
  };

  // Google Auth Setup
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
      return;
    }

    const initGAuth = () => {
      if (typeof window.google === "undefined" || !window.google.accounts) return;

      window.google.accounts.id.initialize({
        client_id:
          "556182822054-s0199us6sdlu44chlejgodafbacs3h3s.apps.googleusercontent.com",
        callback: handleCallbackResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: false,
      });

      const btn = document.getElementById("googlebtn");
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: "320",
        });
      }
    };

    if (typeof window.google !== "undefined" && window.google.accounts) {
      initGAuth();
    } else {
      window.onGoogleLibraryLoad = initGAuth;
    }
  }, [navigate]);

  const handleCallbackResponse = async (response) => {
    try {
      const userObject = jwtDecode(response.credential);

      setCredentials((prev) => ({
        ...prev,
        email: userObject.email,
        fname: userObject.given_name || "",
        lname: userObject.family_name || "",
      }));
      setGoogleID(userObject.sub);

      const res = await fetch(`${url}/oauth/google/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: userObject.sub,
          email: userObject.email,
        }),
      });

      const json = await res.json();

      if (json.success === true) {
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        swal({
          title: "Welcome Back!",
          text: "Logged in Successfully",
          icon: "success",
        });
        navigate("/");
      } else if (json.requireSignup === true) {
        setSignUpReq(true);
      } else {
        swal({
          title: "Account Already Exists",
          text:
            json.message ||
            "User with given email id already exists. Please Login",
          icon: "info",
        });
      }
    } catch (err) {
      console.error(err);
      swal({ title: "Try Again!", text: "Server error!", icon: "error" });
    }
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (phone) => {
    setCredentials((prev) => ({ ...prev, phone }));
  };

  // Google Signup
  const handleGoogleSubmit = async (event) => {
    event.preventDefault();

    if (!isPhoneValid(credentials.phone)) {
      swal({
        title: "Invalid Phone",
        text: "Enter a valid phone number with country code",
        icon: "error",
      });
      return;
    }

    try {
      const response = await fetch(`${url}/oauth/google/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fname: credentials.fname,
          lname: credentials.lname,
          phone: credentials.phone.replace(/[^\d+]/g, ""),
          email: credentials.email,
          googleId: googleID,
        }),
      });
      const json = await response.json();

      if (json.success) {
        localStorage.setItem("token", json.authToken);
        localStorage.setItem("userInfo", JSON.stringify(json));
        setIslogin(true);
        swal({
          title: "Success!",
          text: "Account Created Successfully",
          icon: "success",
        });
        navigate("/");
      } else {
        swal({
          title: "Try Again!",
          text: json.message || "Something went wrong",
          icon: "error",
        });
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

      const json = await response.json().catch(() => ({}));

      if (json.success === true) {
        swal({
          title: "Good job!",
          text: "Verification code sent to email!",
          icon: "success",
        });
        setSendOtp(true);
        return;
      }

      const msg = (json.message || "").toLowerCase();
      const alreadyExists =
        msg.includes("already") ||
        msg.includes("exist") ||
        msg.includes("registered");

      swal({
        title: alreadyExists ? "Account Already Exists" : "Try Again!",
        text:
          json.message ||
          (alreadyExists
            ? "User with given email already exists. Please Login"
            : "Could not send verification code. Please try again."),
        icon: "error",
      });
    } catch (err) {
      console.error(err);
      swal({
        title: "Try Again!",
        text: "Server error! Please try again later.",
        icon: "error",
      });
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
          phone: credentials.phone.replace(/[^\d+]/g, ""),
          email: credentials.email,
          password: credentials.password,
          authcode: String(credentials.authcode),
        }),
      });
      const json = await response.json();

      if (json.success) {
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
        const msg = (json.message || "").toLowerCase();
        const alreadyExists =
          msg.includes("already") || msg.includes("exist");

        swal({
          title: alreadyExists ? "Account Already Exists" : "Try Again!",
          text: json.message || "Invalid OTP or request failed",
          icon: "error",
        });
      }
    } catch (err) {
      swal({ title: "Try Again!", text: "Server error!", icon: "error" });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let valid = true;

    if (!credentials.fname?.trim() || credentials.fname.trim().length < 2) {
      newErrors.fname = "First name must be at least 2 characters";
      valid = false;
    }
    if (!credentials.lname?.trim() || credentials.lname.trim().length < 2) {
      newErrors.lname = "Last name must be at least 2 characters";
      valid = false;
    }
    if (!credentials.email || !/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }
    if (!isPhoneValid(credentials.phone)) {
      newErrors.phone = "Enter a valid phone number with country code";
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

    if (!credentials.authcode || String(credentials.authcode).length !== 6) {
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
          {!sendOtp
            ? "Please fill out the following form to create your account"
            : "Verification code has been sent to your email"}
        </div>
        <div className="sep" />

        <div className="page-form">
          {signUpReq ? (
            <form onSubmit={handleGoogleSubmit}>
              <CustomPhoneField
                value={credentials.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: "#0d6efd" }}
              >
                Create Account
              </button>
            </form>
          ) : !sendOtp ? (
            <form onSubmit={sendMail}>
              <div className="form-group">
                <div className="row">
                  <div className="col">
                    <label>
                      First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="fname"
                      value={credentials.fname}
                      onChange={onChange}
                    />
                    {errors.fname && (
                      <span style={{ color: "red", fontSize: "small" }}>
                        {errors.fname}
                      </span>
                    )}
                  </div>
                  <div className="col">
                    <label>
                      Last Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="lname"
                      value={credentials.lname}
                      onChange={onChange}
                    />
                    {errors.lname && (
                      <span style={{ color: "red", fontSize: "small" }}>
                        {errors.lname}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <CustomPhoneField
                value={credentials.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
              />

              <div className="form-group">
                <div className="row">
                  <div className="col">
                    <label>
                      Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={credentials.email}
                      onChange={onChange}
                    />
                    {errors.email && (
                      <span style={{ color: "red", fontSize: "small" }}>
                        {errors.email}
                      </span>
                    )}
                  </div>
                  <div className="col">
                    <label>
                      Password <span className="required">*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        name="password"
                        value={credentials.password}
                        onChange={onChange}
                      />
                      <i
                        className={`fa-solid ${
                          showPassword ? "fa-eye-slash" : "fa-eye"
                        } password-icon`}
                        onClick={togglePassword}
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: "15px",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                    {errors.password && (
                      <span style={{ color: "red", fontSize: "small" }}>
                        {errors.password}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: "#0d6efd" }}
              >
                Send Verification Code
              </button>

              <div className="small-text pt-3 pb-3 text-center">Or</div>
              <div className="social-buttons d-flex justify-content-center pb-3">
                <div
                  id="googlebtn"
                  className="social-icon"
                  style={{
                    border: "none",
                    background: "transparent",
                    boxShadow: "none",
                    width: "100%",
                    maxWidth: "320px",
                    minWidth: "280px",
                  }}
                ></div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Verification Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter 6 digit code"
                  name="authcode"
                  value={credentials.authcode}
                  onChange={onChange}
                  maxLength={6}
                  inputMode="numeric"
                />
                {errors.authcode && (
                  <span style={{ color: "red", fontSize: "small" }}>
                    {errors.authcode}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: "#0d6efd" }}
              >
                Verify OTP
              </button>
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