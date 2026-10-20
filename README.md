# Data pipeline portfolio

A one-screen-at-a-time portfolio built as a data pipeline. Each page is a stage: Source (Start), Ingest (About), Transform (Skills), Gold layer and dashboard (Projects), Quality (Experience), Model and AI (Awards) and Deploy (Contact). Click the big Next arrow, click a stage on the pipeline bar, press the arrow keys, or swipe, and a full-screen scene plays between the two pages:

1. Ingest: records stream from a database, an API and files into storage.
2. SQL: two tables are joined, filtered and grouped, with the query typing out on screen.
3. Lakehouse: records move through bronze, silver and gold layers.
4. Quality checks: bad records are quarantined, good ones pass.
5. AI: robots fetch only the tables a question needs from a huge schema and feed a language model.
6. Deploy: a flying car delivers the resume and the projects, and lands with a boom.

Going back plays the scene in reverse. The Projects page is a dashboard with KPI tiles, before and after bars, a donut and a tool filter, all driven by `dashboard` in `profile.js`.

Extras, all running in the browser with no server:

- **Pipeline monitor:** stage name, records and status while a scene plays. Click quickly and the scenes speed up.
- **Pick your path:** on the first page, visitors choose AI, dashboards or data quality. Matching projects and skills are highlighted and the Next arrow follows a shorter pipeline. Edit `interests` in `profile.js`.
- **Ask the pipeline:** a chat guide that answers from the content in `profile.js` and jumps to the right stage. It is keyword search, not an AI model, so it only knows what is on your site.
- **Run report:** on the Contact page, visitors download a picture of the pipeline they ran.

No build step and no dependencies. It is plain HTML, CSS and JavaScript.

## Make it yours

Open `profile.js` and replace every placeholder with your own details. That file is the only one you need to edit. Keep the brackets, quotes and commas as they are.

- `name`, `role`, `tagline`, `location`: the hero.
- `links`: email, GitHub, LinkedIn, an optional CV file (put `cv.pdf` next to `index.html` and set `cv: "cv.pdf"`), and any extra buttons in `other`.
- `projects`: three to six is plenty. Each gets a ticket with a result line, tools and links.
- `github.showLiveRepos`: set to `true` to list your latest public repositories under Projects.

To preview it, open `index.html` in a browser. Fonts load from Google Fonts, so you need to be online to see the intended typography.

## Publish it free on GitHub Pages

1. Create a public repository named `your-username.github.io`.
2. Upload `index.html`, `style.css`, `app.js`, `extras.js`, `profile.js` (and your CV if you have one).
3. In the repository, go to Settings, then Pages. Under "Build and deployment", choose "Deploy from a branch", pick `main` and the `/ (root)` folder, then save.
4. After a minute your site is live at `https://your-username.github.io`.

## Change the look

The colours and fonts are variables at the top of `style.css`. Stage names are in `STAGES` at the top of `app.js`. Each scene is one function in the `SCENES` list.

## Notes

- The scenes respect the "reduce motion" setting by skipping the animation. Long pages (Projects, Experience) scroll inside their own page.
- The page needs JavaScript, because every section is built from `profile.js`.
