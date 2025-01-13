// filterManager.js

function initFilters(dataObj, onFilterChange, onCompare, defaults) {
    const { moviesData } = dataObj;
    const { yearRange } = defaults;

    // 1) Build list of unique countries
    const uniqueCountries = Array.from(
        new Set(moviesData.map((d) => d.production_country).filter((d) => d))
    ).sort();

    // 2) Populate the #country-filter <select>
    const countrySelect = document.getElementById("country-filter");
    countrySelect.innerHTML = ""; // clear old if any
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "All Countries";
    countrySelect.appendChild(defaultOpt);

    uniqueCountries.forEach((country) => {
        const opt = document.createElement("option");
        opt.value = country;
        opt.textContent = country;
        countrySelect.appendChild(opt);
    });

    // 3) Populate compare dropdowns
    const compareSelectA = document.getElementById("compare-movie-a");
    const compareSelectB = document.getElementById("compare-movie-b");

    function populateCompareSelect(selectElem) {
        selectElem.innerHTML = "";
        const noneOpt = document.createElement("option");
        noneOpt.value = "";
        noneOpt.textContent = "No Selection";
        selectElem.appendChild(noneOpt);

        moviesData.forEach((movie) => {
            const opt = document.createElement("option");
            opt.value = movie.video_id;
            opt.textContent = movie.title;
            selectElem.appendChild(opt);
        });
    }
    populateCompareSelect(compareSelectA);
    populateCompareSelect(compareSelectB);

    // Set default year range in inputs if provided
    if (yearRange && yearRange[0] != null) {
        document.getElementById("year-range-start").value = yearRange[0];
    }
    if (yearRange && yearRange[1] != null) {
        document.getElementById("year-range-end").value = yearRange[1];
    }

    // 4) Listen for filter changes
    countrySelect.addEventListener("change", () => triggerFilterChange());

    document.getElementById("year-range-apply").addEventListener("click", () => {
        triggerFilterChange();
    });

    document.getElementById("compare-apply").addEventListener("click", () => {
        const movieA = compareSelectA.value;
        const movieB = compareSelectB.value;
        onCompare(movieA, movieB);
    });

    function triggerFilterChange() {
        const selectedCountry = countrySelect.value.trim();
        const startYear = +document.getElementById("year-range-start").value.trim() || null;
        const endYear = +document.getElementById("year-range-end").value.trim() || null;

        onFilterChange({
            country: selectedCountry,
            yearRange: [startYear, endYear],
        });
    }
}