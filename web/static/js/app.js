// Brunch automatically concatenates all files in your
// watched paths. Those paths can be configured at
// config.paths.watched in 'brunch-config.js'.
//
// However, those files will only be executed if
// explicitly imported. The only exception are files
// in vendor, which are never wrapped in imports and
// therefore are always executed.

// Import dependencies
//
// If you no longer want to use a dependency, remember
// to also remove its path from "config.paths.watched".
import 'phoenix_html';
import 'jquery-ui';
import moment from 'moment';

// Import local files
//
// Local files can be imported directly using relative
// paths './socket' or full ones 'web/static/js/socket'.
import 'bootstrap-datepicker';

import socket from './socket';
import { Activity } from './activity';
import inlineEdit from './inline_edit';
import contactAdd from './contact_add';
import contactLive from './contact_live';
import contactImport from './contact_import';
import blueimpFileUpload from './blueimp_file_upload';
import tagEdit from './tag_edit';
import { directive as onClickOutside } from 'vue-on-click-outside';
import linkify from 'vue-linkify';

Vue.directive('linkified', linkify);
Vue.directive('on-click-outside', onClickOutside);

Vue.filter('formatDate', function(value) {
  if (value) {
    return moment(String(value)).format('MM/DD/YYYY');
  }
});

Vue.filter('formatDateTime', function(value) {
  if (value) {
    return moment(String(value)).format('MM/DD/YYYY hh:mm a');
  }
});

export var App = {
  activityInit: function(){
    Activity.start();
  },
  contactSocketInit: function(contactId){
    contactLive.init(socket, contactId );
  }
};

import elementLang from 'element-ui/lib/locale/lang/en';
import elementLocale from 'element-ui/lib/locale';
elementLocale.use(elementLang);

Vue.use(require('vue-moment-jalaali'));
Vue.use(VueResource);
Vue.use(VueResourceCaseConverter, {
  responseUrlFilter(url) {
    if(/\/api\/v2\//.test(url))
      return true;
    else
      return false;
  }
});


import ContactList from '../components/contacts/list.vue';
import Board from '../components/boards/board.vue';
import NewBoard from '../components/boards/new.vue';
import Activities from '../components/activities/list.vue';
import BoardRecentActivities from '../components/boards/recent_timeline_events.vue';
import ArchiveBoard from '../components/boards/archive.vue';
import NotificationApp from '../components/notification.vue';
import GlModalWindow from '../components/glmodal.vue';
import GlAttachmentPreview from '../components/glpreview.vue';
import UserNavBar from '../components/navbar.vue';
import WebhooksApp from '../components/webhooks.vue';

Vue.use(require('vue-autosize'));
const NotificationBus = new Vue();
Object.defineProperty(Vue.prototype, '$notification', {
  get() {
    return NotificationBus;
  }
});

const GlobalModalWindow = new Vue();
Object.defineProperty(Vue.prototype, '$glmodal', {
  get() {
    return GlobalModalWindow;
  }
});
const GlobalAttachmentPreview = new Vue();
Object.defineProperty(Vue.prototype, '$glAttachmentPreview', {
  get() {
    return GlobalAttachmentPreview;
  }
});

Vue.mixin( {
  methods: {
    camelCaseKeys: function(o){
      var newO, origKey, newKey, value;
      if (o instanceof Array) {
        newO = [];
        for (origKey in o) {
          value = o[origKey];
          if (typeof value === 'object') {
            value = this.camelCaseKeys(value);
          }
          newO.push(value);
        }
      } else {
        newO = {};
        for (origKey in o) {
          if (o.hasOwnProperty(origKey)) {
            newKey = origKey.replace(/[\-_\s]+(.)?/g, function(match, chr) {
              return chr ? chr.toUpperCase() : '';
            });
            value = o[origKey];
            if (value !== null && (value.constructor === Object || value.constructor === Array)) {
              value = this.camelCaseKeys(value);
            }
            newO[newKey] = value;
          }
        }
      }
      return newO;
    }
  }
});

const VueCurrentUser = {
  install(Vue, options) {
    localStorage.setItem('auth_token', options['token']);
    Vue.http.headers.common['Authorization'] = 'Bearer ' + localStorage.getItem('auth_token');
    Vue.currentUser =  {
      userId: options['userId'],
      companyId: options['companyId'],
      token: options['token'],
      timeZone: options['timeZone'],
      userImage: options['userImage'],
      eq: function(id) {
        return this.userId === id.toString();
      }
    };
  }
};

window.jwtToken = null;
if (document.querySelector('meta[name="guardian_token"]')) {
  window.jwtToken = document.querySelector('meta[name="guardian_token"]').content;
  Vue.use(VueCurrentUser, {
    userId: document.querySelector('meta[name="user_id"]').content,
    companyId: document.querySelector('meta[name="company_id"]').content,
    token: document.querySelector('meta[name="guardian_token"]').content,
    timeZone: document.querySelector('meta[name="time_zone"]').content,
    userImage: document.querySelector('meta[name="user_image"]').content
  });
}

if ($('#user-navbar').length > 0) {
  new Vue({
    el: '#user-navbar',
    components: {
      'navbar': UserNavBar
    }
  });
}
if ($('#contacts-app').length > 0) {
  new Vue({
    el: '#contacts-app',
    components: {
      'contact-list' : ContactList
    },
    mounted() {
      window.addEventListener('keyup', (event) => {
        if (event.keyCode === 27) { this.$emit('esc-keyup'); }
      });
    }
  });
}

if ($('#board-app').length > 0) {
  new Vue({
    el: '#board-app',
    components: {
      'board': Board
    },
    mounted() {
      window.addEventListener('keyup', (event) => {
        if (event.keyCode === 27) { this.$emit('esc-keyup'); }
      });
    }
  });
}

if ($('#board-list-app').length > 0) {
  new Vue({
    el: '#board-list-app',
    components: {
      'new-board': NewBoard
    }
  });
}

if ($('#activities-app').length > 0) {
  new Vue({
    el: '#activities-app',
    components: {
      'activities': Activities
    },
    mounted() {
      window.addEventListener('keyup', (event) => {
        if (event.keyCode === 27) { this.$emit('esc-keyup'); }
      });
    }
  });
}

if ($('#archive-board').length > 0) {
  new Vue({
    el: '#archive-board',
    components: {
      'archive-board': ArchiveBoard
    }
  });
}

if ($('#recent-activities-app').length > 0) {
  new Vue({
    el: '#recent-activities-app',
    components: {
      'activities': BoardRecentActivities
    },
    mounted() {
      window.addEventListener('keyup', (event) => {
        if (event.keyCode === 27) { this.$emit('esc-keyup'); }
      });
    }
  });
}

if ($('#notification-app').length > 0) {
  new Vue({
    el: '#notification-app',
    components: {
      'notification': NotificationApp
    }
  });
}

if ($('#global-modal-window').length > 0) {
  new Vue({
    el: '#global-modal-window',
    components: { 'glmodal': GlModalWindow },
    mounted() {
      window.addEventListener('keyup', (event) => {
        if (event.keyCode === 27) { if(!$('#global-attachment-preview').is(':visible')){this.$emit('esc-keyup');} }
      });
    }

  });
}

if ($('#global-attachment-preview').length > 0) {
  new Vue({
    el: '#global-attachment-preview',
    components: { 'gl-attachment-preview': GlAttachmentPreview },
    mounted() {
      window.addEventListener('keyup', (event) => {
        if (event.keyCode === 27) { this.$emit('esc-keyup'); }
      });
    }
  });
}

if ($('#webhooks-app').length > 0) {
  new Vue({
    el: '#webhooks-app',
    components: {
      'webhooks': WebhooksApp
    }
  });
}


$('#toggle-activity-panel').on('click', function(){
  $('.control-sidebar-light').toggleClass('open');
  $(this).hide();
});

$('#close-sidebar').on('click', function(){
  $('.control-sidebar-light').toggleClass('open');
  $('#toggle-activity-panel').show();
});

$('.show-archived-boards').on('click', function(e){
  e.preventDefault();
  $('.board-archived-true').show();
  $(this).hide();
  $('.hide-archived-boards').show();
});

$('.hide-archived-boards').on('click', function(e){
  e.preventDefault();
  $('.board-archived-true').hide();
  $(this).hide();
  $('.show-archived-boards').show();
});
