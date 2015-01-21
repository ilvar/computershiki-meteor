Badges = new Mongo.Collection('badges');

Router.route('/', function () {
  this.render('top');
});

Router.route('/profile', function () {
  this.render('profile');
});

Router.route('/badges', function () {
  this.render('badges');
});

Router.route('/badges/:_id', function () {
  this.render('badge_data');
});

Router.route('/users/:_id', function () {
  this.render('user_badges');
});

Router.route('/add', function () {
  this.render('add');
  setTimeout(function () {
    $('#addName').focus();
  }, 100);
});

AdminConfig = {
  adminEmails: ['arcady.chumachenko@gmail.com'],
  collections: {
    Badges: {}
  }
};

Schemas = {};

Schemas.Badges = new SimpleSchema({
  title: {type: String},
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: function () {
      if (this.isInsert) {
        return Meteor.userId()
      }
    },
    autoform: {
      options: function () {
        return _.map(Meteor.users.find().fetch(), function (user) {
          return {
            label: user.emails[0].address,
            value: user._id
          }
        });
      }
    }
  },
  wikipediaHtml: {
    type: String,
    optional: true
  }
});

Badges.attachSchema(Schemas.Badges);

if (Meteor.isClient) {
  Template.navBar.helpers({
    activeIfTemplateIs: function (template) {
      var currentRoute = Router.current();
      return currentRoute && template === currentRoute.lookupTemplate() ? 'active' : '';
    }
  });

  Template.badges.helpers({
    badges: function () {
      return Badges.find({userId: Meteor.userId()});
    }
  });

  Template.user_badges.helpers({
    badges: function () {
      return Badges.find({userId: Router.current().params._id});
    }
  });

  Template.badge_data.helpers({
    badge: function () {
      return Badges.findOne(Router.current().params._id);
    }
  });

  Template.add.helpers({
    badges: function () {
      var name = Session.get('add_name') || '';
      if (name) {
        return Badges.find({
          userId: null,
          title: {$regex: '^' + name, $options: "i"}
        }, {limit: 50, sort: {title: 1}});
      } else {
        return [];
      }
    }
  });

  function insertBadge(title) {
    Meteor.call('addBadge', title);
    Session.set("add_name", "");
    Router.go('/badges');
  }

  Template.add.events({
    'keyup input': function (e, template) {
      Session.set("add_name", e.target.value);
    },
    'click a.select': function (e, template) {
      e.preventDefault();
      var title = e.target.dataset.title;
      insertBadge(title);
    },
    'submit form': function (e, template) {
      e.preventDefault();
      var title = Session.get("add_name");
      insertBadge(title);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      addBadge: function (title) {
        if (!this.userId) {
          throw new Meteor.Error("not-logged-in", "Must be logged in to add a badge.");
        }
        var data = {
          title: title,
          userId: this.userId
        };
        if (Badges.find(data).count() == 0) {
          var options = {query: title, format: "html", summaryOnly: true};
          var wikipedia = Meteor.npmRequire('wikipedia-js');
          wikipedia.searchArticle(options, Meteor.bindEnvironment(function (err, wikiData) {
            if (err) {
              console.log(err);
            } else {
              data.wikipediaHtml = wikiData;
            }
            Badges.insert(data);
          }));
        }

        return true;
      }
    });
  });
}
