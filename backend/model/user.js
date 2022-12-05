class User {
  id;
  uuid;
  nickname;
  state;
  server;
  channel;
  pox;
  poy;
  poz;
  roy;
  constructor({
    id,
    uuid,
    nickname,
    state,
    server,
    channel,
    pox,
    poy,
    poz,
    roy,
  }) {
    id && (this.id = id);
    uuid && (this.uuid = uuid);
    nickname && (this.nickname = nickname);
    state && (this.state = state);
    server && (this.server = server);
    channel && (this.channel = channel);
    pox && (this.pox = pox);
    poy && (this.poy = poy);
    poz && (this.poz = poz);
    roy && (this.roy = roy);
  }
}

module.exports = User;