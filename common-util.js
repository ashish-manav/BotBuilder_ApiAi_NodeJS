const botbuilder = require('botbuilder');
var counter = 0;
const request = require('axios');
var async = require("async");
const path = require('path');
const fs = require('fs');

require('dotenv-extended').load();

module.exports = class CommonUtil {

    static getPlaceSearchUrl(key, location, radius, type) {
        return "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" + key
            + "&location=" + location
            + "&radius=" + radius
            + "&type=" + type;
    }

    static getPhotoReferenceUrl(key, photoReferenceID) {
        return "https://maps.googleapis.com/maps/api/place/photo?maxwidth=150&key=" + key
            + "&photoreference=" + photoReferenceID;
    }

    static getPlaceDetailUrl(key, placeID) {
        return "https://maps.googleapis.com/maps/api/place/details/json?key=" + key
            + "&placeid=" + placeID;
    }

    static getGoogleMapDirectUrl(fromAddr, toAddr, lat, long) {
        return "https://www.google.co.in/maps/dir/"
            + fromAddr + "/"
            + toAddr + "/@"
            + lat + "," + long + "z"
    }

    static incrementCounter() {
        counter = counter + 1;
        return counter;
    }

    static getCounter() {
        return counter;
    }

    static sendCarouselCards(session, messages) {
        var msg = new botbuilder.Message(session);
        msg.attachmentLayout(botbuilder.AttachmentLayout.carousel)
        var attachments = [];
        for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
            let message = messages[messageIndex];
            let attch = new botbuilder.HeroCard(session)
                .title(message.title)
                .subtitle(message.subtitle)
                .text(message.text)
                .images([botbuilder.CardImage.create(session, message.images)])
                .buttons([
                    botbuilder.CardAction.imBack(session, message.buttonValue, message.buttonText)
                ]);
            attachments.push(attch);
        }
        msg.attachments(attachments);
        session.sendTyping()
        session.endConversation(msg).endDialog();
    }

    static sendCarouselCardsMultipleButton(session, messages) {
        var msg = new botbuilder.Message(session);
        msg.attachmentLayout(botbuilder.AttachmentLayout.carousel)
        var attachments = [];
        for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
            let message = messages[messageIndex];
            let buttons = [];
            message.button.forEach(function (btn) {
                buttons.push(botbuilder.CardAction.openUrl(session, btn.buttonValue, btn.buttonText));
            });
            let attch = new botbuilder.HeroCard(session)
                .title(message.title)
                .subtitle(message.subtitle)
                .text(message.text)
                .images([botbuilder.CardImage.create(session, message.images)])
                .buttons(buttons);
            attachments.push(attch);
        }
        msg.attachments(attachments);
        session.sendTyping()
        session.endConversation(msg).endDialog();
    }

    static doRichContentResponse(session, messages) {
        for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
            let message = messages[messageIndex];

            switch (message.type) {
                //message.type 0 means text message
                case 0:
                    {
                        if (CommonUtil.isDefined(message.speech)) {
                            session.endConversation(message.speech);
                        }
                    }
                    break;
                //message.type 1 means card message
                case 1:
                    {
                        let heroCard = new botbuilder.HeroCard(session).title(message.title);
                        if (CommonUtil.isDefined(message.subtitle)) {
                            heroCard = heroCard.subtitle(message.subtitle)
                        }

                        if (CommonUtil.isDefined(message.imageUrl)) {
                            heroCard = heroCard.images([botbuilder.CardImage.create(session, message.imageUrl)]);
                        }

                        if (CommonUtil.isDefined(message.buttons)) {
                            let buttons = [];
                            for (let buttonIndex = 0; buttonIndex < message.buttons.length; buttonIndex++) {
                                let messageButton = message.buttons[buttonIndex];
                                if (messageButton.text) {
                                    let postback = messageButton.postback;
                                    if (!postback) {
                                        postback = messageButton.text;
                                    }

                                    let button;

                                    if (postback.startsWith("http")) {
                                        button = botbuilder.CardAction.openUrl(session, postback, messageButton.text);
                                    } else {
                                        button = botbuilder.CardAction.postBack(session, postback, messageButton.text);
                                    }

                                    buttons.push(button);
                                }
                            }

                            heroCard.buttons(buttons);

                        }

                        let msg = new botbuilder.Message(session).attachments([heroCard]);
                        session.endConversation(msg);

                    }

                    break;

                //message.type 2 means quick replies message
                case 2:
                    {
                        let replies = [];
                        let heroCard = new botbuilder.HeroCard(session).title(message.title);
                        if (CommonUtil.isDefined(message.replies)) {
                            for (let replyIndex = 0; replyIndex < message.replies.length; replyIndex++) {
                                let messageReply = message.replies[replyIndex];
                                let reply = botbuilder.CardAction.postBack(session, messageReply, messageReply);
                                replies.push(reply);
                            }

                            heroCard.buttons(replies);
                        }
                        let msg = new botbuilder.Message(session).attachments([heroCard]);
                        session.endConversation(msg);
                    }
                    break;
                //message.type 3 means image message
                case 3:
                    {
                        let heroCard = new botbuilder.HeroCard(session).images([botbuilder.CardImage.create(session, message.imageUrl)]);
                        let msg = new botbuilder.Message(session).attachments([heroCard]);
                        session.endConversation(msg);
                    }
                    break;
                default:
                    break;
            }
        }

    }

    static convertGoogleJsonFormat(results, session, CurrentLocation) {
        if (!results) return [];
        let output = [];

        let loaderQueue = [];
        let placeIDMap = new Map();

        for (let i = 0; i < results.length; i++) {
            if (i == 6) {
                break;
            }
            let result = results[i];
            console.log("convertGoogleJsonFormat :: Iteration :: nearby place :" + result.name);
            let placeIDUrl = CommonUtil.getPlaceDetailUrl(process.env.GOOGLE_MAP_API, result.place_id);
            console.log(placeIDUrl);
            loaderQueue.push(function (callback) {
                request.get(placeIDUrl)
                    .then(responsePlace => {
                        placeIDMap.set(result.place_id, responsePlace.data.result);
                        callback();
                    })
                    .catch(error => {
                        console.log(error);
                    });
            });
        }

        async.parallel(loaderQueue, function (err, resultAsync) {
            console.log(CurrentLocation);
            for (let i = 0; i < results.length; i++) {
                if (i == 6) { break; }
                let result = results[i]
                let placeDtl = placeIDMap.get(result.place_id);
                let photoIDUrl = result.photos && result.photos[0].photo_reference ?
                    CommonUtil.getPhotoReferenceUrl(process.env.GOOGLE_MAP_API, result.photos[0].photo_reference)
                    : process.env.NO_IMAGE_URL;

                let mapdirurl = CommonUtil.getGoogleMapDirectUrl(CurrentLocation.addr, placeDtl.formatted_address
                    , CurrentLocation.lat, CurrentLocation.lon);
                let buttons = [{
                    buttonValue: mapdirurl,
                    buttonText: "Direction"
                }];

                if (placeDtl.website != undefined) {
                    buttons.push({
                        buttonValue: placeDtl.website,
                        buttonText: "Website"
                    });
                }

                let text = placeDtl.formatted_address
                    + (placeDtl.international_phone_number ? "\n Mob: " + placeDtl.international_phone_number : "");

                let obj = {
                    title: result.name,
                    subtitle: "Rating: " + placeDtl.rating + (placeDtl.reviews ? " (" + placeDtl.reviews.length + ")" : ""),
                    text: text,
                    images: photoIDUrl,
                    button: buttons
                };

                output.push(obj);
            }
            console.log("convertGoogleJsonFormat :: Sending message to bot...")
            CommonUtil.sendCarouselCardsMultipleButton(session, output);

        });
    }

    static getPath(url) {
        return '/' + url;
    }

    static isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }

    static removeAll(dir) {
        fs.readdir(dir, (err, files) => {
            if (err) console.error("Unable to delete file:" + err);
            if (files) {
                for (const file of files) {
                    fs.unlink(path.join(dir, file), err => {
                        if (err) console.error("Unable to delete files:" + err);
                    });
                }
            }
        });
    }
}