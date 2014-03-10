//define global dataset variables
var csvdataset; //global data set

var margin = {top: 20, right: 20, bottom: 20, left: 150},
    width = 1024 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var maxX2 = 5; //set your max X2-axis score here (holds scale in place)
var maxY = 10;

var x; //x scale
var y; //y scale
var x2; //x2 scale
var xAxis; //x Axis
var yAxis; //y Axis
var x2Axis; //x2 Axis

var detractorBars; //contains detractor selection
var promoterBars; //contains promoter selection
var neutralBars; //contains neutral selection
var osatLines; //contains OSAT baseline selection
var osatPoints; //contains OSAT endpoints selection

//data acessor keys (for object constancy)
var categoryKey = function(d) { return d.Category;};

var detractorLabels; //contains detractor label selection
var promoterLabels; //contains promoter label selection
var neutralLabels; //contains neutral label selection

var formatPercentage = d3.format("percentage");

var transitionSpeed = 1400; //how fast the transitions execute (in ms)
var transitionEase = "cubic-in-out"; //type of transition

//load data...only move forward once data is loaded
//need to add cool loading screen functions.  maybe in a few years... :)
d3.csv("../data/ciscodata.csv",function(error,csvdata) {
	if (error) {
		console.log(error); 
	} else {
		console.log("your array of objects for today are: ");
		console.log(csvdata);
		csvdataset = csvdata; //once loaded, copy to dataset.
		sortCategoryAsc();
		generateVis(); //initial build

	};
});

var svg = d3.select("body").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom);

function generateVis() {
	
	//set scales
	y = d3.scale.ordinal()
		.domain(csvdataset.slice(0,maxY).map(function(d) { return d.Category;}))
		.rangeRoundBands([margin.top, height],0.05);
	x = d3.scale.linear()
		.domain([0, (
			d3.max(csvdataset.slice(0,maxY), function(d) {return d.Detractor_Documents-0;}) 
			+ d3.max(csvdataset.slice(0,maxY), function(d) {return d.Neutral_Documents-0;})
			+ d3.max(csvdataset.slice(0,maxY), function(d) {return d.Promoter_Documents-0;}))
			])
		.range([margin.left, width]);
	x2 = d3.scale.linear()
		.domain([0, maxX2])
		.range([margin.left, width]);
/*

    .domain(dataset.map(function (d) {return d.key; }))
*/
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


	//build detractor document bar

	detractorBars = svg.append("g")
		.attr("class", "detractorBars");

	detractorBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("rect")
		.attr("y", function(d, i) {
			return y(i);
		})
		.attr("width", function(d, i) {
			return x(d.Detractor_Documents-0) - margin.left;
		})
		.attr("height",  y.rangeBand())
		.attr("x", margin.left)
		;

	//build neutral document bar

	neutralBars = svg.append("g")
		.attr("class", "neutralBars");

	neutralBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("rect")
		.attr("y", function(d, i) {
			return y(i);
		})
		.attr("x", function(d) {
			return x( (d.Detractor_Documents-0) );
		})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {
			return x(d.Neutral_Documents ) - margin.left;
		});
	
	//build promoter document bar

	promoterBars = svg.append("g")
		.attr("class", "promoterBars");

	promoterBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("rect")
		.attr("y", function(d, i) {
			return y(i);
		})
		.attr("x", function(d) {
			return x( (d.Detractor_Documents-0) + (d.Neutral_Documents-0) );
		})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {
			return x(d.Promoter_Documents) - margin.left;
		});

	//build OSAT lines
	
	osatLines = svg.append("g")
		.attr("class", "osatLines");

	osatLines.selectAll("line")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("line")
		.attr("y1", function(d, i) {
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x1", function(d) {
			return x2(d.OSAT-0);
		})
		.attr("y2", function(d) {
			return height;
		})
		.attr("x2", function(d) {
			return x2(d.OSAT-0);
		})
		.attr("class", "osatLine")
		.attr("opacity", 0.50);

	//build OSAT points
	osatPoints = svg.append("g")
		.attr("class", "osatPoints");

	osatPoints.selectAll("circle")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.enter()
		.append("circle")
		.attr("cy", function(d, i) {
			return y(i) - 3 /*the radius of the points*/ + y.rangeBand() / 2;
		})
		.attr("cx", function(d) {
			return x2(d.OSAT-0);
		})
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
		.attr("class", "labels");

	detractorLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY))
		.enter()
		.append("text")
		.attr("y", function(d, i){
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x", function(d){
			return x(d.Detractor_Documents/2 - 4) ;
		})
		.text(function(d) {
			return formatPercentage( d3.round( (d.Detractor_Documents-0) / (d.Total_Documents-0) ,2) ) ;
		});

	//build promoter labels (%ages)
	promoterLabels = svg.append("g")
		.attr("class", "labels");

	promoterLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY))
		.enter()
		.append("text")
		.attr("y", function(d, i){
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x", function(d){
			return x(d.Promoter_Documents/2 - 4 + (d.Detractor_Documents-0) + (d.Neutral_Documents-0) ) ;
		})
		.text(function(d) {
			return formatPercentage( d3.round( (d.Promoter_Documents-0) / (d.Total_Documents-0) ,2) ) ;
		});

	//build neutral labels (%ages)
	neutralLabels = svg.append("g")
		.attr("class", "labels");

	neutralLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY))
		.enter()
		.append("text")
		.attr("y", function(d, i){
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x", function(d){
			return x(d.Neutral_Documents/2 - 4 + (d.Detractor_Documents-0) ) ;
		})
		.text(function(d) {
			return formatPercentage( d3.round( (d.Neutral_Documents-0) / (d.Total_Documents-0) ,2) ) ;
		});
};

//sorting function
function sortDetractorDesc() {
  csvdataset.sort(function(obj1, obj2) {
	// Descending: sencond value less than the first
		return  obj2.Detractor_Documents - obj1.Detractor_Documents;

});
};
//sorting function
function sortPromoterDesc() {
  csvdataset.sort(function(obj1, obj2) {
	// Descending: sencond value less than the first
		return  obj2.Promoter_Documents - obj1.Promoter_Documents;

});
};
//sorting function
function sortNeutralDesc() {
  csvdataset.sort(function(obj1, obj2) {
	// Descending: sencond value less than the first
		return  obj2.Neutral_Documents - obj1.Neutral_Documents;

});
};
function sortCategoryAsc() {
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
}


//basic event handling
d3.select("p#detractorDesc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortDetractorDesc();
		//transition using update data join
		sortRedraw();

	});
d3.select("p#promoterDesc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortPromoterDesc();
		//transition using update data join
		sortRedraw();

	});
d3.select("p#neutralDesc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortNeutralDesc();
		//transition using update data join
		sortRedraw();

	});
d3.select("p#categoryAsc")
	.on("click", function() {
		//reorder data set - detractor desc
		sortCategoryAsc();
		//transition using update data join
		sortRedraw();

	});
//
function sortRedraw() {
	//update data (detractors, neutral, promoters)
	detractorBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i) {
			return y(i);
		})
		.attr("width", function(d, i) {
			console.log("here it is" + d.Detractor_Documents);
			return x(d.Detractor_Documents-0) - margin.left;
		})
		.attr("height",  y.rangeBand())
		.attr("x", margin.left)
		;
	neutralBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i) {
			return y(i);
		})
		.attr("x", function(d) {
			return x( (d.Detractor_Documents-0) );
		})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {
			return x(d.Neutral_Documents ) - margin.left;
		});
	promoterBars.selectAll("rect")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i) {
			return y(i);
		})
		.attr("x", function(d) {
			return x( (d.Detractor_Documents-0) + (d.Neutral_Documents-0) );
		})
		.attr("height",  y.rangeBand())
		.attr("width", function(d) {
			return x(d.Promoter_Documents) - margin.left;
		});

	//re-build y axis because of sort
	categories = [];
	
	//reset domain for y axis (update labels)
	y.domain(csvdataset.slice(0,maxY).map(function(d) { return d.Category;}));
	//redraw y axis
	svg.select("g.yaxis")
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.call(yAxis);

	//update labels
	detractorLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i){
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x", function(d){
			return x(d.Detractor_Documents/2 - 4) ;
		})
		.text(function(d) {
			return formatPercentage( d3.round( (d.Detractor_Documents-0) / (d.Total_Documents-0) ,2) ) ;
		});
	neutralLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i){
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x", function(d){
			return x(d.Neutral_Documents/2 - 4 + (d.Detractor_Documents-0) ) ;
		})
		.text(function(d) {
			return formatPercentage( d3.round( (d.Neutral_Documents-0) / (d.Total_Documents-0) ,2) ) ;
		});
	promoterLabels.selectAll("text")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y", function(d, i){
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x", function(d){
			return x(d.Promoter_Documents/2 - 4 + (d.Detractor_Documents-0) + (d.Neutral_Documents-0) ) ;
		})
		.text(function(d) {
			return formatPercentage( d3.round( (d.Promoter_Documents-0) / (d.Total_Documents-0) ,2) ) ;
		});

	//update OSAT lines and points
	osatLines.selectAll("line")
		.data(csvdataset.slice(0,maxY), categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("y1", function(d, i) {
			return y(i) + y.rangeBand() / 2;
		})
		.attr("x1", function(d) {
			return x2(d.OSAT-0);
		})
		.attr("y2", function(d) {
			return height;
		})
		.attr("x2", function(d) {
			return x2(d.OSAT-0);
		})
		.attr("class", "osatLine")
		.attr("opacity", 0.50);
	osatPoints.selectAll("circle")
		.data(csvdataset, categoryKey)
		.transition()
		.duration(transitionSpeed)
		.ease(transitionEase)
		.attr("cy", function(d, i) {
			return y(i) - 3 /*the radius of the points*/ + y.rangeBand() / 2;
		})
		.attr("cx", function(d) {
			return x2(d.OSAT-0);
		})
		.attr("r", 3)
		.attr("class", "osatPoint")
		.attr("opacity", 0.75);
};


