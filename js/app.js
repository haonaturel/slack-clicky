var slackToken;
var team = localStorage.getItem('clicky-team');

// Gets current Clicky user from local storage if it exists
var user = JSON.parse(localStorage.getItem('clicky-user'));


// Gets list of all available (and unarchived) channels
function getChannels() {
  var data = {
    'token': slackToken,
    'exclude_archived': 1
  }

  // Checks if channels list exists in local storage
  // If not it is fetched from the Slack API
  // If it is, that is fetched instead
  if (localStorage.getItem('clicky-channels') === null) {
    $.ajax({
      type: 'POST',
      url: 'https://slack.com/api/channels.list',
      data: data,
      success: function(data) {
        if (data.ok === true) {
          var channels = data.channels;
          localStorage.setItem('clicky-channels', JSON.stringify(channels));
          buildChannelList(channels);
        } else {
          console.error('[error] Error getting channels: ' + data.error);
        }
      }
    });
  } else {
    var channelsJson = localStorage.getItem('clicky-channels');
    channels = JSON.parse(channelsJson);
    buildChannelList(channels);
  }
}


// Builds channel list in main interface
function buildChannelList(channels) {
  var list = $('#channelList');
  var html = '';
  $.each(channels, function(i) {
    var channel = channels[i];
    html += '<li class="channel"><a href="javascript:void(0)" title="' + channel.purpose.value + '" data-room="' + channel.id + '">#';
    html += channel.name + '</a>';
    html += '<span id="success-' + channel.id + '" class="label label-success"></span></li>';
  });
  list.html(html);
}


// Gets list of all users
function getUsers() {
  var data = {
    'token': slackToken
  }

  // Checks if users list exists in local storage
  // If not it is fetched from the Slack API
  // If it is, that is fetched instead
  if (localStorage.getItem('clicky-users') === null) {
    $.ajax({
      type: 'POST',
      url: 'https://slack.com/api/users.list',
      data: data,
      success: function(data) {
        if (data.ok === true) {        
          var users = data.members;
          localStorage.setItem('clicky-users', JSON.stringify(users));
          buildUserList(users);
        } else {
          console.error('[error] Error getting users: ' + data.error);
        }        
      }
    });
  } else {
    var usersJson = localStorage.getItem('clicky-users');
    users = JSON.parse(usersJson);
    buildUserList(users);
  }
}


// Builds user list in main interface
function buildUserList(users) {
  var list = $('#userList');
  var html = '';

  $.each(users, function(i) {
    var user = users[i];
    html += '<li class="user"><a href="javascript:void(0)" title="' + user.profile.real_name + '" data-room="' + user.id + '">';
    html += user.name + '</a>';
    html += '<span id="' + user.id + '" class="label label-success"></span></li>';
  });
  list.html(html);
  $('span.team').html(team);
}


// Gets list of all groups
function getGroups() {
  var data = {
    'token': slackToken,
    'exclude_archived': 1    
  }

  // Checks if group list exists in local storage
  // If not it is fetched from the Slack API
  // If it is, that is fetched instead
  if (localStorage.getItem('clicky-groups') === null) {
    $.ajax({
      type: 'POST',
      url: 'https://slack.com/api/groups.list',
      data: data,
      success: function(data) {
        if (data.ok === true) {
          var groups = data.groups;
          localStorage.setItem('clicky-groups', JSON.stringify(groups));
          buildGroupsList(groups);
        } else {
          console.error('[error] Error getting groups: ' + data.error);
        }
      }
    });
  } else {
    var groupsJson = localStorage.getItem('clicky-groups');
    groups = JSON.parse(groupsJson);
    buildGroupsList(groups);
  }
}


// Builds user list in 'Channels' interface
function buildGroupsList(groups) {
  var list = $('#groupList');
  var html = '';

  $.each(groups, function(i) {
    var group = groups[i];
    html += '<li class="group"><a href="javascript:void(0)" title="' + group.name + '" data-room="' + group.id + '">';
    html += group.name + '</a>';
    html += '<span id="' + group.id + '" class="label label-success"></span></li>';
  });
  list.html(html);
  $('span.team').html(team);
}


// Checks that provided API key is valid
function testAuth(token) {
  var data = {
    token: token
  };

  var response = $.ajax({
    type: 'POST',
    url: 'https://slack.com/api/auth.test',
    data: data,
    async: false,
    success: function(data) {
      return data;
    }
  }).responseJSON;

  if (response.ok === true) {
    return response;
  } else {
    return false;
  }
}


// Gets authenticated user data from API
function getUserData(user) {
  var data = {
    token: slackToken,
    user: user
  };

  var response = $.ajax({
    type: 'POST',
    url: 'https://slack.com/api/users.info',
    data: data,
    async: false,
    success: function(data) {
      return data;
    }
  }).responseJSON;

  if (response.ok === true) {
    return response.user;
  } else {
    return false;
  }
}


// Gets active tab url
function postCurrentTabTo(channel) {
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},function(tabs) {
    var tab = tabs[0];
    var tabUrl = tab.url;
    var formattedLink = '<' + tabUrl + '>';

    postMessage(formattedLink, channel);

  });
}


// Sends link to user or channel using Slack API
function postMessage(message, channel) {
  var data = {
    'token': slackToken,
    'channel': channel,
    'text' : message,
    'username': 'clicky from ' + user.name,
    'unfurl_links': true,
    'unfurl_media': true
  };

  $.ajax({
    type: 'POST',
    url: 'https://slack.com/api/chat.postMessage',
    data: data,
    success: function(data) {
      var badge = $('span#' + channel);
      if (data.ok === true) {      
        console.info('[info] Link shared');
        badge.siblings('a').addClass('disabled');
        badge.removeClass('label-danger').addClass('label-success');        
        badge.html('Link shared!');
        badge.fadeIn();
        badge.delay(2000).fadeOut();
      } else {
        console.error('[error] Error sharing link: ' + data.error);
        badge.removeClass('label-success').addClass('label-danger');
        badge.html('Error sharing link, please try again');
        badge.fadeIn();
        // badge.delay(2000).fadeOut();
      }          
    }
  });
}


// Builds greeting
function buildGreeting() {
  var greetings = [
    "Hello",
    "Hi",
    "Hiya",
    "Hey",
    "Ciao",
    "Sup",
    "Wha'gwan",
    "Hola",
    "Bonjour",
    "G'day",
    "What's Poppin'",
    "Howdy",
    "Aloha",
    "Namaste",
    "Salutations",
    "Wassup",
    "What's up",
    "Yo"
  ];
  var greetingId = Math.floor(Math.random() * greetings.length);
  var greeting = greetings[greetingId] + ', ' + user.profile.first_name + '!';
  $('#greeting').html(greeting);
  $('span.team').html(team);
  $('#title').css('color: #' + user.color);  
}



// Loads correct view based on available data
function loadView() {
  if (localStorage.getItem('clicky-token') !== null) {
    slackToken = localStorage.getItem('clicky-token');
    user = JSON.parse(localStorage.getItem('clicky-user'));
    if (localStorage.getItem('clicky-user') !== null) {
      user = JSON.parse(localStorage.getItem('clicky-user'));
      $('#api-token-view').hide();
      buildGreeting();
      getChannels();
      getUsers();
      getGroups();
      $('#main-view').show();      
    }

  } else {
    $('#main-view').hide();
    $('#api-token-view').show();    
  }
}


// Handles API token form submit
$(document).on('click', '#clicky-token-submit', function() {
  var token = $('#clicky-token-input').val();
  var auth = testAuth(token);
  
  if (auth === false) {
    console.info('[info] Authenticated failed');
    $('#clicky-token-input').val('');
    $('#clicky-token-input').val('');
  } else {
    team = auth.team;
    slackToken = token;
    var user_id = auth.user_id;
    var authUser = getUserData(user_id);
    console.info('[info] Successfully authenticated as ' + authUser.profile.first_name + ' at ' + team);
    localStorage.setItem('clicky-user', JSON.stringify(authUser));
    localStorage.setItem('clicky-token', token);
    localStorage.setItem('clicky-team', team);
    loadView();
  }

});

// Handles link clicks
$(document).on('click', 'a.linkable', function() {
  var href = $(this).attr('href');
  chrome.tabs.create({'url': href});
});


// Handles click events on users, channels, and groups
// Shares active tab to that user/channel/group
$(document).on('click', '.roomList>li>a', function() {
  var channel = $(this).attr('data-room');
  postCurrentTabTo(channel);
});


// Handles click events on refresh button
// Deletes users and channels from local storage
// Gets new data and rebuilds interfaces
$(document).on('click', '#refresh-data', function() {
  console.info('[info] Refreshing data');
  localStorage.removeItem('clicky-users');
  localStorage.removeItem('clicky-channels');
  localStorage.removeItem('clicky-groups');
  console.info('[info] Local storage items removed');
  $('#userList').html('Loading...');
  $('#channelList').html('Loading...');
  getChannels();
  getUsers();
  getGroups();  
});


// Loads views when document is ready
$(document).ready(function() {
  loadView();
});