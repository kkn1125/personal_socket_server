const dotenv = require("dotenv");
const path = require("path");

const mode = process.env.NODE_ENV;
dotenv.config({
  path: path.join(path.resolve(), `.env.${mode}`),
});

module.exports = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};
