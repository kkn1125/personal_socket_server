const userService = require("../service/user");

function userController() {}

userController.initialize = () => {
  return userService.initialize();
};

userController.searchPlayers = (data) => {
  return userService.searchPlayers(data);
};

userController.create = (data) => {
  return userService.create(data);
};

userController.update = (data) => {
  return userService.update(data);
};

userController.location = (data) => {
  return userService.location(data);
};

userController.close = (data) => {
  return userService.close(data);
};

module.exports = userController;
