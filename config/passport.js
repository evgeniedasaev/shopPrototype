var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {
    req.checkBody('email', 'Неверный формат email').notEmpty().isEmail();
    req.checkBody('password', 'Неверный пароль').notEmpty().isLength({min: 4});
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(err) {
            messages.push(err.msg);
        });
        return done(null, false, req.flash('error', messages));
    }
    User.findOne({'email': email}, function(err, user) {
        if (err) {
            return done(err);
        }

        if (user) {
            return done(null, false, {message: 'E-mail уже используется'});
        }

        var newUser = new User();
        
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password);

        newUser.save(function(err, result) {
            if (err) {
                return done(err);
            }
            return done(null, newUser);
        });
    });
}));