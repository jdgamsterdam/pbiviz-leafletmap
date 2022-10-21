"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
  public leafletMap: LeafletMapSettings = new LeafletMapSettings();
}
export class LeafletMapSettings {
  public defaultMarkerColor: string = "";
  public defaultLineColor: string = "";
  public markerType: string = "";
  public zoomToFit: boolean = true;
  
  
  
}