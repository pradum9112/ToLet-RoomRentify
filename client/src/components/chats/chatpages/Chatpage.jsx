import { Box } from "@chakra-ui/layout";
import { useState, useContext, useEffect } from "react";
import Chatbox from "../Chatbox";
import MyChats from "../MyChats";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext.jsx";
import { ChakraProvider } from "@chakra-ui/react";

const Chatpage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const {
    islogin,
    user,
    setUser,
  } = useContext(UserContext);

  const navigate = useNavigate();

  // localStorage se turant user lo (Context delay fix)
  const localUser =
    user ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("userInfo") || "null");
      } catch {
        return null;
      }
    })();

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Token nahi hai to login
    if (!token) {
      navigate("/login");
      return;
    }

    // Context mein user null hai lekin localStorage mein hai → set kar do
    if (!user && localUser) {
      setUser(localUser);
    }
  }, [token, user, localUser, setUser, navigate]);

  return (
    <ChakraProvider>
      <div style={{ width: "100%" }} className="setion">
        <Box
          display="flex"
          justifyContent="space-between"
          w="100%"
          h="81.5vh"
          p="10px"
        >
          {/* localUser se check → first login par bhi dikhega */}
          {localUser && <MyChats fetchAgain={fetchAgain} />}
          {localUser && (
            <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
          )}
        </Box>
      </div>
    </ChakraProvider>
  );
};

export default Chatpage;