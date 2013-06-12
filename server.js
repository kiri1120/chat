var io = require('socket.io').listen(3000);
var validator = require('validator');
var sprintf = require('sprintf').sprintf;

var setting = require('./setting');
var users = {};

io.sockets.on('connection', function(socket) {
  socket.emit('iconPath', setting.iconPath)
  socket.emit('iconList', setting.iconList);
  socket.emit('colorList', setting.colorList);
  socket.emit('memberList', users);

  socket.on('join', join);
  socket.on('leave', leave);
  socket.on('talk', talk);
  socket.on('disconnect', leave);

  function join(data) {
    var user = {
      id:       socket.id,
      nickname: toText(data.nickname),
      iconId:   toInt(data.iconId),
      colorId:  toInt(data.colorId)
    };

    try {
      validator.check(user.nickname).notEmpty().len(1, 40);
      validator.check(user.iconId).isInt().min(0).max(setting.iconList.length);
      validator.check(user.colorId).isInt().min(0).max(setting.colorList.length);

      user.icon = setting.iconList[user.iconId];
      user.color = setting.colorList[user.colorId];

      users[socket.id] = user;

      socket.emit('joined');
      socket.emit('memberJoin', user);
      socket.broadcast.emit('memberJoin', user);
      sendMessage(setting.systemUser, user.nickname + 'さんが入室しました。');
    } catch(e) {
      socket.emit('error', e);
    }
  }

  function leave() {
    var user = users[socket.id];

    if (user != null) {
      socket.emit('leaved');
      socket.emit('memberLeave', user);
      socket.broadcast.emit('memberLeave', user);
      sendMessage(setting.systemUser, user.nickname + 'さんが退室しました。');

      delete users[socket.id];
    }
  }

  function talk(message) {
    var message = toText(message);
    var user = users[socket.id];

    try {
      isDefined(user);
      validator.check(message).notEmpty();

      sendMessage(user, message);
    } catch (e) {
      socket.emit('error', e);
    }
  }

  function sendMessage(user, message) {
    var data = {
      user: user,
      message: message,
      time: getLocaleString(),
    }
    socket.emit('talk', data);
    socket.broadcast.emit('talk', data);
  };
});


// validator & sanitizer
function toText(data) {
  data = validator.sanitize(data).trim();
  data = validator.sanitize(data).xss();
  return data;
}

function toInt(data) {
  return validator.sanitize(data).toInt();
}

function isDefined(data) {
  if (data == null) {
    throw 'undefined';
  }
}

function notDefined(data) {
  if (data != null) {
    throw 'defined';
  }
}

function getLocaleString() {
  var date = new Date();
  return sprintf("%04d年%02d月%02d日 %02d:%02d:%02d", date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
}
