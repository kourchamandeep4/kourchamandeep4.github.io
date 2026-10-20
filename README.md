# Australian journey portfolio

A one-screen-at-a-time portfolio told as a trip from a Geelong bus stop to Flinders Street in Melbourne. Each page is a stop: Geelong bus stop (Start), Geelong Station (About), aboard the train (Skills), a Williamstown cafe (Projects), the Docklands ferry wharf (Awards), Southbank and the Eureka Tower (Experience) and Flinders Street (Contact). Click the big Next arrow, click a stop on the route bar, press the arrow keys, or swipe, and a full-screen scene plays between the two pages: the vehicle for that leg (bus, train, taxi, ferry, tram or bike) rides from one landmark to the next while the scenery slides past. Going back plays the scene the other way.

Extras, all running in the browser with no server:

- **Trip computer:** vehicle, route, distance and speed while you travel. Click quickly and the vehicles speed up.
- **Pick your trip:** on the first page, visitors choose AI, dashboards or data quality. Matching projects and skills are highlighted and the Next arrow follows a shorter route. Edit `interests` in `profile.js`.
- **Ask the driver:** a chat guide that answers from the content in `profile.js` and jumps to the right stop. It is keyword search, not an AI model, so it only knows what is on your site.
- **Postcard:** on the Contact page, visitors download a "Greetings from..." postcard with their stops, distance and visit time.

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

The colours and fonts are variables at the top of `style.css` (`--bg`, `--coral`, `--sun`, `--cyan` and the `--f-` font families). Stop names are in `STAGES` at the top of `app.js`. The vehicles are the `vBus`, `vTrain`, `vTaxi`, `vFerry`, `vTram` and `vBike` functions, and the landmarks are the `s...` functions next to them.

## Notes

- The journey respects the "reduce motion" setting by skipping the animation. Long pages (Projects, Experience) scroll inside their own page.
- The page needs JavaScript, because every section is built from `profile.js`.
