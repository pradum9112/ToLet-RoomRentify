// export default MyMarker;

import React, { useState } from "react";
import { Link } from "react-router-dom";

const MyMarker = ({ text, tooltip, $hover, price, placetype, isbooked }) => {
  const [showInfo, setShowInfo] = useState(false);

  const handleClick = () => {
    setShowInfo(!showInfo);
  };

  const handleClose = (e) => {
    e.stopPropagation(); // Event bubbling stop karke parent click triggers se safe rakhta hai
    setShowInfo(false);
  };

  // Per Night Pricing Math with 10% Discount
  const basePrice = Number(price) || 0;
  const discount = Math.round(basePrice * 0.1);
  const discountedPrice = basePrice - discount;

  return (
    <div
      className={showInfo ? "circles hover" : "circles"}
      onClick={handleClick}
    >
      <span className="circlesText" title={tooltip}></span>
      {showInfo && (
        <div className="infoTab">
          <div
            className="card"
            style={{
              width: "210px",
              minHeight: "180px",
              padding: "5px",
              borderRadius: "5px",
            }}
          >
            <div className="card-header d-flex justify-content-end p-1 bg-transparent border-0">
              <button
                className="btn-close"
                aria-label="Close"
                onClick={handleClose}
              ></button>
            </div>
            <div className="card-body" style={{ padding: "4px 8px 8px 8px" }}>
              <h3
                className="card-title text-truncate"
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0 0 4px 0",
                }}
              >
                {tooltip}
              </h3>
              <hr style={{ margin: "4px 0" }} />

              <p
                className="card-text"
                style={{ margin: "3px 0", fontSize: "12px" }}
              >
                Type: {placetype}
              </p>

              {/* Per Night Price with 10% Discount */}
              <div
                className="card-text d-flex align-items-center gap-1"
                style={{ margin: "3px 0px 2px 0px", fontSize: "12px" }}
              >
                <span>Price:</span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#2e7d32",
                  }}
                >
                  ₹{discountedPrice}
                </span>
                <span
                  className="text-danger"
                  style={{ textDecoration: "line-through", fontSize: "11px" }}
                >
                  ₹{basePrice}
                </span>
                <span>/night</span>
              </div>

              {/* 10% OFF Badge */}
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: "#2e7d32",
                  marginBottom: "8px",
                }}
              >
                10% OFF Applied
              </div>

              {isbooked ? (
                <button
                  disabled={true}
                  className="btn btn-primary btn-sm w-100"
                  style={{
                    background: "#534173",
                    borderColor: "#534173",
                    fontSize: "11px",
                  }}
                >
                  Already Booked!
                </button>
              ) : (
                <Link to={`/detail/${text}`}>
                  <button
                    className="btn btn-primary btn-sm w-100"
                    style={{ fontSize: "11px" }}
                  >
                    View Details
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMarker;
