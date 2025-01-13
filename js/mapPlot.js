// mapPlot.js

class MapPlot {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 10, right: 10, bottom: 10, left: 10 };
        this.projection = null;
        this.geoPath = null;
        this.colorScale = d3.scaleOrdinal(d3.schemeTableau10);
        this.tooltip = null;
    }

    async init(geoJsonUrl) {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`MapPlot container #${this.containerId} not found`);
            return;
        }

        // Ensure minimal dimension
        const cWidth = Math.max(container.clientWidth, 300);
        const cHeight = Math.max(container.clientHeight, 300);

        this.width = cWidth - this.margin.left - this.margin.right;
        this.height = cHeight - this.margin.top - this.margin.bottom;

        this.svg = d3
            .select(container)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.projection = d3
            .geoMercator()
            .scale((this.width / 2 / Math.PI) * 1.5)
            .translate([this.width / 2, this.height / 1.4]);

        this.geoPath = d3.geoPath(this.projection);

        const g = this.svg.append("g");

        // tooltips
        this.tooltip = d3
            .select(container)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        try {
            const geoData = await d3.json(geoJsonUrl);
            g.selectAll("path")
                .data(geoData.features)
                .enter()
                .append("path")
                .attr("d", this.geoPath)
                .attr("fill", "#d3d3d3")
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5);

            // add zoom
            const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
            this.svg.call(zoom);
        } catch (err) {
            console.error("Error loading geojson:", err);
        }
    }

    /**
     * Renders an array of { lat, lon, orgName? }
     * groupBy = "orgName" or ""
     */
    renderLocations(locations, groupBy = "") {
        const g = this.svg.select("g");
        g.selectAll("circle.location-circle").remove();

        if (!Array.isArray(locations)) return;

        g.selectAll("circle.location-circle")
            .data(locations)
            .enter()
            .append("circle")
            .attr("class", "location-circle")
            .attr("cx", (d) => this.projection([d.lon, d.lat])[0])
            .attr("cy", (d) => this.projection([d.lon, d.lat])[1])
            .attr("r", 4)
            .attr("fill-opacity", 0.8)
            .attr("fill", (d) => {
                if (!groupBy) return "#e74c3c";
                const val = d[groupBy] || "Unknown";
                return this.colorScale(val);
            })
            .on("mouseover", (event, d) => {
                this.tooltip.transition().duration(200).style("opacity", 0.9);
                this.tooltip
                    .html(`Location: ${d.lat}, ${d.lon}<br>Org: ${d.orgName || "?"}`)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => {
                this.tooltip.transition().duration(300).style("opacity", 0);
            });
    }
}