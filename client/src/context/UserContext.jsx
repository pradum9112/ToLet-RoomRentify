import React, { createContext, useState, useEffect } from "react";
import { url } from "../utils/Constants";
import swal from "sweetalert";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [islogin, setIslogin] = useState(false);

  // Other states
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [selectedChat, setSelectedChat] = useState();
  const [searchResult, setSearchResult] = useState([]);
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const [loggedUser, setLoggedUser] = useState(null);
  const [filterData, setFilterData] = useState({ address: "", placetype: "" });

  // Verify Token
  const checkToken = async () => {
  const currentToken = localStorage.getItem("token");
  if (!currentToken) {
    setIslogin(false);
    return false;
  }

  try {
    const response = await fetch(`${url}/auth/verifyuser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentToken}`,
        "token": currentToken,        // ← dono bhej rahe hain
      },
    });

    const json = await response.json();

    if (response.ok && json.success === true) {
      setIslogin(true);
      if (json.data) {
        setUsername(`${json.data.firstName || ""} ${json.data.lastName || ""}`.trim());
      }
      return true;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      setIslogin(false);
      return false;
    }
  } catch (err) {
    console.error("Token verification failed:", err);
    setIslogin(false);
    return false;
  }
};

  // Load user from localStorage
  const loadUserData = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setUser(parsed);
        setLoggedUser(parsed);
        setIslogin(true);

        const name = parsed.username ||
          (parsed.data
            ? `${parsed.data.firstName || ""} ${parsed.data.lastName || ""}`.trim()
            : "");
        setUsername(name);
      } catch (e) {
        console.error("Failed to parse userInfo");
      }
    }
  };

  // Run on initial load
  useEffect(() => {
  loadUserData();
  checkToken();
}, []);
  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        username,
        setUsername,
        islogin,
        setIslogin,
        checkToken,

        latitude,
        setLatitude,
        longitude,
        setLongitude,

        searchResult,
        setSearchResult,
        selectedChat,
        setSelectedChat,
        notification,
        setNotification,
        chats,
        setChats,
        loggedUser,
        setLoggedUser,

        filterData,
        setFilterData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}