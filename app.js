/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('dotenv-extended').load();
const apiai = require('apiai');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const commonUtil = require("./common-util");
var path = require("path");

const SkypeBot = require('./skypebot');
const SkypeBotConfig = require('./skypebotconfig');

const REST_PORT = (process.env.PORT || 5000);

const botConfig = new SkypeBotConfig(
    process.env.APIAI_ACCESS_TOKEN,
    process.env.APIAI_LANG,
    process.env.MICROSOFT_APP_ID,
    process.env.MICROSOFT_APP_PASSWORD
);

const skypeBot = new SkypeBot(botConfig);

// console timestamps
require('console-stamp')(console, 'yyyy.mm.dd HH:MM:ss.l');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/resources')));
app.get('/chatbot', function (req, res) {
    res.sendFile(path.join(__dirname + '/chatbot.html'));
});

app.get('/chatbotWeb', function (req, res) {
    res.sendFile(path.join(__dirname + '/chatbotweb.html'));
});

app.get('/saveLocation', function (req, res) {
    console.log('saveLocation :: function begin, New hit found');
    var count = commonUtil.incrementCounter();
    var fileName = 'resources/userinfo/location/'+count+'.json';
    var obj = {sessionid : {lat:req.query.lat,
                         lon:req.query.lon,
                         addr:req.query.addr}};
    
    fs.writeFile(fileName, JSON.stringify(obj), function (err) {
        if (err) return console.log(err);
        console.log('saveLocation :: writing to ' + fileName);
        res.status(200).send({
            message: 'Succesfully write location details'
        });
    });
});

app.post('/chat', skypeBot.botService.listen());

app.listen(REST_PORT, function () {
    console.log('Rest service ready on port ' + REST_PORT);
});