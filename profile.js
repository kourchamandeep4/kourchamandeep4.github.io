/* ------------------------------------------------------------------
   EDIT THIS FILE ONLY. Everything on the page is built from it.
   Keep the structure (brackets, quotes, commas) the same and every
   stage of the ride will keep working.
------------------------------------------------------------------- */
window.PROFILE = {
  name: "Chaman Kour",
  role: "Data and AI Engineer",
  location: "Geelong",
  status: "Open to relocation",
  tagline: "I build AI analytics tools and BI dashboards that turn raw data into commercial decisions.",

  github: {
    user: "kourchamandeep4",           // used only if showLiveRepos is true
    showLiveRepos: false
  },

  links: {
    email: "chamandeep@icloud.net.au",
    github: "https://github.com/kourchamandeep4",
    linkedin: "https://www.linkedin.com/in/chaman1997",
    cv: "",                            // e.g. "cv.pdf" (put the file next to index.html)
    other: [
      { label: "Data science portfolio", url: "https://datascienceportfol.io/kourchamandeep4" }
    ]
  },

  plaque: [
    ["Trip", "Geelong to Melbourne"],
    ["Stops", "Seven"],
    ["Getting around", "Bus, train, taxi, ferry, tram, bike"],
    ["Largest schema visited", "1,200+ tables"],
    ["Packed", "Laptop and curiosity"]
  ],


  about: {
    title: "About me",
    paragraphs: [
      "I am a data and analytics professional with three-plus years across telecommunications, real estate and career-tech. I specialise in BI dashboards, data quality engineering and end-to-end pipelines with Python, SQL and Power BI.",
      "Lately I have been building AI analytics: ionLens, an LLM-powered natural-language-to-SQL engine grounded in a live 1,200+ table enterprise schema, with secure multi-tenant access and role-based permissions.",
      "What I enjoy most is cutting reporting effort, improving data reliability and turning raw data into decisions people can act on."
    ],
    facts: [
      ["Based in", "Geelong, Victoria"],
      ["Working rights", "Full working rights"],
      ["Right now", "Data and AI Engineer at ThoughtWare Australia"],
      ["Studied", "Certified Data Analyst, Bachelor of Computer Science"],
      ["Relocation", "Open to it"]
    ]
  },

  skillsNote: "The bars show how comfortable I am. Five bars means I could teach it.",
  skills: [
    { group: "Languages", items: [
      { name: "Python", level: 5 },
      { name: "SQL", level: 5 },
      { name: "DAX and Power Query", level: 4 },
      { name: "FastAPI", level: 3 },
      { name: "VB.NET and ASP.NET", level: 3 }
    ]},
    { group: "AI and LLM engineering", items: [
      { name: "Generative AI applications", level: 4 },
      { name: "RAG and vector databases", level: 4 },
      { name: "Prompt engineering", level: 4 },
      { name: "LangChain", level: 3 },
      { name: "Multi-tenant security (HMAC)", level: 3 }
    ]},
    { group: "BI and data", items: [
      { name: "Power BI", level: 5 },
      { name: "Data quality monitoring", level: 5 },
      { name: "Streamlit", level: 4 },
      { name: "pandas and NumPy", level: 4 },
      { name: "Microsoft Fabric", level: 3 }
    ]},
    { group: "Cloud and databases", items: [
      { name: "PostgreSQL and Supabase", level: 4 },
      { name: "SQL Server", level: 4 },
      { name: "GCP and BigQuery", level: 4 },
      { name: "Databricks", level: 3 },
      { name: "Azure", level: 3 }
    ]}
  ],

  projects: [
    {
      title: "ionLens: text-to-SQL analytics engine",
      blurb: "An LLM-powered engine that turns plain-English questions into SQL, grounded in a live 1,200+ table enterprise schema. A retrieval layer on a vector database pulls only the relevant tables into each prompt, and role-based access control keeps users to the data they are allowed to see.",
      result: "Took it from architecture to a user-tested feature, and restored query success from 0% to 100% after fixing a request-handling deadlock and a SQL parameter-binding defect.",
      tools: ["Python", "GenAI", "RAG", "SQL Server", "PostgreSQL"],
      repo: "", demo: ""
    },
    {
      title: "Neighbourhood Liveability Index",
      blurb: "A Streamlit dashboard that lets non-technical users compare suburbs across 14 amenity metrics with a 1 to 5 km search radius, personalised weighting, ABS Census KPIs, heat maps and radar charts. Built on an event-driven pipeline with a raw layer and a gold layer in Supabase.",
      result: "A cache-first design cut API costs by about 99% for repeat searches, with validated results loading in under 15 seconds.",
      tools: ["Python", "Supabase", "Databricks", "pandas", "Streamlit"],
      repo: "", demo: ""
    },
    {
      title: "Data quality rules and monitoring dashboard",
      blurb: "A daily-refreshed Power BI dashboard tracking completeness, validity, uniqueness, timeliness and consistency across job ingestion data, plus a Golden Record strategy that merges duplicate job and company records from many sources.",
      result: "95% unique entity match rate, and 12 data quality issues caught in three months, all resolved within 48 hours.",
      tools: ["SQL", "BigQuery", "GCP", "DAX", "Power BI"],
      repo: "", demo: ""
    },
    {
      title: "Hidden data job detection",
      blurb: "A skill-based classification framework that finds data-aligned roles that keyword filters miss. It uses skill extraction, scoring, a co-occurrence matrix and frequency analysis.",
      result: "Automated categorisation of about 2,000 job descriptions a week and cut manual intervention by 90%.",
      tools: ["Excel", "Power BI", "EDA"],
      repo: "", demo: ""
    },
    {
      title: "Market intelligence and content dashboard",
      blurb: "A fully automated dashboard analysing SEEK content performance, with year-over-year index tracking, multi-year seasonality and a ranking of states by advertisement growth and competition.",
      result: "Showed competition for data roles up 23% year over year, and informed 5+ pieces of content and market declarations.",
      tools: ["Excel", "Power BI", "DAX", "Power Query"],
      repo: "", demo: ""
    },
    {
      title: "PR-to-PO conversion improvement",
      blurb: "Automated Power BI dashboards with exception indicators that track purchase requests through approval, supplier delivery and closure, built from SCM, Planning, Operations and Energy data.",
      result: "Saved 4 to 5 hours of manual reporting a week and improved turnaround time by 10 to 15%.",
      tools: ["Power BI", "SQL", "Excel"],
      repo: "", demo: ""
    }
  ],

  experienceTitle: "Experience",
  experience: [
    {
      role: "Data and AI Engineer",
      org: "ThoughtWare Australia",
      when: "Jul 2026 to present",
      where: "Melbourne (remote)",
      points: [
        "Built ionLens from the ground up, grounding every generated query in a live 1,200+ table schema so results are not invented.",
        "Designed a multi-tenant identity model so one hosted AI service can safely serve many customer deployments, replacing a single shared identity.",
        "Fixed production-critical defects across Python, VB.NET/ASP.NET, SQL Server and PostgreSQL, and shipped the front end with charts, CSV export and resizable grids."
      ]
    },
    {
      role: "Data Analytics Consultant",
      org: "DashboardWorx",
      when: "Oct 2025 to Jun 2026",
      where: "Melbourne",
      points: [
        "For Demografy: engineered a cache-first ingestion strategy that cut API costs by about 99%, and built the Streamlit liveability dashboard on a Supabase raw-plus-gold schema.",
        "For Data Career App: built its first data quality monitoring system in Power BI and GCP SQL, and a job classification algorithm that cut manual work by 90%.",
        "Presented findings to management and worked with engineers and product managers on data collection and reporting."
      ]
    },
    {
      role: "Operations Analyst (casual)",
      org: "The Data Analytics Institute",
      when: "Mar 2026 to May 2026",
      where: "Sydney (remote)",
      points: [
        "Built Power BI dashboards tracking student engagement, curriculum effectiveness and training outcomes.",
        "Presented performance metrics to cross-functional stakeholders in interactive reports."
      ]
    },
    {
      role: "Business Intelligence Analyst",
      org: "Indus Towers",
      when: "Oct 2024 to May 2025",
      where: "Uttar Pradesh, India",
      points: [
        "Tracked the full PR-to-PO lifecycle and flagged delays to senior leadership before they escalated.",
        "Automated Power BI reporting, saving 4 to 5 hours a week and improving turnaround by 10 to 15%."
      ]
    },
    {
      role: "IT Product Technical Support Analyst",
      org: "S3 Infotech",
      when: "Mar 2021 to Nov 2023",
      where: "India",
      points: [
        "Provided Level 1 and Level 2 support for Microsoft Dynamics 365 Finance and Operations users.",
        "Led a first ERP go-live, training 80+ end users, and cut support queries by 40% through hands-on training."
      ]
    }
  ],

  stats: [
    { value: "3+", label: "Years in data" },
    { value: "~99%", label: "API cost cut at Demografy" },
    { value: "1,200+", label: "Tables behind ionLens" }
  ],

  credentialsTitle: "Stats and credentials",
  credentials: [
    { title: "Certified Data Analyst", issuer: "The Data Analytics Institute, certificate ID 6989bdeaa", year: "2026", link: "" },
    { title: "Bachelor of Computer Science (GPA 8.0)", issuer: "University of Jammu, India", year: "2020", link: "" }
  ],

  // "Pick your ride": visitors choose what they care about and get a shorter route.
  // keywords are matched against project titles, descriptions, results and tools.
  interests: [
    { id: "ai", label: "AI and LLMs",
      keywords: ["ai", "genai", "llm", "rag", "text-to-sql", "vector", "langchain", "prompt"],
      route: ["about", "skills", "projects", "experience", "contact"] },
    { id: "bi", label: "Dashboards and BI",
      keywords: ["power bi", "dax", "streamlit", "dashboard", "dashboards", "excel"],
      route: ["about", "projects", "experience", "credentials", "contact"] },
    { id: "dq", label: "Data quality and pipelines",
      keywords: ["data quality", "pipeline", "bigquery", "supabase", "golden record", "sql", "monitoring", "databricks"],
      route: ["about", "skills", "projects", "experience", "contact"] }
  ],

  contact: {
    title: "Made it to Melbourne",
    text: "I am open to relocation. If you are hiring for data or AI engineering, or want to talk shop, say hello."
  }
};
