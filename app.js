var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var ObjectId = require("mongodb").ObjectId;

const dbo = require("./db/conn");
var loginRouter = require("./routes/login");
var registerRouter = require("./routes/register");

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

const rooms = [
  [22, false],
  [42, false],
  [69, false],
];

async function authenticate(data, callback) {
  console.log("verifica se cliente pode connectar", data);

  const db = dbo.getDb();
  try {
    const result = await db
      .collection("user")
      .findOne({ _id: new ObjectId(data.id) });
    console.log("result --- ", result);
    if (result) {
      return callback(null, result.email);
    }
    return callback("error", { message: "ID incorreto" });
  } catch (err) {
    console.log("error", err);
    return callback("error", { message: "ID incorreto" });
  }
}

function disconnect(socket) {
  console.log(socket.id + " disconnected");
}

io.on("connection", (socket) => {
  // aqui


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
            "usuario " + message + " entrou na sala"
          );
        }
      }.bind(this)
    );
  });

  socket.on("msg", (msg) => {
    io.emit("msg", msg);
  });

  socket.on("room", (data) => {
    console.log("room", data);
    rooms[data[0]] = data[1];
    io.in("/validados").emit("room", [data[0], rooms[data[0]]]);
    
    setTimeout(() => {
      const status = !rooms[data[0]];
      rooms[data[0]] = status;
      io.in("/validados").emit("room", [data[0], status]);
    }, 2000);
  });
});

app.use(cors({
  origin: '*'
}));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, "public")));
const front = path.join(__dirname, "../react-pwa/dist")
console.log("FRONT --",front)
app.use(express.static(front));

app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);

/*
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
*/
// perform a database connection when the server starts
dbo.connectToServer((err) => {
  if (err) {
    console.error(err);
    process.exit();
  }
});

module.exports = { app: app, server: server };
