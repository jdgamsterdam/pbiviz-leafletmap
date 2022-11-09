"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
  public leafletMap: LeafletMapSettings = new LeafletMapSettings();
}
export class LeafletMapSettings {
  public defaultMarkerColor: string = "#a8328c";
  public defaultLineColor: string = "#32a848";
  public markerType: string = "circleMarker";
  public endmarkerType: string = "circleMarker";
  public defaultMarkerSize: number = 10;
  public defaultMarkerOpacity: number = 50;
  public zoomToFit: boolean = true;
}