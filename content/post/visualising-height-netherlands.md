---
title: "Visualising the height of the Netherlands"
authors:
    - name: "Lucas van Dijk"
      affiliation: "Delft University of Technology"
    - name: "Dorus Leliveld"
      affiliation: "Delft University of Technology"
date: 2018-02-01
categories: ['Data Project']
tags: ['python', 'gis']
custom_css:
    - 'seahouse.css'
    - '//unpkg.com/leaflet@1.3.1/dist/leaflet.css'
custom_js:
    - '//unpkg.com/leaflet@1.3.1/dist/leaflet.js'
    - '//d3js.org/d3.v3.min.js'
    - 'seahouse.js'

header:
    image: "blogimages/oosterscheldekering.jpg"
    caption: "The Oosterscheldekering, the largest barrier of the 13 Delta 
    Works. Photo by Isaï Symens"
---

On this date 65 years ago, February 1st 1953, the Netherlands experienced its 
greatest flood till date, the [North Sea Flood of 1953][north-sea-flood]. This 
is still one of the biggest disasters the Netherlands has ever experienced, 
with thousands of casualties and lots of people who lost their homes.

The Netherlands earns its name from the fact that large parts of the country 
lie below sea level. To make sure our country doesn't flood, we have built lots 
of barriers, dams and dykes to keep the water out, and we want to prevent 
anything like the flood of 1953 from happening ever again. 

In the beginning of this year, several of these barriers and dams were put to 
the test when a heavy storm reached the Netherlands which resulted in very high 
water levels. Our five biggest dams and barriers needed to be closed at the 
same time, a first since their construction. We can ask ourselves the question 
whether this will happen more often now that sea levels are rising due to 
global warming [^sealevel]. A higher base line sea level increases the chance 
for even higher water levels when it storms. To get an idea what areas would be 
affected the most by a possible flood, we have created a visualisation project 
that shows the height of the Netherlands in comparison to the sea level. 

[north-sea-flood]: https://en.wikipedia.org/wiki/North_Sea_flood_of_1953
[^sealevel]: https://climate.nasa.gov/vital-signs/sea-level/

<!--more-->

{{< img src="/img/blogimages/maeslantkering.jpg" alt="Maeslantkering" >}}
  The Maeslantkering in closed state.
  Photo: <a href="https://beeldbank.rws.nl" target="_blank">Rijkswaterstaat</a>
{{< /img >}}

Things to check out
-------------------

* The Y-axis shows deviation from "[Amsterdam Ordnance Datum][nap]"
* You can zoom on both the map and the elevation profile (by selecting a region 
  in the bottom profile).
* If you hover your mouse over the elevation profile, a red dot will show you 
  the location on the map
* The highest point in our country is the [Vaalserberg][vaalserberg], with a 
  whopping 322 m! It's in the most southern part of the Netherlands. Some 
  people, however, may claim it's not really part of the Netherlands because of 
  their ugly accents ;)
* If you zoom in on our shorelines, you can see our dykes

[vaalserberg]: https://nl.wikipedia.org/wiki/Vaalserberg
[nap]: https://en.wikipedia.org/wiki/Amsterdam_Ordnance_Datum

<h2 id="title">Elevation profiles of the Netherlands</h2>

<div id="chart"></div>

<div id="map"></div>


Technical details
-----------------

### Quick links

* Data source: http://ahn.nl
    * We use AHN version 2 and the dataset with a resolution of 5 meter
* Written in Python and CoffeeScript, and available on Github: 
  https://github.com/lrvdijk/nl-height

### Algorithm overview

1. The publicly available height data is split across multiple "raster data" 
   files. The AHN website provides a "ahn_units.shp" shapefile, that shows 
   which part of the Netherlands is covered by which *raster data* file, and 
   thus shows which file to download.
2. We import this ahn_units shapefile in a PostgreSQL database with the PostGIS 
   extension enabled. A script downloads and extracts all available raster data 
   files.
3. When all data is downloaded, we import the raster data in our PostgreSQL 
   database.
4. To generate an elevation profile, we draw a line horizontally across the 
   Netherlands and query which cells in our raster data hit our line. Each cell 
   contains the height at its midpoint. Our query is based on this blogpost: 
   http://blog.mathieu-leplatre.info/drape-lines-on-a-dem-with-postgis.html
5. When there's water, no data exists in our database. We apply some 
   post-processing such that our visualisation does not get weird artefacts.
6. We store the data in a JSON file, and use the d3.js library for the 
   visualisation.
