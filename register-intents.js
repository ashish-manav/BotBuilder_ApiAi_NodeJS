const IntentService = require('./intent-service');
const intentMap = require("./intents-map");
const commonUtil = require("./common-util");

module.exports = class RegisterIntent {

    get intentService() {
        this._intentService;
    }

    constructor(intents, bot) {         
        intents.matches(intentMap.ENQUIRY_SIGHTSEEING, intentMap.ENQUIRY_SIGHTSEEING);
        intents.matches(intentMap.ENQUIRY_SIGHTSEEING_CONFIRM, intentMap.ENQUIRY_SIGHTSEEING_CONFIRM);
        
        intents.matches(intentMap.ENQUIRY_FOOD, intentMap.ENQUIRY_FOOD);
        intents.matches(intentMap.ENQUIRY_FOOD_SELECTEDTYPE, intentMap.ENQUIRY_FOOD_SELECTEDTYPE);
        intents.matches(intentMap.ENQUIRY_FOOD_SELECTEDFOOD, intentMap.ENQUIRY_FOOD_SELECTEDFOOD);
        
        intents.matches(intentMap.GENERAL_REPONSE, intentMap.GENERAL_REPONSE);
        intents.matches(intentMap.BOOK_CAB, intentMap.BOOK_CAB);
        intents.matches(intentMap.ENQUIRY_EVENT, intentMap.ENQUIRY_EVENT);
        intents.matches(intentMap.ENQUIRY_RESTAURANT, intentMap.ENQUIRY_RESTAURANT);


        bot.dialog('/', intents);

        this._intentService = new IntentService(bot);    
    }
}