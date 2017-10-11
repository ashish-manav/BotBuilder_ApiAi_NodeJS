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

const apiai = require('apiai');
const botbuilder = require('botbuilder');
const RegisterIntents = require('./register-intents');
var apiairecognizer = require('./apiai_recognizer');
const fs = require('fs');
const commonUtil = require("./common-util");
const sessionIds = new Map();

module.exports = class SkypeBot {

    get botConfig() {
        return this._botConfig;
    }

    set botConfig(value) {
        this._botConfig = value;
    }

    get botService() {
        return this._botService;
    }

    set botService(value) {
        this._botService = value;
    }

    constructor(botConfig) {
        this.resetApplication();
        this._botConfig = botConfig;

        this.botService = new botbuilder.ChatConnector({
            appId: this.botConfig.skypeAppId,
            appPassword: this.botConfig.skypeAppSecret
        });

        this._bot = new botbuilder.UniversalBot(this.botService);
        // Do not persist userData
        this._bot.set(`persistUserData`, false);
        // Do not persist conversationData
        this._bot.set(`persistConversationData`, false);
        this._bot.use({
            botbuilder: function (session, next) {
                let sessionId = session.message.address.conversation.id;
                console.log("SESSION TIME OUT:: ####################### BEGIN, session id : " + session.message.address.conversation.id);
                //console.log("SESSION TIME OUT:: ####################### BEGIN, lastsend time: "+  session.lastSendTime);
                console.log("SESSION TIME OUT:: ####################### BEGIN, last access time: " + session.sessionState.lastAccess);
                if (session.sessionState.lastAccess) {
                    var delta = new Date().getTime() - session.sessionState.lastAccess;//session.lastSendTime;
                    console.log("SESSION TIME OUT:: ####################### time diff-" + delta);
                    if (delta > 600000) {
                         console.log("SESSION TIME OUT:: ####################### Sesssion expired, last accestime is more than 10min");
                        sessionIds.delete(sessionId);                        
                    }
                }
                SkypeBot.fetchSessionInfo(sessionId);
                //session.privateConversationData.previousAccess = session.sessionState.lastAccess;
                next();
            }
        });
        /*this._bot.on('conversationUpdate', function (message) { //to invoke for each session before enter into apirecogizer
             console.log("@@@@@@@@@@@@@@@@@@@@@ EVENTS @@@@@@@@@@@@@@@@@@@@@@@@@@");
            // console.log(message);
         });*/

        /*this._bot.on("lookupUser", function (t1) {
            var sessionId = t1.conversation.id;
            console.log("lookupuser::  sessionIds map");
            console.log(sessionIds);
            console.log("lookupuser :: session ID :" + sessionId);
            if (!sessionIds.has(sessionId)) {
                console.log("lookupuser :: new session Id found");
                sessionIds.set(sessionId, "SESSIONID");
                var count = commonUtil.getCounter();
                var locfileName = 'resources/userinfo/location/' + count + '.json';
                console.log("lookupuser :: File location path for geo loc json:" + locfileName);
                if (fs.existsSync(locfileName)) {
                    var locationDtl = JSON.parse(fs.readFileSync(locfileName, 'utf8'));
                    var sessLocFilename = 'resources/userinfo/session-location-map/' + sessionId.replace(":", "_") + '.json';
                    var sessionLocObj = {
                        sessionid: {
                            lat: locationDtl.sessionid.lat, lon: locationDtl.sessionid.lon, addr: locationDtl.sessionid.addr
                        }
                    }
                    fs.writeFile(sessLocFilename, JSON.stringify(sessionLocObj), function (err) {
                        if (err) return console.log(err);
                        console.log("lookupuser :: writing session map file to " + sessLocFilename);
                    });
                }else {
                     console.log("lookupuser :: location file not exist in "+locfileName);
                }

            } else {
                console.log("lookupuser :: Session is already present in map ::" + sessionId)
            }
        });*/

        var intents = new botbuilder.IntentDialog({
            recognizers: [
                apiairecognizer
            ],
            intentThreshold: 0.2,
            recognizeOrder: botbuilder.RecognizeOrder.series
        });
        this._registerIntents = new RegisterIntents(intents, this._bot);
    }

    static fetchSessionInfo(sessionId) {
        console.log("fetchSessionInfo::  sessionIds map");
        console.log(sessionIds);
        console.log("fetchSessionInfo :: session ID :" + sessionId);
        if (!sessionIds.has(sessionId)) {
            console.log("fetchSessionInfo :: new session Id found");
            sessionIds.set(sessionId, "SESSIONID");
            var count = commonUtil.getCounter();
            var locfileName = 'resources/userinfo/location/' + count + '.json';
            console.log("fetchSessionInfo :: File location path for geo loc json:" + locfileName);
            if (fs.existsSync(locfileName)) {
                var locationDtl = JSON.parse(fs.readFileSync(locfileName, 'utf8'));
                var sessLocFilename = 'resources/userinfo/session-location-map/' + sessionId.replace(":", "_") + '.json';
                var sessionLocObj = {
                    sessionid: {
                        lat: locationDtl.sessionid.lat, lon: locationDtl.sessionid.lon, addr: locationDtl.sessionid.addr
                    }
                }
                fs.writeFile(sessLocFilename, JSON.stringify(sessionLocObj), function (err) {
                    if (err) return console.log("fetchSessionInfo :: unable to write session map file "+err);
                    console.log("fetchSessionInfo :: writing session map file to " + sessLocFilename);
                });
            } else {
                console.log("fetchSessionInfo :: location file not exist in " + locfileName);
            }

        } else {
            console.log("fetchSessionInfo :: Session is already present in map ::" + sessionId)
        }
    }

    resetApplication() {
        console.log("Clearing sessionIds map...");
        sessionIds.clear();
        console.log(sessionIds);

        console.log("Deleting all location related files...");
        commonUtil.removeAll('resources/userinfo/location');

        console.log("Deleting all session-location map related files...");
        commonUtil.removeAll('resources/userinfo/session-location-map');

    }
}