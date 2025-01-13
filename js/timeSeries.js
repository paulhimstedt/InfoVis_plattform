// timeSeries.js

class TimeSeriesPlot {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 30, right: 20, bottom: 50, left: 60 };
        this.colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        // We'll create a tooltip inside the container instead of body
        this.tooltip = null;
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`TimeSeriesPlot container #${this.containerId} not found`);
            return;
        }

        // Ensure minimal width/height so no negative brush rect
        const cWidth = Math.max(container.clientWidth, 200);
        const cHeight = Math.max(container.clientHeight, 200);

        this.width = cWidth - this.margin.left - this.margin.right;
        this.height = cHeight - this.margin.top - this.margin.bottom;

        this.svg = d3
            .select(container)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // Create a tooltip div inside container
        this.tooltip = d3
            .select(container)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    /**
     * @param {Array} data - array of { date: Date, [feature]: number, ... }
     * @param {string} feature - numeric key (e.g. 'count' or 'fps')
     * @param {string} aggregation - 'sum' or 'mean'
     * @param {string} groupBy - if set, data is grouped by data[groupBy]
     */
    render(data, feature = "count", aggregation = "sum", groupBy = "") {
        this.svg.selectAll("*").remove();
        if (!data || data.length === 0) {
            return;
        }

        // Step 1: attach a hidden field for group if not present
        data.forEach((d) => {
            if (!groupBy) {
                d._group = "All";
            } else {
                // If the data does not really have "production_country" or so,
                // you’d need that property on each row. Otherwise fallback:
                d._group = d[groupBy] || "Undefined";
            }
        });

        // Step 2: group data
        const grouped = d3.group(data, (d) => d._group);

        // Roll up by date
        const groupsArray = [];
        for (let [groupName, arr] of grouped.entries()) {
            // each arr is an array of data points with the same group
            // roll up by date
            // d3.rollups => [ [ dateValue, aggregatorResult ], ... ]
            const rolled = d3.rollups(
                    arr,
                    (v) => {
                        return aggregation === "sum" ?
                            d3.sum(v, (x) => x[feature]) :
                            d3.mean(v, (x) => x[feature]);
                    },
                    (d) => +d.date // date’s numeric time value
                )
                .map(([dateNum, val]) => ({
                    date: new Date(dateNum),
                    value: val,
                }))
                .sort((a, b) => a.date - b.date);

            groupsArray.push({
                group: groupName,
                values: rolled,
            });
        }

        // Flatten all for domain
        const allValues = groupsArray.flatMap((g) => g.values);
        const xDomain = d3.extent(allValues, (d) => d.date);
        const yMax = d3.max(allValues, (d) => d.value);

        const xScale = d3.scaleTime().domain(xDomain).range([0, this.width]);
        const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([this.height, 0]);

        // Axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);
        this.svg
            .append("g")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxis);
        this.svg.append("g").call(yAxis);

        // Line generator
        const lineGen = d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.value))
            .curve(d3.curveMonotoneX);

        // Draw each group’s line
        groupsArray.forEach((g, i) => {
            this.svg
                .append("path")
                .datum(g.values)
                .attr("fill", "none")
                .attr("stroke", this.colorScale(g.group))
                .attr("stroke-width", 2)
                .attr("d", lineGen);

            // group label
            this.svg
                .append("text")
                .attr("x", this.width - 80)
                .attr("y", 20 + i * 15)
                .attr("fill", this.colorScale(g.group))
                .style("font-size", "12px")
                .text(g.group);
        });

        // Add brush for zoom
        const brush = d3
            .brushX()
            .extent([
                [0, 0],
                [this.width, this.height],
            ])
            .on("end", (event) => this._onBrushEnd(event, xScale, lineGen, groupsArray));

        this.svg.append("g").attr("class", "brush").call(brush);

        // Mouse move tooltip
        const mouseRect = this.svg
            .append("rect")
            .attr("class", "mouse-rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "none")
            .attr("pointer-events", "all");

        mouseRect
            .on("mousemove", (event) => {
                const [mx, my] = d3.pointer(event, this.svg.node());
                const date = xScale.invert(mx);
                // For a single group scenario, we could find the nearest data point, but we have multiple lines
                // We'll just show the date in the tooltip. You can get fancier with bisectors for each group.
                this.tooltip
                    .style("opacity", 0.9)
                    .html(`Date: ${date.toISOString().slice(0, 10)}`)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => {
                this.tooltip.style("opacity", 0);
            });
    }

    _onBrushEnd(event, xScale, lineGen, groupsArray) {
        const selection = event.selection;
        if (!selection) {
            // no selection => reset
            return;
        }
        const [x0, x1] = selection;
        // new domain
        const newDomain = [xScale.invert(x0), xScale.invert(x1)];
        xScale.domain(newDomain);

        // remove brush
        this.svg.select(".brush").call(d3.brush().move, null);

        // update x-axis
        this.svg.selectAll("g.x-axis").remove();
        const xAxis = d3.axisBottom(xScale);
        this.svg
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxis);

        // update lines
        // A more robust approach is to select them by a class or data
        // For simplicity:
        this.svg
            .selectAll("path")
            .transition()
            .attr("d", function(d) {
                // some of them might not be bound to data (like brush rect).
                if (!Array.isArray(d)) return null;
                return lineGen.x((pt) => xScale(pt.date))(d);
            });
    }
}