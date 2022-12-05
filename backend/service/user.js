const conn = require("../database/db");
const User = require("../model/user");

User.initialize = async () => {
  // await conn.promise().query(
  //   `
  // 	DELETE FROM user
  // 	WHERE id
  // 	IN (
  // 		SELECT id FROM user
  // 		WHERE nickname
  // 		LIKE 'guest%'
  // 	)
  // 	`
  // );
  await conn.promise().query(
    `
		UPDATE user
		SET state='offline'
		WHERE id
		IN (
			SELECT id FROM user
			WHERE nickname
			LIKE 'guest%'
		)
		`
  );
  await conn.promise().query(
    `
		UPDATE user
		SET state='offline'
		WHERE id
		IN (
			SELECT id FROM user
			WHERE state='viewer'
			OR state='player'
		)
		`
  );
};

User.searchPlayers = async (data) => {
  const [founds] = await conn.promise().query(
    `
		SELECT * FROM user
		WHERE state='player'
		AND server=?
		AND channel=?
		`,
    [data.server, data.channel]
  );
  return founds;
};

User.create = async (data) => {
  const [found] = await conn.promise().query(
    `
		SELECT * FROM user
		WHERE uuid=?
		`,
    data.uuid
  );
  const [info] = await conn.promise().query(
    `
		SHOW TABLE STATUS
		FROM sockets
		WHERE name = 'user'
		`
  );
  const lastIndex = info[0].Auto_increment;
  if (found.length === 0) {
    const params = Object.assign(
      {
        state: "viewer",
        nickname: "guest" + lastIndex,
        server: 1,
        channel: 1,
      },
      data
    );
    const [inserts] = await conn
      .promise()
      .query(`INSERT INTO user SET ?`, params);
    return params;
  } else {
    conn.promise().query(
      `
			UPDATE user SET state='viewer', pox=?, poy=?, poz=?, roy=? WHERE uuid=?
			`,
      [data.pox, data.poy, data.poz, data.roy, found[0].uuid]
    );
  }
  return found[0];
};

User.update = async (data) => {
  await conn.promise().query(
    `
		UPDATE user
		SET state='player'
		WHERE uuid=?
		`,
    data.uuid
  );
  const [me] = await conn.promise().query(
    `
		SELECT * FROM user WHERE uuid=?
		`,
    data.uuid
  );

  const [players] = await conn.promise().query(
    `
		SELECT * FROM user
		WHERE state='player'
		`
  );
  return [me[0], players];
};

User.location = async (data) => {
  return conn.promise().query(
    `
		UPDATE user
		SET pox=?, poy=?, poz=?, roy=?
		WHERE uuid=?
		`,
    [data.pox, data.poy, data.poz, data.roy, data.uuid]
  );
};

User.close = async (data) => {
  const [rows] = await conn.promise().query(
    `
		SELECT * FROM user
		WHERE uuid=?
	`,
    data
  );
  if (rows.length > 0) {
    if (rows[0].nickname.match(/guest[0-9]+/g)) {
      console.log("게스트 있음");
      await conn
        .promise()
        .query(`UPDATE user SET state='offline' WHERE id=?`, rows[0].id);
      // conn.promise().query(`DELETE FROM user WHERE id=?`, rows[0].id);
    } else {
      console.log("유저 있음");
      await conn
        .promise()
        .query(`UPDATE user SET state='offline' WHERE id=?`, rows[0].id);
    }
    return rows[0];
  }
  return null;
};

const userService = User;

module.exports = userService;
