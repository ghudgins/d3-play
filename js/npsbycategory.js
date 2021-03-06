//npsbycategory bar chart settings
var margin = {top: 20, right: 10, bottom: 20, left: 150},
    width = 730 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom,
    scalePadding = 0.11; //percentage below/above min/max to expand axis (increase to prevent axis clipping)
//dual-bar settings
var maxY = 10; //set the number of Categories to display
var csvdataset; //global data set
var fullDataContainer; //container set so csv reload is not required
var labelVisibility = true;  //variable to track label visibility
var x; //x scale
var y; //y scale
var x2; //x2 scale
var xAxis; //x Axis
var yAxis; //y Axis
var x2Axis; //x2 Axis
var categoryKey = function(d) { return d.CAT_ID;}; //data acessor key (for object constancy) - still a bug on this...
var cg; //contains selection of cg drop down
var currentSort = "detractorSort"; //current sort selection (and default value)

//treemap settings
var chartWidth = 1200 - 80;
var chartHeight = 300 - 180;
var xscale = d3.scale.linear().range([0, chartWidth]); //zoom control scales
var yscale = d3.scale.linear().range([0, chartHeight]); //zoom control scales
//color options on treemap
var greenLowerBound = 0.40; //lower end of GREEN shades (upper end based on data)
var redUpperBound = -0.40; //upper end of RED shades (lower end based on data)
var detractorColors = d3.scale.linear()
	.domain([-5, redUpperBound]) //negative sentiment band
	.rangeRound([128, 255]); //shades of RED (RGB)
var promoterColors = d3.scale.linear()
	.domain([greenLowerBound, 5]) //positive sentiment band
	.rangeRound([255, 102]); //shades of green (RGB)
var neutralColors = "rgb(221,217,195)" //"i've been using this tan color" -ellen
var headerHeight = 15;
var headerColor = "#555555"; 
//global treemap data variables
var root;
var node;
var tree = [];

//cat influence settings
var infHeight = 300 - margin.top - margin.bottom ;
var tooltip = CustomTooltip("catinfluence_tooltip", 220);
var layout_gravity = -0.05; //negative values = points push away from each other
var damper = 0.1; //speed in which alpha is lost
var catInfNodes = []; //data array for cat Inf
var vis, force, circles, radius_scale; 
var bandConstant = 0.0003; //where the bands of influence break (not subject to infIntensity)
var infIntensity = 10000; //make the values human readable
var chart_control = {}; 
//where the "all setting" is on the svg
var center = {x: 0.45 * width , y: infHeight / 2};
//where the centers are on the svg
var infBand_centers = {
    "Negative": {x: 1.5 * width / 5, y: infHeight / 2},
    "Polarized": {x: 2 * width / 5, y: infHeight / 2},
    "Positive": {x: 2.5 * width / 5, y: infHeight / 2},
    "No Influence": {x: 3 * width / 5, y: infHeight / 2}
  };
//cat inf color pallet (categorical)
var fill_color = d3.scale.ordinal()
                .domain(["Negative", "No Influence", "Positive", "Polarized"])
                .range(["#d84b2a", "#ddd9c3", "#7aa25c", "#efa819"]);

//transition settings
var transitionSpeed = 1500; //how fast the transitions execute (in ms)
var transitionEase = "cubic-in-out"; //type of transition


//bubblebuilder.js starts here
//****************************************
//****************************************
//****************************************
//bubblebuilder.js starts here


//enable selectors
$(document).ready(function() {
  $('#view_selection a').click(function() {
    var view_type = $(this).attr('id');
    $('#view_selection a').removeClass('active');
    $(this).toggleClass('active');
    chart_control.toggle_view(view_type);
    return false;
  });
});

chart_control.init = function(_data) {
  custom_chart(_data);
  start();
};
chart_control.display_all = display_group_all;
chart_control.display_infBand = display_by_infBand;

chart_control.toggle_view = function(view_type) {
  if (view_type == "infBand") {
    display_by_infBand();
  } else {
    display_group_all();
    }
  };




function custom_chart(data) {
  var max_amount = d3.max(data, function(d) { return d.DET_CAT_INF_SCORE*infIntensity; } );
  radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 40]);

  //create node objects from original data
  //that will serve as the data behind each
  //bubble in the vis, then add each node
  //to nodes to be used later
  data.forEach(function(d){
    var infNode = {
      id: d.CAT_ID,
      radius: radius_scale(d.DET_CAT_INF_SCORE*infIntensity + d.PRO_CAT_INF_SCORE*infIntensity),
      value: d.DET_CAT_INF_SCORE*infIntensity + d.PRO_CAT_INF_SCORE*infIntensity,
      name: d.Category,
      Total_Documents: d.Total_Documents,
      group: determine_influence_band(d),
      Category_Group: d.Category_Group,
      detInf: d.DET_CAT_INF_SCORE,
      proInf: d.PRO_CAT_INF_SCORE,
      x: Math.random() * 900,
      y: Math.random() * 800
    };
    catInfNodes.push(infNode);
  });

  catInfNodes.sort(function(a, b) {return b.value- a.value; });

  vis = d3.select("#categoryinfluence").append("svg")
              .attr("width", width)
              .attr("height", infHeight)
              .attr("id", "svg_vis");

  circles = vis.selectAll("circle")
               .data(catInfNodes, function(d) { return d.id ;});

  circles.enter().append("circle")
    .attr("r", 0)
    .attr("fill", function(d) { return fill_color(d.group) ;})
    .attr("stroke-width", 0.50)
    .attr("stroke", function(d) {return d3.rgb(fill_color(d.group)).darker();})
    .attr("id", function(d) { return  "bubble_" + d.id; })
    .on("mouseover", function(d, i) {show_details(d, i, this);} )
    .on("mouseout", function(d, i) {hide_details(d, i, this);} );

  circles.transition().duration(transitionSpeed).attr("r", function(d) { return d.radius; });

}

function charge(d) {
  return -Math.pow(d.radius, 2.0) / 8;
}

function start() {
  force = d3.layout.force()
          .nodes(catInfNodes)
          .size([width, infHeight]);
}

function display_group_all() {
  force.gravity(layout_gravity)
       .charge(charge)
       .friction(0.9)
       .on("tick", function(e) {
          circles.each(move_towards_center(e.alpha))
                 .attr("cx", function(d) {return d.x;})
                 .attr("cy", function(d) {return d.y;});
       });
  force.start();
  hide_infBand();
}

function move_towards_center(alpha) {
  return function(d) {
    d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
    d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
  };
}


function display_by_infBand() {
  force.gravity(layout_gravity)
       .charge(charge)
       .friction(0.9)
      .on("tick", function(e) {
        circles.each(move_towards_infBand(e.alpha))
               .attr("cx", function(d) {return d.x;})
               .attr("cy", function(d) {return d.y;});
      });
  force.start();
  display_infBand();
}

function move_towards_infBand(alpha) {
  return function(d) {
    var target = infBand_centers[d.group];
    d.x = d.x + (target.x - d.x) * (damper + 0.02) * alpha * 1.1;
    d.y = d.y + (target.y - d.y) * (damper + 0.02) * alpha * 1.1;
  };
}

function display_infBand() {
    var infBand_x = {"Negative": width / 5, 
                    "Polarized": 2 * width / 5, 
                    "Positive": 3 * width / 5, 
                    "No Influence": 4 * width / 5};
    var infBand_data = d3.keys(infBand_x);
    var infBands = vis.selectAll(".infBand")
               .data(infBand_data);

    infBands.enter().append("text")
                 .attr("class", "infBand")
                 .attr("x", function(d) { return infBand_x[d]; }  )
                 .attr("y", 18)
                 .attr("text-anchor", "middle")
                 .text(function(d) { return d;});
}

function hide_infBand() {
    var infBands = vis.selectAll(".infBand").remove();
}

function show_details(data, i, element) {
  d3.select(element).attr("stroke", "black").attr("stroke-width", 2);
  var content = "<span class=\"name\">Driver:</span><span class=\"value\"> " + data.name + "</span><br/>";
  content +="<span class=\"name\">Total Influence:</span><span class=\"value\"> " + d3.round(data.value,2) + "</span><br/>";
  content +="<span class=\"name\">Detractor Influence:</span><span class=\"value\"> " + d3.round(data.detInf*infIntensity,2) + "</span><br/>";
  content +="<span class=\"name\">Promoter Influence:</span><span class=\"value\"> " + d3.round(data.proInf*infIntensity,2) + "</span><br/>";
  content +="<span class=\"name\">Influence Band:</span><span class=\"value\"> " + data.group + "</span><br/>";
  content +="<span class=\"name\">Total Volume:</span><span class=\"value\"> " + data.Total_Documents + "</span>";
  tooltip.showTooltip(content, d3.event);
}

function hide_details(data, i, element) {
  d3.select(element).attr("stroke", function(d) { return d3.rgb(fill_color(d.group)).darker();} )
    .attr("stroke-width", 0.50);
  tooltip.hideTooltip();
}

function determine_influence_band(data) {
  if ( data.PRO_CAT_INF_SCORE-0 > bandConstant) {
    if ( data.DET_CAT_INF_SCORE-0 > bandConstant) {
      return "Polarized";
    } else {
      return "Positive";
    };
  } else {
     if ( data.DET_CAT_INF_SCORE-0 > bandConstant) {
      return "Negative";
    } else {
      return "No Influence";
    };
  };
}


//YOU SHOULD MOVE THESE FUNCTIONS TO A SEPARATE UTILITIES.JS

function CustomTooltip(tooltipId, width){
  var tooltipId = tooltipId;
  $("body").append("<div class='tooltip' id='"+tooltipId+"'></div>");
  
  if(width){
    $("#"+tooltipId).css("width", width);
  }
  
  hideTooltip();
  
  function showTooltip(content, event){
    $("#"+tooltipId).html(content);
    $("#"+tooltipId).show();
    
    updatePosition(event);
  }
  
  function hideTooltip(){
    $("#"+tooltipId).hide();
  }
  
  function updatePosition(event){
    var ttid = "#"+tooltipId;
    var xOffset = 20;
    var yOffset = 10;
    
     var ttw = $(ttid).width();
     var tth = $(ttid).height();
     var wscrY = $(window).scrollTop();
     var wscrX = $(window).scrollLeft();
     var curX = (document.all) ? event.clientX + wscrX : event.pageX;
     var curY = (document.all) ? event.clientY + wscrY : event.pageY;
     var ttleft = ((curX - wscrX + xOffset*2 + ttw) > $(window).width()) ? curX - ttw - xOffset*2 : curX + xOffset;
     if (ttleft < wscrX + xOffset){
      ttleft = wscrX + xOffset;
     } 
     var tttop = ((curY - wscrY + yOffset*2 + tth) > $(window).height()) ? curY - tth - yOffset*2 : curY + yOffset;
     if (tttop < wscrY + yOffset){
      tttop = curY + yOffset;
     } 
     $(ttid).css('top', tttop + 'px').css('left', ttleft + 'px');
  }
  
  return {
    showTooltip: showTooltip,
    hideTooltip: hideTooltip,
    updatePosition: updatePosition
  }
}

function addCommas(nStr)
{
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

//treemap.js starts here
//****************************************
//****************************************
//****************************************
//treemap.js starts here

//create treemap
var treemap = d3.layout.treemap()
	.round(false)
	.size([chartWidth, chartHeight])
	.sticky(true)
	.padding([headerHeight + 1, 1, 1, 1])
	.value(function(d) { return size(d); })
	//.sort(function(a,b) { return a.value - b.value;}); //treemap sorts largest values first
//create chart area for treemap
var chart = d3.select("td#treemap3")
	.append("div")
	.attr("id", "treemap")
	.append("svg:svg")
	.attr("width", chartWidth)
	.attr("height", chartHeight)
	.append("svg:g");
//NPSBYCATEGORY - load data...only move forward once data is loaded
//need to add cool loading screen functions.  maybe in a few years... :)
d3.csv("../data/sampledata.csv",function(error,csvdata) {
	if (error) {
		console.log(error); 
	} else {
		csvdataset = csvdata; //once loaded, copy to dataset.
		fullDataContainer = csvdataset; //store for filter results

		//INFLUENCE - use loaded data from CSV
		chart_control.init(csvdataset);
		chart_control.toggle_view("all");

		//TREEMAP - load data..only move forward once data is loaded 
		d3.csv("../data/hdata.csv",function(error, data) {
		  if(error) {
		    console.log(error);
		  } else {
		    // create a node name map
		    var dataMap = data.reduce(function(map, nodeDM) {
		        map[nodeDM.NODE_ID] = nodeDM;
		        return map;
		    }, {});
		    // create the tree array in JSON format    
		    data.forEach(function(nodeFE) {
		        // add to parent
		        var parentFE = dataMap[nodeFE.parent];
		        if (parentFE) {
		            // create child array if it doesn't exist
		            (parentFE.children || (parentFE.children = []))
		                // add node to child array
		                .push(nodeFE);
		        } else {
		            // parent is null or missing
		            tree.push(nodeFE);
		        }
		    });
		  };
			//cgDropDownBuild(); //create dynamic dropdown of category groups
			sortDetractorDesc(); //default sort

			//update treemap color domains based on dataset value
			detractorColors.domain([ d3.min( treemap.nodes(tree[0]), function(d) { return d.SENTIMENT_SCORE-0; } ),	redUpperBound]); //set lowest sentiment value on the scale
			promoterColors.domain([ greenLowerBound, d3.max( treemap.nodes(tree[0]), function(d) { return d.SENTIMENT_SCORE-0; } )]); //set lowest sentiment value on the scale
			
			//d3.select("div#treemapLegend").append

			generateStackedOSAT(); //initial build of bar char
			showHideLabel();
		 	generateTreemap(); //initial build of treemap
		});
	};
});

function generateTreemap() {

	node = root = tree[0];
	var nodes = treemap.nodes(root);

	var children = nodes.filter(function(d) {
	    return !d.children;
	});
	var parents = nodes.filter(function(d) {
	    return d.children;
	});

	//clipping on treemap lables 
	
	var treemapClipping = chart.selectAll("clipPath")
			.data(parents, function(d) { return "p-" + d.NODE_ID; })
	var treemapClippingEnter = treemapClipping.enter()
			.append("clipPath")
			.attr("id", function(d) { return "cp" + d.NODE_ID; })
			.attr("class", "treemapClippath")
			.append("rect")
			.attr("class", "treemapClipping")
			.attr("width", function(d) { return Math.max(0.01, d.dx - 1); })
			.attr("height", headerHeight);

	// create parent cells
	var parentCells = chart.selectAll("g.cell.parent")
	        .data(parents, function(d) { return "p-" + d.NODE_ID; });
	var parentEnterTransition = parentCells.enter()
	        .append("g")
	        .attr("class", "cell parent")
	        .attr("clip-path", function(d) { return "url(#cp" + d.NODE_ID + ")"; })
	        .on("click", function(d) {
	            zoom(d);
	        });
	parentEnterTransition.append("rect")
	        .attr("width", function(d) { return Math.max(0.01, d.dx - 1); })
	        .attr("height", headerHeight)
	        .style("fill", headerColor);
	parentEnterTransition.append('text')
	        .attr("class", "label")
	        .attr("transform", "translate(3, 13)")
	        .attr("width", function(d) { return Math.max(0.01, d.dx - 1); })
	        .attr("height", headerHeight)
	        .text(function(d) { return d.NODE_NAME; });

	var parentUpdateTransition = parentCells.transition().duration(transitionSpeed);
	parentUpdateTransition.select(".cell")
	        .attr("transform", function(d) { return "translate(" + d.dx + "," + d.y + ")"; });
	parentUpdateTransition.select("rect")
	        .attr("width", function(d) { return Math.max(0.01, d.dx - 1); })
	        .attr("height", headerHeight)
	        .style("fill", headerColor);
	parentUpdateTransition.select(".label")
	        .attr("transform", "translate(3, 13)")
	        .attr("width", function(d) { return Math.max(0.01, d.dx - 1); })
	        .attr("height", headerHeight)
	        .text(function(d) { return d.NODE_ID; });

	// remove transition
	parentCells.exit()
	        .remove();

	// create children cells
	var childrenCells = chart.selectAll("g.cell.child")
	        .data(children, function(d) { return "c-" + d.NODE_ID; });
	// enter transition
	var childEnterTransition = childrenCells.enter()
	        .append("g")
	        .attr("class", "cell child")
	        .on("click", function(d) { zoom( node === d.parent ? root : d.parent); });
	childEnterTransition.append("rect")
	        .classed("background", true)
	        .style("fill", function(d) {
	            if (d.SENTIMENT_SCORE-0 <= redUpperBound) {
	            	return "rgb(" + detractorColors(d.SENTIMENT_SCORE-0) + ",0,0)";
	            } else  if (d.SENTIMENT_SCORE-0 >= greenLowerBound) {
	            	return "rgb(0," + promoterColors(d.SENTIMENT_SCORE-0) + ",0)";
	            } else {
	            	return neutralColors; //Ellen's Tan color
	            };
	        });
	childEnterTransition.append('text')
	        .attr("class", "label")
	        .attr('x', function(d) {
	            return d.dx / 2;
	        })
	        .attr('y', function(d) {
	            return d.dy / 2;
	        })
	        .attr("dy", ".35em")
	        .attr("text-anchor", "middle")
	        .style("display", "none")
	        .text(function(d) {
	            return d.NODE_NAME;
	        });/*
	        .style("opacity", function(d) {
	            d.w = this.getComputedTextLength();
	            return d.dx > d.w ? 1 : 0;
	        });*/
	// update transition
	var childUpdateTransition = childrenCells.transition().duration(transitionSpeed);
	childUpdateTransition.select(".cell")
	        .attr("transform", function(d) {
	            return "translate(" + d.x  + "," + d.y + ")";
	        });
	childUpdateTransition.select("rect")
	        .attr("width", function(d) {
	            return Math.max(0.01, d.dx - 1);
	        })
	        .attr("height", function(d) {
	            return (d.dy - 1);
	        })
	        .style("fill", function(d) {
	            if (d.SENTIMENT_SCORE-0 <= redUpperBound) {
	            	return "rgb(" + detractorColors(d.SENTIMENT_SCORE-0) + ",0,0)";
	            } else  if (d.SENTIMENT_SCORE-0 >= greenLowerBound) {
	            	return "rgb(0," + promoterColors(d.SENTIMENT_SCORE-0) + ",0)";
	            } else {
	            	return neutralColors;
	            	//return color(d.parent.NODE_ID);
	            };
	        });
	childUpdateTransition.select(".label")
	        .attr('x', function(d) {
	            return d.dx / 2;
	        })
	        .attr('y', function(d) {
	            return d.dy / 2;
	        })
	        .attr("dy", ".35em")
	        .attr("text-anchor", "middle")
	        .style("display", "none")
	        .text(function(d) {
	            return d.NODE_NAME;
	        });/*
	        .style("opacity", function(d) {
	            d.w = this.getComputedTextLength();
	            return d.dx > d.w ? 1 : 0;
	        });*/

	// exit transition
	childrenCells.exit()
	        .remove();

	d3.select("select").on("change", function() {
	    console.log("node depth:");
	    console.log(node.depth);

	    treemap.value(this.value == "size" ? size : count)
	            .nodes(root);

	    if (node.depth == 1) {
		    d3.selectAll(".treemapClippath").selectAll("rect")
				.transition()
				.duration(transitionSpeed)
				.attr("width", chartWidth);
		} else {
		    d3.selectAll(".treemapClippath").selectAll("rect")
				.transition()
				.duration(transitionSpeed)
				.attr("width", function(d) { return Math.max(0.01, d.dx - 1);});
		};
	    zoom(node);
	});

	zoom(node);

};

function size(d) {
    return d.TOTAL_DOCUMENTS;
}


function count(d) {
    return 1;
}


//and another one
function textHeight(d) {
    var ky = chartHeight / d.dy;
    yscale.domain([d.y, d.y + d.dy]);
    return (ky * d.dy) / headerHeight;
}

function getRGBComponents (color) {
    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);
    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
    };
}


function idealTextColor (bgColor) {
    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
    return ((255 - bgDelta) < nThreshold) ? "#d3d3d3" : "#ffffff";
}


function zoom(d) {

	console.log("passed in variables:");
	console.log(d.NODE_NAME);
	console.log(d.NODE_ID);
	console.log("node variables:");
	console.log(node.NODE_NAME);
	console.log(node.NODE_ID);

    this.treemap
            .padding([headerHeight/(chartHeight/d.dy), 0, 0, 0])
            .nodes(d);
	//filter bar chart on click
	//handling for show all selection

	if( d.NODE_NAME == "Show ALL") {
		
		console.log("removing filter...");
		//reload full dataset
		csvdataset = fullDataContainer;

		//carry previous sort value
		if( currentSort == "detractorSort") {
			sortDetractorDesc();
		} else if ( currentSort == "promoterSort") {
			sortPromoterDesc();
		} else if ( currentSort == "neutralSort") {
			sortNeutralDesc();
		} else {
			sortCategoryAsc();
		};

		vis.selectAll("circle")
			.data(catInfNodes, function(d) {return d.id; })
			//.transition() doesn't work...makes the bubbles small
			//.duration(transitionSpeed)
			.attr("opacity", "1");


		redraw();

	} else {

		console.log("filtering...");
		//reload full dataset
		csvdataset = fullDataContainer;
		//filter to selection in dropdown
		csvdataset = csvdataset.filter(function(d1){return d1.Category_Group == d.NODE_NAME;});
		
		//carry previous sort value
		if( currentSort == "detractorSort") {
			sortDetractorDesc();
		} else if ( currentSort == "promoterSort") {
			sortPromoterDesc();
		} else if ( currentSort == "neutralSort") {
			sortNeutralDesc();
		} else {
			sortCategoryAsc();
		};
		
		/*
		var newCircles = vis.selectAll("circle")
			.data(catInfNodes, function(d) { return d.id; });


		newCircles.exit()
			.transition()
			.duration(transitionSpeed)
			.attr("cx", width)
			.attr("cy", infHeight)
			.attr("opacity", ".25")
			.remove();
		display_group_all();
		*/

		vis.selectAll("circle")
			.data(catInfNodes.filter(function(d1) { return d1.Category_Group != d.NODE_NAME; }), function(d) {return d.id;})
			.transition()
			.duration(transitionSpeed)
			.attr("opacity", "0.1");

		redraw();


	};
    // moving the next two lines above treemap layout messes up padding of zoom result
    var kx = chartWidth  / d.dx;
    var ky = chartHeight / d.dy;
    var level = d;

    xscale.domain([d.x, d.x + d.dx]);
    yscale.domain([d.y, d.y + d.dy]);

    if (node != level) {
        chart.selectAll(".cell.child .label").style("display", "none");
    };

	//update header clipping
	//THIS IS NOT WORKING YET, CHANGE TO COUNT AFTER ZOOMING IN STILL FUNKY

		//when you zoom in
		//node.depth = 0 and d.depth = 1
		if (node.depth == 0 && d.depth == 1) {
			d3.selectAll(".treemapClippath").selectAll("rect")
					.transition()
					.duration(transitionSpeed)
					.attr("width", chartWidth );
		};
		//when you zoom out
		//node.depth = 1 and d.depth = 0
		if ( node.depth == 1 && d.depth == 0) {
			d3.selectAll(".treemapClippath").selectAll("rect")
					.transition()
					.duration(transitionSpeed)
					.attr("width", function(d) { return Math.max(0.01, d.dx - 1);});
		};

	//expand selection
    var zoomTransition = chart.selectAll("g.cell").transition().duration(transitionSpeed)
            .attr("transform", function(d) {
                return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")";
            })
            .each("start", function() {
                d3.select(this).select("label")
                        .style("display", "none");
            })
            .each("end", function(d, i) {
                if (!i && (level !== self.root)) {
                    chart.selectAll(".cell.child")
                        .filter(function(d) {
                            return d.parent === self.node; // only get the children for selected group
                        })
                        .select(".label")
                        .style("display", "")
                        .style("fill", function(d) {
                            	                if (d.SENTIMENT_SCORE-0 <= redUpperBound) {
									            	return idealTextColor("rgb(" + detractorColors(d.SENTIMENT_SCORE-0) + ",0,0)");
									            } else if (d.SENTIMENT_SCORE-0 >= greenLowerBound) {
													return idealTextColor("rgb(0," + promoterColors(d.SENTIMENT_SCORE-0) + ",0)");
									        	} else {
									            	return idealTextColor(neutralColors);
	            								};
                        });
                }
            });

    zoomTransition.select(".label")
            .attr("width", function(d) {
                return Math.max(0.01, (kx * d.dx - 1));
            })
            .attr("height", function(d) {
                return d.children ? headerHeight: Math.max(0.01, (ky * d.dy - 1));
            })
            .text(function(d) {
                return d.NODE_NAME;
            });

    zoomTransition.select(".child .label")
            .attr("x", function(d) {
                return kx * d.dx / 2;
            })
            .attr("y", function(d) {
                return ky * d.dy / 2;
            });

    // update the width/height of the rects
    zoomTransition.select("rect")
            .attr("width", function(d) {
                return Math.max(0.01, (kx * d.dx - 1));
            })
            .attr("height", function(d) {
                return d.children ? headerHeight : Math.max(0.01, (ky * d.dy - 1));
            })
            .style("fill", function(d) {
                if (d.children) {
					return headerColor; 
				} else if (d.SENTIMENT_SCORE-0 <= redUpperBound) {
	            	return "rgb(" + detractorColors(d.SENTIMENT_SCORE-0) + ",0,0)";
	            } else if (d.SENTIMENT_SCORE-0 >= greenLowerBound) {
					return "rgb(0," + promoterColors(d.SENTIMENT_SCORE-0) + ",0)";
	        	} else {
	            	return neutralColors;
	            };
            });

    node = d;

    if (d3.event) {
        d3.event.stopPropagation();
    }
}

//npsbycategory.js starts here
//****************************************
//****************************************
//****************************************
//npsbycategory.js starts here
var svg = d3.select("body").select("td#npsbycategory").append("div")
	.attr("id", "divNps").append("svg")
	.attr("width", width)
	.attr("height", height + margin.top + margin.bottom);

//clipping
svg.append("clipPath")
	.attr("id", "chart-area")
	.append("rect")
	.attr({
		"x": margin.left,
		"y": margin.top,
		"width": width - margin.right - margin.left,
		"height": height - margin.bottom
	});

//showHideLabel build
d3.select("div#showHideLabels").append("input")
	.attr("type", "checkbox")
	.on("click", showHideLabel);

function showHideLabel() {
	if (labelVisibility) {
		labelVisibility = false;

		d3.select("g.detractorLabels").style("display", "none");
		d3.select("g.neutralLabels").style("display", "none");
		d3.select("g.promoterLabels").style("display", "none");
	} else {
		labelVisibility = true;

		d3.select("g.detractorLabels").style("display", "");
		d3.select("g.neutralLabels").style("display", "");
		d3.select("g.promoterLabels").style("display", "");
	};
};

function generateStackedOSAT() {
	
	//set scales
	y = d3.scale.ordinal()
		.domain( csvdataset.slice(0,maxY).map(function(d) { return d.Category;}, categoryKey))
		.rangeRoundBands([margin.top, height],0.05);
	x = d3.scale.linear()
		.domain([0, (1+scalePadding) * (
			d3.max(csvdataset.slice(0,maxY), function(d) {return d.Detractor_Documents-0;}) 
			+ d3.max(csvdataset.slice(0,maxY), function(d) {return d.Neutral_Documents-0;})
			+ d3.max(csvdataset.slice(0,maxY), function(d) {return d.Promoter_Documents-0;}))
			])
		.range([margin.left, width]);
	x2 = d3.scale.linear()
		.domain([
				(1-scalePadding) * d3.min(csvdataset.slice(0,maxY), function(d) { return d.OSAT;})
				, (1+scalePadding) * d3.max(csvdataset.slice(0,maxY), function(d) { return d.OSAT;})])
		.range([margin.left, width]);


	//set axis
	yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	xAxis = d3.svg.axis()
		.scale(x)
		.orient("top");
	x2Axis = d3.svg.axis()
		.scale(x2)
		.orient("bottom");

	//create axis labels
	var axisLabels = svg.append("g")
		.attr("class", "axisLables");
	axisLabels.append("text")
		.attr("class", "x2label")
		.attr("text-anchor", "end")
		.attr("x", width)
		.attr("y", height - 6)
		.text("osat");
	axisLabels.append("text")
		.attr("class", "xlabel")
		.attr("text-anchor", "end")
		.attr("x", width)
		.attr("y", margin.top + 10)
		.text("volume");
	axisLabels.append("text")
	    .attr("class", "ylabel")
	    .attr("text-anchor", "end")
	    .attr("y", 6)
	    .attr("x", -0.40 * height)
	    .attr("dy", ".75em")
	    .attr("transform", "rotate(-90)")
	    .text("discussion topic ");

	//build detractor document bar
	detractorBars = svg.append("g")
		.attr("class", "detractorBars")
		.attr("clip-path", "url(#chart-area)");
	detractorBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("rect")
		.attr("y", function(d, i) {	return y(d.Category);})
		.attr("width", function(d, i) { return x(d.Detractor_Documents-0) - margin.left;})
		.attr("height",  y.rangeBand())
		.attr("x", margin.left)
		;

	//build neutral document bar
	neutralBars = svg.append("g")
		.attr("class", "neutralBars")
		.attr("clip-path", "url(#chart-area)");
	neutralBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("rect")
		.attr("y", function(d, i) { return y(d.Category);})
		.attr("x", function(d) { return x( (d.Detractor_Documents-0) );})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) { return x(d.Neutral_Documents ) - margin.left;});
	
	//build promoter document bar
	promoterBars = svg.append("g")
		.attr("class", "promoterBars")
		.attr("clip-path", "url(#chart-area)");
	promoterBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("rect")
		.attr("y", function(d, i) { return y(d.Category);})
		.attr("x", function(d) { return x( (d.Detractor_Documents-0) + (d.Neutral_Documents-0) );})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) { return x(d.Promoter_Documents) - margin.left;});

	//build OSAT lines
	osatLines = svg.append("g")
		.attr("class", "osatLines")
		.attr("clip-path", "url(#chart-area)");
	osatLines.selectAll("line")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("line")
		.style("stroke-dasharray",("5, 5"))
		.attr("y1", function(d, i) { return y(d.Category) + y.rangeBand() / 2;})
		.attr("x1", function(d) { return x2(d.OSAT-0)-3;})
		.attr("y2", function(d) { return y(d.Category) + y.rangeBand() / 2;})
		.attr("x2", function(d) { return margin.left;})
		.attr("class", "osatLine")
		.attr("opacity", 0.50);

	//build OSAT points
	osatPoints = svg.append("g")
		.attr("class", "osatPoints")
		.attr("clip-path", "url(#chart-area)");
	osatPoints.selectAll("circle")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("circle")
		.attr("cy", function(d, i) { return y(d.Category) + y.rangeBand() / 2;})
		.attr("cx", function(d) { return x2(d.OSAT-0);})
		.attr("r", 3)
		.attr("class", "osatPoint")
		.attr("opacity", 0.75);

	//build x axis
	svg.append("g")
		.attr("class", ["xaxis"])
		.attr("transform", "translate(0," + margin.top + ")")
		.call(xAxis);

	//build y axis
	svg.append("g")
		.attr("class", "yaxis")
		.attr("transform", "translate(" + margin.left + ",0)")
		.call(yAxis);

	//build x2 axis
	svg.append("g")
		.attr("class", "x2axis")
		.attr("transform", "translate(0," + height + ")")
		.call(x2Axis);

	//build detractor labels (%ages)
	detractorLabels = svg.append("g")
		.attr("class", "detractorLabels")
		.attr("clip-path", "url(#chart-area)");
	detractorLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY))
		.enter()
		.append("text")
		.attr("y", function(d, i){ return y(d.Category) + y.rangeBand() / 2 + 2.5; /*2.5 = adjust for 8px font size*/})
		.attr("x", function(d){	return x(d.Detractor_Documents/2 - 4) ;})
		.text(function(d) {return  d3.round( (d.Detractor_Documents / d.Total_Documents) * 100, 0) + "%" ;});

	//build promoter labels (%ages)
	promoterLabels = svg.append("g")
		.attr("class", "promoterLabels")
		.attr("clip-path", "url(#chart-area)");
	promoterLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY))
		.enter()
		.append("text")
		.attr("y", function(d, i){return y(d.Category) + y.rangeBand() / 2 + 2.5; /*2.5 = adjust for 8px font size*/ })
		.attr("x", function(d){	return x(d.Promoter_Documents/2 - 4 + (d.Detractor_Documents-0) + (d.Neutral_Documents-0) ) ;})
		.text(function(d) {return  d3.round( (d.Promoter_Documents / d.Total_Documents) * 100, 0) + "%" ;});

	//build neutral labels (%ages)
	neutralLabels = svg.append("g")
		.attr("class", "neutralLabels")
		.attr("clip-path", "url(#chart-area)");
	neutralLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY))
		.enter()
		.append("text")
		.attr("y", function(d, i){return y(d.Category) + y.rangeBand() / 2 + 2.5; /*2.5 = adjust for 8px font size*/})
		.attr("x", function(d){ return x(d.Neutral_Documents/2 - 4 + (d.Detractor_Documents-0) ) ;})
		.text(function(d) {	return  d3.round( (d.Neutral_Documents / d.Total_Documents) * 100, 0) + "%" ;});
};

//sorting function
function sortDetractorDesc() {
  currentSort = "detractorSort";
  csvdataset.sort(function(obj1, obj2) {
	// Descending: sencond value less than the first
		return  obj2.Detractor_Documents - obj1.Detractor_Documents;

	});
};
//sorting function
function sortPromoterDesc() {
	currentSort = "promoterSort";
	csvdataset.sort(function(obj1, obj2) {
	// Descending: sencond value less than the first
		return  obj2.Promoter_Documents - obj1.Promoter_Documents;

	});
};
//sorting function
function sortNeutralDesc() {
  currentSort = "neutralSort";
  csvdataset.sort(function(obj1, obj2) {
	// Descending: sencond value less than the first
		return  obj2.Neutral_Documents - obj1.Neutral_Documents;

	});
};
//sorting function
function sortCategoryAsc() {
	currentSort = "categorySort";
	csvdataset.sort(objTextSort("Category"));
};

//sorting function for text
function objTextSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
};

//basic event handling
d3.select("input#detractorDesc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortDetractorDesc();
		//transition using update data join
		redraw();

	});
d3.select("input#promoterDesc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortPromoterDesc();
		//transition using update data join
		redraw();

	});
d3.select("input#neutralDesc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortNeutralDesc();
		//transition using update data join
		redraw();

	});
d3.select("input#categoryAsc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortCategoryAsc();
		//transition using update data join
		redraw();

	});
//redraw axis
function redraw() {
	
	//re-build y axis because of sort
	y.domain(csvdataset.slice(0,maxY).map(function(d) { return d.Category;}) );
	//update x scale
	x.domain([0, (1+scalePadding) * (
			d3.max(csvdataset.slice(0,maxY), function(d) { return d.Detractor_Documents-0;}) 
			+ d3.max(csvdataset.slice(0,maxY), function(d) { return d.Neutral_Documents-0;})
			+ d3.max(csvdataset.slice(0,maxY), function(d) { return d.Promoter_Documents-0;}))
			]);
			x2.domain([
				(1-scalePadding) * d3.min(csvdataset.slice(0,maxY), function(d) { return d.OSAT;})
				, (1+scalePadding) * d3.max(csvdataset.slice(0,maxY), function(d) { return d.OSAT;})]);

	//new detractor bars
	var newDetractorBars = svg.select("g.detractorBars").selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey);
	var newPromoterBars = svg.select("g.promoterBars").selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey);	
	var newNeutralBars = svg.select("g.neutralBars").selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey);	
	
	//new data (detractors, neutral, promoters)
	newDetractorBars.enter().insert("rect")
		.attr("y", function(d, i) {	return height;})
		.attr("width", function(d, i) {	return x(d.Detractor_Documents-0) - margin.left;})
		.attr("height",  y.rangeBand())
		.attr("x", margin.left);
	newPromoterBars.enter().insert("rect")
		.attr("y", function(d, i) {	return height;	})
		.attr("x", function(d) {return x( (d.Detractor_Documents-0) + (d.Neutral_Documents-0) );})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {return x(d.Promoter_Documents) - margin.left;});		
	newNeutralBars.enter().insert("rect")
		.attr("y", function(d, i) {	return height;})
		.attr("x", function(d) {return x( (d.Detractor_Documents-0) );	})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {return x(d.Neutral_Documents ) - margin.left;});

	//update data (detractors, neutral, promoters)
	newDetractorBars
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i) {return y(d.Category);})
		.attr("width", function(d, i) {	return x(d.Detractor_Documents-0) - margin.left;})
		.attr("height",  y.rangeBand())
		.attr("x", margin.left);
	newNeutralBars
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i) {	return y(d.Category);})
		.attr("x", function(d) {return x( (d.Detractor_Documents-0) );})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {return x(d.Neutral_Documents ) - margin.left;});
	newPromoterBars
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i) {	return y(d.Category);})
		.attr("x", function(d) {return x( (d.Detractor_Documents-0) + (d.Neutral_Documents-0) );})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {return x(d.Promoter_Documents) - margin.left;});

	//exit data (detractors, neutral, promoters)
	newDetractorBars.exit()
        .transition()
        .duration(transitionSpeed)
        .ease(transitionEase)
        .attr("y", width)
        .remove();
	newPromoterBars.exit()
        .transition()
        .duration(transitionSpeed)
        .ease(transitionEase)
        .attr("y", width)
        .remove();
	newNeutralBars.exit()
        .transition()
        .duration(transitionSpeed)
        .ease(transitionEase)
        .attr("y", width)
        .remove();

	//redraw y axis
	svg.select("g.yaxis")
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.call(yAxis);
	//redraw x axis
	svg.select("g.xaxis")
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.call(xAxis);
	//redraw x2 axis
	svg.select("g.x2axis")
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.call(x2Axis);

	//new OSAT points
	newOsatPoints = svg.select("g.osatPoints")
		.selectAll("circle")
		.data(csvdataset.slice(0,maxY), categoryKey);
	newOsatLines = svg.select("g.osatLines")
		.selectAll("line")
		.data(csvdataset.slice(0,maxY), categoryKey);

	//new data
	newOsatPoints.enter()
		.insert("circle")
		.attr("cy", function(d, i) {return height;})
		.attr("cx", function(d) {return x2(d.OSAT-0);})
		.attr("r", 3)
		.attr("class", "osatPoint")
		.attr("opacity", 0.75);
	newOsatLines.enter()
		.insert("line")
		.attr("y1", function(d, i) {return height;})
		.attr("x1", function(d) {return x2(d.OSAT-0);})
		.attr("y2", function(d) {return height;})
		.attr("x2", function(d) {return margin.left;})
		.attr("class", "osatLine")
		.attr("opacity", 0.50)
		.style("stroke-dasharray",("5, 5"));

	//update data
	newOsatLines.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr({
			"y1": function(d, i) {return y(d.Category) + y.rangeBand() / 2;},
			"y2": function(d) {	return y(d.Category) + y.rangeBand() / 2;},
			"x1": function(d) {	return x2(d.OSAT-0)-3;},
			"x2": function(d) {	return margin.left;}
		})
		.attr("class", "osatLine")
		.attr("opacity", 0.50);
	newOsatPoints.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("cy", function(d, i) { return y(d.Category) + y.rangeBand() / 2;})
		.attr("cx", function(d) { return x2(d.OSAT-0);})
		.attr("r", 3)
		.attr("class", "osatPoint")
		.attr("opacity", 0.75);

	//exit data
	newOsatPoints.exit()
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("cy", width)
		.remove();
	newOsatLines.exit()
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y1", width)
		.attr("y2", width)
		.remove();

	//new lables
	var newDetractorLabels = svg.select("g.detractorLabels").selectAll("text")
		.data(csvdataset.slice(0,maxY), categoryKey);
	var newPromoterLabels = svg.select("g.promoterLabels").selectAll("text")
		.data(csvdataset.slice(0,maxY), categoryKey);	
	var newNeutralLabels = svg.select("g.neutralLabels").selectAll("text")
		.data(csvdataset.slice(0,maxY), categoryKey);	
	
	//new labels (detractors, neutral, promoters)
	newDetractorLabels.enter().insert("text")
		.attr("y", function(d, i){ return height; })
		.attr("x", function(d){	return x(d.Detractor_Documents/2 - 4) ;	})
		.text(function(d) {	return  d3.round( (d.Detractor_Documents / d.Total_Documents) * 100, 0) + "%" ;	});
	newPromoterLabels.enter().insert("text")
		.attr("y", function(d, i){ return height;})
		.attr("x", function(d){	return x(d.Detractor_Documents/2 - 4 + (d.Detractor_Documents-0) + (d.Neutral_Documents-0)) ;})
		.text(function(d) {	return  d3.round( (d.Detractor_Documents / d.Total_Documents) * 100, 0) + "%" ;	});
	newNeutralLabels.enter().insert("text")
		.attr("y", function(d, i){ return height;})
		.attr("x", function(d){	return x(d.Detractor_Documents/2 - 4 + (d.Detractor_Documents-0)) ;})
		.text(function(d) {	return  d3.round( (d.Detractor_Documents / d.Total_Documents) * 100, 0) + "%" ;});

	//update labels
	newDetractorLabels
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i){return y(d.Category) + y.rangeBand() / 2  + 2.5; ;}) //2.5 = adjust for 8px font size
		.attr("x", function(d){	return x(d.Detractor_Documents/2 - 4) ;	})
		.text(function(d) {	return  d3.round( (d.Detractor_Documents / d.Total_Documents) * 100, 0) + "%" ;	});
	newNeutralLabels
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i){return y(d.Category) + y.rangeBand() / 2 + 2.5; ;}) //2.5 = adjust for 8px font size
		.attr("x", function(d){	return x(d.Neutral_Documents/2 - 4 + (d.Detractor_Documents-0) ) ;})
		.text(function(d) {	return  d3.round( (d.Neutral_Documents / d.Total_Documents) * 100, 0) + "%" ;});
	newPromoterLabels
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i){ return y(d.Category) + y.rangeBand() / 2 + 2.5; ;}) //2.5 = adjust for 8px font size
		.attr("x", function(d){	return x(d.Promoter_Documents/2 - 4 + (d.Detractor_Documents-0) + (d.Neutral_Documents-0) ) ;})
		.text(function(d) {	return  d3.round( (d.Promoter_Documents / d.Total_Documents) * 100, 0) + "%" ;});

	//exit data (detractors, neutral, promoters)
	newDetractorLabels.exit()
        .transition()
        .duration(transitionSpeed)
        .ease(transitionEase)
        .attr("y", width)
        .remove();
	newPromoterLabels.exit()
        .transition()
        .duration(transitionSpeed)
        .ease(transitionEase)
        .attr("y", width)
        .remove();
	newNeutralLabels.exit()
        .transition()
        .duration(transitionSpeed)
        .ease(transitionEase)
        .attr("y", width)
        .remove();	
};

