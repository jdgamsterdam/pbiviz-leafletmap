"use strict";
import "core-js";
import "leaflet/dist/leaflet.css";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import * as L from 'leaflet';
import * as tileLayers from "../tilelayers.json";
import { VisualSettings } from "./settings";
//For wildCard
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import * as IconFunctions from "./graphics/icons";

interface Plot {
    tooltips: string;
    markerlabel: string;
    latitude: number;
    longitude: number;
    tolatitude: number;
    tolongitude: number;
    markercolor: string;
    endmarkercolor: string;   
    linecolor: string;
    markerradius: number;
    linewidth: number;
    linetooltips: string;
    markerType: any;
    endmarkerType: any;
    iconsvgfield: any;
    endiconsvgfield: any;
    iconOptionsFromField: string;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private mapContainer: HTMLElement;
    private map: L.Map;
    private plots: Plot[];
    private markerLayer: L.LayerGroup<[L.CircleMarker,L.DivIcon]>;
    private polylineLayer: L.LayerGroup<L.Polyline>;
    private labelLayer: L.LayerGroup<L.DivIcon>;
    private endmarkerLayer: L.LayerGroup<[L.CircleMarker,L.DivIcon]>;
    private element: HTMLElement;
    private isLandingPageOn: Boolean;
    private LandingPageRemoved: Boolean;
    private LandingPage: d3.Selection<any,any,any,any>;

    constructor(options: VisualConstructorOptions) {
        this.element = options.element;
        if (!document) { return; }
        this.target = options.element;
        //this.target.innerHTML = 'TEST' + JSON.stringify(window.location);
        this.createMapContainer();
        this.configureLeaflet();
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.resizeMap(options);
        this.plots = <Plot[]>this.parseData(options);
        //Do End Before Start Since if there are no end points the Start Will Cover the End Points with a Blank
        this.drawMarkers("end");
        this.drawMarkers("start");
        this.drawLabels();
        this.drawLines();
    }

    public destroy() {
        this.map.remove();
    }


    private configureLeaflet() {
        // create L.Map off of the <div>
        this.map = new L.Map("mapid");
        this.map.setView(new L.LatLng(48.78, 9.18), 13);
        const layers = this.getTileLayers();
        layers.forEach(url => this.map.addLayer(L.tileLayer(url)));
        this.map.attributionControl.setPrefix(false);
    }

    private createMapContainer() {
        // add <div> to the DOM
        const div = document.createElement('div');
        div.id = 'mapid';
        div.style.width = `${this.target.clientWidth}px`;
        div.style.height = `${this.target.clientHeight}px`;
        this.mapContainer = div;
        this.target.append(div);
    }

    private drawMarkers(MarkerPosition: string) {
        if (MarkerPosition == "start") {
            if (this.markerLayer) this.map.removeLayer(this.markerLayer);
        }
        else {
            if (this.endmarkerLayer) this.map.removeLayer(this.endmarkerLayer);
        }
        //Need to Put the new big thing in the settings.ts
        const { zoomToFit, defaultMarkerColor, markerType, endmarkerType, defaultMarkerSize, defaultMarkerOpacity } = this.settings.leafletMap;
        const markers = this.plots.map(function ({tooltips, latitude, longitude, tolatitude, tolongitude, markercolor, endmarkercolor, markerradius, iconsvgfield, endiconsvgfield, iconOptionsFromField}) {
            var MarkerForSwitch=markerType;
            //Set Initial LatLng
            var latlng = L.latLng([0, 0])
            if (MarkerPosition != "start") {
                //These are the end points now (if not "start") but could be used to do ICONS in the middle of lines for example
                latitude=tolatitude;
                longitude=tolongitude;
                MarkerForSwitch=endmarkerType;
            }
            if (!latitude || !longitude){
                //One of the items is missing so return a dummy point
                let dummymarkerOptions: L.CircleMarkerOptions = { 
                    color: "Blue",
                    radius: 0,
                    fillOpacity: 0
                };
                latlng = L.latLng([0,0]);
                let dummymarker=L.circleMarker(latlng,dummymarkerOptions);
                return dummymarker
            }
            else{
                latlng = L.latLng([latitude, longitude]);
            }
            //Decide What to Return if not null
            switch (MarkerForSwitch) {
                default:    
                case 'circleMarker':
                    let circlemarkerOptions: L.CircleMarkerOptions = { 
                        color: markercolor || defaultMarkerColor,
                        radius: markerradius || defaultMarkerSize,
                        fillOpacity:  defaultMarkerOpacity / 100
                    };
                    if (MarkerPosition != "start") {
                        circlemarkerOptions["color"]=endmarkercolor || defaultMarkerColor;
                    }

                    var basiccirclemarker = L.circleMarker(latlng, circlemarkerOptions);
                    var mytooltip = (tooltips || 'No Tool Tip');
                    basiccirclemarker.bindTooltip(String(mytooltip));
                    return basiccirclemarker;
                case 'customMarker1':
                    //This needs to be myIcon since the icon settings are built into the SVG
                    const iconsvgdata = IconFunctions.myIcon;
                    var baseiconSettings = { mapIconUrl: ( iconsvgdata ) };
                    let defaulticonOptions='{"mapIconColor": "#cc756b", "mapIconColorInnerCircle":"'+ (markercolor || defaultMarkerColor)+'", "pinInnerCircleRadius":48}';

                    // Get icon Field Options from default if no field is supplied
                    var iconCustomFieldOptions = iconOptionsFromField || defaulticonOptions;
                    var iconCustomFieldOptionsJSON=JSON.parse(iconCustomFieldOptions);  
                    var iconSettings=Object.assign(baseiconSettings,iconCustomFieldOptionsJSON);

                    // icon normal state
                    var divIcon = L.divIcon({
                        className: "leaflet-data-marker",
                        html: L.Util.template(iconSettings.mapIconUrl, iconSettings), //.replace('#','%23'),
                        iconAnchor  : [1, 1],
                        iconSize    : [markerradius || defaultMarkerSize, markerradius || defaultMarkerSize],
                        popupAnchor : [0, -28]
                    });
                    var iconmarker = L.marker(latlng,{icon: divIcon });
                    var mytooltip = (tooltips || 'No Tool Tip');
                    iconmarker.bindTooltip(String(mytooltip));
                    return iconmarker;         
                case 'markerFromField':                   
                    if (MarkerPosition == "start") {
                        var basesvgiconSettings = { mapIconUrl: (iconsvgfield) };
                    }
                    else {
                        var basesvgiconSettings = { mapIconUrl: (endiconsvgfield) };
                    }

                    var defaulticonFieldOptions='{}';    

                    // Get icon Field Options from default if no field is supplied
                    var iconFieldOptions = iconOptionsFromField || defaulticonFieldOptions; 
                    var jsoniconOptions=JSON.parse(iconFieldOptions);
                    var svgiconSettings=Object.assign(basesvgiconSettings,jsoniconOptions);    
                    var divSVGIcon = L.divIcon({
                        className: "leaflet-data-marker",
                        html: L.Util.template(svgiconSettings.mapIconUrl, svgiconSettings),
                        iconAnchor  : [1, 1],
                        iconSize    : [markerradius || defaultMarkerSize, markerradius || defaultMarkerSize],
                        popupAnchor : [0, -28]
                    });       
                    var svgmarker = L.marker(latlng,{icon: divSVGIcon });
                    var mytooltip = (tooltips || 'No Tool Tip');
                    svgmarker.bindTooltip(String(mytooltip));
                    return svgmarker;
            };
        });

        // place markers on map

        if (MarkerPosition == "start") {
            this.markerLayer = L.layerGroup(markers);
            this.map.addLayer(this.markerLayer);
        }
        else {
            this.endmarkerLayer = L.layerGroup(markers);
            this.map.addLayer(this.endmarkerLayer);
        }

        // zoom out so map shows all points
        if (zoomToFit) {
            var group = L.featureGroup(markers);
            this.map.fitBounds(group.getBounds());
        }
    }

    private drawLabels() {
        if (this.labelLayer) this.map.removeLayer(this.labelLayer);
        const { defaultMarkerSize } = this.settings.leafletMap;
        //Add Labels for all marker Types
        const labelmarkers = this.plots.map(function ({latitude, longitude, markerlabel, markerradius}) {
            //Note for Simple Text SVG the y must be the same as the point size (or bigger) or the text will not show. 
            const defaultlabelsvg='<svg xmlns="http://www.w3.org/2000/svg"><text x="5" y="15" style="font-size: 15px">'+(markerlabel || ' ')+'</text></svg>';
            var labelsvg=defaultlabelsvg;         
            const labellatlng = L.latLng([latitude, longitude]);
            var baselabelSettings = { mapIconUrl: ( labelsvg ) };
            var labeliconSettings=Object.assign(baselabelSettings);
            var labelIcon = L.divIcon({
                  className: "text-below-marker",
                html: L.Util.template(labeliconSettings.mapIconUrl, labeliconSettings),
                iconAnchor  : [0, 0],
                iconSize    : [markerradius || defaultMarkerSize, markerradius || defaultMarkerSize],
                popupAnchor : [0, 0]
            });
            let labelmarkers = L.marker(labellatlng, {icon: labelIcon });
            return labelmarkers
        });

        // place markers on map
        this.labelLayer = L.layerGroup(labelmarkers);
        this.map.addLayer(this.labelLayer);
    }   

    private drawLines() {
        if (this.polylineLayer) this.map.removeLayer(this.polylineLayer);
        const { defaultLineColor } = this.settings.leafletMap;
        //Test Adding PolyLine
 
        const lines = this.plots.map(function ({latitude, longitude, tolatitude, tolongitude,linecolor,linewidth,linetooltips}) {

            if (!latitude || !longitude || !tolatitude || !tolongitude){
                //One of the items is missing so no lines to draw
                return L.polyline([L.latLng([0, 0]),L.latLng([0, 0])]);
            }

            var platlng1 = L.latLng([latitude, longitude]);
            var platlng2 = L.latLng([tolatitude, tolongitude]);
            const linelist=[platlng1,platlng2];
            const lineOptions: L.PolylineOptions = { 
                color: linecolor || defaultLineColor,
                weight: linewidth || 2,
                fillOpacity: .5
            };

            let pmarker = L.polyline(linelist,lineOptions);
            var mylinetooltip = (linetooltips || 'No Line Tool Tip');
            pmarker.bindTooltip(String(mylinetooltip));
            return pmarker;
        });

        // place markers on map
        this.polylineLayer = L.layerGroup(lines);
        this.map.addLayer(this.polylineLayer);
    }


    private getTileLayers(): string[] {
        let layers = tileLayers && 
            tileLayers.currentTargetEnvironment && 
            tileLayers.targetEnvironments[tileLayers.currentTargetEnvironment];
        return layers || [];
    }

    private parseData(options: VisualUpdateOptions) {
        /*
            Data passed into the visual is based on dataRoles and dataviewMappings
            https://github.com/woodbuffalo/powerbi-leaflet/blob/master/capabilities.json
            Parsing logic is found in the converter() method:
            https://github.com/woodbuffalo/powerbi-leaflet/blob/master/src/visual.ts
        */
        const { columns, rows } = options.dataViews[0].table;
        const data = rows.map(function (row, idx) {
            const item = row.reduce(function (d, v, i) {
                const role = Object.keys(columns[i].roles)[0]
                d[role] = v;
                return d;
            }, {});
            return item;
        });
        return data;
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    private resizeMap(options: VisualUpdateOptions) {
        const { width, height } = options.viewport;
        this.mapContainer.style.width = width + 'px';
        this.mapContainer.style.height = height + 'px';
        this.map.invalidateSize(true);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];


        //Start Try to add Conditional
        if (!this.settings ||
            !this.settings.leafletMap) {
            return objectEnumeration;
        }

        switch (objectName) {
            case 'leafletMap':
                objectEnumeration.push({
                    objectName: objectName,
                    //Need to put all the fields you want to show in Propertes and the adjusted ones also in Instance Kind
                    properties: {
                        defaultMarkerColor: this.settings.leafletMap.defaultMarkerColor,
                        defaultLineColor: this.settings.leafletMap.defaultLineColor,
                        markerType: this.settings.leafletMap.markerType,
                        endmarkerType: this.settings.leafletMap.markerType,
                        zoomToFit: this.settings.leafletMap.zoomToFit
                    },
                    propertyInstanceKind: {
                        defaultLineColor: VisualEnumerationInstanceKinds.ConstantOrRule
                    },
                    altConstantValueSelector: null,
                    selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals)
                });
                break;
        };
        //return objectEnumeration;
        //End add conditional
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}