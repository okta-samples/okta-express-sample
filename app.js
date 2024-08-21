var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var qs = require('querystring');
var { Strategy } = require('passport-openidconnect');
const axios = require('axios');

//UL requiremnts
var {MemoryStore} = require('express-session')
const store = new MemoryStore();

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
  saveUninitialized: true,
  store
}));

app.use(passport.initialize());
app.use(passport.session());

// https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
let logout_url, id_token;
let _base = ORG_URL.slice(-1) == '/' ? ORG_URL.slice(0, -1) : ORG_URL;
axios
  .get(`${_base}/.well-known/openid-configuration`)
  .then(res => {
    if (res.status == 200) {
      let { issuer, authorization_endpoint, token_endpoint, userinfo_endpoint, end_session_endpoint } = res.data;
      logout_url = end_session_endpoint;

      // Set up passport
      passport.use('oidc', new Strategy({
        issuer,
        authorizationURL: authorization_endpoint,
        tokenURL: token_endpoint,
        userInfoURL: userinfo_endpoint,
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        //callbackURL: 'http://localhost:3000/authorization-code/callback',
        callbackURL: 'https://potential-zebra-qwxg6946v29w5w-3000.app.github.dev/authorization-code/callback',
        scope: 'profile offline_access',
      }, (issuer, profile, context, idToken, accessToken, refreshToken, params, done) => {
        console.log(`OIDC response: ${JSON.stringify({
          issuer, profile, context, idToken,
          accessToken, refreshToken, params
        }, null, 2)}\n*****`);
        id_token = idToken;
        return done(null, profile);
      }));
    }
    else {
      console.log(`Unable to reach the well-known endpoint. Are you sure that the ORG_URL you provided (${ORG_URL}) is correct?`);
    }
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

function demandLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/')
}

// app.use('/', ensureLoggedIn, indexRouter);
app.use('/', indexRouter);

app.use('/login', passport.authenticate('oidc'));

app.use('/authorization-code/callback',
  // https://github.com/jaredhanson/passport/issues/458
  passport.authenticate('oidc', { failureMessage: true, failWithError: true }),
  (req, res) => {
    res.redirect('/profile');
  }
);

app.use('/profile', demandLoggedIn, (req, res) => {
//app.use('/profile', ensureLoggedIn, (req, res) => {
  res.render('profile', { authenticated: req.isAuthenticated(), user: req.user });
});

app.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) { return next(err); }
    let params = {
      id_token_hint: id_token,
      post_logout_redirect_uri: 'http://localhost:3000/'
    }
    res.redirect(logout_url + '?' + qs.stringify(params));
  });
});

////Universal Logout endpoint
app.post('/global-token-revocation', (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;

  // 400 If the request is malformed
  if (!req.body) {
    res.status(400);
  }

  // Find the user by email linked to the org id associated with the API key provided
  console.log(req.body)
  
  const user = req.body['sub_id']['email']
  console.log(user)

  // 404 User not found
  if (!user) {
    res.sendStatus(404);
  }

  // End user session
  const storedSession = store.sessions;
  console.log(storedSession)
  const sids = [];
  Object.keys(storedSession).forEach((key) => {
    const sess = JSON.parse(storedSession[key]);
    console.log(sess)
    if (sess.passport.user.username === user) {
      console.log(sess.passport.user.username)
      sids.push(key);
    }
  });
  console.log(sids)
  for (const sid of sids) {
    store.destroy(sid);
    console.log('User session deleted')
  }
  
  return res.sendStatus(httpStatus);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message + (err.code && ' (' + err.code + ')' || '') +
    (req.session.messages && ": " + req.session.messages.join("\n. ") || '');
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
