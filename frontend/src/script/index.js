import { v4 } from "uuid";
import { Field, Message } from "protobufjs";

Field.d(1, "string", "optional")(Message.prototype, "uuid");
Field.d(2, "int64", "optional")(Message.prototype, "server");
Field.d(3, "int64", "optional")(Message.prototype, "channel");
Field.d(4, "string", "optional")(Message.prototype, "state");
Field.d(5, "string", "optional")(Message.prototype, "nickname");
Field.d(6, "float", "optional")(Message.prototype, "pox");
Field.d(7, "float", "optional")(Message.prototype, "poy");
Field.d(8, "float", "optional")(Message.prototype, "poz");
Field.d(9, "float", "optional")(Message.prototype, "roy");

const $ = (el) => document.querySelector(el);

const app = document.createElement("canvas");
app.id = "app";

/* append app into body */
const resizeToFit = (e) => {
  app.width = innerWidth;
  app.height = innerHeight;
};

resizeToFit();
app.addEventListener("resize", resizeToFit);

$("body").insertAdjacentElement("afterbegin", app);

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ctx = app.getContext("2d");
const path = `ws://localhost:3000/`;
const size = {
  user: {
    x: 30,
    y: 30,
    speed: 5,
  },
};
const mydata = {};

/* joystick */
const direction = {};
window.addEventListener("keydown", (e) => {
  e.preventDefault();
  const lower = e.key.toLowerCase();
  if (lower === "w" || lower === "a" || lower === "s" || lower === "d") {
    direction[lower] = true;
  }
});

window.addEventListener("keyup", (e) => {
  e.preventDefault();
  const lower = e.key.toLowerCase();
  if (lower === "w" || lower === "a" || lower === "s" || lower === "d") {
    direction[lower] = false;
  }
});

/* websocket settings */
let users = [];
let uuid = null;
const ws = new WebSocket(path);
ws.binaryType = "arraybuffer";
ws.onopen = (e) => {
  console.log("open");

  if (!localStorage.user_info) {
    localStorage.user_info = "{}";
  }
  const userInfo = JSON.parse(localStorage.user_info);
  uuid = v4();
  if (!userInfo.uuid) {
    localStorage.user_info = JSON.stringify({
      uuid,
    });
  } else {
    uuid = userInfo.uuid;
  }
  ws.send(
    JSON.stringify({
      type: "viewer",
      uuid,
      pox: app.width / 2,
      poy: app.height / 2,
      poz: 0,
      roy: Math.PI / 180,
    })
  );

  Object.assign(mydata, userInfo);
};

ws.onmessage = (message) => {
  // console.log(message);
  const { data } = message;
  let json = null;
  try {
    json = JSON.parse(data);
  } catch (e) {}
  if (json instanceof Array) {
    users = json;
  } else if (data instanceof ArrayBuffer) {
    /* location data */
    const decoded = Message.decode(new Uint8Array(data)).toJSON();
    decoded.server = Number(decoded.server);
    decoded.channel = Number(decoded.channel);
    Object.assign(mydata, decoded);
    for (let user of users) {
      if (user.uuid === decoded.uuid) {
        Object.assign(user, decoded);
      }
    }
  } else if (json.id) {
    for (let user of users) {
      if (user.uuid !== json.uuid) continue;
      else {
        Object.assign(user, {
          uuid: json.uuid,
          nickname: json.nickname,
          pox: json.pox,
          poy: json.poy,
          poz: json.poz,
          roy: json.roy,
        });
        Object.assign(mydata, user);
      }
    }
    localStorage.user_info = JSON.stringify(json);
  }
  // if (json.type === "player") {
  // 	console.log("player", data);
  // } else if (json.type === "location") {
  // 	ws.send(Message.encode(new Message(mydata)).finish());
  // }
};
ws.onerror = function (e) {
  console.log("error!");
  ws?.close(1000, uuid);
};
ws.onclose = function (e) {
  console.log("close", e);
  ws?.close(1000, uuid);
};
window.addEventListener("beforeunload", () => {
  ws?.close(1000, uuid);
});

const clear = () => ctx.clearRect(0, 0, app.width, app.height);

function login() {
  ws.send(
    JSON.stringify({
      type: "player",
      uuid,
    })
  );
}

setTimeout(() => {
  login();
}, 5000);

const drawUser = (user) => {
  const { pox, poy } = user;
  ctx.fillRect(
    pox - size.user.x / 2,
    poy - size.user.y / 2,
    size.user.x,
    size.user.y
  );
};

function update() {
  for (let user of users) {
    const temp = Object.assign(user, {});
    if (user.uuid === uuid) {
      if (direction.w || direction.a || direction.s || direction.d) {
        if (direction.w) {
          temp.poy -= size.user.speed;
        }
        if (direction.s) {
          temp.poy += size.user.speed;
        }
        if (direction.a) {
          temp.pox -= size.user.speed;
        }
        if (direction.d) {
          temp.pox += size.user.speed;
        }
        ws.send(Message.encode(new Message(temp)).finish());
      }
    }
    drawUser(user);
  }
}

function render(time) {
  time *= 0.001;
  clear();
  update();

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
