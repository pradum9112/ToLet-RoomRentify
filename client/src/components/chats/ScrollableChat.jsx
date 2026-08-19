import { Avatar } from "@chakra-ui/avatar";
import { Tooltip, IconButton, Badge, Box } from "@chakra-ui/react";
import { ArrowDownIcon } from "@chakra-ui/icons";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "./config/ChatLogics";
import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../context/UserContext.jsx";

const ScrollableChat = ({ messages }) => {
  const { user } = useContext(UserContext);
  const userId =
    user?._id || JSON.parse(localStorage.getItem("userInfo") || "{}")?._id;

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const threshold = 80;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setIsNearBottom(nearBottom);
    if (nearBottom) setUnreadCount(0);
  };

  // Naya message aaya
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    const newLen = messages?.length || 0;
    const added = newLen - prevLen;

    if (added > 0) {
      if (isNearBottom) {
        // Neeche ho → auto scroll
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setUnreadCount(0);
      } else {
        // Upar ho → arrow + count
        setUnreadCount((c) => c + added);
      }
    }

    prevLengthRef.current = newLen;
  }, [messages, isNearBottom]);

  // Naya chat open / pehli load → neeche
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
    setUnreadCount(0);
    setIsNearBottom(true);
    prevLengthRef.current = messages?.length || 0;
  }, [messages?.[0]?._id]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
    setIsNearBottom(true);
  };

  if (!userId) return <div>Loading chat...</div>;

  return (
    <Box position="relative" h="100%" w="100%">
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        h="100%"
        overflowY="auto"
        px={1}
      >
        {messages?.map((m, i) => {
          const isMyMessage = m.sender?._id === userId;

          return (
            <div
              key={m._id}
              style={{
                display: "flex",
                justifyContent: isMyMessage ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              {!isMyMessage &&
                (isSameSender(messages, m, i, userId) ||
                  isLastMessage(messages, i, userId)) && (
                  <Tooltip
                    label={m.sender?.username}
                    placement="bottom-start"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      mr={2}
                      size="sm"
                      name={m.sender?.username}
                      src={m.sender?.pic}
                    />
                  </Tooltip>
                )}

              <span
                style={{
                  backgroundColor: isMyMessage ? "#BEE3F8" : "#B9F5D0",
                  borderRadius: "20px",
                  padding: "8px 15px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(messages, m, i, userId),
                  marginTop: isSameUser(messages, m, i) ? 3 : 10,
                }}
              >
                {m.content}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      {/* Arrow + unread count */}
      {!isNearBottom && (
        <Box position="absolute" bottom="12px" right="12px" zIndex={10}>
          <Box position="relative">
            <IconButton
              icon={<ArrowDownIcon />}
              onClick={scrollToBottom}
              borderRadius="full"
              colorScheme="teal"
              size="md"
              shadow="md"
              aria-label="Scroll to bottom"
            />
            {unreadCount > 0 && (
              <Badge
                colorScheme="green"
                borderRadius="full"
                position="absolute"
                top="-6px"
                right="-6px"
                minW="20px"
                textAlign="center"
                fontSize="0.75em"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ScrollableChat;
