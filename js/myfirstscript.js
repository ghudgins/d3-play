//Global Variables
var csvdataset; //global csv data variable
var jsondataset; //global json data variable
var dataset = [];

//random dataset

for (var i=0; i<25; i++) {
	dataset.push(Math.round(Math.random()*25));
}

//fixed-dataset
/*
var dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13,
                   11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ];
*/

//learning csv file loading to js memory
d3.csv("../data/report_CATEGORY.csv",function(error,csvdata) {
	if (error) {
		console.log(error); 
	} else {
		console.log(csvdata);
		csvdataset = csvdata; //once loaded, copy to dataset.
/*
		generateVis();
		hideLoadingMsg();
*/
	};
});

//learning json file loading to js memory
d3.json("../data/bullets.json",function(error,jsondata) {
	if (error) {
		console.log(error);
	} else {
		console.log(jsondata);
		jsondataset = jsondata; //once loaded, copy to dataset
	};
});

var w = 500; //global svg width
var h = 100; //global svg height
var barPadding = 1; //global bar chart padding
var barMagnif = 4;

//svg image
var svg = d3.select("body")
			.append("svg")
			.attr("width",w)
			.attr("height",h);

//Build the bar charts
svg.selectAll("rect")
	.data(dataset)
	.enter()
	.append("rect")
	.attr({
		x: function(d,i) {return i * (w/dataset.length);},
		y: function(d) {return h - (d * barMagnif);},
		width: w / dataset.length - barPadding,
		height: function(d) {return d * barMagnif;},
		fill: function(d) {return "rgb(0,0," + (d*10) + ")";}
	});

//Add label to bar charts
svg.selectAll("text")
	.data(dataset)
	.enter()
	.append("text")
	.text(function(d){return d;})
	.attr({
		x: function(d,i) {return i * (w/dataset.length) + (w / dataset.length - barPadding) / 2;},
		y: function(d) {
			if(d>4) {
				return h-(d*barMagnif) + 15;
			} else {
				return h-(d*barMagnif) + 10;}
			},
		"font-family": "sans-serif",
		"font-size": "11px",
		fill: "white",
		"text-anchor": "middle"
	})