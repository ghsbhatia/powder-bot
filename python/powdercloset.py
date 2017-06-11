#Let's go to the mountains! But first let's check the weather!

from flask import Flask, request

app = Flask(__name__)


@app.route('/')

def hello_world():

    avg_temp = int(request.args.get('temp'))

    chance_precip = int(request.args.get('precip'))

    precent_sun = int(request.args.get('sun'))

    wind_chill = int(request.args.get('windchill'))

    print(get_rec(avg_temp, chance_precip, precent_sun, wind_chill))

    return get_rec(avg_temp, chance_precip, precent_sun, wind_chill)



def rec_goggles(precent_sun):

    if precent_sun > 70:

        return 'dark lens'

    elif precent_sun < 70:

        return 'light lens'



def rec_jacket(avg_temp):

    if avg_temp >= 30:

        return 'light insuated'

    elif avg_temp in range(15, 29):

        return 'medium insulated'

    elif avg_temp <= 15:

        return 'heavy insulated'



def rec_water_proof(chance_precip):

    if chance_precip >= 30:

        return 'water proof'

    else:

        return 'wind proof'



def rec_pants(avg_temp):

    if avg_temp >= 15:

        return 'normal ski pants'

    elif avg_temp < 15:

        return 'insulated ski pants'



def rec_gloves(avg_temp):

    if avg_temp >= 15:

        return 'normal gloves'

    elif avg_temp < 15:

        return 'warmer gloves'



rec_socks = 'Use wool socks, not cotton!'



rec_accessories = "Don't forget your sunscreen, warmers, lip balm, water and snacks!"



def get_rec(avg_temp, chance_precip, precent_sun, wind_chill):

    recs = dict()

    recs['goggles'] = rec_goggles(precent_sun)

    recs['jacket'] = rec_jacket(avg_temp)

    recs['shell'] = rec_water_proof(chance_precip)

    recs['pants'] = rec_pants(avg_temp)

    recs['gloves'] = rec_gloves(avg_temp)

    recs['socks'] = rec_socks

    recs['acessories'] = rec_accessories



    response = "Wear {} goggles.".format(recs['goggles'])

    response2 = "Choose a {} jacket.".format(recs['jacket'])

    response3 = "Pick a {} shell.".format(recs['shell'])

    response4 = "Choose {}.".format(recs['pants'])

    response5 = "Wear {}.".format(recs['gloves'])

    return response + "\n" + response2 + "\n" + response3 + "\n" + response4 + "\n" + response5 + "\n" + rec_socks + "\n" + rec_accessories



#Used this stuff below for testing different values in terminal.

#print(get_rec(-28, 30, 65, -32))
