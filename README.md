# powder-bot

## PowderBot is a ChatBot powered by IBM Watson Conversation Service. 

User is asked for a ski resort in Colorado, day of visit and activity to suggest appropriate gear based on weather conditions.

### Instructions

Create a environment file (.env) in node folder with following properties:  

#WATSON CONVERSATION
CONVERSATION_USERNAME  
CONVERSATION_PASSWORD  
CONVERSATION_WORKSPACE_ID  
#CLOUDANT DB
CLOUDANT_URL  
CLOUDANT_DIALOG_DB_NAME  
CLOUDANT_USER_DB_NAME  
#RECOMMENDATION SERVICE  
RECOMMENDATION_URL=http://127.0.0.1:5000  

#### Start Recommendation Service

cd python  
export FLASK_APP=powdercloset.py  
flask run  

#### Start ChatBot

cd node  
npm install  
npm start  
