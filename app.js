var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var { Strategy } = require('passport-openidconnect');
const axios = require('axios');

// source and import environment variables
require('dotenv').config({ path: '.okta.env' })
const { ORG_URL, CLIENT_ID, CLIENT_SECRET } = process.env;

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'CanYouLookTheOtherWay',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
let _base = ORG_URL.slice(-1) == '/'? ORG_URL.slice(0,-1) : ORG_URL;
let issuer, authorizationURL, tokenURL, userInfoURL;
axios
  .get(`${_base}/.well-known/openid-configuration`)
  .then(res => {
    if (res.status == 200) {
      issuer = res.data.issuer;
      authorizationURL = res.data.authorization_endpoint;
      tokenURL = res.data.token_endpoint;
      userInfoURL = res.data.userinfo_endpoint;
    }
    else { /** we should never reach here, but you nver know ... */
      issuer = `${ORG_URL}oauth2/default`;
      authorizationURL = `${ORG_URL}oauth2/default/v1/authorize`;
      tokenURL = `${ORG_URL}oauth2/default/v1/token`;
      userInfoURL = `${ORG_URL}/oauth2/default/v1/userinfo`;
    }
  })
  .then(res => {
    // set up passport
    passport.use('oidc', new Strategy({
      issuer,
      authorizationURL,
      tokenURL,
      userInfoURL,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: '/authorization-code/callback',
      scope: 'groups profile offline_access',
    }, (issuer, uiProfile, idProfile, context, idToken, accessToken, refreshToken, params, done) => {
      console.log(`OIDC response: ${JSON.stringify({issuer, uiProfile, idProfile, context, idToken,
        accessToken, refreshToken, params}, null, 2)}\n*****`);
      let profile = uiProfile._json;
      delete uiProfile._json;
      delete uiProfile._raw;
      Object.assign(profile, uiProfile);
      return done(null, profile);
    }));
  })
  .catch(error => {
    console.error(error);
  });

passport.serializeUser((user, next) => {
  next(null, user);
});

passport.deserializeUser((obj, next) => {
  next(null, obj);
});

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login')
}

app.use('/', indexRouter);

app.use('/login', passport.authenticate('oidc'));

app.use('/authorization-code/callback',
  // https://github.com/jaredhanson/passport/issues/458
  passport.authenticate('oidc', { failureMessage: true, failWithError: true }),
  (req, res) => {
    res.redirect('/profile');
  }
);

app.use('/profile', ensureLoggedIn, (req, res) => {
  res.render('profile', { authenticated: req.isAuthenticated(), user: req.user });
});

app.post('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message + (err.code && ' ('+err.code+')' || '') + 
    (req.session.messages && ": " + req.session.messages.join("\n. ") || '');
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
