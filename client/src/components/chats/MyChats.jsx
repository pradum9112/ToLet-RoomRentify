import { BellIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Stack,
  Text,
  Button,
  Spinner,
  Badge,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Tooltip,
  Input,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { getSender } from "./config/ChatLogics";
import ChatLoading from "./ChatLoading";
import UserListItem from "./userAvatar/UserListItem";
import { UserContext } from "../../context/UserContext.jsx";
import { url } from "../../utils/Constants";

const MyChats = ({ fetchAgain }) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchResult, setSearchResult] = useState([]);

  const {
    loggedUser,
    selectedChat,
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
  } = useContext(UserContext);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ==================== SEARCH USERS ====================
  const handleSearch = async () => {
    if (!search) {
      toast({
        title: "Please Enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.get(`${url}/chats/user?search=${search}`, {
        headers: { token: localStorage.getItem("token") },
      });

      setSearchResult(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  // ==================== ACCESS CHAT ====================
  const accessChat = async (guestuserId) => {
    try {
      setLoadingChat(true);
      const { data } = await axios.post(
        `${url}/chats`,
        { guestuserId },
        { headers: { token: localStorage.getItem("token") } },
      );

      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      setLoadingChat(false);
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  // ==================== FETCH CHATS ====================
  const fetchChats = async () => {
    try {
      console.log("Fetching chats from API...");
      const { data } = await axios.get(`${url}/chats`, {
        headers: { token: localStorage.getItem("token") },
      });
      console.log("Chats received:", data);
      setChats(data);
    } catch (error) {
      console.log("Fetch chats error:", error);
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    console.log("MyChats useEffect triggered");
    console.log("user:", user);
    console.log("loggedUser:", loggedUser);

    const token = localStorage.getItem("token");
    const userInfo = localStorage.getItem("userInfo");

    console.log("token exists:", !!token);
    console.log("userInfo exists:", !!userInfo);

    if ((user?._id || loggedUser?._id || userInfo) && token) {
      console.log("Calling fetchChats...");
      fetchChats();
    }
  }, [fetchAgain, user, loggedUser]);
  // Open Chat + Clear Notification
  const openChat = (chat) => {
    setSelectedChat(chat);chat.users
    // Us chat ke saare notifications hatao
    setNotification((prev) => prev.filter((n) => n.chat?._id !== chat._id));
  };

  const currentUser =
    user ||
    loggedUser ||
    JSON.parse(localStorage.getItem("userInfo") || "null");

  return (
    <>
      <Box
        display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
        flexDir="column"
        alignItems="center"
        p={3}
        bg="white"
        w={{ base: "100%", md: "31%" }}
        borderRadius="lg"
        borderWidth="1px"
      >
        <Box
          pb={3}
          px={3}
          fontSize={{ base: "28px", md: "30px" }}
          fontFamily="Work sans"
          display="flex"
          w="100%"
          justifyContent="space-between"
          alignItems="center"
        >
          <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
            <Button variant="ghost" onClick={onOpen}>
              <i className="fas fa-search"></i>
              <Text display={{ base: "none", md: "flex" }} px={4}>
                Search User
              </Text>
            </Button>
          </Tooltip>

          {/* Notification Bell */}
          <Menu>
            <MenuButton p={1} position="relative">
              <BellIcon fontSize="2xl" m={1} />
              {notification.length > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="-2"
                  right="-1"
                  fontSize="0.75em"
                  minW="5"
                  h="5"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {notification.length}
                </Badge>
              )}
            </MenuButton>

            <MenuList p={3} maxH="420px" overflowY="auto" fontSize="md">
              {!notification.length && <Text p={2}>No New Messages</Text>}

              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification((prev) =>
                      prev.filter((n) => n._id !== notif._id),
                    );
                  }}
                  _hover={{ bg: "#EDF2F7" }}
                >
                  {`New message from ${getSender(currentUser, notif.chat?.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>

        {/* Chat List */}
        <Box
          display="flex"
          flexDir="column"
          p={3}
          bg="#F8F8F8"
          w="100%"
          h="100%"
          borderRadius="lg"
          overflowY="hidden"
        >
          {Array.isArray(chats) ? (
            <Stack overflowY="scroll">
              {chats.map((chat) => {
                // Is chat ke kitne unread notifications hain
                const unreadCount = notification.filter(
                  (n) => n.chat?._id === chat._id,
                ).length;

                const isSelected = selectedChat?._id === chat._id;

                return (
                  <Box
                    onClick={() => openChat(chat)}
                    cursor="pointer"
                    bg={
                      isSelected
                        ? "#38B2AC"
                        : unreadCount > 0
                          ? "#E8F5E9"
                          : "#E8E8E8"
                    }
                    color={isSelected ? "white" : "black"}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    key={chat._id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box flex="1" minW={0}>
                      <Text
                        fontWeight={unreadCount > 0 ? "bold" : "bold"}
                        noOfLines={1}
                      >
                        {getSender(currentUser, chat.users)}
                      </Text>

                      {chat.latestMessage && (
                        <Text
                          fontSize="xs"
                          noOfLines={1}
                          fontWeight={unreadCount > 0 ? "semibold" : "normal"}
                          opacity={isSelected ? 0.9 : 0.8}
                        >
                          <b>
                            {chat.latestMessage.sender?.username ?? "Unknown"}:
                          </b>{" "}
                          {chat.latestMessage.content.length > 40
                            ? chat.latestMessage.content.substring(0, 40) +
                              "..."
                            : chat.latestMessage.content}
                        </Text>
                      )}
                    </Box>

                    {/* Unread badge — WhatsApp style */}
                    {unreadCount > 0 && !isSelected && (
                      <Badge
                        colorScheme="green"
                        borderRadius="full"
                        ml={2}
                        minW="20px"
                        textAlign="center"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <ChatLoading />
          )}
        </Box>
      </Box>

      {/* Search Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb={2}>
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>

            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}
            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MyChats;
