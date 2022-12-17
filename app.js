var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
const dbo = require("./db/conn");
var logger = require("morgan");

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

function authenticate(data, callback) {
  console.log("verifica se cliente pode connectar");
  var username = data.username;
  var password = data.password;
  if (username == "John" && password == "secret") {
    callback(null, true);
  }
  callback(null, true);
  //eturn callback("error", { message: "ID/senha incorretos" });
}

function disconnect(socket) {
  console.log(socket.id + " disconnected");
}

function recebeMSG(socket) {
  console.log("recebeu mensagem do cliente");
}

io.on("connection", (socket) => {
  socket.on("authentication", (data) => {
    authenticate(
      data,
      function (err, message) {
        if (err) {
          console.log(err);
          socket.emit("unauthorized", message);
          socket.disconnect();
        } else {
          socket.emit("authenticated");
          socket.join("/validados");
          io.in("/validados").emit(
            "msg",
            "usuario " + data.username + " entrou na sala"
          );
        }
      }.bind(this)
    );
  });
});

app.use((req, res, next) => {
  res.io = io;
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.static(path.join(__dirname, "../dist"), { extensions: ["html"] })
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {},
  });
});

// perform a database connection when the server starts
dbo.connectToServer((err) => {
  if (err) {
    console.error(err);
    process.exit();
  }
});

module.exports = { app: app, server: server };
