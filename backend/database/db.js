const config = require("./config");
const mysql = require("mysql2");

let conn = null;
console.log(config);
function getConnection() {
  conn = mysql.createConnection(config);
  conn.connect(function (error) {
    if (error) {
      console.log("error when connecting to db:", error);
    }
  });

  conn.on("connect", (e) => {
    console.log("connect to mysql!");
  });

  conn.on("error", function (error) {
    console.log("db error", error);
    if (error.code === "PROTOCOL_CONNECTION_LOST") {
      getConnection();
    } else {
      throw error;
    }
  });
}

getConnection();

module.exports = conn;
