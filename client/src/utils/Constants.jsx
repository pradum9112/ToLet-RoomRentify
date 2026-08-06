const isLocal = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

module.exports = Object.freeze({
    url: isLocal 
      ? "http://localhost:5101" 
      : "https://tolet-roomrentify.onrender.com",
});


