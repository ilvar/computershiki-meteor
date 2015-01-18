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

Router.route('/users/:_id', function () {
    this.render('user_badges');
});

Router.route('/add', function () {
    this.render('add');
    setTimeout(function () {
        $('#addName').focus();
    }, 100);
});

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

    Template.add.helpers({
        badges: function () {
            var name = Session.get('add_name') || '';
            return Badges.find({name: {$regex: '^' + name, $options: "i"}});
        }
    });

    Template.add.events({
        'keyup input': function (e, template) {
            Session.set("add_name", e.target.value);
        },
        'click button': function (e, template) {
            e.preventDefault();
            var title = Session.get("add_name");
            Badges.insert({
                title: title,
                userId: Meteor.userId()
            });
            Router.go('/badges')
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
