var apiai = require('apiai');
const uuid = require('node-uuid');
const sessionIdsTemp = new Map();
require('dotenv-extended').load();

var apiaiOptions = {
    language: process.env.APIAI_LANG,
    requestSource: "skype"
};
var app = apiai(process.env.APIAI_ACCESS_TOKEN,apiaiOptions);
var generalIntent = process.env.GENERAL_INTENT;
module.exports = {
    recognize: function (session, callback) {
            
        let sender = session.message.address.conversation.id;
        console.log(sender);
        if (!sessionIdsTemp.has(sender)) {
                sessionIdsTemp.set(sender, uuid.v1());
        }
        let request = app.textRequest(session.message.text, {
            sessionId: sessionIdsTemp.get(sender),
            originalRequest: {
                data: session.message,
                source: "skype"
            }
        });

        request.on('response', function (response) {
            var result = response.result;
            var intentName = result.action;
            let generalIntentArr =  generalIntent.split(",");

            for(let intent of generalIntentArr){
                if(intentName.indexOf(intent) >-1){
                    intentName = 'general.response';
                    break;
                }
            }     
            callback(null, {
                intent: intentName,
                score: result.score,
                result: response.result
            });
        });

        request.on('error', function (error) {
            console.error(sender, 'Error while call to api.ai', error);
            callback(error);
        });

        request.end();

    }
};