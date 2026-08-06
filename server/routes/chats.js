const express = require("express");
const asyncHandler = require("express-async-handler");
const fetchUser = require("../middleware/fetchUserFromToken.js");
const Chat = require("../models/ChatModel.js");
const Message = require("../models/MessageModel");
const User = require("../models/User");



const Router = express.Router();

////////////////////get user search Chat//////////////////////

Router.get("/user",fetchUser,asyncHandler(async(req,res) => {
  const keyword = req.query.search
  ?{
      $or:[
          { username : { $regex : req.query.search, $options: "i" }},
          { email : { $regex : req.query.search, $options: "i" }},
      ],
  }
  : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.userId } });
  res.send(users);
}));

////////////////////accessChat//////////////////////

Router.post(
  "/",fetchUser,
  asyncHandler(async (req, res) => {
    const { guestuserId } = req.body;
    console.log("check1");
    if (!guestuserId) {
      console.log("UserId param not sent with request");
      return res.sendStatus(400);
    }
    console.log("check2");

    var isChat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: req.userId } } },
        { users: { $elemMatch: { $eq: guestuserId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");
      console.log("check3");

      
    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "username pic email",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        users: [req.userId, guestuserId],
      };

      try {
        const createdChat = await Chat.create(chatData);
        const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
          "users",
          "-password"
        );
        res.status(200).json(FullChat);
      } catch (error) {
        res.status(400);
        throw new Error(error.message);
      }
    }
  })
);

////////////////////fetchChats//////////////////

Router.get(
  "/",fetchUser,
  asyncHandler(async (req, res) => {
    try {
      Chat.find({ users: { $elemMatch: { $eq: req.userId } } })
        .populate("users", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .then(async (results) => {
          results = await User.populate(results, {
            path: "latestMessage.sender",
            select: "username pic email",
          });
          res.status(200).send(results);
        });
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  })
);



//////////////////get all message//////////////////////////////

Router.get(
  "/message/:chatId",
  asyncHandler(async (req, res) => {
    try {
      console.log("sddssd");
      const messages = await Message.find({ chat: req.params.chatId })
        .populate("sender", "username pic email")
        .populate("chat");
      res.json(messages);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  })
);

////////////////// send message ///////////////////////////////

Router.post(
  "/message",
  fetchUser,
  asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    console.log("content");

    if (!content || !chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
    }

    var newMessage = {
      sender: req.userId,
      content: content,
      chat: chatId,
    };
    console.log("newMessage");

    try {
      var message = await Message.create(newMessage);

      message = await message.populate("sender", "username pic");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.users",
        select: "username pic email",
      });

      await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

      res.json(message);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  })
);



////////////////// Delete Whole Chat Route /////////////////////

Router.delete(
  "/deletechat/:chatId",
  fetchUser,
  asyncHandler(async (req, res) => {
    try {
      const { chatId } = req.params;

      // 1. Delete all messages associated with this chat
      await Message.deleteMany({ chat: chatId });

      // 2. Delete the chat instance
      const deletedChat = await Chat.findByIdAndDelete(chatId);

      if (!deletedChat) {
        return res
          .status(404)
          .json({ message: "Chat not found", success: false });
      }

      return res.status(200).json({
        message: "Whole chat deleted successfully",
        success: true,
      });
    } catch (error) {
      console.error("Delete Chat Error:", error);
      return res
        .status(500)
        .json({ message: "Server error while deleting chat", success: false });
    }
  })
);

module.exports = Router;