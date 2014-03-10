//categoryinfluence bar chart settings
//can we use the same settings as the npsbycategory.js
var margin = {top: 20, right: 10, bottom: 20, left: 150},
    width = 730 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom,
    scalePadding = 0.11; //percentage below/above min/max to expand axis (increase to prevent axis clipping)
//universal display settings
var maxY = 10; //set the number of Categories to display
var csvdataset; //global data set
var fullDataContainer; //container set so csv reload is not required
var labelVisibility = true;  //variable to track label visibility
//transition settings
var transitionSpeed = 1500; //how fast the transitions execute (in ms)
var transitionEase = "cubic-in-out"; //type of transition
var categoryKey = function(d) { return d.CAT_ID;}; //data acessor key (for object constancy) - still a bug on this...

//********COPY BELOW THIS LINE TO INTEGRATE*********//
//cat influence scales
var yCatInfluence; //y scale for negative influence 
var xCatInfluence; //x scale for positive influence 
//cat influence axises
var yAxisCatInfluence; //y Axis for negative influence
var xAxisCatInfluence; //x axis for positive influence
var infIntensity = 1; //constant to expand all values 
//cat inlfuence data
var detractorPoints;
var promoterPoints;
var combinedDataSet = [];
var detCatInf;
var proCatInf;
//color options on treemap
var greenLowerBound = 0.40; //lower end of GREEN shades (upper end based on data)
var redUpperBound = -0.40; //upper end of RED shades (lower end based on data)

var detractorColors = d3.scale.linear()
	.domain([-5, redUpperBound]) //negative sentiment band
	.rangeRound([128, 255]); //shades of RED (RGB)
var promoterColors = d3.scale.linear()
	.domain([greenLowerBound, 5]) //positive sentiment band
	.rangeRound([255, 102]); //shades of green (RGB)
var neutralColors = "rgb(221,217,195)"; //"i've been using this tan color" -ellen
var catInfData; //global category influence data variable

d3.csv("../data/sampledata.csv",function(error,csvdata) {
	if (error) {
		console.log(error); 
	} else {
		csvdataset = csvdata; //once loaded, copy to dataset.
		fullDataContainer = csvdataset; //store for filter results		
	};

	generateCatInfluence();
});

var svg2 = d3.select("body").select("td#categoryinfluence").append("div")
	.attr("id", "divCatInfluence").append("svg")
	.attr("width", width )
	.attr("height", height + margin.top + margin.bottom);

//clipping
svg2.append("clipPath")
	.attr("id", "influence-chart-area")
	.append("rect")
	.attr({
		"x": margin.left,
		"y": margin.top,
		"width": width - margin.right - margin.left,
		"height": height - margin.bottom
	});

function positiveInfluenceConstant() {
	return ( d3.max(csvdataset, function(d){ return d.PRO_CAT_INF_SCORE*infIntensity; }) 
		+ d3.min(csvdataset, function(d) { return d.PRO_CAT_INF_SCORE*infIntensity; }) ) / 2;
};

function negativeInfluenceConstant() {
	return (d3.max(csvdataset, function(d){ return d.DET_CAT_INF_SCORE*infIntensity; }) 
		+ d3.min(csvdataset, function(d) { return d.DET_CAT_INF_SCORE*infIntensity; })) / 2;
};

function generateCatInfluence() {
	

	//datasets for initial chart build
	detCatInf = csvdataset.sort(function(obj1, obj2) {
		
		return  (obj1.DET_CAT_INF_SCORE-0) - (obj2.DET_CAT_INF_SCORE-0);
	});
	
	proCatInf = csvdataset.sort(function(obj1, obj2) {
		return  (obj1.PRO_CAT_INF_SCORE-0) - (obj2.PRO_CAT_INF_SCORE-0);
	});

	detCatInf = detCatInf.slice(0,maxY);
	proCatInf = proCatInf.slice(0,maxY);

	combinedDataSet = combinedDataSet.concat(detCatInf, proCatInf);


	//set scales
	xCatInfluence = d3.scale.pow()
		.domain(
			[d3.min(csvdataset, function(d) { return ( d.PRO_CAT_INF_SCORE * infIntensity ) -  positiveInfluenceConstant(); }) ,  
			d3.max(csvdataset, function(d) { return ( d.PRO_CAT_INF_SCORE * infIntensity ) -  positiveInfluenceConstant(); })
			])
		.range( [margin.left, width] );

	yCatInfluence = d3.scale.pow()
		.domain(
			[d3.min(csvdataset, function(d) { return ( d.DET_CAT_INF_SCORE * infIntensity ) -  negativeInfluenceConstant(); }) ,  
			d3.max(csvdataset, function(d) { return ( d.DET_CAT_INF_SCORE * infIntensity ) -  negativeInfluenceConstant(); })
			])
		.range( [margin.top, height] );

	//build axis
	yAxisCatInfluence = d3.svg.axis()
		.scale(xCatInfluence)
		.orient("right");
	xAxisCatInfluence = d3.svg.axis()
		.scale(yCatInfluence)
		.orient("top");


	//create axis labels
	var catInfAxisLabels = svg2.append("g")
		.attr("class", "axisLables");
	catInfAxisLabels.append("text")
		.attr("class", "xlabel")
		.attr("text-anchor", "end")
		.attr("x", width)
		.attr("y", margin.top + 10)
		.text("volume");
	catInfAxisLabels.append("text")
	    .attr("class", "ylabel")
	    .attr("text-anchor", "end")
	    .attr("y", 6)
	    .attr("x", -0.40 * height)
	    .attr("dy", ".75em")
	    .attr("transform", "rotate(-90)")
	    .text("discussion topic ");
	
	//detractor influence points

	detractorPoints = svg2.append("g")
		.attr("class", "detractorPoints")
		//.attr("clip-path", "url(#influence-chart-area)");
	detractorPoints.selectAll("circle")
		.data(combinedDataSet.slice(0,maxY), categoryKey)
		.enter()
		.append("circle")
		.attr("cy", function(d, i) {	return yCatInfluence(d.DET_CAT_INF_SCORE*infIntensity - negativeInfluenceConstant());})
		.attr("cx", function(d, i) {	return xCatInfluence(d.PRO_CAT_INF_SCORE*infIntensity - positiveInfluenceConstant());})
		.attr("r", function(d, i) { return 3;})
		;

};




