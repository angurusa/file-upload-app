/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var partials = require('express-partials');

var GITHUB_CLIENT_ID = "ce4da17d97c24819aabc";
var GITHUB_CLIENT_SECRET = "db4fd97b2cfd323ef85402bec159ab15f8daac61";


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:6002/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function() {

            // To keep the example simple, the user's GitHub profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the GitHub account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
));

// create a new express server
var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.get('/account', ensureAuthenticated, function(req, res) {
    console.log("Inside account route");
    res.render('account', { user: req.user });
});

var request = require('request');

var options = {
 method: 'GET',
 url: 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/040c6b7cd4bd43b936aacd7b7ce3a7f5387b0e5a4da0d27945f3e655bbcca391/cardsservice/getAllCards',
 headers:{ accept: 'application/json', 'x-ibm-client-id': 'c9466723-ce3e-490c-9b19-bf052f569bf9' }
};

var sortBy = require('sort-by');

app.get(['/','/content*'], function(req, res) {
  request.get(options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            var obj = JSON.parse(body);
            var cards = [];

            var formId = "";
            var searchId = "";
            var searchFlag = false;
            if(req.query.searchId!='' && req.query.searchId!=undefined){
              searchId = req.query.searchId;
              console.log("The Search ID isssssssssss : "+searchId);

              for (var i = 0; i < obj.length; i++) {
                console.log("Inside for loooooooooooooooooooooooooop 1111111111111111111111111111   :"+i);
                var temp = JSON.parse(obj[i]);
                for (var j = 0; j < temp.tags.length; j++) {
                  console.log("Inside for loooooooooooooooooooooooooooooop 2222222222222222222222222   :"+j);
                  if(temp.tags[j]==searchId){
                    console.log("Inside Foooooooorr and Ifffffff Loooooooooooop : "+temp.tags[j]);
                    cards.push(JSON.parse(obj[i]));
                    console.log("The size of the cards is : "+cards.length);
                  }
                }
              }
            }
            else {
              console.log("When there's no search IDddddddddddddddddddddddddddddddddddddd");
              for(var i=0; i < obj.length; i++) {
                cards.push(JSON.parse(obj[i]));
              }
            }


            if(req.query.sortId!='' && req.query.sortId!=undefined){
                formId = req.query.sortId;
                cards.sort(sortBy(formId));
            }
            else {
              cards.sort(sortBy("id"));
            }

            //set default variables
            var totalCards = cards.length,
                pageSize = 3,
                pageCount = Math.round(totalCards/pageSize),
                currentPage = 1,
                cardsArrays = [],
                cardsList = [];

            //split list into groups
            while (cards.length > 0) {
                cardsArrays.push(cards.splice(0, pageSize));
            }

            //set current page if specifed as get variable (eg: /?page=2)
            if (typeof req.query.page !== 'undefined') {
                currentPage = +req.query.page;
            }

            //show list of cards from group
            cardsList = cardsArrays[+currentPage - 1];

            if(cardsList!=undefined){
              res.render('content',{
                user: req.user,
                cards: cardsList,
                pageSize: pageSize,
                totalCards: totalCards,
                pageCount: pageCount,
                currentPage: currentPage,
                formId: formId,
                searchId: searchId
              });
            }
            else {
              res.redirect('/content');
            }

            }
         });

});

app.get('/details*', function(req, res) {

  request.get(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var obj = JSON.parse(body);
        var contentCards = null;
        for(var j=0; j < obj.length; j++) {
          if (JSON.parse(obj[j])._id == req.query.id) {
              contentCards = JSON.parse(obj[j]);
          }
        }

        res.render('details', {
           user: req.user,
           details: contentCards
        });
      }
  });

});

app.get('/upload', function(req, res) {
    res.render('upload', { user: req.user });
});

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] }),
    function(req, res) {
        // The request will be redirected to GitHub for authentication, so this
        // function will not be called.
    });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}
