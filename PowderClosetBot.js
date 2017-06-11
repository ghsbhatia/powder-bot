'use strict';

const ConversationV1 = require('watson-developer-cloud/conversation/v1');
const request = require('request'); 

class PowderClosetBot {

    /**
     * Creates a new instance of PowderClosetBot.
     * @param {object} userStore - Instance of CloudantUserStore used to store and retrieve users from Cloudant
     * @param {string} dialogStore - Instance of CloudantDialogStore used to store conversation history
     * @param {string} conversationUsername - The Watson Conversation username
     * @param {string} conversationPassword - The Watson Converation password
     * @param {string} conversationWorkspaceId - The Watson Conversation workspace ID
     * @param {string} foursquareClientSecret - The Foursquare Client Secret
     */
    constructor(userStore, dialogStore, conversationUsername, conversationPassword, conversationWorkspaceId) {
        this.userStore = userStore;
        this.dialogStore = dialogStore;
        this.conversationService = new ConversationV1({
            username: conversationUsername,
            password: conversationPassword,
            version_date: '2017-04-21'
        });
        this.conversationWorkspaceId = conversationWorkspaceId;
    }

     /**
     * Initializes the bot, including the required datastores.
     */
    init() {
        return Promise.all([
            this.userStore.init(),
            this.dialogStore.init()
        ]);
    }

    /**
     * Process the message entered by the user.
     * @param {string} message - The message entered by the user
     * @returns {Promise.<string|Error>} - The reply to be sent to the user if fulfilled, or an error if rejected
     */
    processMessage(messageSender, message) {
        let user = null;
        let conversationResponse = null;
        let reply = null;
        return this.getOrCreateUser(messageSender)
            .then((u) => {
                user = u;
                return this.sendRequestToWatsonConversation(message, user.conversationContext);
            })
            .then((response) => {
                conversationResponse = response;
                return this.handleResponseFromWatsonConversation(message, user, conversationResponse);
            })
            .then((replyText) => {
                reply = replyText;
                return this.updateUserWithWatsonConversationContext(user, conversationResponse.context);
            })
            .then((u) => {
                return Promise.resolve({conversationResponse: conversationResponse, text:reply});
            })
            .catch((error) => {
                console.log(`Error: ${JSON.stringify(error,null,2)}`);
                let reply = "Sorry, something went wrong!";
                return Promise.resolve({conversationResponse: conversationResponse, text:reply});
            });
    }

    /**
     * Sends the message entered by the user to Watson Conversation
     * along with the active Watson Conversation context that is used to keep track of the conversation.
     * @param {string} message - The message entered by the user
     * @param {object} conversationContext - The active Watson Conversation context
     * @returns {Promise.<object|error>} - The response from Watson Conversation if fulfilled, or an error if rejected
     */
    sendRequestToWatsonConversation(message, conversationContext) {
        return new Promise((resolve, reject) => {
            var conversationRequest = {
                input: {text: message},
                context: conversationContext,
                workspace_id: this.conversationWorkspaceId,
            };
            this.conversationService.message(conversationRequest, (error, response) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    
    /**
     * Takes the response from Watson Conversation, performs any additional steps
     * that may be required, and returns the reply that should be sent to the user.
     * @param {string} message - The message sent by the user
     * @param {object} user - The active user stored in Cloudant
     * @param {object} conversationResponse - The response from Watson Conversation
     * @returns {Promise.<string|error>} - The reply to send to the user if fulfilled, or an error if rejected
     */
    handleResponseFromWatsonConversation(message, user, conversationResponse) {
        // getOrCreateActiveConversationId will retrieve the active conversation
        // for the current user from our Cloudant log database.
        // A new conversation doc is created anytime a new conversation is started.
        // The conversationDocId is store in the Watson Conversation context,
        // so we can access it every time a new message is received from a user.
        return this.getOrCreateActiveConversationId(user, conversationResponse)
            .then(() => {
                const action = conversationResponse.context.action;
                conversationResponse.context.action = null;
                // Process the action
                if (action == "generateRecommendation") {
                    return this.handleGenerateRecommendation(conversationResponse);
                }
                else {
                    return this.handleDefaultMessage(conversationResponse);
                }
            })
            .then((reply) => {
                // Finally, we log every action performed as part of the active conversation
                // in our Cloudant dialog database and return the reply to be sent to the user.
                this.logDialog(
                    conversationResponse.context.conversationDocId,
                    conversationResponse.context.action,
                    message,
                    reply
                );
                return Promise.resolve(reply);
            });
    }

    /**
     * The default handler for any message from Watson Conversation that requires no additional steps.
     * Returns the reply that was configured in the Watson Conversation dialog.
     * @param {object} conversationResponse - The response from Watson Conversation
     * @returns {Promise.<string|error>} - The reply to send to the user if fulfilled, or an error if rejected
     */
    handleDefaultMessage(conversationResponse) {
        let reply = '';
        for (let i = 0; i < conversationResponse.output.text.length; i++) {
            reply += conversationResponse.output.text[i] + '\n';
        }
        return Promise.resolve(reply);
    }

    /**
     * Handler for generateRecommendation action defined in the Watson Conversation dialog.
     * @param {object} conversationResponse - The response from Watson Conversation
     * @returns {Promise.<string|error>} - The reply to send to the user if fulfilled, or an error if rejected
     */
    handleGenerateRecommendation(conversationResponse) {

        var activity = conversationResponse.context.activity;
        var location = conversationResponse.context.location;
        var date = conversationResponse.context.date;

        var day  = new Date(date).toISOString().slice(8, 10) - new Date().toISOString().slice(8, 10);

        return new Promise((resolve, reject) => {

            // invoke weather api then recommendation

            var zipcodeUrlTemplate = 'http://maps.googleapis.com/maps/api/geocode/json?address={city}+CO';
            var zipcodeUrl = zipcodeUrlTemplate.replace('{city}', location);

            request(zipcodeUrl, function (error, response, body) {

              var addressComponents = JSON.parse(body).results[0].address_components;
              var zipCode = addressComponents[addressComponents.length-1].short_name;

              var weatherUrlTemplate = 'https://api.weather.com/v1/location/{zipcode}:4:US/forecast/daily/10day.json?language=en-US&units=e&apiKey=f43934a981fc48f5926e5929d3ee0760';
              var weatherUrl = weatherUrlTemplate.replace('{zipcode}',zipCode);

              console.log(`weather url: ${weatherUrl}`);

              request(weatherUrl, function (error, response, body) {

                var wc = JSON.parse(body).forecasts[day].day.wc;
                var temperature = Math.round(parseInt(wc) - Math.random()*40);

                var iconCode = JSON.parse(body).forecasts[day].day.icon_code;

                var pop = Math.round(Math.random()*10)*10;

                console.log(`day: ${day} temperature: ${temperature} precipitation: ${pop} icon code: ${iconCode}`);

                var reply = '';

                if (error) {
                  console.log(error);
                  reply = 'Sorry, I couldn\'t find any recommendation.';
                }
                else {
                  reply = 'Here is what I found:\n' + 'temperature:'+temperature+'\n'+'chance of precipitation:'+pop;
                }

                resolve(reply);

              });

            });

        });

    }

    /**
     * Retrieves the user doc stored in the Cloudant database associated with the current user interacting with the bot.
     * First checks if the user is stored in Cloudant. If not, a new user is created in Cloudant.
     * @param {string} messageSender - The User ID from the messaging platform (Slack ID, or unique ID associated with the WebSocket client) 
     * @returns {Promise.<object|error>} - The user that was retrieved or created if fulfilled, or an error if rejected
     */
    getOrCreateUser(messageSender) {
        return this.userStore.addUser(messageSender);
    }

    /**
     * Updates the user doc in Cloudant with the latest Watson Conversation context.
     * @param {object} user - The user doc associated with the active user
     * @param {context} context - The Watson Conversation context
     * @returns {Promise.<object|error>} - The user that was updated if fulfilled, or an error if rejected
     */
    updateUserWithWatsonConversationContext(user, context) {
        return this.userStore.updateUser(user, context);
    }

    /**
     * Retrieves the ID of the active conversation doc in the Cloudant conversation log database for the current user.
     * If this is the start of a new converation then a new document is created in Cloudant,
     * and the ID of the document is associated with the Watson Conversation context.
     * @param {string} user - The user doc associated with the active user
     * @param {object} conversationResponse - The response from Watson Conversation
     * @returns {Promise.<string|error>} - The ID of the active conversation doc in Cloudant if fulfilled, or an error if rejected 
     */
    getOrCreateActiveConversationId(user, conversationResponse) {
        const newConversation = conversationResponse.context.newConversation;
        if (newConversation) {
            conversationResponse.context.newConversation = false;
            return this.dialogStore.addConversation(user._id)
                .then((conversationDoc) => {
                    conversationResponse.context.conversationDocId = conversationDoc._id;
                    return Promise.resolve(conversationDoc._id);
                });
        }
        else {
            return Promise.resolve(conversationResponse.context.conversationDocId);
        }
    }

    /**
     * Logs the dialog traversed in Watson Conversation by the current user to the Cloudant log database.
     * @param {string} conversationDocId - The ID of the active conversation doc in Cloudant 
     * @param {string} name - The name of the dialog (action)
     * @param {string} message - The message sent by the user
     * @param {string} reply - The reply sent to the user
     */
    logDialog(conversationDocId, name, message, reply) {
        if (! conversationDocId) {
            return;
        }
        let dialogDoc = {name:name, message:message, reply:reply, date:Date.now()};
        this.dialogStore.addDialog(conversationDocId, dialogDoc);
    }
}

module.exports = PowderClosetBot;
