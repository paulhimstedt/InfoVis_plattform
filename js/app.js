// app.js

let globalData = null;
let allTiles = []; // store all tile objects here (both default + dynamic)

document.addEventListener("DOMContentLoaded", async() => {
    // 1) Load data
    globalData = await loadData();

    // 2) Initialize global filters
    initGlobalFilters();

    // 3) Create the two default tiles
    createDefaultTiles();

    // 4) Attach event listener to create new tile
    document.getElementById("create-tile-btn").addEventListener("click", createNewTile);

    // 5) Apply default filters (to show something) 
    const years = globalData.moviesData
        .map((m) => (m.date_of_production ? m.date_of_production.getFullYear() : null))
        .filter((y) => y);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    applyFiltersAndUpdate({ yearRange: [minYear, maxYear] });
});

function initGlobalFilters() {
    const years = globalData.moviesData
        .map((m) => (m.date_of_production ? m.date_of_production.getFullYear() : null))
        .filter((y) => y);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    initFilters(
        globalData,
        (filters) => applyFiltersAndUpdate(filters),
        (movieA, movieB) => handleCompare(movieA, movieB), { yearRange: [minYear, maxYear] }
    );
}

function createDefaultTiles() {
    // 1) Default Time Series tile
    const timeSeriesTileEl = document.getElementById("default-time-series-tile");
    const timeSeriesChartEl = document.getElementById("default-time-series-chart");
    const tileObj1 = createTimeSeriesTile(
        timeSeriesTileEl,
        timeSeriesChartEl,
        /* default variable= */
        "count",
        /* default grouping= */
        "",
        /* default aggregator= */
        "sum"
    );
    allTiles.push(tileObj1);

    // 2) Default Map tile
    const mapTileEl = document.getElementById("default-map-tile");
    const mapChartEl = document.getElementById("default-map-chart");
    const tileObj2 = createMapTile(
        mapTileEl,
        mapChartEl,
        /* default grouping= */
        ""
    );
    allTiles.push(tileObj2);
}

/**
 * This is invoked whenever the global filters are changed (country/yearRange).
 */
function applyFiltersAndUpdate({ country = "", yearRange = [null, null] }) {
    // Filter the movies based on country + year range
    const filteredMovies = globalData.moviesData.filter((m) => {
        // filter by country
        const inCountry = !country || m.production_country === country;

        // filter by year range
        let inYearRange = true;
        if (yearRange[0]) {
            const y = m.date_of_production ? m.date_of_production.getFullYear() : null;
            if (y && y < yearRange[0]) inYearRange = false;
        }
        if (yearRange[1]) {
            const y = m.date_of_production ? m.date_of_production.getFullYear() : null;
            if (y && y > yearRange[1]) inYearRange = false;
        }

        return inCountry && inYearRange;
    });

    // For each tile, call its .update() method with the filtered data
    allTiles.forEach((tile) => {
        tile.update(filteredMovies, globalData.segmentsData);
    });
}

function handleCompare(movieAId, movieBId) {
    if (!movieAId || !movieBId || movieAId === movieBId) {
        alert("Please select two different movies for comparison.");
        return;
    }
    const movieA = globalData.moviesData.find((m) => m.video_id === movieAId);
    const movieB = globalData.moviesData.find((m) => m.video_id === movieBId);

    if (!movieA || !movieB) {
        alert("One or both movies not found in dataset.");
        return;
    }

    alert(
        `Comparison:\n` +
        `${movieA.title} (Produced: ${
        movieA.date_of_production ? movieA.date_of_production.getFullYear() : "N/A"
      })\n` +
        `vs.\n` +
        `${movieB.title} (Produced: ${
        movieB.date_of_production ? movieB.date_of_production.getFullYear() : "N/A"
      })\n`
    );
}

/**
 * Creates a brand-new tile from scratch, based on user’s selection of tile type.
 */
function createNewTile() {
    const tileTypeSelect = document.getElementById("tile-type");
    const tileType = tileTypeSelect.value; // "time-series" or "map"

    // Create a container in #tiles-container
    const container = document.getElementById("tiles-container");

    const tileContainer = document.createElement("div");
    tileContainer.className = "tile";
    tileContainer.id = `tile-${Date.now()}`; // unique ID

    const tileHeader = document.createElement("div");
    tileHeader.className = "tile-header";

    const h2 = document.createElement("h2");
    h2.textContent = `New ${tileType === "time-series" ? "Time Series" : "Map"} Tile`;
    tileHeader.appendChild(h2);

    // Controls for this tile
    const tileControlsDiv = document.createElement("div");
    tileControlsDiv.className = "tile-controls";
    tileHeader.appendChild(tileControlsDiv);

    if (tileType === "time-series") {
        // Variable:
        const varLabel = document.createElement("label");
        varLabel.textContent = "Variable:";
        tileControlsDiv.appendChild(varLabel);

        const varSelect = document.createElement("select");
        varSelect.className = "tile-variable-select";
        ["count", "fps", "frames_total"].forEach((v) => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            varSelect.appendChild(opt);
        });
        tileControlsDiv.appendChild(varSelect);

        // Grouping:
        const groupLabel = document.createElement("label");
        groupLabel.textContent = "Grouping:";
        tileControlsDiv.appendChild(groupLabel);

        const groupSelect = document.createElement("select");
        groupSelect.className = "tile-group-select";
        const noGroupOpt = document.createElement("option");
        noGroupOpt.value = "";
        noGroupOpt.textContent = "(No grouping)";
        groupSelect.appendChild(noGroupOpt);
        const countryGroupOpt = document.createElement("option");
        countryGroupOpt.value = "production_country";
        countryGroupOpt.textContent = "Production Country";
        groupSelect.appendChild(countryGroupOpt);
        tileControlsDiv.appendChild(groupSelect);

        // Aggregation:
        const aggLabel = document.createElement("label");
        aggLabel.textContent = "Aggregation:";
        tileControlsDiv.appendChild(aggLabel);

        const aggSelect = document.createElement("select");
        aggSelect.className = "tile-agg-select";
        ["sum", "mean"].forEach((agg) => {
            const opt = document.createElement("option");
            opt.value = agg;
            opt.textContent = agg;
            aggSelect.appendChild(opt);
        });
        tileControlsDiv.appendChild(aggSelect);

    } else if (tileType === "map") {
        // Grouping:
        const groupLabel = document.createElement("label");
        groupLabel.textContent = "Grouping:";
        tileControlsDiv.appendChild(groupLabel);

        const groupSelect = document.createElement("select");
        groupSelect.className = "tile-group-select";
        const noGroupOpt = document.createElement("option");
        noGroupOpt.value = "";
        noGroupOpt.textContent = "(No grouping)";
        groupSelect.appendChild(noGroupOpt);

        const orgOpt = document.createElement("option");
        orgOpt.value = "orgName";
        orgOpt.textContent = "Organization Name";
        groupSelect.appendChild(orgOpt);

        tileControlsDiv.appendChild(groupSelect);
    }

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-tile-btn";
    deleteBtn.textContent = "Delete";
    tileHeader.appendChild(deleteBtn);

    // Chart container
    const chartDiv = document.createElement("div");
    chartDiv.className = "vis-container";
    chartDiv.id = `${tileContainer.id}-chart`;
    tileContainer.appendChild(tileHeader);
    tileContainer.appendChild(chartDiv);

    container.appendChild(tileContainer);

    // Now we create either a time series or map tile object
    let tileObj;
    if (tileType === "time-series") {
        tileObj = createTimeSeriesTile(tileContainer, chartDiv, "count", "", "sum");
    } else {
        tileObj = createMapTile(tileContainer, chartDiv, "");
    }
    allTiles.push(tileObj);
}

/**
 * Create a "Time Series" tile object (with references to DOM + the chart instance).
 */
function createTimeSeriesTile(tileContainerEl, chartEl, defaultVar, defaultGroup, defaultAgg) {
    // Initialize the time series
    const tsPlot = new TimeSeriesPlot(chartEl.id);
    tsPlot.init();

    const tileObj = {
        id: tileContainerEl.id,
        type: "time-series",
        instance: tsPlot,
        update: (filteredMovies) => {
            const variableSelect = tileContainerEl.querySelector(".tile-variable-select");
            const groupSelect = tileContainerEl.querySelector(".tile-group-select");
            const aggSelect = tileContainerEl.querySelector(".tile-agg-select");

            const chosenVar = variableSelect ? variableSelect.value : "count";
            const chosenGroup = groupSelect ? groupSelect.value : "";
            const chosenAgg = aggSelect ? aggSelect.value : "sum";

            const dataToRender = buildTimeSeriesData(filteredMovies, chosenVar);
            tsPlot.render(dataToRender, chosenVar, chosenAgg, chosenGroup);
        },
    };

    // Pre-set the selects
    if (defaultVar) {
        tileContainerEl.querySelector(".tile-variable-select").value = defaultVar;
    }
    if (defaultGroup) {
        tileContainerEl.querySelector(".tile-group-select").value = defaultGroup;
    }
    if (defaultAgg) {
        tileContainerEl.querySelector(".tile-agg-select").value = defaultAgg;
    }

    // Hook up event listeners on these selects so that changing them re-renders
    const variableSelect = tileContainerEl.querySelector(".tile-variable-select");
    const groupSelect = tileContainerEl.querySelector(".tile-group-select");
    const aggSelect = tileContainerEl.querySelector(".tile-agg-select");
    [variableSelect, groupSelect, aggSelect].forEach((ctrl) => {
        if (ctrl) {
            ctrl.addEventListener("change", () => {
                tileObj.update(globalData.moviesData);
            });
        }
    });

    // Delete button
    const deleteBtn = tileContainerEl.querySelector(".delete-tile-btn");
    deleteBtn.addEventListener("click", () => {
        tileContainerEl.remove();
        allTiles = allTiles.filter((t) => t.id !== tileObj.id);
    });

    return tileObj;
}

/**
 * Create a "Map" tile object (with references to DOM + the chart instance).
 */
function createMapTile(tileContainerEl, chartEl, defaultGroup) {
    const mapPlot = new MapPlot(chartEl.id);

    // We must init the map asynchronously
    mapPlot.init("data/europe.geojson").then(async() => {
        // Possibly geocode and render all locations (we won't filter yet)
        if (globalData.organizationsData) {
            const locations = await geocodeLocations(globalData.organizationsData);
            mapPlot.renderLocations(locations, defaultGroup);
        }
    });

    const tileObj = {
        id: tileContainerEl.id,
        type: "map",
        instance: mapPlot,
        update: async(filteredMovies, filteredSegments) => {
            // Re-render with updated grouping
            const groupSelect = tileContainerEl.querySelector(".tile-group-select");
            const chosenGroup = groupSelect ? groupSelect.value : "";

            if (globalData.organizationsData) {
                const locations = await geocodeLocations(globalData.organizationsData);
                mapPlot.renderLocations(locations, chosenGroup);
            }
        },
    };

    // Pre-set the group select
    if (defaultGroup) {
        tileContainerEl.querySelector(".tile-group-select").value = defaultGroup;
    }

    // Add event for group select
    const groupSelect = tileContainerEl.querySelector(".tile-group-select");
    if (groupSelect) {
        groupSelect.addEventListener("change", async() => {
            tileObj.update(globalData.moviesData);
        });
    }

    // Delete button
    const deleteBtn = tileContainerEl.querySelector(".delete-tile-btn");
    deleteBtn.addEventListener("click", () => {
        tileContainerEl.remove();
        allTiles = allTiles.filter((t) => t.id !== tileObj.id);
    });

    return tileObj;
}

/**
 * Utility to build time series data from movies for a given numeric field.
 */
function buildTimeSeriesData(movies, numericField) {
    if (!movies) return [];

    if (numericField === "count") {
        // Count how many movies per year
        const yearCountMap = {};
        movies.forEach((m) => {
            if (m.date_of_production) {
                const y = m.date_of_production.getFullYear();
                if (!yearCountMap[y]) yearCountMap[y] = 0;
                yearCountMap[y]++;
            }
        });
        return Object.keys(yearCountMap)
            .map((year) => ({
                date: new Date(+year, 0, 1),
                count: yearCountMap[year],
            }))
            .sort((a, b) => a.date - b.date);
    } else {
        // e.g. fps, frames_total
        const yearMap = {};
        movies.forEach((m) => {
            if (m.date_of_production) {
                const y = m.date_of_production.getFullYear();
                if (!yearMap[y]) yearMap[y] = [];
                const val = +m[numericField] || 0;
                yearMap[y].push(val);
            }
        });
        const arr = [];
        for (let y in yearMap) {
            const sumVal = d3.sum(yearMap[y]);
            arr.push({
                date: new Date(+y, 0, 1),
                [numericField]: sumVal,
            });
        }
        arr.sort((a, b) => a.date - b.date);
        return arr;
    }
}

/**
 * geocodeLocations function to avoid the "not defined" error.
 * You can store this in dataManager.js if you prefer. 
 */
async function geocodeLocations(organizations) {
    if (!Array.isArray(organizations)) {
        console.error("Expected an array of organizations, but got:", organizations);
        return [];
    }

    // Attempt to get from localStorage
    const cached = localStorage.getItem("geocodedLocations");
    if (cached) {
        return JSON.parse(cached);
    }

    // Replace with your actual OpenCage API key
    const apiKey = "YOUR_API_KEY_HERE";
    const geocodedLocations = [];

    for (const org of organizations) {
        if (!org.location) continue; // skip empty
        try {
            const resp = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(org.location)}&key=${apiKey}`
            );
            const data = await resp.json();
            if (data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                geocodedLocations.push({ lat, lon: lng, orgName: org.organizations });
            }
        } catch (err) {
            console.error("geocode error for:", org.location, err);
        }
    }

    localStorage.setItem("geocodedLocations", JSON.stringify(geocodedLocations));
    return geocodedLocations;
}