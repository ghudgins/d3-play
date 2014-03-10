
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


var margin = {top: 20, right: 10, bottom: 20, left: 150};
var csvdataset;
var maxY = 10;

//var detCatInf; //stores top postiive values
//var proCatInf; //stores top negative values
var bandConstant = 0.0003; //where the bands of influence break 
var infIntensity = 10000; //make the values human readable
var chart_control = {}; 
var combinedDataSet;

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

var width = 600,
    infHeight = 300 - margin.top - margin.bottom,
    tooltip = CustomTooltip("catinfluence_tooltip", 220),
    //tooltip,
    layout_gravity = -0.05,
    damper = 0.1,
    catInfNodes = [],
    vis, force, circles, radius_scale;

var center = {x: 0.45 * width , y: infHeight / 2};

var infBand_centers = {
    "Negative": {x: 1.5 * width / 5, y: infHeight / 2},
    "Polarized": {x: 2 * width / 5, y: infHeight / 2},
    "Positive": {x: 2.5 * width / 5, y: infHeight / 2},
    "No Influence": {x: 3 * width / 5, y: infHeight / 2}
  };

var fill_color = d3.scale.ordinal()
                .domain(["Negative", "No Influence", "Positive", "Polarized"])
                .range(["#d84b2a", "#ddd9c3", "#7aa25c", "#efa819"]);


d3.csv("../data/sampledata.csv", function(data) {
        
      csvdataset = data;

      //datasets for initial chart build
      detCatInf = csvdataset.sort(function(obj1, obj2) {
        
        return  (obj1.DET_CAT_INF_SCORE-0) - (obj2.DET_CAT_INF_SCORE-0);
      });
      
      proCatInf = csvdataset.sort(function(obj1, obj2) {
        return  (obj1.PRO_CAT_INF_SCORE-0) - (obj2.PRO_CAT_INF_SCORE-0);
      });

      detCatInf = detCatInf.slice(0,maxY);
      proCatInf = proCatInf.slice(0,maxY);

    //  combinedDataSet = combinedDataSet.concat(detCatInf, proCatInf);

          chart_control.init(csvdataset);
          chart_control.toggle_view("all");
    });


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
      radius: radius_scale(d.DET_CAT_INF_SCORE*infIntensity),
      value: d.DET_CAT_INF_SCORE*infIntensity + d.PRO_CAT_INF_SCORE*infIntensity,
      name: d.Category,
      Total_Documents: d.Total_Documents,
      group: determine_influence_band(d),
      year: d.Category_Group,
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

  circles.transition().duration(2000).attr("r", function(d) { return d.radius; });

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

function display_by_year() {
  force.gravity(layout_gravity)
       .charge(charge)
       .friction(0.9)
      .on("tick", function(e) {
        circles.each(move_towards_year(e.alpha))
               .attr("cx", function(d) {return d.x;})
               .attr("cy", function(d) {return d.y;});
      });
  force.start();
  display_infBand();
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
  var content = "<span class=\"name\">Category:</span><span class=\"value\"> " + data.name + "</span><br/>";
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

