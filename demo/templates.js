/* Sample application templates for the demo persona, Jordan Avery (a fictional line cook in Portland).
   Each template is one application JSON in the shape pdf/resume_pdf.js expects. [[double brackets]] are
   placeholders the tailoring agent fills in for each job; **text** is bold.
   The same templates are saved as templates/*.json for the command-line builder. */
(function (root) {
  "use strict";
  const contact = ["Portland, OR", "(555) 010-4821", "jordan.avery@example.com"];
  const education = [
    { school: "Rose City Culinary Academy", lines: ["Culinary Arts Certificate"], date: "2019" },
  ];
  const certs = ["Oregon Food Handler Card", "ServSafe Food Handler", "Allergen awareness training"];
  const exp = {
    birch: { title: "Line Cook", org: "Birch Street Bistro", dates: "2023 – Present", bullets: [
      "Run the sauté and grill stations on a 120-seat line, about 180 covers on weekend nights.",
      "Train new line cooks on station setup, plating specs and ticket times.",
      "Write the nightly prep list and help the sous chef with weekly inventory counts and ordering.",
    ] },
    tide: { title: "Prep Cook, then Breakfast Cook", org: "Morning Tide Café", dates: "2021 – 2023", bullets: [
      "Prepped sauces, soups and pastries for a busy breakfast and brunch service.",
      "Moved from prep to the breakfast line within a year; ran the flat-top on weekend brunch.",
    ] },
    diner: { title: "Dishwasher and Prep", org: "Riverside Diner", dates: "2019 – 2021", bullets: [
      "Kept dish and prep moving through rushes and covered prep shifts when the kitchen was short.",
    ] },
  };
  const proj = {
    popup: { name: "Seasonal Pop-up Dinners", kind: "Personal project", tech: "Menu planning, food costing, local sourcing", bullets: [
      "Planned and cooked four five-course dinners for about 30 guests each with a neighborhood supper club.",
      "Costed every menu to a set price per plate and sourced produce from two local farms.",
    ] },
    staff: { name: "Staff Meal Program", kind: "Birch Street Bistro", tech: "", bullets: [
      "Started a weekly staff-meal rotation built from trim and overstock, which cut down on food waste.",
    ] },
    catering: { name: "Community Meal Volunteer", kind: "Volunteer", tech: "Batch cooking, food safety", bullets: [
      "Cook monthly batch meals for 150+ people at a community kitchen, following hot- and cold-holding rules.",
    ] },
  };
  const why = { title: "Why [[Employer]]", paragraphs: ["[[Why this employer: 2 to 3 sentences from brief research about the restaurant, its food and why it matters to me.]]"] };
  const close = ["I'm available nights, weekends and holidays, and I can start with two weeks' notice. I'd be glad to come in for a stage or a working interview."];

  const T = {
    "Line / station cook": {
      template: "Line / station cook", employer: "[[Employer]]", role: "[[Role]]", name: "Jordan Avery",
      headline: "Line Cook · Sauté, Grill and Prep", contact, education,
      skills: [
        { label: "Stations", items: ["Sauté, grill, fry", "Garde manger, flat-top"] },
        { label: "Prep", items: ["Knife work, stocks, sauces", "Poultry and fish breakdown"] },
        { label: "Kitchen", items: ["Prep lists, FIFO, labeling", "Inventory counts", "Toast POS, combi oven"] },
      ],
      coursework_title: "CERTIFICATIONS", coursework: certs,
      summary: "Line cook with about five years in Portland kitchens, most recently on sauté and grill for a 120-seat bistro. Fast, clean and calm on a full board, and comfortable training new cooks.",
      sections: ["experience", "projects"], projects_title: "KITCHEN PROJECTS",
      experience: [exp.birch, exp.tide, exp.diner], projects: [proj.popup, proj.staff],
      cover: {
        contact, date: "[[Month D, YYYY]]", recipient: ["[[Employer]]", "[[Neighborhood, Portland, OR]]"],
        greeting: "Dear [[Employer]] Kitchen Team,",
        before: ["I'm applying for the [[Role]] position. I've spent the last two years on sauté and grill at Birch Street Bistro, a 120-seat bistro in Northwest Portland, and I'm looking for a kitchen where I can keep getting faster and learn more."],
        sections: [why, { title: "What I'd bring to the line", bullets: [
          { lead: "Speed on a full board.", text: "On weekend nights at Birch Street I run sauté and grill through about 180 covers and keep ticket times on target." },
          { lead: "Clean, organized prep.", text: "I write the nightly prep list and keep my station labeled and stocked so the next shift starts ready." },
          { lead: "Helping new cooks.", text: "I train new line cooks on setup, plating specs and pace." },
        ] }],
        after: close, signoff: "Thank you,",
      },
    },
    "Sous chef / kitchen lead": {
      template: "Sous chef / kitchen lead", employer: "[[Employer]]", role: "[[Role]]", name: "Jordan Avery",
      headline: "Cook Ready to Lead · Training, Prep Planning and Inventory", contact, education,
      skills: [
        { label: "Leadership", items: ["Training new cooks", "Prep planning", "Line checks"] },
        { label: "Operations", items: ["Inventory counts", "Ordering support", "Food costing basics"] },
        { label: "Stations", items: ["Sauté, grill, fry", "Garde manger, flat-top"] },
      ],
      coursework_title: "CERTIFICATIONS", coursework: certs,
      summary: "Cook with about five years in Portland kitchens who already handles prep lists, inventory counts and training at a 120-seat bistro. Ready to step into a kitchen lead or junior sous role.",
      sections: ["experience", "projects"], projects_title: "KITCHEN PROJECTS",
      experience: [exp.birch, exp.tide, exp.diner], projects: [proj.staff, proj.popup],
      cover: {
        contact, date: "[[Month D, YYYY]]", recipient: ["[[Employer]]", "[[Neighborhood, Portland, OR]]"],
        greeting: "Dear [[Employer]] Hiring Team,",
        before: ["I'm applying for the [[Role]] role. At Birch Street Bistro I've grown from line cook into the person who writes the prep list, helps with inventory and trains new hires, and I'm ready to take on more of that work."],
        sections: [why, { title: "How my experience fits", bullets: [
          { lead: "Running the line.", text: "I work sauté and grill through about 180 covers on weekend nights and help call tickets when the sous chef is off." },
          { lead: "Prep and inventory.", text: "I write the nightly prep list and help with weekly counts and ordering." },
          { lead: "Training.", text: "I train new line cooks on setup, plating specs and pace." },
          { lead: "Cutting waste.", text: "I started a staff-meal rotation built from trim and overstock." },
        ] }],
        after: close, signoff: "Thank you,",
      },
    },
    "Catering / institutional": {
      template: "Catering / institutional", employer: "[[Employer]]", role: "[[Role]]", name: "Jordan Avery",
      headline: "Cook · Batch Cooking, Food Safety and Prep", contact, education,
      skills: [
        { label: "Production", items: ["Batch cooking, sauces", "Hot and cold holding", "Recipe scaling"] },
        { label: "Food safety", items: ["Labeling, FIFO, logs", "Allergen awareness"] },
        { label: "Stations", items: ["Sauté, grill, fry", "Garde manger"] },
      ],
      coursework_title: "CERTIFICATIONS", coursework: certs,
      summary: "Cook with about five years in Portland kitchens and regular volunteer experience cooking batch meals for 150+ people. Careful about food safety, labeling and holding temperatures.",
      sections: ["experience", "projects"], projects_title: "KITCHEN PROJECTS",
      experience: [exp.birch, exp.tide, exp.diner], projects: [proj.catering, proj.popup],
      cover: {
        contact, date: "[[Month D, YYYY]]", recipient: ["[[Employer]]", "[[Neighborhood, Portland, OR]]"],
        greeting: "Dear [[Employer]] Hiring Team,",
        before: ["I'm applying for the [[Role]] position. I've cooked on a busy restaurant line for five years and cook batch meals for 150+ people each month as a volunteer, so high-volume, food-safe production is work I already enjoy."],
        sections: [why, { title: "How my experience fits", bullets: [
          { lead: "High-volume cooking.", text: "Each month I cook batch meals for 150+ people at a community kitchen, following hot- and cold-holding rules." },
          { lead: "Food safety habits.", text: "I hold an Oregon Food Handler Card and ServSafe Food Handler certificate, and I keep labels, dates and logs current." },
          { lead: "Prep planning.", text: "I write the nightly prep list at Birch Street Bistro and help with inventory counts." },
        ] }],
        after: close, signoff: "Thank you,",
      },
    },
  };
  const api = { templates: T };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DEMO_TEMPLATES = T;
})(typeof globalThis !== "undefined" ? globalThis : this);
