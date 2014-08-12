
//  CREATE MATRIX AND MAP

d3.csv('data/cooc.csv', function (error, data) {
  var mpr = chordMpr(data);
  
  _.each(data, function (d) { //A
    mpr.addToMap(d.PRIMARY_CAT, d.SENTIMENT)
  });

  mpr.setFilter(function (row, a, b) {
      return (row.PRIMARY_CAT === a.name && row.REL_CAT === b.name)
    })
    .setAccessor(function (recs, a, b) { //B
      if (!recs[0]) return 0;
      return {sentiment: recs[0].SENTIMENT, 
              volume: recs[0].COOC, 
              valueOf: value
            };
    });
  drawChords(mpr.getMatrix(), mpr.getMap(), 0);

  function value() { return +this.volume; } //C
});

//  DRAW THE CHORD DIAGRAM

function drawChords (matrix, mmap) {
  var chordWidth = 650, chordHeight = 650, r1 = chordHeight / 2, r0 = r1 - 100;

  var chordFill = 
      //d3.scale.category20();
      d3.scale.ordinal()
      .domain(d3.range(4))
      .range([//"#69D2E7", "#A7DBD8", "#E0E4CC", "#F38630", "#FA6900" //goldfish
        //"#FF9900", "#424242", "#E9E9E9", "#BCBCBC", "#3299BB" //gamebrooks
        //"#594F4F", "#547980", "#45ADA8", "#9DE0AD", "#E5FCC2" //greens
        "#1A1A1A", "#333333", "#666666", "#D1D1D1" //blacks
        //"#FE4365", "#FC9D9A", "#F9CDAD", "#C8C8A9", "#83AF9B" //candy
        //"#373737", "#99ADB6", "#CFD9B6", "#E8E6C0" //manly colors
        //"#F4E3DB", "#F0CBC3", "#F8A2A1", "#F6878E", "#CA9FA6" //pinks
        ]);

   var chordFill2 = function(sentiment, returnText) {
    if (!returnText) {

      if (sentiment+0 < -1) {
        return "#8C2318";
      } else if (sentiment+0 >= -1 && sentiment+0 < -0.40) {
        return "#F2C45A";
      } else if (sentiment+0 >= -0.40 && sentiment+0 < 0.40) {
        return "#BFB35A";
      } else if (sentiment+0 >= 0.40 && sentiment+0 < 1) {
        return "#88A65E";
      } else {
        return "#5E8C6A";
      };

    } else {

      if (sentiment+0 < -1) {
        return "Negative";
      } else if (sentiment+0 >= -1 && sentiment+0 < -0.40) {
        return "Somewhat Negative";
      } else if (sentiment+0 >= -0.40 && sentiment+0 < 0.40) {
        return "Neutral or Polarized";
      } else if (sentiment+0 >= 0.40 && sentiment+0 < 1) {
        return "Somewhat Positive";
      } else {
        return "Positive";
      };


    }

  }


  var chord = d3.layout.chord()
      .padding(.02)
      .sortSubgroups(d3.ascending)
      //.sortChords(d3.descending)
      ;

  var arc = d3.svg.arc()
      .innerRadius(r0)
      .outerRadius(r0 + 20);

  var svg_chord = d3.select("body").append("svg:svg")
      .attr("width", chordWidth)
      .attr("height", chordHeight)
    .append("svg:g")
      .attr("id", "circle")
      .attr("transform", "translate(" + chordWidth / 2 + "," + chordHeight / 2 + ")");

      svg_chord.append("circle")
          .attr("r", r0 + 20)
          .style("fill","none");

  var rdr = chordRdr(matrix, mmap);
  chord.matrix(matrix);


  var chord_g = svg_chord.selectAll("g.group")
      .data(chord.groups())
    .enter().append("svg:g")
      .attr("class", "group")
      .on("mouseover", chord_mouseover)
      .on("mouseout", function (d) { d3.select("#chord_tooltip").style("visibility", "hidden") })
      .on("click", function (d) { d3.select("#chord_tooltip").style("visibility", "hidden") });

  chord_g.append("svg:path")
      .style("stroke", "black")
      .style("fill", function(d) { return chordFill(d.index); })
      .attr("d", arc);

  chord_g.append("svg:text")
      .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .style("font-family", "helvetica, arial, sans-serif")
      .style("font-size", "8px")
      .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
      .attr("transform", function(d) {
        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
            + "translate(" + (r0 + 26) + ")"
            + (d.angle > Math.PI ? "rotate(180)" : "");
      })
      .text(function(d) { return rdr(d).gname; });

    var chordPaths = svg_chord.selectAll("path.chord")
          .data(chord.chords())
          .enter()
          .append("svg:path")
          .attr("class", "chord")
          .style("stroke", function(d) { return d3.rgb(chordFill2(+rdr(d).sdata.sentiment)).darker(); })
          .style("fill", function(d) { return chordFill2(+rdr(d).sdata.sentiment); })
          .attr("d", d3.svg.chord().radius(r0))
          .on("mouseover", function (d) {
            d3.select("#chord_tooltip")
              .style("visibility", "visible")
              .html(chordTip(rdr(d)))
              .style("top", function () { return (d3.event.pageY - 100)+"px"})
              .style("left", function () { return (d3.event.pageX - 100)+"px";})
          })
          .on("mouseout", function (d) { d3.select("#chord_tooltip").style("visibility", "hidden") })
          .on("click", function (d) { d3.select("#chord_tooltip").style("visibility", "hidden") });

    function chordTip (d) {
      var p = d3.format(".2%"), q = d3.format(",r")
      return "<strong>" + q(d.svalue) + "</strong><i> customers talk about both</i> <strong>" + d.sname + "</strong><i> and </i><strong>" + d.tname + "</strong><br/>"
        + "<i>with a </i><strong><font color=" + chordFill2(+d.sdata.sentiment) + ">" + chordFill2(+d.sdata.sentiment, 1) + "</font></strong><i> average sentiment</i><br/><br/>"
        + "<i>this is...</i><br/>" 
        + "<strong>" + p(d.svalue/d.stotal) + " </strong><i>of comments about </i>" + "<strong>" + d.sname + "</strong> <i>and</i> "
        + (d.sname === d.tname ? "": ("<br/><strong>" + p(d.tvalue/d.ttotal) + " </strong><i>of comments about </i>" + "<strong>" + d.tname + "</strong> "));
    }

    function groupTip (d) {
      var p = d3.format(".1%"), q = d3.format(",.3r")
      return "<strong>" + d.gname + "</strong> : " + q(d.gvalue) + "<br/>"
          + p(d.gvalue/d.mtotal) + "<i> of individual comments total</i> (" + q(d.mtotal) + ")"
    }

    function chord_mouseover(d, i) {
      d3.select("#chord_tooltip")
        .style("visibility", "visible")
        .html(groupTip(rdr(d)))
        .style("top", function () { return (d3.event.pageY - 80)+"px"})
        .style("left", function () { return (d3.event.pageX - 130)+"px";})

      chordPaths.classed("fade", function(p) {
        return p.source.index != i
            && p.target.index != i;
      });
    }
};