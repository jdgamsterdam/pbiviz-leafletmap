# Leaflet Map PowerBI Visual
THis is a fork of  https://github.com/chanm003/pbivizleafletmap by J67    (SOCAFRICA.HQ.J67.KM.mbx@socom.mil)
Will try to add all the features of the great project by weiweicui https://weiweicui.github.io/PowerBI-Routemap

Basically I wanted to use the 4.7 Version of the PBIVIZ API and this project seemed to update just fine. 
Also, While WeiweiCui's project is great, I have always found leaflet to be the best and most straight forward mapping solution. 

Features

Data bound custom visual that can be used with Datasets with LAT/LONG coordinates. 
Each Point Can also be Connected to another point To use as routes. 


## Create a tilelayers.json in project root directory
This file will not be checked into your source control.  This file should have the following format.
```
{	"_comment": "Make sure to have the correct Tile. The SIPR Works correctly in this implementation. ",
    "currentTargetEnvironment": "sipr",
    "targetEnvironments": {
        "dev": [
            "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        ],
        "nipr": ["https://www.openstreetmap.org/#map=8/47.714/13.349"],
        "sipr": ["http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"]
    }
}
```

In your Capabilities it has all the possible open paths to get the data from open maps,but make sure your network allows them. 

## DEV
Ensure tilelayers.json adheres to above format, then `pbiviz start`

## PACKAGE/DEPLOY
Inside tilelayers.json change `currentTargetEnvironment` to *nipr* or *sipr*, then `pbiviz package`