var data,
    locationData,
    teamSchedules,
    selectedSeries,
    colorScale;


/* EVENT RESPONSE FUNCTIONS */

function setHover(d) {
    
    var info="";
    if(d.data_type=="Game")
    {
        info=d["Visit Team Name"]+" @ "+ d["Home Team Name"];
        document.getElementById("info").innerHTML=JSON.stringify(info);

    }
    else if(d.data_type=="Team")
    {
        info= d.name;
        document.getElementById("info").innerHTML=JSON.stringify(info);

    }
    else if(d.data_type=="Location")
    {
        for (values in d.games) {

            if(values==0)
                info =  d.games[values]["Visit Team Name"]+" @ "+ d.games[values]["Home Team Name"];
            else
                info = info +" ,"+ d.games[values]["Visit Team Name"]+" @ "+ d.games[values]["Home Team Name"];
        }
        document.getElementById("info").innerHTML=JSON.stringify(info);
    }
    else
    {
        info="";
    }
}

function clearHover() {
    setHover(null);
}

function changeSelection(d) {
    // There are FOUR data_types that can be selected;
    // an empty selection (null), a single Game,
    // a Team, or a Location.

	if(d.data_type === "Location") {
        selectedSeries = d["games"];
        updateBarChart();
        updateForceDirectedGraph();
        updateMap();
    }
    else if(d.data_type === "Team"){
        var team = d.name;
        selectedSeries = teamSchedules[team];
        updateBarChart();
        updateForceDirectedGraph();
        updateMap();
    }
    else if(d.data_type === "Game")
    {
        selectedSeries = [d];
        updateBarChart();
        updateForceDirectedGraph();
        updateMap();
    }
    else if(d.data_type === null)
    {
        selectedSeries = [];
        updateBarChart();
        updateForceDirectedGraph();
        updateMap();
    }

}

/* DRAWING FUNCTIONS */

function updateBarChart() {
  var svgBounds = document.getElementById("barChart").getBoundingClientRect(),
        xAxisSize = 100,
        yAxisSize = 60;
    var svgheight = svgBounds.height;
    var svgwidth = svgBounds.width;
       var margin ={top:30, right:30, bottom:30, left:40},
       width  = svgwidth - margin.left - margin.right,
       height = svgheight - margin.top - margin.bottom;
       var textHeight = 40;
       var textWidth  = 40;
       max = d3.max(selectedSeries, function(d) { return d.attendance; });
       min = d3.min(selectedSeries, function(d) { return d.attendance; });

       var xScale = d3.scale.ordinal()
       .rangeRoundBands([textWidth, 400], .1);
       xScale.domain(selectedSeries.map(function (d) {
       return d.Date;
       }))
       var yScale = d3.scale.linear()
       .domain([0, 90000])
       .range([0, 300])
       .nice();

       colorScale = d3.scale.linear()
       .domain([0, 90000])
       .range(["#c7e9c0", "#006d2c"]);
	   
       var xAxisG = d3.select("#xAxis");
       var xAxis = d3.svg.axis()
       .scale(xScale)
       .orient("bottom");

       xAxisG
       .call(xAxis)
       .selectAll("text")
       .style("text-anchor", "end")
       .attr("dx", "-.15em")
       .attr("dy", ".02em")
       .attr("transform", "rotate(-65)" );

       var yAxisG = d3.select("#yAxis");
       var yScaleInverted = d3.scale.linear()
       .domain([90000, 0])
       .range([0, 300])
       .nice();
       var yAxis = d3.svg.axis()
       .scale(yScaleInverted)
       .orient("left");
       yAxisG
       .call(yAxis);


       var barchartG = d3.select("#barChart")
       .attr({
       width: 427,
       height: 500
       })
       .append("g")
       .attr("transform", "translate(" + margin.left  + "," + margin.top + ")");


       spacing = (width - textWidth)/ selectedSeries.length;

       var bars = d3.select("#bars")
           .selectAll("rect")
           .data(selectedSeries);
       bars
           .enter()
           .append("rect");

       bars
            .exit()
            .remove();
       bars
               .transition().duration(2000)
               .attr("x", function (d, i) {
                   return xScale(d.Date);
                   })
               .attr("y", margin.top + textHeight)
               .attr("height", function(d, i) {
                   return yScale(d.attendance);
                   })
               .attr("width", spacing * 0.8)
               .style("fill", function (d){
                   return colorScale(d.attendance);
                   });
            bars.on("click",function(d){changeSelection(d)})
            bars.on("mouseover",function(d){setHover(d);})
		}

function updateForceDirectedGraph() {
    var svgBounds = document.getElementById("graph").getBoundingClientRect();
    var width = svgBounds.width;
    var height = svgBounds.height;

    function symbolType(d)
    {
        if(d.data_type == 'Team')
        {
            return 'triangle-up';
        }
        else
        {
            return 'circle';
        }
    }

    function setTransform(d)
    {
        if(isObjectInArray(d,selectedSeries))
        {
            return "translate(" + d.x + "," + d.y + ") scale(2)";
        }
        else
        {
            return "translate(" + d.x + "," + d.y + ") scale(1)";
        }
    }

    function setClass(d)
    {
        if(d.data_type == 'Team')
        {
            return "team";
        }
        else
        {
            return "game";
        }
    }
    function setColor(d)
    {
        if(isObjectInArray(d,selectedSeries))
        {
            return colorScale(d.attendance);
        }
    }

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height])
        .start();

    force
        .nodes(data.vertices)
        .links(data.edges)
        .start();

    var link = d3.select("#links").selectAll("line")
        .data(data.edges);
    link
        .enter().append("line");

    var node = d3.select("#nodes").selectAll("path")
        .data(data.vertices);
    node
        .enter()
        .append("path")
        .attr("d", d3.svg.symbol().type(function(d){return symbolType(d);}))
        .attr("class",function(d){ return setClass(d);})
        .call(force.drag);

    node.append("title")
        .text(function(d) { return d.name; });

    force.on("tick", function() {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });
        node.style("fill",function(d){
            return setColor(d);})
        node.attr("transform", function (d) {
            return setTransform(d); });
    });

        node.on("click",function(d){
            changeSelection(d);
        })

        node.on("mouseover",function(d){setHover(d);})
	}

function updateMap() {
    var svgBounds = document.getElementById("map").getBoundingClientRect();

    width = svgBounds.width;
    height = svgBounds.height;

    var svg = d3.select("#map");
    projection = d3.geo.albersUsa()
        .translate([width / 2, height / 2]).scale([700]);
    Location_data=d3.values(locationData);
    location_keys = d3.keys(locationData);
    var selectedLocationArray = [];
    for(x in selectedSeries)
    {
        lat = selectedSeries[x]["latitude"];
        long = selectedSeries[x]["longitude"];
        selectedLocationArray.push(lat+ ","+long);
    }

    var map_points = d3.select("#points").selectAll("circle")
        .data(Location_data)
    map_points
            .enter()
            .append("circle");
    map_points.exit().remove();
    map_points
            .attr("r", function (d) {
                var locString = d.latitude+","+ d.longitude;
                if(selectedLocationArray.indexOf(locString) > -1)
                {
                    return "9px"
                }
                else {
                    return "3px";
                }
            })
            .attr("transform", function(d) {return "translate(" + projection([d.longitude,d.latitude]) + ")";})
            .attr("fill",function(d){
                var locString = d.latitude+","+ d.longitude;
                var sum = 0;
                if(selectedLocationArray.indexOf(locString) > -1)
                {
                    var games = d["games"];

                    for(x in games)
                    {
                        sum = sum + games[x].attendance;
                    }
                    return colorScale(sum/games.length);
                }
                else
                {
                    return "#a1d99b ";
                }
            })
            .attr("stroke","grey")
            .on("click",function(d){changeSelection(d)})
            .on("mouseover",function(d){setHover(d);})
}

function drawStates(usStateData) {

    var svg = d3.select("#map");


    var path = d3.geo.path().projection(projection);

    svg.selectAll("#states")
            .datum(topojson.feature(usStateData,usStateData.objects.states))
            .attr("d", path);
}


function dateComparator(a, b) {
    return Date.parse(a.Date) - Date.parse(b.Date);
}

function isObjectInArray(obj, array) {
    var i;
    for (i = 0; i < array.length; i += 1) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function deriveGraphData() {
    var indexLookup = {};
    data.vertices.forEach(function (d, i) {
        indexLookup[d._id] = i;
    });
    data.edges.forEach(function (d) {
        d.source = indexLookup[d._outV];
        d.target = indexLookup[d._inV];
    });
}

function deriveLocationData() {
    var key;

    locationData = {};

    data.vertices.forEach(function (d) {
        if (d.data_type === "Game" &&
            d.hasOwnProperty('latitude') &&
            d.hasOwnProperty('longitude')) {

            key = d.latitude + "," + d.longitude;
            
            if (!locationData.hasOwnProperty(key)) {
                locationData[key] = {
                    "latitude": d.latitude,
                    "longitude": d.longitude,
                    "data_type": "Location",
                    "games": []
                };
            }
            locationData[key].games.push(d);
        }
    });

    for (key in locationData) {
        if (locationData.hasOwnProperty(key)) {
            locationData[key].games = locationData[key].games.sort(dateComparator);
        }
    }
}

function deriveTeamSchedules() {
    var teamName;

    teamSchedules = {};

    data.edges.forEach(function (d) {
        teamName = data.vertices[d.target].name;
        if (!teamSchedules.hasOwnProperty(teamName)) {
            teamSchedules[teamName] = [];
        }
        teamSchedules[teamName].push(data.vertices[d.source]);
    });

    for (teamName in teamSchedules) {
        if (teamSchedules.hasOwnProperty(teamName)) {
            teamSchedules[teamName] = teamSchedules[teamName].sort(dateComparator);
        }
    }
}


/* DATA LOADING */

// This is where execution begins

d3.json("data/us.json", function (error, usStateData) {
    if (error) throw error;
    
    drawStates(usStateData);
});
d3.json("data/pac12_2013.json", function (error, loadedData) {
    if (error) throw error;

    // Storing data in a global variable for all functions to access
    data = loadedData;

    // These functions help us get visualizations of data in different shapes
    deriveGraphData();
    deriveLocationData();
    deriveTeamSchedules();
    
    // Default value as Utah
    selectedSeries = teamSchedules.Utah;

    // Draw for the first time
    updateBarChart();
    updateForceDirectedGraph();
    updateMap();
});
