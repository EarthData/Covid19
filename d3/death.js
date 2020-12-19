

const geolong = {CH: "CH", CH011: "VD", CH012: "VS", CH013: "GE", CH021: "BE", CH022: "FR", CH023: "SO", CH024: "NE", CH025: "JU", CH031: "BS", CH032: "BL", CH033: "AG", CH040: "ZH", CH051: "GL", CH052: "SH", CH053: "AR", CH054: "AI", CH055: "SG", CH056: "GR", CH057: "TG", CH061: "LU", CH062: "UR", CH063: "SZ", CH064: "OW", CH065: "NW", CH066: "ZG", CH070: "TI"};
const geoshort = {CH: "Switzerland", VD: "Vaud", VS: "Valais", GE: "Genève", BE: "Bern", FR: "Freiburg", SO: "Solothurn", NE: "Neuchâtel", JU: "Jura", BS: "Basel-Stadt", BL: "Basel-Landschaft", AG: "Aargau", ZH: "Zürich", GL: "Glarus", SH: "Schaffhausen", AR: "Appenzell Ausserrhoden", AI: "Appenzell Innerrhoden", SG: "St. Gallen", GR: "Graubünden", TG: "Thurgau", LU: "Luzern", UR: "Uri", SZ: "Schwyz", OW: "Obwalden", NW: "Nidwalden", ZG: "Zug", TI: "Ticino"};

const parseDay           = d3.timeParse("%Y-%m-%d");
const parseWeek          = d3.timeParse("%Y-%W");
const year_week_formater = d3.timeFormat('%Y-%W');
const week_formater      = d3.timeFormat('%W');
const year_formater      = d3.timeFormat('%Y');

const graph = async function() {

  var cum_data = {};
  cum_data['death_data'] = await load_death();
  cum_data['corona_data'] = await load_corona();

  var death_data = cum_data['death_data']['2020']
  death_data['geo'] = cum_data['death_data']['geo']
  var chart_data_keys = cum_data['death_data']['week']
  var corona_data = cum_data['corona_data']['2020']
  corona_data['geo'] = cum_data['corona_data']['geo']

  var chart_data = {};
  var sum_data = {};

  for (var geo of death_data['geo']) {
    chart_data[geo] = [];
    sum_data[geo] = [];
    for (var week in death_data[geo]) {
      week = parseInt(week);
      var values = {}
      var lastweek = week-1;
      values['timePeriod'] = week;
      var total = 0
      for (var age in death_data[geo][week]) {
        values[age] = death_data[geo][week][age]['T']
        total += death_data[geo][week][age]['T']
      };
      sum_data[geo].push(total);
      chart_data[geo].push(values)
    };
  };

  var line_data = {};
  var sum_corona_data = {};

  for (var geo of corona_data['geo']) {
    line_data[geo] = [];
    for (var week in death_data[geo]) {
      if (!sum_corona_data[week]) {
         sum_corona_data[week] = 0;
      }
      var values = {}
      values['timePeriod'] = parseInt(week);
      if (corona_data[geo][week-1]) {
        values['corona'] = parseInt(corona_data[geo][week]) - parseInt(corona_data[geo][week-1])
      } else if (corona_data[geo][week]) {
        values['corona'] = parseInt(corona_data[geo][week])
      } else {
        values['corona'] = 0
      }
      sum_corona_data[week] += parseInt(corona_data[geo][week])
      line_data[geo].push(values)
    };
  };

  line_data['CH'] = [];
  for (var week in death_data['CH']) {
    var values = {}
    values['timePeriod'] = parseInt(week);
    if (sum_corona_data[week-1]) {
      values['corona'] = sum_corona_data[week] - sum_corona_data[week-1]
    } else if (sum_corona_data[week]) {
      values['corona'] = sum_corona_data[week]
    } else {
      values['corona'] = 0
    }
    line_data['CH'].push(values)
  }

  console.log(line_data['VD']);

  const keys_orig = ['Y0T4', 'Y5T9', 'Y10T14', 'Y15T19', 'Y20T24', 'Y25T29', 'Y30T34', 'Y35T39', 'Y40T44', 'Y45T49', 'Y50T54', 'Y55T59', 'Y60T64', 'Y65T69', 'Y70T74', 'Y75T79', 'Y80T84', 'Y85T89', 'Y_GE90']
  const keys = keys_orig.reverse();

  var divWidth = 1200;
  var divHeight = 800;
  var margin = {top: 20, right: 20, bottom: 30, left: 40}
    width = divWidth - margin.left - margin.right,
    height = divHeight - margin.top - margin.bottom;

  // set x scale
  var x = d3.scaleBand()
    .rangeRound([0, width - 80])
    .paddingInner(0.05)
    .align(0.1)

  // set y scale
  var y = d3.scaleLinear()
    .rangeRound([height, 0]);

  // set the colors
  //var colors = d3.schemeSpectral[11].reverse();
  var colors = d3.schemeSpectral[11];

  //var colors = d3.scaleSequential().domain([1, 19]).range([0, 1])
  //console.log(colors)

  var z = d3.scaleOrdinal()
    .range(colors);

  Object.keys(chart_data).forEach(function(region) {

    x.domain(chart_data_keys);
    y.domain([0, d3.max(sum_data[region]) + d3.max(sum_data[region])*0.2 ]).nice();
    z.domain(keys);

    var svg = d3.select("body")
      .append("div")
      .attr("width", divWidth)
      .attr("height", divHeight)
      .attr("id", region)
      .attr("style", "margin: 50px")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 " + divWidth  + " " + divHeight);

    var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append("text")
      .attr("x", 30)
      .attr("y", 00)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text(geoshort[region])
      .attr("font-family", "sans-serif")
      .style("fill", "#000000");

    g.append("g")
      .selectAll("g")
      .data(d3.stack().keys(keys)(chart_data[region]))
      .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("x", function(d) { return x(d.data['timePeriod']); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth())
      .on("mouseover", function() { tooltip.style("display", null); })
      .on("mouseout", function() { tooltip.style("display", "none"); })
      .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - 5;
        var yPosition = d3.mouse(this)[1] - 5;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text(d[1]-d[0]);
      });

    g.append('path')
      .datum(line_data[region])
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 3.0)
      .attr("d", d3.line()
        //.curve(d3.curveCatmullRomOpen)
        .x(function(d) { return x(d['timePeriod']) + x.bandwidth()/2 })
        .y(function(d) { return y(d['corona']) })
        )

    g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
      .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start");

    var legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

    legend.append("text")
      .attr("x", width - 30)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });

    // Prep the tooltip bits, initial display is hidden
    var tooltip = svg.append("g")
      .attr("class", "tooltip-" + region)
      .style("display", "none")

    tooltip.append("rect")
      .attr("width", 60)
      .attr("height", 20)
      .attr("fill", "white")
      .style("opacity", 0.5);

    tooltip.append("text")
      .attr("x", 30)
      .attr("dy", "1.2em")
      .style("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");

  });
};

const load_corona = async () => {

  var corona_data = {};

  raw = await load_data('corona.csv');

  var dsv = d3.dsvFormat(',');
  var data = dsv.parse(raw);

  data.forEach(function(d) {
    var absolute_date = parseDay(d['date']);
    d['TIME_PERIOD']  = absolute_date;
    d['YEAR']         = year_formater(new Date(absolute_date))
    d['WEEK']         = parseInt(week_formater(new Date(absolute_date)));
  });

  corona_data['year']        = d3.map(data, function(d){return(d['YEAR'])}).keys()
  corona_data['week']        = d3.map(data, function(d){return(d['WEEK'])}).keys()
  corona_data['geo']         = d3.map(data, function(d){return(d['abbreviation_canton_and_fl'])}).keys()
  corona_data['timePeriod']  = d3.map(data, function(d){return d['TIME_PERIOD']}).keys()
  corona_data['timePeriod']  = d3.map(data, function(d){return d['WEEK']}).keys()

  corona_data['geo'] = corona_data['geo'].filter((value)=>value!='FL');
  
  corona_data['year'].map((value0, index0) => {
    corona_data[value0] = {}
    corona_data['geo'].map((value1, index1) => {
      corona_data[value0][value1] = {}
      corona_data['timePeriod'].map((value2, index2) => {
        corona_data[value0][value1][value2] = 0;
      });
    });
  });
  
  for (var i = 0; i < data.length; i++) {
    if (data[i]['abbreviation_canton_and_fl'] == "FL") {
      continue;
    }
    if (data[i]['ncumul_deceased'] != "" && data[i]['ncumul_deceased'] > corona_data[data[i]['YEAR']][data[i]['abbreviation_canton_and_fl']][data[i]['WEEK']]) {
      corona_data[data[i]['YEAR']][data[i]['abbreviation_canton_and_fl']][data[i]['WEEK']] = parseInt(data[i]['ncumul_deceased'])
    }
  };

  return Promise.resolve(corona_data);

}

const load_death = async () => {

  var death_data = {};

  raw = await load_data('death.csv');

  var dsv = d3.dsvFormat(';');
  var data = dsv.parse(raw);

  data.forEach(function(d) {
    var year_week     = d['TIME_PERIOD'].slice(0,4) + "-" + parseInt(d['TIME_PERIOD'].slice(6));
    var absolute_date = parseWeek(year_week);
    d['TIME_PERIOD']  = parseWeek(year_week);
    d['YEAR']         = year_formater(new Date(absolute_date));
    d['WEEK']         = parseInt(week_formater(new Date(absolute_date)));
    d['GEO']          = geolong[d['GEO']];
  });

  death_data['year']        = d3.map(data, function(d){return d['YEAR']}).keys()
  death_data['week']        = d3.map(data, function(d){return d['WEEK']}).keys()
  death_data['geo']         = d3.map(data, function(d){return d['GEO']}).keys()
  death_data['timePeriod']  = d3.map(data, function(d){return d['TIME_PERIOD']}).keys()
  death_data['timePeriod']  = d3.map(data, function(d){return d['WEEK']}).keys()
  death_data['age']         = d3.map(data, function(d){return d['AGE']}).keys()
  death_data['sex']         = d3.map(data, function(d){return d['SEX']}).keys()

  death_data['age'].splice( death_data['age'].indexOf('_T'), 1 );

  death_data['year'].map((value0, index0) => {
    death_data[value0] = {}
    death_data['geo'].map((value1, index1) => {
      death_data[value0][value1] = {}
      death_data['timePeriod'].map((value2, index2) => {
        death_data[value0][value1][value2] = {}
        death_data['age'].map((value3, index3) => {
          death_data[value0][value1][value2][value3] = {}
          death_data['sex'].map((value4, index4) => {
            death_data[value0][value1][value2][value3][value4] = 0
          });
        });
      });
    });
  });

  for (var i = 0; i < data.length; i++) {
    if (data[i]['AGE'] != "_T") {
      death_data[data[i]['YEAR']][data[i]['GEO']][data[i]['WEEK']][data[i]['AGE']][data[i]['SEX']] = parseInt(data[i]['Obs_value'])
    }
  }

  return Promise.resolve(death_data);

};

async function load_data(file) {
  const data = await d3.text(file);
  return data;
}

graph();

