'use strict';

const cfenv = require('cfenv');
const dotenv = require('dotenv');
const express = require('express');
const CloudantDialogStore = require('./CloudantDialogStore');
const CloudantUserStore = require('./CloudantUserStore');
const PowderClosetBot = require('./PowderClosetBot');
const WebSocketBotController = require('./WebSocketBotController');

const appEnv = cfenv.getAppEnv();
const app = express();
const http = require('http').Server(app);

app.use(express.static(__dirname + '/public'));

// set view engine and map views directory
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// map requests
app.get('/', function(req, res) {
    res.render('index.ejs', {
        webSocketProtocol: appEnv.url.indexOf('http://') == 0 ? 'ws://' : 'wss://'
    });
});

// start server on the specified port and binding host
http.listen(appEnv.port, appEnv.bind, () => {
    console.log("server starting on " + appEnv.url);

    // load environment variables and create an instance of the HealthBot
    dotenv.config();
    let powderClosetBot = new PowderClosetBot(
        new CloudantUserStore(process.env.CLOUDANT_URL, process.env.CLOUDANT_USER_DB_NAME),
        new CloudantDialogStore(process.env.CLOUDANT_URL, process.env.CLOUDANT_DIALOG_DB_NAME),
        process.env.CONVERSATION_USERNAME,
        process.env.CONVERSATION_PASSWORD,
        process.env.CONVERSATION_WORKSPACE_ID
    );
    // initialize the HealthBot
    powderClosetBot.init()
        .then(() => {
            // create an instance of the WebSocketBotController to handle WebSocket connected clients
            let webSocketBotController = new WebSocketBotController(powderClosetBot, http);
            webSocketBotController.start();
        })
        .catch((error) => {
            console.log(`Error: ${error}`);
            process.exit();
        });
});
