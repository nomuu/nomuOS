/* ============================================================
   NomuOS — Portfolio profile data
   ------------------------------------------------------------
   Content mirrored from imronaldmendoza.com.
   Edit here to update what the About / Skills / Projects /
   Contact apps display.
   ============================================================ */
window.NomuProfile = {
  /* ---- Identity ---- */
  name: "Ronald Fernandez Mendoza",
  initials: "RFM",
  role: "Full Stack Developer",
  professions: ["Full Stack Developer", "Software Engineer", "Application Developer"],
  tagline:
    "I love programming in different languages and always look for ways to " +
    "improve my skills and learn new things.",
  avatar: "🧑‍💻",

  /* ---- 01. About Me ---- */
  about: {
    bio: [
      "Currently, I am working as a Mid-Level Web Developer in an international " +
        "BPO company. My professional journey is driven by a passion for building " +
        "robust and scalable web solutions. In my current role, I focus on empowering " +
        "our support team by developing specialized tools that automate payroll " +
        "processing, including complex computations and report generation.",
      "I am also spearheading a project that leverages UiPath bots and Document " +
        "Understanding to streamline data extraction and processing. In my free time, " +
        "I immerse myself in AI research and exploring emerging programming paradigms. " +
        "I believe that staying ahead of the curve is the key to creating impactful technology.",
    ],
    beyondTheCode: [
      { title: "Endurance Running", description: "Fun run participant and finisher", icon: "fas fa-running" },
      { title: "Competitive Racing", description: "Tamiya Mini 4WD & RC tournament player", icon: "fas fa-trophy" },
      { title: "Pickleball", description: "Active court player and enthusiast", icon: "fas fa-table-tennis" },
      { title: "Coffee Craft", description: "Amateur barista and manual brewing", icon: "fas fa-mug-hot" },
    ],
  },

  /* ---- 02. Skills ---- */
  skills: {
    techStack: [
      { category: "LANGUAGES", skills: "C#, HTML, CSS, JS, SQL" },
      { category: "FRAMEWORKS", skills: ".NET, ASP.NET, Bootstrap" },
      { category: "DATABASES", skills: "SQL Server, MySQL, Postgre" },
      { category: "TOOLS & CLOUD", skills: "Git, VS 2022, Azure (SSO)" },
      { category: "RPA / AI", skills: "UiPath, OCR, DU, APIs, Kiro CLI" },
      { category: "SITE ADMIN", skills: "Security, Server Mgmt" },
    ],
    coreStrengths: [
      { name: "Problem Solving & Debugging", percentage: 95 },
      { name: "Responsive Web Design", percentage: 100 },
      { name: "Web Security Integration", percentage: 90 },
      { name: "Full-Stack Portal Development", percentage: 85 },
    ],
    professionalDevelopment: [
      "Continuously exploring backend improvements and cloud integration (Azure, APIs).",
      "Currently studying advanced .NET Core and API design patterns to build more scalable enterprise solutions.",
    ],
  },

  /* ---- 03. Projects ---- */
  projects: {
    featured: [
      { name: "Mockify", description: "Prepare for real-world interviews by practicing your own questions on your terms.", url: "https://mockify.imronaldmendoza.com", icon: "fas fa-microphone-alt", tags: ["AI / Career"] },
      { name: "Weevu", description: "Detect and fix web vulnerabilities before attackers do with instant security scans.", url: "https://imronaldmendoza.com/projects/Weevu", icon: "fas fa-shield-virus", tags: ["CyberSec"] },
      { name: "GitSet", description: "Universal version control for RC chassis setups with encrypted data exports.", url: "https://imronaldmendoza.com/Projects/Gitset", icon: "fas fa-cogs", tags: ["RC Tech / Hobby"] },
      { name: "Inventrac", description: "Platform for product monitoring and industry regulation compliance.", url: "https://imronaldmendoza.com/", icon: "fas fa-boxes", tags: ["Inventory"] },
      { name: "Photopify", description: "Converts images locally in your browser using hardware acceleration — no uploads.", url: "https://imronaldmendoza.com/Projects/Photopify", icon: "fas fa-camera-retro", tags: ["Privacy"] },
      { name: "Loanatic", description: "Real-time amortization schedules and financial summaries for debt-tracking.", url: "https://imronaldmendoza.com/Projects/loanatic", icon: "fas fa-hand-holding-usd", tags: ["Fintech"] },
    ],
    others: [
      { name: "All Codes", description: "Count lines of code in your project files across multiple languages.", url: "https://imronaldmendoza.com/Projects/Allcodes/home.html", icon: "fas fa-file-code" },
      { name: "Beaniria", description: "Sleek online presence for a premium coffee bean shop.", url: "https://beaniria.my.canva.site/beaniria", icon: "fas fa-coffee" },
      { name: "vsTECH", description: "Full-stack web application built with PHP and Bootstrap.", url: "#", icon: "fas fa-laptop-code" },
      { name: "JSONate", description: "Excel to JSON dataset converter using JavaScript.", url: "https://imronaldmendoza.com/Projects/JSONate", icon: "fas fa-database" },
      { name: "Fast Forward", description: "Responsive logistics landing page with smooth animations.", url: "https://fastforwardfreight.ph", icon: "fas fa-truck-fast" },
      { name: "Markipify", description: "Diagonal watermark security tool for media protection.", url: "https://imronaldmendoza.com/Projects/Markipify", icon: "fas fa-file-signature" },
      { name: "Time Keeper", description: "Efficiently log and manage time, track hours, and generate reports using VB.NET.", url: "#", icon: "fas fa-clock" },
    ],
  },

  /* ---- 04. Contact ---- */
  contact: {
    greeting: "Hello Visitors!",
    description:
      "I'm always open to discussing my projects, receiving feedback, or exploring " +
      "new opportunities. I look forward to connecting with you!",
    email: "mypersonal@imronaldmendoza.com",
    location: "Makati City, Philippines",
    languages: ["Pilipino", "English"],
    socials: [
      { label: "Facebook", url: "https://facebook.com/446046595495367", icon: "fab fa-facebook" },
      { label: "LinkedIn", url: "https://linkedin.com/in/imronaldmendoza", icon: "fab fa-linkedin" },
      { label: "GitHub", url: "https://github.com/nomuu", icon: "fab fa-github" },
    ],
  },
};
