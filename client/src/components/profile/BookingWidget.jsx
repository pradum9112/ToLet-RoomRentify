import { useContext, useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { url } from "../../utils/Constants";
import { UserContext } from "../../context/UserContext.jsx";
import swal from "sweetalert";

export default function BookingWidget({ place }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [redirect, setRedirect] = useState("");
  const [loading, setLoading] = useState(false);

  const { islogin, user } = useContext(UserContext);
  const authToken = localStorage.getItem("token");
  const navigate = useNavigate();

  // Dynamic Razorpay Script Loading
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Autofill Name from Logged-in User
  useEffect(() => {
    if (user) {
      setName(user.username || user.name || "");
    }
  }, [user]);

  // Calculate total nights
  let numberOfNights = 0;
  if (checkIn && checkOut) {
    numberOfNights = differenceInCalendarDays(
      new Date(checkOut),
      new Date(checkIn)
    );
  }

  // Robust Form Validation
  const isFormValid =
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    phone.trim().length >= 10 &&
    numberOfGuests > 0 &&
    numberOfNights > 0;

  async function bookThisPlace() {
    // 1) Auth Check
    if (!islogin) {
      swal({
        title: "Login Required!",
        text: "Please login to book a place.",
        icon: "error",
        button: "Ok!",
      });
      navigate("/login");
      return;
    }

    // 2) Explicit Details Validation
    if (!name.trim() || !phone.trim() || phone.trim().length < 10) {
      swal({
        title: "Missing Details!",
        text: "Please fill your full name and a valid 10-digit phone number.",
        icon: "warning",
        button: "Ok!",
      });
      return;
    }

    if (numberOfNights <= 0) {
      swal({
        title: "Invalid Dates!",
        text: "Check-out date must be after Check-in date.",
        icon: "warning",
        button: "Ok!",
      });
      return;
    }

    try {
      setLoading(true);

      // 3) Create Booking in Database
      const response = await axios.post(
        `${url}/booking/bookings`,
        {
          checkIn,
          checkOut,
          numberOfGuests,
          name: name.trim(),
          phone: phone.trim(),
          place: place._id,
          placeowner: place.owner,
          price: numberOfNights * place.price,
        },
        {
          headers: {
            "Content-Type": "application/json",
            token: authToken,
          },
        }
      );

      const bookingId = response.data._id;

      // 4) Create Razorpay Order
      const { data: orderData } = await axios.post(
        `${url}/payment/create-order`,
        { bookingId },
        {
          headers: {
            "Content-Type": "application/json",
            token: authToken,
          },
        }
      );

      // 5) Verify Razorpay SDK availability
      if (!window.Razorpay) {
        swal({
          title: "Payment Error",
          text: "Razorpay SDK failed to load. Please refresh and try again.",
          icon: "error",
          button: "Ok!",
        });
        setLoading(false);
        return;
      }

      // 6) Configure Razorpay Options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ToLet RoomRentify",
        description: "Room booking payment",
        order_id: orderData.orderId,
        handler: async function (rzpResponse) {
          try {
            await axios.post(
              `${url}/payment/verify-payment`,
              {
                bookingId,
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  token: authToken,
                },
              }
            );

            swal({
              title: "Payment Successful!",
              text: "Your booking has been confirmed.",
              icon: "success",
              button: "Ok!",
            });

            setRedirect(`/profile/bookings/${bookingId}`);
          } catch (e) {
            swal({
              title: "Verification Failed!",
              text: "Payment received but signature verification failed.",
              icon: "error",
              button: "Ok!",
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: name.trim(),
          contact: phone.trim(),
        },
        theme: {
          color: "#534173",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      // 7) Initialize and Trigger Razorpay Modal
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function () {
        setLoading(false);
        swal({
          title: "Payment Failed",
          text: "Payment was not successful or was cancelled.",
          icon: "error",
          button: "Ok!",
        });
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      swal({
        title: "Booking Error!",
        text: err.response?.data?.message || "Something went wrong on the server.",
        icon: "error",
        button: "Ok!",
      });
    }
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="bg-white shadow p-4 rounded-2xl">
      <div className="text-2xl text-center font-bold">
        Price: ₹{place.price} / per night
      </div>

      <div className="border rounded-2xl mt-4">
        {/* Check-In & Check-Out Dates */}
        <div className="flex">
          <div className="py-3 px-4 w-1/2">
            <label className="text-xs font-bold block">Check in:</label>
            <input
              type="date"
              className="w-full mt-1 p-1 border rounded"
              value={checkIn}
              onChange={(ev) => setCheckIn(ev.target.value)}
            />
          </div>
          <div className="py-3 px-4 border-l w-1/2">
            <label className="text-xs font-bold block">Check out:</label>
            <input
              type="date"
              className="w-full mt-1 p-1 border rounded"
              value={checkOut}
              onChange={(ev) => setCheckOut(ev.target.value)}
            />
          </div>
        </div>

        {/* Guest Count */}
        <div className="py-3 px-4 border-t">
          <label className="text-xs font-bold block">Number of guests:</label>
          <input
            type="number"
            min={1}
            className="w-full mt-1 p-1 border rounded"
            value={numberOfGuests}
            onChange={(ev) => setNumberOfGuests(Number(ev.target.value))}
          />
        </div>

        {/* User Details - ALWAYS VISIBLE for UX and smooth validation */}
        <div className="py-3 px-4 border-t space-y-2">
          <div>
            <label className="text-xs font-bold block">Your full name:</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full mt-1 p-1 border rounded"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold block">Phone number:</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              className="w-full mt-1 p-1 border rounded"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      {place.isbooked ? (
        <button
          disabled={true}
          className="w-full text-white py-2 rounded-2xl mt-4 opacity-50 cursor-not-allowed"
          style={{ background: "#534173" }}
        >
          Already Booked!
        </button>
      ) : (
        <button
          onClick={bookThisPlace}
          className="primary w-full mt-4 py-2 rounded-2xl text-white font-bold"
          style={{ background: "#534173" }}
          disabled={!isFormValid || loading}
        >
          {loading ? "Processing Payment..." : "Book this Place"}
          {numberOfNights > 0 && !loading && (
            <span> ₹{numberOfNights * place.price}</span>
          )}
        </button>
      )}
    </div>
  );
}