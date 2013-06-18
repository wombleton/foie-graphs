var chart;

d3.json('data.json', function(data) {
    var i,
        lines = 0;

    for (i = 0; i < data.length; i++) {
        if (data[i].values.length > lines) {
            lines = data[i].values.length;
        }
    }

    document.getElementsByTagName('svg')[0].setAttribute('style', 'height: ' + (lines * 30));

    nv.addGraph(function() {
        var chart = nv.models.multiBarHorizontalChart()
            .stacked(true)
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .margin({top: 30, right: 20, bottom: 50, left: 350})
            .tooltips(true)
            .showControls(false);

        chart.yAxis
            .tickFormat(d3.format(',f'));

        d3.select('svg')
            .datum(data)
            .transition().duration(500)
            .call(chart);

        setTimeout(function() {
            var i;

            for (i = 0; i < data.length; i++) {
                data[i].values = _.shuffle(data[i].values);
            }

            d3.select('svg')
                .datum(data)
                .transition().duration(500)
                .call(chart);
        }, 5000);

        nv.utils.windowResize(chart.update);

        return chart;
    });
});
