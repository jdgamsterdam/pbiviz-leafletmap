# Leaflet Map PowerBI Visual
THis is a fork of  https://github.com/chanm003/pbivizleafletmap by J67    (SOCAFRICA.HQ.J67.KM.mbx@socom.mil)
Will try to add all the features of the great project by weiweicui https://weiweicui.github.io/PowerBI-Routemap

Basically I wanted to use the 4.7 Version of the PBIVIZ API and this project seemed to update just fine. 
Also, While WeiweiCui's project is great, I have always found leaflet to be the best and most straight forward mapping solution. 

Features

Data bound custom visual that can be used with Datasets with LAT/LONG coordinates. 
Each Point Can also be Connected to another point To use as routes. 

## USAGE
This is pretty straight forward. The only thing that needs a bit of care is using your custom icons.  I have included a PowerBi M query   (getremoteicon.m) to get an icon from an (open) remote source.

The nice thing about my solution is you can have a different icon for each DataPoint.  I will eventually add the ability to have a picture as well at PopUps or Data Points.

You can also have some points that have some points that have routes that don't in the same table.  E.g. you could have a point with a flag for each country capital and then have different icons for the start and stop of routes. 

The main things to keep in mind if manually copying the SVG data into your source data are: 
    1. make sure there are no line feeds (This may or may not work but seems to cause some issues.)
    2. Make sure the internal SVG are single quotes. Take a look at the definition for myIcon2 in the src/graphics/icons.ts file. If the SVG has adjustable parameters you will need a column with a JSON defining those parameters.

The example PBIX has a data transformation for copying the top row to the whole column. The Basic idea is:
    // Copy Down The Column
    #"Replaced Value" = Table.ReplaceValue(#"Changed Type",null,Table.First(#"Changed Type")[MyIcon],Replacer.ReplaceValue,{"MyIcon"}),


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