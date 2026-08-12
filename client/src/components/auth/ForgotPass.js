import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import TestimonialSlider from "../testimonial/TestimonialSlider";
import { url } from "../../utils/Constants";

const ForgotPass = (props) => {
  const [credentials, setCredentials] = useState({
    email: props.email || "",
    password: "",
    authcode: "",
  });

  const navigate = useNavigate();
  const [sendOtp, setSendOtp] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    if (name === "authcode") {
      const authcodeValue = value.substring(0, 6);
      setCredentials((prev) => ({ ...prev, [name]: authcodeValue }));
    } else {
      setCredentials((prev) => ({ ...prev, [name]: value }));
    }
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const validateMail = () => {
    let errs = {};
    let isValid = true;

    if (!credentials.email) {
      errs.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errs.email = "Invalid email format";
      isValid = false;
    }

    setErrors(errs);
    return isValid;
  };

  const validateForm = () => {
    let errs = {};
    let isValid = true;

    if (!credentials.authcode) {
      errs.authcode = "Verification code is required";
      isValid = false;
    } else if (credentials.authcode.length !== 6) {
      errs.authcode = "Verification code must be 6 digits";
      isValid = false;
    }

    if (!credentials.password) {
      errs.password = "Password is required";
      isValid = false;
    } else if (credentials.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(errs);
    return isValid;
  };

  // Step 1: Send Mail / Request OTP
  const sendMail = async (event) => {
    event.preventDefault();
    if (!validateMail()) return;

    try {
      const response = await fetch(`${url}/forgotpassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: credentials.email }),
      });

      const json = await response.json();

      if (json.success === true) {
        swal({
          title: "Good job!",
          text: "Mail sent successfully!",
          icon: "success",
          button: "Ok!",
        });
        setSendOtp(true);
      } else {
        swal({
          title: "Try Again!",
          text: json.message || "Something went wrong. Please try again.",
          icon: "error",
          button: "Ok!",
        });
        setSendOtp(false);
      }
    } catch (err) {
      swal({
        title: "Try Again!",
        text: "Server is down or unreachable!",
        icon: "error",
        button: "Ok!",
      });
    }
  };

  // Step 2: Verify OTP & Change Password
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(`${url}/forgotpassword/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          authcode: credentials.authcode, 
        }),
      });
       
      const json = await response.json();

      if (json.success === true) {
        swal({
          title: "Success!",
          text: "Password changed successfully!",
          icon: "success",
          button: "Ok!",
        });
        navigate("/login");
      } else {
        swal({
          title: "Try Again!",
          text: typeof json.message === "string" ? json.message : "Invalid OTP or request failed!",
          icon: "error",
          button: "Ok!",
        });
      }
    } catch (err) {
      swal({
        title: "Try Again!",
        text: "Server is down or unreachable!",
        icon: "error",
        button: "Ok!",
      });
    }
  };

  return (
    <div className="container-fluid d-flex px-0 section">
      <section className="left-panel">
        <TestimonialSlider />
      </section>
      <section className="right-panel">
        <div className="main-heading">Forgot Password?</div>
        <div className="regular-text">
          {!sendOtp
            ? "Enter the email associated with your account and we'll send an email with instructions to reset the password."
            : "Mail with verification code sent to your email-ID. Set a new password with OTP verification."}
        </div>
        <div className="sep" />
        <div className="page-form">
          {!sendOtp ? (
            <form onSubmit={sendMail}>
              <div className="form-group">
                <label htmlFor="exampleInputEmail1">
                  Please provide your email address
                  <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="exampleInputEmail1"
                  placeholder="Enter email"
                  value={credentials.email}
                  onChange={onChange}
                  name="email"
                />
                {errors.email && (
                  <span style={{ color: "red", fontSize: "small" }}>
                    {errors.email}
                  </span>
                )}
              </div>
              <div className="form-settings d-flex justify-content-end">
                <div className="text-end">
                  <span className="regular-text">Remember your Password?</span>
                  <br />
                  <Link to="/login">Back to login</Link>
                </div>
              </div>
              <div className="pt-3" />
              <div className="form-button">
                <button type="submit" className="btn btn-primary w-100">
                  Reset Password
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="exampleInputauthcode1">
                  Verification Code<span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="exampleInputauthcode1"
                  placeholder="Enter authcode"
                  value={credentials.authcode}
                  onChange={onChange}
                  name="authcode"
                />
                {errors.authcode && (
                  <span style={{ color: "red", fontSize: "small" }}>
                    {errors.authcode}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="exampleInputPassword">
                  Set New Password<span className="required">*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    id="exampleInputPassword"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={onChange}
                    name="password"
                  />
                  <i
                    className={`fa-solid ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    } password-icon`}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "0.75rem",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                    }}
                    onClick={togglePassword}
                  />
                </div>
                {errors.password && (
                  <span style={{ color: "red", fontSize: "small" }}>
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="pt-3" />
              <div className="form-button">
                <button type="submit" className="btn btn-primary w-100">
                  Reset Password
                </button>
              </div>
            </form>
          )}

          <div className="regular-text text-center pt-3">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForgotPass;