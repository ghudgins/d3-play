

var tree = []; //global data variable

var margin = {top: 20, right: 10, bottom: 20, left: 150},
    width = 900 - margin.left - margin.right,
    height = 375 - margin.top - margin.bottom;

var treemap = d3.layout.treemap()
    .size([width,height])
    .sticky(true)
    .children(function(d) { return d.children; })
    .value(function(d) { return d.TOTAL_DOCUMENTS; });

var div = d3.select("body").append("div")
    .style("position", "relative")
    .style("width", (width + margin.left + margin.right) + "px")
    .style("height", (height + margin.top + margin.bottom) + "px")
    .style("left", margin.left + "px")
    .style("top", margin.top + "px");

var color = d3.scale.category20c();

d3.csv("../data/hdata.csv",function(error, data) {

  if(error) {
    console.log(error);
  } else {

    // create a node name map
    var dataMap = data.reduce(function(map, node) {
        map[node.NODE_ID] = node;
        return map;
    }, {});

    // create the tree array in JSON format    
    data.forEach(function(node) {
        // add to parent
        var parent = dataMap[node.parent];
        if (parent) {
            // create child array if it doesn't exist
            (parent.children || (parent.children = []))
                // add node to child array
                .push(node);
        } else {
            // parent is null or missing
            tree.push(node);
        }
    });
  
  };




    
    // show what we've got
    d3.select('body').append('pre')
        .text(JSON.stringify(tree[0], null, '  '));
    
/*

  var node = div.datum(tree[0]).selectAll(".node")
      .data(treemap.nodes)
    .enter().append("div")
      .attr("class", "node")
      .call(position)
      .style("background", function(d) { return d.children ? color(d.NODE_ID) : null; })
      .text(function(d) { return d.children ? null : d.NODE_NAME; });

  d3.selectAll("input").on("change", function change() {
    var value = this.value === "count"
        ? function() { return 1; }
        : function(d) { return d.TOTAL_DOCUMENTS-0; };

    node
        .data(treemap.value(value).nodes)
      .transition()
        .duration(1500)
        .call(position);
  });
*/

  });

function position() {
  this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
};

