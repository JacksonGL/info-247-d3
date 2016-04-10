// Modified based on the code availble at
// http://bl.ocks.org/jasondavies/1341281
// Author: Liang Gong

(function () {
    var margin = {
            top: 30,
            right: 10,
            bottom: 10,
            left: 10
        },
        width = 900 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;
    
    var x = d3.scale.ordinal().rangePoints([0, width], 1),
        y = {},
        dragging = {};
    
    var line = d3.svg.line(),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;
        
    /* Initialize tooltip */
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) { 
            return d.university_name
        });
    
    var svg = d3.select("#parallel_coor_container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(tip);
    
    String.prototype.replaceAt=function(index, character) {
        return this.substr(0, index) + character + this.substr(index+character.length);
    }
        
    function display_name(prop) {
        var name = prop.replace(/_/g, ' ');
        for(var i=0;i<name.length;i++) {
            if(i === 0) {
                name = name.replaceAt(i, name.charAt(i).toUpperCase());
            }
            if(name[i] === ' ' && i + 1 < name.length) {
                name = name.replaceAt(i+1, name.charAt(i+1).toUpperCase());
            }
        }
        return name;
    }
    
    d3.csv("/data/timesData_selected.csv", function(error, univ_data) {
        // Extract the list of dimensions and create a scale for each.
        
        // reorder the display of different dimensions
        d_keys = ["world_rank",  "teaching", "research", "citations", 
            "student_staff_ratio", "female_male_ratio", 
            "international", "international_students(%)",]
            
        // x.domain(dimensions = d3.keys(univ_data[0]).filter(function(d) {
        x.domain(dimensions = d_keys.filter(function(d) {
            var start = height, end = 0;    
            if (d === "world_rank") {
                start = 0, end = height;
            }
            return d != "university_name" &&
                d != "country" &&
                // d != "world_rank" &&
                // d != "teaching" &&
                d != "international" &&
                // d != "research" &&
                d != "citations" &&
                d != "income" &&
                d != "total_score" &&
                d != "num_students" &&
                // d != "student_staff_ratio" &&
                // d != "international_students(%)" &&
                // d != "female_male_ratio" &&
                d != "year" &&
                (y[d] = d3.scale.linear()
                    .domain(d3.extent(univ_data, function(p) {
                        return +p[d];
                    }))
                    .range([start, end]));
        }));
        
        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(univ_data)
            .enter().append("path")
            .attr("d", path)
            .attr("id", path_id)
            .attr("style", fill_line_background)
    
        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(univ_data)
            .enter().append("path")
            .attr("d", path)
            .attr("id", path_id)
            .attr("x", function(d) { return 100; })
            .attr("y", function(d) { return 100; })
            .attr("style", fill_line)
            /*.on('mouseover', function(d) {
                $(this)
                    .css('stroke-width', '6px');
            })
            .on('mouseout', function(d) {
                $(this)
                    .css('stroke-width', '1px');
            })*/
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
          
            
            
    
        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) {
                return "translate(" + x(d) + ")";
            })
            .call(d3.behavior.drag()
                .origin(function(d) {
                    return {
                        x: x(d)
                    };
                })
                .on("dragstart", function(d) {
                    dragging[d] = x(d);
                    background.attr("visibility", "hidden");
                })
                .on("drag", function(d) {
                    dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                    foreground.attr("d", path);
                    dimensions.sort(function(a, b) {
                        return position(a) - position(b);
                    });
                    x.domain(dimensions);
                    g.attr("transform", function(d) {
                        return "translate(" + position(d) + ")";
                    })
                })
                .on("dragend", function(d) {
                    delete dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                    transition(foreground).attr("d", path);
                    background
                        .attr("d", path)
                        .transition()
                        .delay(500)
                        .duration(0)
                        .attr("visibility", null);
                }));
    
        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) {
                if (d === "female_male_ratio") {
                    return "Female (%)";
                } else if (d === 'student_staff_ratio') {
                    return "Student vs Staff Ratio"
                }
                return display_name(d);
            });
    
        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    });
    
    function position(d) {
        var v = dragging[d];
        return v == null ? x(d) : v;
    }
    
    function transition(g) {
        return g.transition().duration(500);
    }
    
    function final_data_guard(val) {
        if (val !== val)
            return -1;
        return val;
    }
    
    function trim_str (str) {
        if (typeof str === 'string') {
            str = str.replace(/^[\s]+/g, '');
            str = str.replace(/[\s]+$/g, '');
        }
        return str
    }
    
    
    function parse_rank(data) {
        if(typeof data === 'string' && data[0] === '=') {
            data = data.substring(1, data.length);
        } else if (typeof data === 'string' && data.indexOf('-') >= 0) {
            var min_rank = data.substring(0, data.indexOf('-'));
            min_rank = parseInt(min_rank, 10);
            var max_rank = data.substring(data.indexOf('-') + 1, data.length);
            max_rank = parseInt(max_rank, 10);
            data = (min_rank + Math.random() * (max_rank - min_rank)) | 0;
        }
        data = parseInt(data, 10)
        return data;
    }

    function get_data(prop, dataset) {
        var data = dataset[prop];
        if (prop === "world_rank") {
            data = parse_rank(data);
        } else if (prop === "international_students") {
            if (typeof data === 'string' && data[data.length] === '%') {
                data = data.substring(0, data.length - 1);
            }
            data = parseFloat(data);
        } else if (prop === "num_students") {
            if (typeof data === 'string') {
                data = data.replace('"', "").replace('"', "");
                data = data.replace(',', "")
            }
        } else if (prop === 'female_male_ratio') {
            if (typeof data === 'string') {
                data = trim_str(data);
                if (data === '') {
                    data = '0.5'
                } else if (data.indexOf(':') < 0) {
                    // then data is a floating point
                    // number string e.g., '0.51'
                    // do nothing
                } else {
                    var first_col_pos = data.indexOf(':');
                    var second_col_pos = data.indexOf(':', first_col_pos + 1);
                    if (second_col_pos < 0) {
                        second_col_pos = data.length;
                    }
                    var numerator = data.substring(0, first_col_pos);
                    var denominator = data.substring(first_col_pos + 1, second_col_pos);
                    var ratio = parseInt(numerator) / (parseInt(numerator) + parseInt(denominator));
                    data = '' + ratio;
                }
                if (data !== '100') {
                    var num = parseFloat(data);
                    data = (num > 1 ? 1 : num) * 100 + '';
                }
                if (data !== data) {
                    data = '50';
                }
            }
        }
        return data;
    }
    
    
    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function(p) {
            // console.log(p)
                // console.log(x(p))
                // console.log(y[p])
                // console.log(d[p])
            // console.log(y[p](d[p]))
            var data = get_data(p, d);
            var ret1 = final_data_guard(position(p));
            var ret2 = final_data_guard(y[p](data));
            return [ret1, ret2];
        }));
    }
    
    
    function digit2char(num) {
        if (num < 10) {
            return num + '';
        } else {
            switch(num) {
                case 10: return 'a';
                case 11: return 'b';
                case 12: return 'c';
                case 13: return 'd';
                case 14: return 'e';
            }
        }
        return 'f';
    }
    
    function fill_line(d) {
        var rank = parse_rank(d.world_rank);
        // rank  = 800 - rank;
        var color_char = digit2char((14 * rank/800) | 0)
        return "stroke: #f" + color_char 
            + "4; stroke-opacity:0.5; stroke-width: 2px;";
        // return "stroke: #72" + color_char + ";";
    }
    
    function fill_line_background(d) {
        var rank = parse_rank(d.world_rank);
        // rank  = 800 - rank;
        var color_char = digit2char(10 + (4 * rank/800) | 0)
        return "stroke: #" + color_char + color_char + color_char 
            + ";stroke-opacity:0.3; stroke-width: 2px;";
    }
    
    // Returns the id for a given data_point
    function path_id(d) {
        var rank = parse_rank(d.world_rank);
        return "path_rank_" + rank;
    }
    
    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }
    
    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = dimensions.filter(function(p) {
                return !y[p].brush.empty();
            }),
            extents = actives.map(function(p) {
                return y[p].brush.extent();
            });
        foreground.style("display", function(d) {
            return actives.every(function(p, i) {
                return extents[i][0] <= get_data(p, d) && get_data(p, d) <= extents[i][1];
            }) ? null : "none";
        });
    }
})();