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
    latitude: number;
    longitude: number;
    tolatitude: number;
    tolongitude: number;
    markercolor: string;
    linecolor: string;
    markerradius: number;
    linewidth: number;
    linetooltips: any;
    markerType: any;
    iconsvgfield: any;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private mapContainer: HTMLElement;
    private map: L.Map;
    private plots: Plot[];
    private markerLayer: L.LayerGroup<[L.CircleMarker,L.DivIcon]>;
    private polylineLayer: L.LayerGroup<L.Polyline>;

    constructor(options: VisualConstructorOptions) {
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
        this.drawMarkers();
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

    private drawMarkers() {
        if (this.markerLayer) this.map.removeLayer(this.markerLayer);
        //Need to Put the new big thing in the settings.ts
        const { zoomToFit, defaultMarkerColor, markerType } = this.settings.leafletMap;

        const markers = this.plots.map(function ({tooltips, latitude, longitude, markercolor, markerradius, iconsvgfield}) {
            const latlng = L.latLng([latitude, longitude]);
            //Decide What to Return
            switch (markerType) {
                default:
                    //Circle Marker
                    const defaultmarkerOptions: L.CircleMarkerOptions = { 
                        color: markercolor || (defaultMarkerColor || 'Black'),
                        radius: markerradius || 10,
                        fillOpacity: 0.5
                    };
                    let defaultmarker = L.circleMarker(latlng, defaultmarkerOptions);
                    defaultmarker.bindTooltip(tooltips || '[Drag a field onto Tooltips]');
                    return defaultmarker;
                case 'circleMarker':
                    const circlemarkerOptions: L.CircleMarkerOptions = { 
                        color: markercolor || (defaultMarkerColor || 'Black'),
                        radius: markerradius || 10,
                        fillOpacity: 0.5
                    };
                    let basiccirclemarker = L.circleMarker(latlng, circlemarkerOptions);
                    basiccirclemarker.bindTooltip(tooltips || '[Drag a field onto Tooltips]');
                    return basiccirclemarker;
                case 'customMarker1':
                    //This needs to be myIcon since the icon settings are built into the SVG
                    const iconsvgdata = IconFunctions.myIcon;
                    var iconSettings = {
                        mapIconUrl: ( iconsvgdata ),
                        mapIconColor: ( markercolor || '#cc756b'),
                        mapIconColorInnerCircle: '#fff',
                        pinInnerCircleRadius:48
                    };
                    // icon normal state
                    var divIcon = L.divIcon({
                        className: "leaflet-data-marker",
                        html: L.Util.template(iconSettings.mapIconUrl, iconSettings), //.replace('#','%23'),
                        iconAnchor  : [12, 32],
                        iconSize    : [25, 30],
                        popupAnchor : [0, -28]
                    });
                    let iconmarker = L.marker(latlng,{icon: divIcon });
                    iconmarker.bindTooltip(tooltips || '[Drag a field onto Tooltips]');
                    return iconmarker;         
                case 'markerFromField':                   
                    //Icons should not have any custom fields built in (I could add an SVG Settings field as well but skip that for now)

                    var svgiconSettings = {
                        mapIconUrl: (iconsvgfield)
                        };
                    var divSVGIcon = L.divIcon({
                        className: "leaflet-data-marker",
                        html: L.Util.template(svgiconSettings.mapIconUrl, svgiconSettings),
                        iconAnchor  : [12, 32],
                        iconSize    : [25, 30],
                        popupAnchor : [0, -28]
                    });       
                    let svgmarker = L.marker(latlng,{icon: divSVGIcon });
                    svgmarker.bindTooltip(tooltips || '[Drag a field onto Tooltips]');
                    return svgmarker;
            };
        });

        // place markers on map
        this.markerLayer = L.layerGroup(markers);
        this.map.addLayer(this.markerLayer);

        // zoom out so map shows all points
        if (zoomToFit) {
            var group = L.featureGroup(markers);
            this.map.fitBounds(group.getBounds());
        }
    }

    private drawLines() {
        if (this.polylineLayer) this.map.removeLayer(this.polylineLayer);
        const { defaultLineColor } = this.settings.leafletMap;
        //Test Adding PolyLine
    

        const lines = this.plots.map(function ({latitude, longitude, tolatitude, tolongitude,linecolor,linewidth,linetooltips}) {
            var platlng1 = L.latLng([latitude, longitude]);
            var platlng2 = L.latLng([tolatitude, tolongitude]);
            const linelist=[platlng1,platlng2];
            const lineOptions: L.PolylineOptions = { 
                color: linecolor || (defaultLineColor || 'Blue'),
                weight: linewidth || 2,
                fillOpacity: .5
            };

            let pmarker = L.polyline(linelist,lineOptions);
            pmarker.bindTooltip(linetooltips || '[Drag a field onto Line Tooltips]');
//            bindTooltip(<String|HTMLElement|Function|Tooltip> content, <Tooltip options> options?)
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