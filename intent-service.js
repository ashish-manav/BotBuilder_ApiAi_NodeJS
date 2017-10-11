const botbuilder = require('botbuilder');
const intentMap = require("./intents-map");
const commonUtil = require("./common-util");
const fs = require('fs');
const request = require('axios');
const utilContants = new Map();
require('dotenv-extended').load();

module.exports = class IntentService {

    constructor(bot) {
        this.initialiseContants();

        this._bot = bot;

        this._bot.dialog(intentMap.BOOK_CAB, [
            this.bookCab
        ]);

        this._bot.dialog(intentMap.ENQUIRY_FOOD, [
            this.enquiryfood
        ]);

        this._bot.dialog(intentMap.ENQUIRY_FOOD_SELECTEDFOOD, [
            this.enquiryfoodSelectedFood
        ]);

        this._bot.dialog(intentMap.ENQUIRY_FOOD_SELECTEDTYPE, [
            this.enquiryfoodSelectedType
        ]);

        this._bot.dialog(intentMap.ENQUIRY_SIGHTSEEING, [
            this.sightseeing, this.sightseeingConfirm
        ]);

        this._bot.dialog(intentMap.ENQUIRY_SIGHTSEEING_CONFIRM, [
            this.sightseeingConfirm
        ]);

        this._bot.dialog(intentMap.ENQUIRY_EVENT, [
            //this.enquryEvent
        ]);

        this._bot.dialog(intentMap.ENQUIRY_RESTAURANT, [
            this.enquryRestaurant
        ]);

        this._bot.dialog(intentMap.GENERAL_REPONSE, [
            this.generalResponse
        ]);
    }

    initialiseContants() {
        utilContants.set("parks", "amusement_park");
        utilContants.set("beaches", "natural_feature");
        utilContants.set("night club", "night_club");
        utilContants.set("shopping mall", "shopping_mall");
        utilContants.set("bar", "bar");
        utilContants.set("zoo", "zoo");
        utilContants.set("casino", "casino");
    }

    bookCab(session, response) {
        var datetime = response.result.parameters.datetime;
        var destination = response.result.parameters.destination;
        //session.send("jobStream : %s and job type : %s ",jobStream, jobType);
        if (destination) {
            next({ response: destinationType });
        } else {
            // no entities detected, ask user for a specialisation
            botbuilder.Prompts.text(session, 'Where you would like to go?');
        }
    }

    enquiryfood(session, response) {
        var msg = new botbuilder.Message(session)
            .text("Thank you for expressing interest in our service! What type of food would you like?")
            .suggestedActions(
            botbuilder.SuggestedActions.create(
                session, [
                     botbuilder.CardAction.imBack(session, "Burger", "Burger"),
                     botbuilder.CardAction.imBack(session, "Pizza", "Pizza"),
                    botbuilder.CardAction.imBack(session, "Pasta", "Pasta"),
                    /*botbuilder.CardAction.imBack(session, "Salad", "Salad"),
                    botbuilder.CardAction.imBack(session, "Waffles", "Waffles"),*/
                    botbuilder.CardAction.imBack(session, "Sandwich", "Sandwich")
                ]
            ));
        session.endConversation(msg);

    }

    enquiryfoodSelectedType(session, response) {
        let foodtype = response.result.parameters.foodtype;
        var messages = JSON.parse(fs.readFileSync('resources/foodtype/'+foodtype.toLowerCase()+'.json', 'utf8'));
        commonUtil.sendCarouselCards(session, messages);
    }

    enquiryfoodSelectedFood(session, response) {
        let fooditems = response.result.parameters.fooditems;
        session.endConversation("Your order for " + fooditems + " was sucessfully processed");
    }

    sightseeing(session, response, next) {
        var destinationType = response.result.parameters.destinationType
        //session.send("jobStream : %s and job type : %s ",jobStream, jobType);
        if (destinationType) {
            next({ response: destinationType });
        } else {
            var msg = new botbuilder.Message(session)
                .text(" What type of place would you like?")
                .suggestedActions(
                botbuilder.SuggestedActions.create(
                    session, [
                        botbuilder.CardAction.imBack(session, "Beaches", "Beaches"),
                        botbuilder.CardAction.imBack(session, "Parks", "Parks"),
                        botbuilder.CardAction.imBack(session, "Night clubs", "Night clubs"),
                        botbuilder.CardAction.imBack(session, "Shopping Mall", "Shopping Mall"),
                        botbuilder.CardAction.imBack(session, "Bar", "Bar "),
                        botbuilder.CardAction.imBack(session, "Zoo", "Zoo"),
                        botbuilder.CardAction.imBack(session, "Casino", "Casino")
                    ]
                ));
            session.endConversation(msg);
            //botbuilder.Prompts.text(session, 'There are beaches, waterfall & hilly areas. Which is your preference?');
        }
    }

    sightseeingConfirm(session, response) {
        let destinationType = response.response;
        if (!destinationType) { destinationType = response.result.parameters.destinationType; }

        console.log("sightseeingType :: Dest type:" + destinationType);

        console.log("sightseeingType :: Google api search type: " + utilContants.get(destinationType));
        let sender = session.message.address.conversation.id;
        let locfileName = 'resources/userinfo/session-location-map/' + sender.replace(":", "_") + '.json';
        if (fs.existsSync(locfileName)) {
            let location = JSON.parse(fs.readFileSync(locfileName, 'utf8'));
            console.log("sightseeingType :: fetch location from session map file > " + location.sessionid.addr);
            let templocation = location.sessionid.lat + "," + location.sessionid.lon;
            let url = commonUtil.getPlaceSearchUrl(process.env.GOOGLE_MAP_API, templocation, process.env.GOOGLE_MAP_RADIUS, utilContants.get(destinationType));
            console.log("sightseeingType :: Going to search nearby places from url: " + url);

            request.get(url)
                .then(response => {
                    let resp = response.data.results;
                    console.log("sightseeingType :: Got respose for nearby places from the url" + url);
                    if (resp && resp.length > 0) {
                        let jsonObj = commonUtil.convertGoogleJsonFormat(resp, session,location.sessionid);
                        console.log("sightseeingType :: Sucessfully convert response, going to send message");
                    } else {
                        session.endConversation("Sorry, search result is empty.");
                    }

                })
                .catch(error => {
                    console.log(error);
                });
            //session.endConversation("You are located in '" + location.sessionid.addr + "'");
        } else {
            session.endConversation("Sorry, Your location was unable to fetch");
        }


    }

    generalResponse(session, response) {
        if (response) {
            let messageText = session.message.text;
            let sender = session.message.address.conversation.id;
            let respo = response.result;
            if (messageText && sender) {
                if (commonUtil.isDefined(respo) && commonUtil.isDefined(respo.fulfillment)) {
                    let responseText = respo.fulfillment.speech;
                    let responseMessages = respo.fulfillment.messages;

                    if (commonUtil.isDefined(responseMessages) && responseMessages.length > 0) {
                        commonUtil.doRichContentResponse(session, responseMessages);
                    } else if (commonUtil.isDefined(responseText)) {
                        console.log(sender, 'Response as text message');
                        session.endConversation(responseText);
                    } else {
                        console.log(sender, 'Received empty speech');
                    }
                } else {
                    console.log(sender, 'Received empty result');
                }
            } else {
                console.log('Empty message');
            }
        }
    }

    enquryRestaurant(session, response) {        
        let sender = session.message.address.conversation.id;
        let locfileName = 'resources/userinfo/session-location-map/' + sender.replace(":", "_") + '.json';
      
        if (fs.existsSync(locfileName)) {
            let location = JSON.parse(fs.readFileSync(locfileName, 'utf8'));
            console.log("enquryEvent :: fetch location from session map file > " + location.sessionid.addr);
            let templocation = location.sessionid.lat + "," + location.sessionid.lon;
            let url = commonUtil.getPlaceSearchUrl(process.env.GOOGLE_MAP_API, templocation, process.env.GOOGLE_MAP_RADIUS, "restaurant");
            console.log("Going to search nearby places from url: " + url);

            request.get(url)
                .then(response => {
                    let resp = response.data.results;
                    console.log("Got respose for nearby places from the url" + url);
                    if (resp && resp.length > 0) {
                        let jsonObj = commonUtil.convertGoogleJsonFormat(resp, session, location.sessionid);
                        console.log("sightseeingType :: Sucessfully convert response, going to send message");
                    } else {
                        session.endConversation("Sorry, search result is empty.");
                    }
                })
                .catch(error => {
                    console.log(error);
                });
            //session.endConversation("You are located in '" + location.sessionid.addr + "'");
        } else {
            session.endConversation("Sorry, Your location was unable to fetch, please type your location");
        }





        /* = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?
         location=10.014078,76.3636645&radius=5000&type=restaurant&
         key=AIzaSyAbaxBMBSdFPsLrefGRzsok9LGV_8BsSqo";*/


        console.log("after block");
        //session.endConversation("simple");




    }
}
