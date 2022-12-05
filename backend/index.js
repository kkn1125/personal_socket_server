const { v4 } = require("uuid");
const dotenv = require("dotenv");
const path = require("path");
const uWs = require("uWebSockets.js");
const { Field, Message } = require("protobufjs");
const userController = require("./controller/user");

Field.d(1, "string", "optional")(Message.prototype, "uuid");
Field.d(2, "int64", "optional")(Message.prototype, "server");
Field.d(3, "int64", "optional")(Message.prototype, "channel");
Field.d(4, "string", "optional")(Message.prototype, "state");
Field.d(5, "string", "optional")(Message.prototype, "nickname");
Field.d(6, "float", "optional")(Message.prototype, "pox");
Field.d(7, "float", "optional")(Message.prototype, "poy");
Field.d(8, "float", "optional")(Message.prototype, "poz");
Field.d(9, "float", "optional")(Message.prototype, "roy");

const encoder = new TextEncoder();
const decoder = new TextDecoder();

dotenv.config({
  path: path.join(path.resolve(), `.env.${process.env.NODE_ENV}`),
});

const host = process.env.HOST;
const port = Number(process.env.PORT);

const app = uWs
  .App({})
  .ws("/*", {
    /* Options */
    compression: uWs.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 32,

    /* Handlers */
    upgrade: (res, req, context) => {
      res.upgrade(
        {
          url: req.getUrl(),
        },
        req.getHeader("sec-websocket-key"),
        req.getHeader("sec-websocket-protocol"),
        req.getHeader("sec-websocket-extensions"),
        context
      );
    },
    open: (ws) => {
      console.log("A WebSocket connected!");
      ws.subscribe("broadcast");
    },
    message: (ws, message, isBinary) => {
      /* Ok is false if backpressure was built up, wait for drain */
      // let ok = ws.send(message, isBinary);
      try {
        if (isBinary) {
          /* binary */
          const json = Message.decode(new Uint8Array(message)).toJSON();
          userController.location(json);
          app.publish(`${json.server}-${json.channel}`, message, isBinary);
        } else {
          /* message */
          const decoded = decoder.decode(message);
          const json = JSON.parse(decoded);
          if (json.type === "viewer") {
            delete json.type;
            userController.create(json).then((result) => {
              ws.subscribe(`${result.server}`);
              ws.subscribe(`${result.server}-${result.channel}`);
              userController.searchPlayers(result).then((players) => {
                app.publish(
                  `${result.server}-${result.channel}`,
                  JSON.stringify(players)
                );
              });
            });
          } else if (json.type === "player") {
            delete json.type;
            userController.update(json).then(([me, players]) => {
              ws.send(JSON.stringify(me));
              app.publish(
                `${me.server}-${me.channel}`,
                JSON.stringify(players)
              );
            });
          }
        }
      } catch (e) {
        console.log(e.message);
      }
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log("WebSocket closed");
      const stringify = decoder.decode(message);
      userController.close(stringify).then((result) => {
        if (result) {
          userController.searchPlayers(result).then((players) => {
            app.publish(
              `${result.server}-${result.channel}`,
              JSON.stringify(players)
            );
          });
        }
      });
    },
  })
  .listen(port, (token) => {
    if (token) {
      userController.initialize();
      console.log(`listening on port ${port}`);
    }
  });
