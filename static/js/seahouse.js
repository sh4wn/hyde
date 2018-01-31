var Visualisation, pairgen;

Visualisation = (function() {
  function Visualisation(line_plot_elem_id, map_elem_id, title_id) {
    this.line_plot_elem_id = line_plot_elem_id;
    this.map_elem_id = map_elem_id;
    this.title_id = title_id;
    this.line_plotter = new LinePlotter("#" + this.line_plot_elem_id);
    this.sealevel_map = new SealevelMap(this.map_elem_id);
    this.mouse_icon = L.divIcon({
      iconSize: [5, 5],
      className: 'mouse-loc-icon'
    });
    this.mouse_marker = L.marker([0, 0], {
      icon: this.mouse_icon,
      clickable: false,
      zIndex: 1000
    }).addTo(this.sealevel_map.map);
    this.latitude = 0;
    this.line_plotter.mouseoverlay.on("mousemove", (function(_this) {
      return function() {
        var degrees, mouse_pos, x;
        mouse_pos = d3.mouse(d3.event.target);
        x = _this.line_plotter.xScaleFocus.invert(mouse_pos[0]);
        degrees = _this.line_plotter.convertToDegrees(x);
        _this.mouse_marker.setLatLng([_this.latitude, degrees[0]]);
        return _this.mouse_marker.update();
      };
    })(this));
  }

  Visualisation.prototype.loadMarkers = function() {
    return Location.loadLocations((function(_this) {
      return function(loc) {
        return _this.sealevel_map.addLocation(loc, function(e, src, test) {
          return _this.loadLocation($(e.target).data('slug'));
        });
      };
    })(this));
  };

  Visualisation.prototype.loadLocation = function(slug) {
    return $.when($.ajax({
      url: "/data/" + slug + "/dataset.json"
    }), $.ajax({
      url: "/data/" + slug + "/metadata.json"
    })).then((function(_this) {
      return function(data, metadata) {
        _this.line_plotter.plot(data[0], metadata[0]);
        _this.sealevel_map.setCutLayer(metadata[0]);
        _this.latitude = metadata[0].geometry.coordinates[0][1];
        return $('#' + _this.title_id).text("Elevation profile through " + metadata[0].properties.name);
      };
    })(this));
  };

  return Visualisation;

})();

$(document).ready(function() {
  var vis;
  vis = new Visualisation('chart', 'map', 'title');
  vis.loadMarkers();
  return vis.loadLocation('amsterdam');
});

pairgen = function(begin, end, baseL, projL) {
  var a;
  a = [
    {
      x: begin,
      base: baseL,
      proj: projL
    }
  ];
  a.push({
    x: end,
    base: baseL,
    proj: projL
  });
  return a;
};

var Location;

Location = (function() {
  function Location(name, slug1, coordinates) {
    this.name = name;
    this.slug = slug1;
    this.coordinates = coordinates;
  }

  Location.loadLocations = function(handler) {
    var locations;
    locations = [];
    return $.ajax('/data/locations.json').done(function(data, status, xhr) {
      var loc, obj, results, slug;
      results = [];
      for (slug in data) {
        loc = data[slug];
        obj = new Location(loc.properties.name, loc.properties.slug, [loc.properties.location[1], loc.properties.location[0]]);
        results.push(handler(obj));
      }
      return results;
    });
  };

  return Location;

})();

var SealevelMap;

SealevelMap = (function() {
  function SealevelMap(element) {
    this.map = L.map(element);
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    L.tileLayer.wms('//geodata.nationaalgeoregister.nl/ahn2/wms', {
      layers: 'ahn2_5m',
      format: 'image/png',
      transparent: true,
      opacity: 0.5,
      attribution: 'AHN2: CC-BY Kadaster'
    }).addTo(this.map);
    this.map.setView([52.1561110, 5.3878270], 7);
    this.cut_layer = void 0;
  }

  SealevelMap.prototype.addLocation = function(loc, on_click_handler) {
    var load_btn, marker, p;
    marker = L.marker(loc.coordinates, {
      zIndexOffset: 500
    }).addTo(this.map);
    load_btn = $(document.createElement('button'));
    load_btn.addClass('btn btn-xs btn-success');
    load_btn.append(document.createTextNode('Load location'));
    load_btn.data({
      name: loc.name,
      slug: loc.slug,
      coordinates: loc.coordinates
    });
    $(load_btn).on('click', on_click_handler);
    p = $(document.createElement('p'));
    p.append($(document.createTextNode(loc.name + " - ")));
    p.append(load_btn);
    marker.bindPopup(p.get(0));
  };

  SealevelMap.prototype.setCutLayer = function(geoJson) {
    if (this.cut_layer != null) {
      this.map.removeLayer(this.cut_layer);
    }
    this.cut_layer = L.geoJson(geoJson);
    return this.cut_layer.addTo(this.map);
  };

  return SealevelMap;

})();

var LinePlotter, range,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

LinePlotter = (function() {
  function LinePlotter(selector) {
    this.selector = selector;
    this.brushed = bind(this.brushed, this);
    this.img = $(this.selector);
    this.svg = d3.select(this.selector).append("svg");
    this.svg.append("defs").append("clipPath").attr("id", "clip").append("rect");
    this.projection = d3.geo.mercator();
    this.padding = {
      top: 0,
      left: 60,
      bottom: 30,
      right: 10
    };
    this.padding2 = {
      top: 250,
      left: this.padding.left,
      bottom: this.padding.bottom,
      right: this.padding.right
    };
    this.focus = this.svg.append("g").attr("id", "focus").attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");
    this.focus.append("g").attr("class", "y axis");
    this.focus.append("g").attr("class", "x axis");
    this.focus.append("text").attr("class", "axis").attr("x", -this.padding.left).attr("y", (this.padding2.top - this.padding.bottom) / 2).attr("text-anchor", "right").text("NAP");
    this.waterFocus = this.focus.append("g").attr("class", "water");
    this.focus.append("g").attr("class", "land").append("path").attr("id", "focus-land-path").attr("clip-path", "url(#clip)");
    this.context = this.svg.append("g").attr("id", "context").attr("transform", "translate(" + this.padding2.left + ", " + this.padding2.top + ")");
    this.context.append("g").attr("class", "x axis");
    this.waterContext = this.context.append("g").attr("class", "water");
    this.context.append("g").attr("class", "land").append("path").attr("id", "context-land-path").attr("clip-path", "url(#clip)");
    this.context.append("g").attr("id", "locations");
    this.mouseoverlay = this.svg.append("rect").attr("id", "mouseoverlay");
    this.data = void 0;
    this.metadata = void 0;
    this.year = 0;
    this.setSizes();
    d3.select(window).on("resize", this.setSizes.bind(this));
  }

  LinePlotter.prototype.setSizes = function() {
    this.width = this.img.width();
    this.height = this.img.height();
    this.svg.attr("width", this.width);
    this.svg.attr("height", this.height);
    this.heightFocusBox = this.padding2.top - this.padding.bottom;
    this.heightContextBox = this.height - this.padding2.top - this.padding2.bottom;
    this.widthFocusBox = this.width - this.padding.left - this.padding.right;
    this.widthContextBox = this.width - this.padding2.left - this.padding2.right;
    this.svg.select('#clip rect').attr("width", this.widthFocusBox).attr("height", this.heightFocusBox);
    this.mouseoverlay.attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")").attr("width", this.widthFocusBox).attr("height", this.heightFocusBox);
    this.focus.select('.axis.x').attr("transform", "translate(0 ," + this.heightFocusBox + ")");
    this.context.select('.axis.x').attr("transform", "translate(0 ," + this.heightContextBox + ")");
    if ((this.data != null) && (this.metadata != null)) {
      return this.draw();
    }
  };

  LinePlotter.prototype.adjustScales = function(maxX, maxY, minX, minY) {
    this.xScaleFocus = d3.scale.linear().domain([minX, maxX]).range([0, this.widthFocusBox]);
    this.xScaleContext = d3.scale.linear().domain([minX, maxX]).range([0, this.widthContextBox]);
    this.yScaleFocus = d3.scale.linear().domain([minY, maxY]).range([this.heightFocusBox, 0]);
    this.yScaleContext = d3.scale.linear().domain([minY, maxY]).range([this.heightContextBox, 0]);
    this.brush = d3.svg.brush();
    this.brush.x(this.xScaleContext).on("brush", this.brushed);
    this.context.select('.brush.x').remove();
    return this.context.append("g").attr("class", "x brush").call(this.brush).selectAll("rect").attr("y", -6).attr("height", this.height - this.padding2.top - this.padding2.bottom + 7);
  };

  LinePlotter.prototype.brushed = function() {
    if (this.brush.empty()) {
      this.xScaleFocus.domain(this.xScaleContext.domain());
    } else {
      this.xScaleFocus.domain(this.brush.extent());
    }
    this.focus.select(".land path").attr("d", this.areaFocus);
    return this.xAxisSVG.call(this.xAxisFocus);
  };

  LinePlotter.prototype.convertToDegrees = function(d) {
    return this.projection.invert([d, this.data.data[0].lat]);
  };

  LinePlotter.prototype.plot = function(data1, metadata) {
    this.data = data1;
    this.metadata = metadata;
    return this.draw();
  };

  LinePlotter.prototype.draw = function() {
    var areaContext, cityX, data, xAxisContext, xMax, xMin, yAxis, yMax, yMin;
    data = this.data.data;
    xMin = this.projection(this.metadata.geometry.coordinates[0])[0];
    xMax = d3.max(data, (function(_this) {
      return function(d) {
        return _this.projection([d.long, d.lat])[0];
      };
    })(this));
    yMax = d3.max(data, (function(_this) {
      return function(d) {
        return d.height;
      };
    })(this));
    yMin = -13;
    this.adjustScales(xMax, yMax, xMin, yMin);
    cityX = (this.projection(this.metadata.properties.location)[0]);
    this.areaFocus = d3.svg.area().x((function(_this) {
      return function(d) {
        return _this.xScaleFocus(_this.projection([d.long, d.lat])[0]);
      };
    })(this)).y0(this.heightFocusBox).y1((function(_this) {
      return function(d) {
        return _this.yScaleFocus(d.height);
      };
    })(this));
    areaContext = d3.svg.area().x((function(_this) {
      return function(d) {
        return _this.xScaleContext(_this.projection([d.long, d.lat])[0]);
      };
    })(this)).y0(this.heightContextBox).y1((function(_this) {
      return function(d) {
        return _this.yScaleContext(d.height);
      };
    })(this));
    yAxis = d3.svg.axis().scale(this.yScaleFocus).orient("left").ticks(5);
    this.xAxisFocus = d3.svg.axis().scale(this.xScaleFocus).orient("bottom").tickFormat((function(_this) {
      return function(d) {
        return d3.round(_this.convertToDegrees(d)[0], 2) + "°";
      };
    })(this)).ticks(5);
    xAxisContext = d3.svg.axis().scale(this.xScaleContext).orient("bottom").ticks(1).tickValues([xMin, cityX, xMax]).tickFormat((function(_this) {
      return function(d) {
        return d3.round(_this.convertToDegrees(d)[0], 2) + "°";
      };
    })(this));
    this.focus.select(".axis.y").call(yAxis);
    this.xAxisSVG = this.focus.select(".axis.x").call(this.xAxisFocus);
    this.context.select('.axis.x').call(xAxisContext);
    this.plotSealevel(xMin, xMax);
    d3.select('#focus-land-path').datum(data).attr("d", this.areaFocus);
    d3.select('#context-land-path').datum(data).attr("d", areaContext);
    this.context.select("#locations").remove();
    return this.context.append("g").attr('id', 'locations').attr("transform", "translate(" + this.xScaleFocus(cityX) + ", " + (this.heightContextBox + this.padding2.bottom) + ")").append('text').attr("text-anchor", "middle").text(this.metadata.properties.name);
  };

  LinePlotter.prototype.plotSealevel = function(xMinSeaLevel, xMaxSeaLevel) {
    this.xMinSeaLevel = xMinSeaLevel;
    this.xMaxSeaLevel = xMaxSeaLevel;
    return this.drawSeaLevel();
  };

  LinePlotter.prototype.drawSeaLevel = function() {
    var areaNowContext, areaNowFocus, baseSeaLevel, data;
    baseSeaLevel = 0;
    data = [
      {
        x: this.xMinSeaLevel,
        y: baseSeaLevel
      }, {
        x: this.xMaxSeaLevel,
        y: baseSeaLevel
      }
    ];
    this.waterFocus.selectAll("path").remove();
    this.waterContext.selectAll("path").remove();
    areaNowFocus = d3.svg.area().x((function(_this) {
      return function(d) {
        return _this.xScaleFocus(d.x);
      };
    })(this)).y0(this.heightFocusBox).y1((function(_this) {
      return function(d) {
        return _this.yScaleFocus(d.y);
      };
    })(this));
    areaNowContext = d3.svg.area().x((function(_this) {
      return function(d) {
        return _this.xScaleContext(d.x);
      };
    })(this)).y0(this.heightContextBox).y1((function(_this) {
      return function(d) {
        return _this.yScaleContext(d.y);
      };
    })(this));
    this.waterFocus.append("path").datum(data).attr("class", "waterarea").attr("d", areaNowFocus).attr("clip-path", "url(#clip)");
    return this.waterContext.append("path").datum(data).attr("class", "waterarea").attr("d", areaNowContext).attr("clip-path", "url(#clip)");
  };

  return LinePlotter;

})();

range = function(start, stop, elements, baseL, projL) {
  var a, b, step;
  a = [
    {
      x: start,
      base: baseL,
      proj: projL
    }
  ];
  b = start;
  step = (stop - start) / elements;
  while (b < stop) {
    b += step;
    a.push({
      x: b,
      base: baseL,
      proj: projL
    });
  }
  return a;
};

//# sourceMappingURL=maps/seahouse.js.map
