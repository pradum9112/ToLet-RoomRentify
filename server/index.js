const express = require("express");
const connectToMongo = require("./db");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5101;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect to MongoDB
connectToMongo();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDINARYSECRET,
});

// Available routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to ToLet-RoomRentify API Server!",
    status: "Healthy",
    author: "Pradum Sonkar",
  });
});
app.use('/auth', require('./routes/auth'))
app.use('/fogotpassword', require('./routes/forgotpass'));
app.use('/oauth', require('./routes/oauth'));
app.use('/testimonial', require('./routes/testimonial'))

app.use('/hosting',require('./routes/hosting'));
app.use('/booking',require('./routes/booking'));
app.use('/places',require('./routes/places'));

app.use('/chats',require('./routes/chats'));

// Start the server
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});


////////////////////////// real time chat functionality started //////////////////////////////

require("dotenv").config();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://to-let-room-rentify.vercel.app"]
    : ["http://localhost:3000", "http://localhost:5173"];

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // Setup - User personal room
  socket.on("setup", (userData) => {
    if (!userData || !userData._id) {
      return console.log("Invalid userData in setup");
    }
    socket.join(userData._id);
    console.log("user joined room: " + (userData.email || userData._id));
    socket.emit("connected");
  });

  // Join specific chat room
  socket.on("join chat", (room) => {
    if (!room) return;
    socket.join(room);
    console.log("user joined chat room: " + room);
  });

  // New Message Event (Fixed)
  socket.on("new message", (newMessageRecieved) => {
    try {
      console.log("New Message on Server:", newMessageRecieved?._id);

      if (!newMessageRecieved) {
        return console.log("newMessageRecieved is null/undefined");
      }

      const chat = newMessageRecieved.chat;

      if (!chat) {
        return console.log("chat is null/undefined");
      }

      if (!chat.users || !Array.isArray(chat.users)) {
        return console.log("chat.users not defined or not an array");
      }

      chat.users.forEach((user) => {
        if (!user || !user._id) return;

        // Don't send to sender
        if (
          user._id.toString() === newMessageRecieved.sender?._id?.toString()
        ) {
          return;
        }

        // Emit to personal room of other users
        socket.in(user._id.toString()).emit("message recieved", newMessageRecieved);
      });
    } catch (error) {
      console.log("Error in new message event:", error.message);
    }
  });

  // Typing Indicator
  socket.on("typing", (room) => {
    if (room) socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    if (room) socket.in(room).emit("stop typing");
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });
});

////////////////////////// real time chat functionality ended //////////////////////////////