/* Content model — ALL copy lives here, presentation never hardcodes text.
   Phase 2 (v0.3): portfolio of Pujan Banik Arnab, Industrial & Production
   Engineer. Every fact below is sourced from the owner's CV (Oct 2026) —
   no invented metrics, no fictional employers. Voice is calibrated for two
   audiences at once: (a) employers hiring IPE / supply-chain engineers and
   (b) graduate admissions & visa officers — stated focus: MSc in Supply
   Chain Management. See docs/HANDOFF.md before editing. */

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface ButtonSpec {
  readonly label: string;
  readonly href: string;
  readonly variant: "filled" | "outlined" | "tonal" | "text";
  readonly download?: boolean;
}

export interface Fact {
  readonly label: string;
  readonly text: string;
}

export interface DotState {
  readonly label: string;
  readonly text: string;
  readonly variant: "steady" | "scattered" | "faint";
  /** Verified reference dot-matrix illustration (byte-exact decay-N.svg). */
  readonly image: string;
  readonly imageAlt: string;
}

export interface SkillRow {
  readonly skill: string;
  readonly domain: string;
  readonly level: "core" | "working" | "learning";
  readonly score: string;
}

export interface LegendChip {
  readonly label: string;
  readonly tone: "core" | "working" | "learning" | "idle";
}

export interface Card {
  readonly title: string;
  readonly text: string;
}

export interface ProjectCard {
  readonly id: string;
  readonly status: "shipped" | "in-progress" | "academic";
  readonly bars: readonly number[];
  readonly year: string;
  readonly summary: string;
}

export interface Zone {
  readonly label: string;
  readonly caption: string;
  readonly percent: number;
  readonly variant: "solid" | "hatch" | "void";
}

export interface ExperienceEntry {
  readonly role: string;
  readonly org: string;
  readonly period: string;
  readonly points: readonly string[];
}

export interface CredentialGroup {
  readonly name: string;
  readonly year?: string;
  readonly note?: string;
  readonly items: readonly { readonly text: string }[];
  readonly actions: readonly ButtonSpec[];
  readonly featured: boolean;
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export interface SiteContent {
  readonly brand: {
    readonly name: string;
    readonly tagline: string;
  };
  readonly nav: {
    readonly links: readonly NavLink[];
    readonly footerNote: string;
    readonly footerLinks: readonly NavLink[];
  };
  readonly hero: {
    readonly kicker: string;
    readonly title: readonly string[];
    readonly lede: string;
    readonly actions: readonly ButtonSpec[];
    readonly window: {
      readonly title: string;
      readonly statusLine: string;
      readonly progressLabel: string;
      readonly legend: readonly LegendChip[];
    };
  };
  readonly facts: readonly Fact[];
  readonly scenes: {
    readonly about: {
      readonly kicker: string;
      readonly title: readonly string[];
      readonly lede: readonly string[];
      readonly states: readonly DotState[];
      readonly footnote: string;
    };
    readonly skills: {
      readonly kicker: string;
      readonly title: readonly string[];
      readonly lede: readonly string[];
      readonly window: {
        readonly title: string;
        readonly statusLine: string;
        readonly progressLabel: string;
        readonly legend: readonly LegendChip[];
        readonly rows: readonly SkillRow[];
      };
      readonly cards: readonly Card[];
    };
    readonly projects: {
      readonly kicker: string;
      readonly title: readonly string[];
      readonly lede: readonly string[];
      readonly events: readonly ProjectCard[];
      readonly note: readonly string[];
    };
    readonly experience: {
      readonly kicker: string;
      readonly title: readonly string[];
      readonly lede: readonly string[];
      readonly zones: readonly Zone[];
      readonly quote: string;
      readonly entries: readonly ExperienceEntry[];
    };
    readonly credentials: {
      readonly kicker: string;
      readonly title: readonly string[];
      readonly groups: readonly CredentialGroup[];
    };
  };
  readonly principles: {
    readonly title: string;
    readonly items: readonly string[];
    readonly links: readonly NavLink[];
  };
  readonly contact: {
    readonly kicker: string;
    readonly title: readonly string[];
    readonly lede: readonly string[];
    readonly actions: readonly ButtonSpec[];
    readonly faq: {
      readonly heading: string;
      readonly items: readonly FaqItem[];
    };
  };
}

export const site: SiteContent = {
  brand: {
    name: "Pujan Banik Arnab",
    tagline: "Industrial & Production Engineer",
  },
  nav: {
    links: [
      { label: "About", href: "#about" },
      { label: "Skills", href: "#skills" },
      { label: "Projects", href: "#projects" },
      { label: "Experience", href: "#experience" },
      { label: "Credentials", href: "#credentials" },
      { label: "Contact", href: "#contact" },
    ],
    footerNote: "Jigatola, Dhanmondi, Dhaka, Bangladesh. Built from scratch — no templates, no trackers.",
    footerLinks: [
      { label: "Email", href: "mailto:banikarnab.ipe@gmail.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/pujan-banik-arnab" },
      { label: "Phone", href: "tel:+8801792514506" },
      { label: "Résumé", href: "/resume.pdf" },
    ],
  },
  hero: {
    kicker: "Industrial & Production Engineer · Dhaka, Bangladesh",
    title: ["Right parts.", "Right time."],
    lede:
      "I am Pujan Banik Arnab. At Excellent Ceramics Group I run end-to-end procurement for the Tiles & Ceramics units — local and international — from Comparative Statements and purchase orders to Letter of Credit files, freight and customs clearance. Before that, a year supervising beverage production lines at PRAN-RFL. Next step, deliberate: graduate study in Supply Chain Management.",
    actions: [
      { label: "Download résumé", href: "/resume.pdf", variant: "filled", download: true },
      { label: "See experience", href: "#experience", variant: "outlined" },
      { label: "Email me", href: "mailto:banikarnab.ipe@gmail.com", variant: "text" },
    ],
    window: {
      title: "pujan-arnab — supply chain desk",
      statusLine: "Procurement · LC & trade documents · logistics · production",
      progressLabel: "OPEN TO OPPORTUNITIES",
      legend: [
        { label: "Procurement", tone: "core" },
        { label: "Production", tone: "working" },
        { label: "Grad study", tone: "learning" },
      ],
    },
  },
  facts: [
    { label: "Education", text: "B.Sc. in Industrial & Production Engineering, Ahsanullah University of Science & Technology (2017–2022)" },
    { label: "Current role", text: "Junior Executive, Supply Chain Management — Excellent Ceramics Group (May 2025–present)" },
    { label: "Certified", text: "Supply Chain Logistics · Supply Chain Operations — both via Coursera" },
    { label: "Based in", text: "Jigatola, Dhanmondi, Dhaka, Bangladesh · open to relocation" },
  ],
  scenes: {
    about: {
      kicker: "01 / 06 · About",
      title: ["From the factory floor", "to the border desk."],
      lede: [
        "I finished my B.Sc. in Industrial & Production Engineering at Ahsanullah University of Science and Technology in 2022 and went straight to the floor — supervising beverage production lines at PRAN Beverage Limited (PRAN-RFL Group). A year of production planning, GMP discipline and downtime fights taught me exactly where materials, hours and money get lost inside a plant.",
        "Since May 2025 I have run procurement and import execution at Excellent Ceramics Group: quotation collection and Comparative Statements, vendor selection, purchase orders, Letter of Credit applications with banks, customs clearance through C&F agents, and freight negotiation with ETD/ETA tracking. The next step is deliberate — graduate study in Supply Chain Management — to turn the trade I run daily into something I can design, measure and teach.",
      ],
      states: [
        { label: "Source", text: "Local raw materials to overseas finished goods: quotations, CS preparation, vendor selection, purchase orders — the full buying cycle.", variant: "steady", image: "/assets/decay-1.svg", imageAlt: "An ordered grid of dots: every step of the sourcing cycle in place." },
        { label: "Move", text: "LC applications with banks, freight negotiation, ETD/ETA monitoring, customs clearance with C&F agents — shipments and documents arriving together.", variant: "scattered", image: "/assets/decay-2.svg", imageAlt: "The same dots, scattered: shipments and documents in motion across transit." },
        { label: "Improve", text: "From beverage lines to supplier ledgers: cost, inventory and process problems treated as things to measure, model and systematically solve — the same DOE discipline as the thesis, pointed at the desk.", variant: "faint", image: "/assets/decay-3.svg", imageAlt: "A faint flat pattern of dots: noise distilled into what can be measured and improved." },
      ],
      footnote:
        "Focus for the years ahead: an MSc in Supply Chain Management — procurement analytics, global logistics and trade operations. Three years of running the work first, then learning to design it properly.",
    },
    skills: {
      kicker: "02 / 06 · Skills",
      title: ["What I run daily,", "and what's next."],
      lede: [
        "These are the eight core competencies I practice in my current desk, rated honestly: core means I own it unaided today; working means I do it with autonomy and am still sharpening it; learning is a deliberate next step, not a wish.",
      ],
      window: {
        title: "skills — matrix",
        statusLine: "Rated against daily work at Excellent Ceramics Group and a year at PRAN-RFL",
        progressLabel: "REVIEWED",
        legend: [
          { label: "Core", tone: "core" },
          { label: "Working", tone: "working" },
          { label: "Learning", tone: "learning" },
        ],
        rows: [
          { skill: "Procurement & sourcing (local + int'l)", domain: "Procurement", level: "core", score: "core" },
          { skill: "Vendor & supplier management", domain: "Procurement", level: "core", score: "core" },
          { skill: "LC processing & trade documentation", domain: "Trade finance", level: "core", score: "core" },
          { skill: "Logistics & shipment coordination", domain: "Logistics", level: "core", score: "core" },
          { skill: "Inventory & stock control", domain: "Supply chain", level: "core", score: "core" },
          { skill: "Production operations & line supervision", domain: "Production", level: "core", score: "core" },
          { skill: "Cost & freight optimization", domain: "Supply chain", level: "working", score: "working" },
          { skill: "Process & operational improvement", domain: "Production", level: "working", score: "working" },
          { skill: "Production reporting & analysis", domain: "Data & reporting", level: "working", score: "working" },
          { skill: "Graduate SCM coursework", domain: "Study plan", level: "learning", score: "learning" },
        ],
      },
      cards: [
        { title: "Buy", text: "Quotation to payment: Comparative Statements, vendor selection, purchase orders, LC applications with banks, supplier ledgers, bill and payment requisitions — including Post-Dated Cheque runs." },
        { title: "Move", text: "Freight negotiation with forwarders, ETD/ETA tracking, C&F customs clearance, freight certificates from banks, LC file verification before handover to Accounts for import costing." },
        { title: "Make", text: "A year supervising beverage lines at PRAN-RFL: planning, scheduling, line supervision, GMP and safety compliance, production reports — I buy materials knowing exactly what the line needs." },
      ],
    },
    projects: {
      kicker: "03 / 06 · Selected work",
      title: ["Projects with", "method attached."],
      lede: [
        "Two engineering projects from my degree and two live workstreams from my current desk. Each card states the work and the method — figures live in the résumé and reports, traceable on request.",
      ],
      events: [
        { id: "UNDERGRAD THESIS · DOE, TURNING 52-HRC STEEL", status: "academic", bars: [8, 7, 7, 6, 5, 5, 4, 3], year: "Feb 2022", summary: "B.Sc. thesis, Dept. of MPE, AUST — co-authored with Gourab Saha Turza & Masud Rana Khandker, supervised by Prof. Dr. Imtiaz Ahmed Choudhury. D2SKD tool steel hardened to 52±2 HRC, turned across an L18 Taguchi orthogonal array (18 runs, dry vs wet) and analysed in Minitab via ANOVA: feed rate emerged as the dominant surface-roughness factor (60.58 % contribution), with the best finish at 136 m/min and 0.100 mm/rev." },
        { id: "MULTI-MATERIAL CRUSHER · PNEUMATIC", status: "academic", bars: [4, 4, 5, 5, 6, 6, 7, 8], year: "IPE 3104 · design sessional", summary: "Product Design & Development sessional, 6-member team (Group B8): a pneumatically-driven crusher for aluminium cans and plastic waste, taken from customer survey to costed, manufacturable design — requirements via QFD House of Quality, components modelled in SolidWorks, material selection by weighted property index / digital logic, closed with stress and safety analysis plus cost and break-even modelling." },
        { id: "IMPORT DESK · LC TO CLEARANCE", status: "shipped", bars: [6, 7, 7, 8, 8, 9, 9, 9], year: "2025 → present", summary: "Live workstream at Excellent Ceramics: overseas sourcing of finished goods, seat covers, fittings and accessories — LC applications with banks, C&F clearance follow-up, freight certificates, imports landing on schedule with complete documents." },
        { id: "PROCUREMENT CYCLE · TILES & CERAMICS", status: "shipped", bars: [5, 5, 6, 6, 7, 7, 8, 8], year: "2025 → present", summary: "End-to-end buying for the Tiles & Ceramics units: sodium silicate, local raw materials, press-machine punches and moulds — quotation collection through CS preparation, vendor selection, POs, supplier ledgers and payments." },
      ],
      note: [
        "Academic work above is documented in university reports; live workstreams are documented inside company records — details available on request, with sensitive commercial data withheld. The résumé PDF carries the full, verifiable outline.",
      ],
    },
    experience: {
      kicker: "04 / 06 · Experience",
      title: ["Two desks,", "one system."],
      lede: [
        "My career so far spans both ends of the materials pipeline: a year making products on the factory floor, and the current job moving materials across borders to feed it. Engineers and officers who have only seen one end tend to design for neither.",
      ],
      zones: [
        { label: "procurement & sourcing", caption: "International and local buying, LC files, vendor management — Excellent Ceramics Group", percent: 45, variant: "solid" },
        { label: "logistics & trade execution", caption: "Freight, customs clearance, invoices and ledgers — the paperwork side of the same desk", percent: 25, variant: "hatch" },
        { label: "production operations", caption: "Line supervision, planning, GMP compliance — PRAN Beverage (PRAN-RFL Group)", percent: 30, variant: "void" },
      ],
      quote:
        "How my industry time splits, as an honest estimate: roughly 45 % procurement & sourcing, 25 % logistics & trade execution, 30 % production operations. The through-line: materials should move on evidence and clean documents, not on emergency.",
      entries: [
        {
          role: "Junior Executive — Supply Chain Management",
          org: "Excellent Ceramics Group · Dhaka, Bangladesh",
          period: "May 2025 – present",
          points: [
            "Manage end-to-end procurement of local raw materials, sodium silicate, and press-machine punches and moulds for the Tiles and Ceramics units — from quotation collection and Comparative Statement (CS) preparation to vendor selection and purchase orders.",
            "Source finished goods, seat covers, fittings and accessories from overseas vendors: evaluate quotations, select suppliers, and prepare Letter of Credit (LC) applications in coordination with banks.",
            "Coordinate with Clearing & Forwarding (C&F) agents on customs duty and clearance, and follow up imports to ensure timely receipt at the factory.",
            "Negotiate freight quotations with forwarders, monitor ETD and ETA, and obtain freight certificates from banks to keep shipments on schedule.",
            "Process supplier, freight and inbound-shipment invoices through system posting, bill and payment requisitions and payments (including Post-Dated Cheques), maintaining accurate supplier ledgers; verify LC files for completeness and hand them to Accounts for import costing.",
          ],
        },
        {
          role: "Assistant Engineer — Production",
          org: "PRAN Beverage Limited (PRAN-RFL Group) · Bangladesh",
          period: "April 2022 – May 2023",
          points: [
            "Supervised and operated beverage production lines to ensure smooth, continuous manufacturing; supported production planning and scheduling to meet operational targets and deadlines.",
            "Implemented process improvements to enhance efficiency and minimize material wastage; coordinated with maintenance teams for timely equipment servicing and reduced downtime.",
            "Prepared and analysed production reports to monitor performance and support decision-making; ensured GMP compliance, workplace safety and consistent product quality under standard operating procedures.",
          ],
        },
      ],
    },
    credentials: {
      kicker: "05 / 06 · Credentials",
      title: ["Credentials,", "in order."],
      groups: [
        {
          name: "Education",
          year: "2013 – 2022",
          note: "Full academic history — transcripts available on request.",
          items: [
            { text: "B.Sc. in Industrial & Production Engineering — Ahsanullah University of Science and Technology, Dhaka (2017 – 2022) · CGPA 2.95" },
            { text: "Higher Secondary School Certificate, Science — MC College, Sylhet (2013 – 2015) · GPA 5.00" },
            { text: "Secondary School Certificate, Science — Sylhet Govt. Pilot High School, Sylhet (2011 – 2013) · GPA 5.00" },
          ],
          actions: [{ label: "Full résumé PDF", href: "/resume.pdf", variant: "outlined" }],
          featured: true,
        },
        {
          name: "Certifications & references",
          note: "Named academic and professional referees available on request — contact details live in the résumé, not on the open web.",
          items: [
            { text: "Supply Chain Logistics — Coursera" },
            { text: "Supply Chain Operations — Coursera" },
            { text: "Professional references: an Assistant Professor, Department of MPE, AUST; and a government revenue officer — full details in the résumé." },
          ],
          actions: [{ label: "Request via email", href: "mailto:banikarnab.ipe@gmail.com", variant: "filled" }],
          featured: false,
        },
      ],
    },
  },
  principles: {
    title: "How I work",
    items: [
      "Documents before promises. In import trade, a complete LC file is worth more than a fast one — I verify every file for document completeness before it reaches the bank or Accounts.",
      "Evidence over gut feel. Quotations get collected and compared in a proper Comparative Statement; vendors are selected on the sheet, not on the handshake.",
      "The line is the customer. A year in production taught me what a stock-out does to a shift — procurement serves the factory floor, not the paperwork.",
      "Learning is scheduled, not vague. Graduate study in Supply Chain Management is my stated next step — deepening the practice I already run, with dates attached.",
    ],
    links: [
      { label: "About my path.", href: "#about" },
      { label: "Experience.", href: "#experience" },
      { label: "Questions.", href: "#contact" },
    ],
  },
  contact: {
    kicker: "06 / 06 · Contact",
    title: ["For recruiters", "and universities."],
    lede: [
      "Hiring for supply chain, procurement, logistics or production? Planning to assess me for a graduate programme in Supply Chain Management? Either way, my documents are in order — résumé, transcripts, certificates and named references are ready on request, and I reply within a working day.",
    ],
    actions: [
      { label: "Email me", href: "mailto:banikarnab.ipe@gmail.com", variant: "filled" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/pujan-banik-arnab", variant: "outlined" },
      { label: "Résumé PDF", href: "/resume.pdf", variant: "text", download: true },
      { label: "+880 1792 514506", href: "tel:+8801792514506", variant: "text" },
    ],
    faq: {
      heading: "Before you reach out",
      items: [
        {
          question: "What roles are you looking for?",
          answer:
            "Junior-to-mid roles in supply chain management, procurement and sourcing, logistics and shipment coordination, inventory planning, or production planning. I am strongest where buying, trade documentation and the factory floor meet — and I bring both sides to the table.",
        },
        {
          question: "Are you planning graduate study?",
          answer:
            "Yes. My stated focus is an MSc in Supply Chain Management, building directly on my B.Sc. in Industrial & Production Engineering and my current SCM practice in international procurement. I am glad to map my experience against a programme's entry requirements — transcripts and certificates are ready on request.",
        },
        {
          question: "Can you run international procurement end to end?",
          answer:
            "That is my day job at Excellent Ceramics Group: overseas vendor evaluation, LC applications with banks, C&F customs clearance, freight negotiation with ETD/ETA monitoring, and the invoice, ledger and payment cycle behind it — including Post-Dated Cheques and freight certificates.",
        },
        {
          question: "Which documents and tools do you work with?",
          answer:
            "Comparative Statements, purchase orders, LC files, freight certificates, bill and payment requisitions, supplier ledgers, work orders and production reports. Day-to-day tools: MS Excel for reporting and analysis, plus ERP-style system posting for invoices and payments. GMP and workplace-safety compliance come from production floor practice.",
        },
        {
          question: "Are references and documents available?",
          answer:
            "Yes. Named academic and professional references (with contact details), transcripts and certificates are available on request — they are listed in the résumé PDF. Project reports and thesis documentation can be shared with sensitive data withheld.",
        },
      ],
    },
  },
};
