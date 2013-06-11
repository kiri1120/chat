var iconPath = '';
var iconList = [];
var colorList = [];

var user = {
  'nickname': '',
  'iconId': 0,
  'colorId': 0
};

$(function() {
  var uri = 'http://' + location.host + ':3000';
  var socket = io.connect(uri);

  socket.on('connect', function () {
    $('#connecting').hide();
    $('#joined').hide();
    $('#connected').show();
    $('#logs').show();

    $('#icon').change(changeIcon);

    socket.on('iconPath', initIconPath);
    socket.on('iconList', initIconList);
    socket.on('colorList', initColorList);
    socket.on('talk', talk);
    socket.on('joined', joined);
    socket.on('leaved', leaved);
    socket.on('memberJoin', memberJoin);
    socket.on('memberLeave', memberLeave);
    socket.on('memberList', memberList);

    $('#joinform').submit(join);
    $('#messageform').submit(send);

    $('#leave').click(leave);

    //////////////////////////////////////////////////////////////////
    function changeIcon() {
      user.iconId = $('#icon').val();
      $('#selectedicon').attr('src', iconList[user.iconId].image.src);
      $('#selectedicon').attr('title', iconList[user.iconId].name);
    }

    function initIconPath(data) {
      iconPath = data;
    }

    function initIconList(data) {
      iconList = data;
      $('#icon').empty();

      if (iconPath == "") {
        console.log("error:iconPath not defined");
      }

      for(var i=0;i<iconList.length; i++) {
        iconList[i].image = new Image();
        iconList[i].image.src = iconPath + iconList[i].src;
        $('#icon').append('<option value="' + i + '">' + iconList[i].name + '</option>');
      }
      $('#icon').val(user.iconId);
      changeIcon();
    }

    function initColorList(data) {
      colorList = data;
      $('#colors').empty();

      for(var i=0;i<colorList.length; i++) {
        var label = $('<label/>').addClass('alert message-radio');
        label.css(colorList[i]);
        label.append($('<input type="radio" name="color">').val(i)).append(colorList[i].name);
        $('#colors').append(label);
      }
      $('input:radio[name="color"]').val([user.colorId]);
    }

    function join() {
      user.nickname = $('#nickname').val();
      user.colorId = $('input:radio[name="color"]:checked').val();
      socket.emit('join', user);
      return false;
    }

    function joined() {
      $('#connected').hide();
      $('#joined').show();
      $('#myicon').attr('src', iconList[user.iconId].image.src);
      $('#myicon').attr('title', iconList[user.iconId].name);
    }

    function leave() {
      socket.emit('leave');
    }

    function leaved() {
      $('#connected').show();
      $('#joined').hide();
    }

    function send() {
      socket.emit('talk', $('#message').val());
      $('#message').val('').focus();
      return false;
    }

    function talk(data) {
      var user = data.user;
      var message = data.message;
      var time = data.time;
      
      var frame = $('<div>').addClass('alert');
      frame.css(user.color);

      var html = $('<div>').addClass('row-fluid');
      html.append($('<div>').addClass('span2').append($('<img>').attr('src', iconPath + user.icon.src)));
      html.append($('<div>').addClass('span7').append($('<div>').text(user.nickname).addClass('message-nickname')).append($('<div>').text(message)).append($('<small>').text(time).addClass('muted pull-right')));

      $('#messages').prepend(frame.append(html));
    }

    function memberJoin(data) {
      var member = $('<div>').attr('id', 'member' + data.id).addClass('row');
      member.append($('<div>').addClass('span1').append($('<img>').attr('src', iconPath + data.icon.src)));
      member.append($('<div>').addClass('span2').text(data.nickname).css('color', data.color.color).addClass('message-nickname'));
      $('#members').append(member);
    }

    function memberLeave(data) {
      $('#member' + data.id).remove();
    }

    function memberList(data) {
      for(var key in data) {
        memberJoin(data[key]);
      }
    }

  });
});
