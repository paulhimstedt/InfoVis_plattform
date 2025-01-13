// dataManager.js

async function loadData() {
    // Load videos.csv and segments.csv in parallel
    const [moviesRaw, segmentsRaw] = await Promise.all([
        d3.csv("data/videos.csv"), // replaced movies.csv with videos.csv
        d3.csv("data/segments.csv"),
    ]);

    // Process "movies" data
    const moviesData = moviesRaw.map((d) => ({
        video_id: d.video_id,
        title: d.title,
        file_name: d.file_name,
        path: d.path,
        fps: +d.fps || null,
        frames_total: +d.frames_total || null,
        video_label: d.video_label,
        date_of_production: parseDate(d.date_of_production),
        date_of_release: parseDate(d.date_of_release),
        production_country: d.production_country,
        archive: d.archive,
        format_colour: d.format_colour,
        aspect_ratio: d.aspect_ratio,
        duration_timecode: d.duration_timecode,
        video_format_digital_format: d.video_format_digital_format,
        media: d.media,
        organizations: d.organizations,
        organizations_location: d.organizations_location,
        genres: d.genres,
        agents: d.agents,
    }));

    // Process segments data
    const segmentsData = segmentsRaw.map((d) => ({
        segment_id: d.segment_id,
        video_id: d.video_id,
        start_time: +d.start_time || 0,
        end_time: +d.end_time || 0,
        tiers: d.tiers,
        annotations: d.annotations,
        annotations_label: d.annotations_label,
    }));

    // Extract organizations data
    const organizationsData = moviesData
        .map((d) => ({
            organizations: d.organizations,
            location: d.organizations_location,
        }))
        .filter((d) => d.organizations && d.location);

    return { moviesData, segmentsData, organizationsData };
}