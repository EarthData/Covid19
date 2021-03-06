var margin = {top: 30, right: 70, bottom: 40, left: 40},
  width = parseInt(d3.select('#young').style('width'), 10),
  width = width - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

var x = d3.scaleBand()
  .rangeRound([0, width])
  .padding(0.1);

var y = d3.scaleLinear()
  .rangeRound([height, 0]);

var color = d3.scaleOrdinal()
  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y).tickFormat(d3.format(".2s"));

var y_orig = {};
var active_link = {};
var legendClicked = {};
var legendClassArray = {};

const graph = async (year, group, ydomain) => {

  if (group == "young") {
    var title = "Todesfälle nach Alter (Schweiz - " + year + " - 0-64 Jahre)";
  } else {
    var title = "Todesfälle nach Alter (Schweiz - " + year + " - 65- Jahre)";
  }

  active_link[group] = "0"; //to control legend selections and hover
  legendClicked[group]; //to control legend selections
  legendClassArray[group] = []; //store legend classes to select bars in plotSingle()
  y_orig[group]; //to store original y-posn

  d3.csv("data_processed/death_" + year + "_" + group + ".csv")
    .then(function(data) {

    color.domain(data.columns.filter(function(key) { return key !== "week"; }));

    data.forEach(function(d) {
      var myweek = d.week; //add to stock code
      var y0 = 0;
      d.ages = color.domain().map(function(name) { return {myweek:myweek, name: name, y0: y0, y1: y0 += +d[name]}; });
    });

    x.domain(data.map(function(d) { return d.week; }));
    y.domain([0, ydomain]);

    var svg = d3.select("#" + group).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "svg-" + group)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .call(xAxis)
      .attr("transform", "translate(0," + height + ")")
      .append("text")
      .attr("transform", "translate(" + (width + 20) + ",0)")
      .attr("dy", "-0.71em")
      .style("text-anchor", "end")
      .text("Woche");

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Todesfälle");

    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(title);

    var state = svg.selectAll(".state")
      .data(data)
      .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + "0" + ",0)"; });

    state.selectAll("rect")
      .data(function(d) {
        return d.ages;
      })
      .enter().append("rect")
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.y1); })
      .attr("x",function(d) { //add to stock code
        return x(d.myweek)
      })
      .attr("height", function(d) { return y(d.y0) - y(d.y1); })
      .attr("class", function(d) {
        classLabel = d.name.replace(/\s/g, ''); //remove spaces
        return "class" + classLabel;
      })
      .style("fill", function(d) { return color(d.name); });

    state.selectAll("rect")

     .on("mouseover", function(d,i){
        var delta = i.y1 - i.y0;
        var xPos = parseFloat(d3.select(this).attr("x"));
        var yPos = parseFloat(d3.select(this).attr("y"));
        var height = parseFloat(d3.select(this).attr("height"))
        d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);
        svg.append("text")
          .attr("x", xPos)
          .attr("y", yPos + height/2)
          .attr("class", group + "-tooltip")
          .text(i.name + ": " + delta);
      })

      .on("mouseout",function(){
        svg.select("." + group + "-tooltip").remove();
        d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);
      })

      var legend = svg.selectAll(".legend")
        .data(color.domain().slice().reverse())
        .enter().append("g")
        .attr("class", function (d) {
          legendClassArray[group].push(d.replace(/\s/g, '')); //remove spaces
          return "legend";
        })
        .attr("transform", function(d, i) { return "translate(50," + i * 20 + ")"; });

      //reverse order to match order in which bars are stacked
      legendClassArray[group] = legendClassArray[group].reverse();

      legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color)
        .attr("id", function (d, i) {
          return "id" + d.replace(/\s/g, '');
        })

      .on("mouseover",function() {
        if (active_link[group] === "0") d3.select(this).style("cursor", "pointer");
        else {
          if (active_link[group].split("class").pop() === this.id.split("id").pop()) {
            d3.select(this).style("cursor", "pointer");
          } else d3.select(this).style("cursor", "auto");
        }
      })

      .on("click",function(d, i) {
        if (active_link[group] === "0") { //nothing selected, turn on this selection
          d3.select(this)
            .style("stroke", "black")
            .style("stroke-width", 2);
            active_link[group] = this.id.split("id").pop();
            plotSingle(this);
            //gray out the others
            for (j = 0; j < legendClassArray[group].length; j++) {
              if (legendClassArray[group][j] != active_link[group]) {
                d3.select("#id" + legendClassArray[group][j])
                  .style("opacity", 0.5);
              }
            }
        } else { //deactivate
          if (active_link[group] === this.id.split("id").pop()) {//active square selected; turn it OFF
            d3.select(this)
              .style("stroke", "none");
            active_link[group] = "0"; //reset
            //restore remaining boxes to normal opacity
            for (j = 0; j < legendClassArray[group].length; j++) {
              d3.select("#id" + legendClassArray[group][j])
                .style("opacity", 1);
            }
            //restore plot to original
            restorePlot(d);
          }
        } //end active_link check
      });
  
      legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });
  
      function restorePlot(d) {
        state.nodes().forEach(function(d, i) {
          var nodes = d.childNodes;
          //restore shifted bars to original posn
          d3.select(nodes[idx])
            .transition()
            .duration(1000)
            .attr("y", y_orig[group][i]);
        })
        //restore opacity of erased bars
        for (i = 0; i < legendClassArray[group].length; i++) {
          if (legendClassArray[group][i] != class_keep) {
            d3.selectAll(".class" + legendClassArray[group][i])
              .transition()
              .duration(1000)
              .delay(750)
              .style("opacity", 1);
          }
        }
      }
  
      function plotSingle(d) {
        class_keep = d.id.split("id").pop();
        idx = legendClassArray[group].indexOf(class_keep);
        //erase all but selected bars by setting opacity to 0
        for (i = 0; i < legendClassArray[group].length; i++) {
          if (legendClassArray[group][i] != class_keep) {
            d3.selectAll(".class" + legendClassArray[group][i])
              .transition()
              .duration(1000)
              .style("opacity", 0);
          }
        }
        //lower the bars to start on x-axis
        y_orig[group] = [];

        state.nodes().forEach(function(d, i) {
          var nodes = d.childNodes;
          //get height and y posn of base bar and selected bar
          h_keep = d3.select(nodes[idx]).attr("height");
          y_keep = d3.select(nodes[idx]).attr("y");

          //store y_base in array to restore plot
          y_orig[group].push(y_keep);

          h_base = d3.select(nodes[0]).attr("height");
          y_base = d3.select(nodes[0]).attr("y");

          h_shift = h_keep - h_base;
          y_new = y_base - h_shift;

          //reposition selected bars
          d3.select(nodes[idx])
            .transition()
            .ease(d3.easeBounce)
            .duration(1000)
            .delay(750)
            .attr("y", y_new);
        })
     }
  })
  .catch(function(error){
    throw error;
  })

}

const build = async (year) => {
  await graph(year, "old", 2000);
  await graph(year, "young", 400);
}

var year = window.location.pathname
  .split("/")
  .pop()
  .match(/index_([0-9]+).html/)
  .pop();
    
build(year);
