function process(raw) {
    var bodies;

    bodies = _.sortBy(raw, function(value) {
        return value.total;
    }).reverse();

    return _.reduce(bodies, function(memo, body) {
        memo[0].values.push({
            label: body.title,
            value: body.successful
        });
        memo[1].values.push({
            label: body.title,
            value: body.unsuccessful
        });
        memo[2].values.push({
            label: body.title,
            value: body.not_held
        });
        memo[3].values.push({
            label: body.title,
            value: body.waiting
        });

        return memo;
    }, [
        {
            key: "Successful",
            color: "#1f77b4",
            values: []
        },
        {
            key: "Unsuccessful",
            color: "#d62728",
            values: []
        },
        {
            key: "Not Held",
            color: "#888",
            values: []
        },
        {
            key: "Waiting",
            color: "#D9D2B6",
            values: []
        }
    ]);
}

function drawGraph() {
    var url = 'data.json',
        year = $('button.active').attr('data-year');

    if (year !== 'all') {
        url += '?year=' + year;
    }

    d3.json(url, function(raw) {
        var data = process(raw);

        document.getElementsByTagName('svg')[0].setAttribute('style', 'height: ' + (data[0].values.length * 30) + 'px');

        nv.graphs.shift();
        nv.addGraph(function() {
            var chart = nv.models.multiBarHorizontalChart()
                .stacked(true)
                .x(function(d) { return d.label })
                .y(function(d) { return d.value })
                .margin({top: 30, right: 20, bottom: 50, left: 350})
                .tooltip(function(key, x, y, e, graph) {
                    return '<h3>' + x + '</h3><h3>' + key + '</h3><p>' + y + '</p>';
                })
                .tooltips(true)
                .showControls(false);

            chart.yAxis
                .tickFormat(d3.format(',f'));

            d3.select('svg').empty();

            d3.select('svg')
                .datum(data)
                .transition().duration(500)
                .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });
    })
}

$(document).ready(drawGraph);

$(document).on('click', 'button', function() {
    _.delay(drawGraph, 10);
});
