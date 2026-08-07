import io from "socket.io-client";
import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import {
  IconButton,
  Spinner,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { ArrowBackIcon, DeleteIcon } from "@chakra-ui/icons";
import { useEffect, useState, useRef, useContext, useMemo } from "react";
import axios from "axios";

import { getSender, getSenderFull } from "./config/ChatLogics";
import ScrollableChat from "./ScrollableChat";
import ProfileModal from "./miscellaneous/ProfileModal";
import Lottie from "react-lottie";
import animationData from "../../assets/data/typing.json";

import { UserContext } from "../../context/UserContext.jsx";
import { url } from "../../utils/Constants";

const ENDPOINT =
  window.location.hostname === "localhost"
    ? "http://localhost:5101"
    :"https://tolet-roomrentify.onrender.com";

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();
  const socketRef = useRef(null);
  
  // Ref to always track latest selectedChat inside socket handlers
  const selectedChatCompareRef = useRef(null);

  const { selectedChat, setSelectedChat, user, setNotification } =
    useContext(UserContext);

  const currentUser = useMemo(() => {
    return user || JSON.parse(localStorage.getItem("userInfo") || "{}");
  }, [user]);

  const defaultOptions = useMemo(
    () => ({
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
    }),
    [],
  );

  // Keep Ref updated with selectedChat
  useEffect(() => {
    selectedChatCompareRef.current = selectedChat;
  }, [selectedChat]);

  // ==================== SOCKET SETUP & LISTENERS ====================
  useEffect(() => {
    if (!currentUser?._id) return;

    socketRef.current = io(ENDPOINT);
    socketRef.current.emit("setup", currentUser);

    socketRef.current.on("connected", () => {
      console.log("✅ SOCKET CONNECTED");
      setSocketConnected(true);
    });

    socketRef.current.on("typing", () => setIsTyping(true));
    socketRef.current.on("stop typing", () => setIsTyping(false));

    // LIVE MESSAGE LISTENER
    const messageHandler = (newMessageRecieved) => {
      console.log("📩 MESSAGE RECEIVED:", newMessageRecieved);

      const activeChat = selectedChatCompareRef.current;

      if (!activeChat || activeChat._id !== newMessageRecieved.chat?._id) {
        console.log("✅ NOTIFICATION MEIN ADD");
        setNotification((prev) => {
          if (prev.some((n) => n._id === newMessageRecieved._id)) return prev;
          return [newMessageRecieved, ...prev];
        });
        setFetchAgain((prev) => !prev);
      } else {
        console.log("➡️ CURRENT CHAT MEIN ADD");
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessageRecieved._id)) return prev;
          return [...prev, newMessageRecieved];
        });
      }
    };

    const deleteHandler = (deletedChatId) => {
      const activeChat = selectedChatCompareRef.current;
      if (activeChat && activeChat._id === deletedChatId) {
        setSelectedChat(null);
        setMessages([]);
        toast({ title: "Chat deleted", status: "info", duration: 3000, isClosable: true });
      }
      setFetchAgain((prev) => !prev);
    };

    socketRef.current.on("message recieved", messageHandler);
    socketRef.current.on("chat deleted", deleteHandler);

    return () => {
      socketRef.current?.off("message recieved", messageHandler);
      socketRef.current?.off("chat deleted", deleteHandler);
      socketRef.current?.disconnect();
    };
  }, [currentUser?._id]);

// SingleChat.jsx ke andar:

// ==================== FETCH MESSAGES ====================
const fetchMessages = async () => {
  if (!selectedChat?._id) return;

  try {
    setLoading(true);
    const { data } = await axios.get(
      `${url}/chats/message/${selectedChat._id}`,
      { headers: { token: localStorage.getItem("token") } },
    );
    setMessages(data);
    socketRef.current?.emit("join chat", selectedChat._id);
  } catch (error) {
    toast({ title: "Failed to load messages", status: "error" });
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (selectedChat?._id) {
    // 🟢 ADDED: Selected chat khulte hi us chat ke saare notifications clear kar do
    setNotification((prev) =>
      prev.filter((n) => n.chat?._id !== selectedChat._id)
    );

    fetchMessages();
  }
}, [selectedChat?._id]);

  useEffect(() => {
    fetchMessages();
  }, [selectedChat?._id]);

  // ==================== TYPING HANDLER ====================
  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected || !selectedChat?._id) return;

    if (!typing) {
      setTyping(true);
      socketRef.current.emit("typing", selectedChat._id);
    }

    const lastTypingTime = new Date().getTime();
    setTimeout(() => {
      if (new Date().getTime() - lastTypingTime >= 3000 && typing) {
        socketRef.current.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 3000);
  };

  // ==================== SEND MESSAGE ====================
  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage.trim()) {
      const messageText = newMessage.trim();
      setNewMessage("");
      socketRef.current?.emit("stop typing", selectedChat._id);

      try {
        const { data } = await axios.post(
          `${url}/chats/message`,
          { content: messageText, chatId: selectedChat._id },
          { headers: { token: localStorage.getItem("token") } },
        );

        socketRef.current.emit("new message", data);
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        toast({ title: "Failed to send message", status: "error" });
      }
    }
  };

  // ==================== DELETE CHAT ====================
  const deleteChatHandler = async () => {
    if (!selectedChat?._id) return;

    try {
      setDeleting(true);
      await axios.delete(`${url}/chats/deletechat/${selectedChat._id}`, {
        headers: { token: localStorage.getItem("token") },
      });

      socketRef.current?.emit("delete chat", selectedChat._id);

      toast({ title: "Chat deleted successfully", status: "success" });
      onClose();
      setSelectedChat(null);
      setMessages([]);
      setFetchAgain((prev) => !prev);
    } catch (error) {
      toast({
        title: "Failed to delete chat",
        description: error.response?.data?.message || "Server Error",
        status: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {selectedChat ? (
        <>
          {/* Header Section */}
          <Box
            pb={3}
            px={2}
            display="flex"
            alignItems="center"
            w="100%"
            position="relative"
            minH="50px"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat(null)}
              mr={2}
            />

            <Text
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
              fontSize={{ base: "18px", md: "22px" }}
              fontWeight="medium"
              isTruncated
              maxW={{ base: "45%", md: "55%" }}
              textAlign="center"
            >
              {getSender(currentUser, selectedChat.users)}
            </Text>

            <Box display="flex" alignItems="center" gap={2} ml="auto">
              <ProfileModal
                user={getSenderFull(currentUser, selectedChat.users)}
              />
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="ghost"
                onClick={onOpen}
                aria-label="Delete Chat"
              />
            </Box>
          </Box>

          {/* Chat Body */}
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
                <ScrollableChat messages={messages} />
              </div>
            )}

            {istyping && (
              <Box display="flex" alignItems="center" ml={2} mb={2}>
                <Lottie
                  options={defaultOptions}
                  height={22}
                  width={40}
                  isClickToPauseDisabled={true}
                />
                <Text fontSize="sm" color="gray.600" ml={2}>
                  typing...
                </Text>
              </Box>
            )}

            <FormControl onKeyDown={sendMessage} isRequired>
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Chat
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this whole chat? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={deleting}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={deleteChatHandler}
                ml={3}
                isLoading={deleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default SingleChat;