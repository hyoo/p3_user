var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var site = require("./site");
var session = require("express-session");
var RedisStore = require('connect-redis')(session);
var passport = require("passport");
var oauth2 = require("./oauth2");
var config = require("./config");
var cors = require('cors');
var debug = require('debug')('p3api-user');
var userView = require("./routes/user");
var clientView= require("./routes/client");
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
//app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cors({origin: true, methods: ["GET,PUT,POST,PUT,DELETE"], allowHeaders: ["content-type", "authorization"],exposedHeaders: ['Content-Range', 'X-Content-Range'], credential: true, maxAge: 8200}));

app.use(cookieParser(config.get('cookieSecret')));

app.use(function(req,res,next){
	console.log("Cookies: ", req.cookies);
	next();
});

var sessionStore = app.sessionStore = new RedisStore(config.get("redis"));
app.use(session({
    store: sessionStore,
    name: config.get("cookieKey"),
    cookie: { domain: config.get('cookieDomain'),  maxAge: 2628000000 },
    secret: config.get('cookieSecret'),
    resave:false,
    saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

require("./auth");

app.post("/login", site.login);
app.get("/login", site.loginForm);
app.get("/logout", site.logout);
//app.get("/dialog/authorize", oauth2.authorization);
//app.post("/dialog/authorize/decision", oauth2.decision);
//app.post("/oauth2/token", oauth2.token);

//app.get("/api/userinfo", userView.info);
//app.get("/api/clientinfo", clientView.info);

app.get("/$", site.index)
// app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

require("replify")({name: "p3api", path: "./REPL"},app,{});
