let
    SVGURL = "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/caution.svg",
    filesplitList = Text.Split(SVGURL, "/"),
    iconname = List.Last(filesplitList),
    WebSource = Web.Contents(SVGURL),
    Source = Table.FromColumns({Lines.FromBinary(WebSource, null, false, 1252)}),
    #"Transposed Table" = Table.Transpose(Source),
    AllColumns = Table.ColumnNames(#"Transposed Table"),
    #"Merged Columns" = Table.CombineColumns(#"Transposed Table",AllColumns,Combiner.CombineTextByDelimiter("", QuoteStyle.None),"IconSVGDefinition"),
    #"Added Custom" = Table.AddColumn(#"Merged Columns", "SVGICONNAME", each iconname )
in
    #"Added Custom"