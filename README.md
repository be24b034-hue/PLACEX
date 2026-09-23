# PlaceX

**PlaceX** is a placement preparation and exploration platform built for students to understand placement opportunities, check eligibility, compare companies, and prepare for placements in one place.

🔗 **Live App:** https://placex1.vercel.app/app

## What is PlaceX?

PlaceX brings placement-related information into a simple interactive platform.

Students can:

* 🔎 Explore companies and placement opportunities
* 🎯 Find companies they are eligible for based on branch and CGPA
* ❤️ Save companies for later
* 📊 Compare different companies
* 📅 Explore placement information by year
* 👤 Create their own profile
* 🤖 Ask PlaceX AI questions related to placements
* 📚 Access placement preparation resources

## Main Features

### Explore

Browse real placement data from IIT Madras Bluebooks and filter companies based on different criteria.

### My Matches

PlaceX checks your **branch and CGPA** against company eligibility requirements and shows relevant opportunities.

### Saved

Save interesting companies and access them later. Saved companies are stored locally in your browser.

### Compare

Compare companies and their placement information side by side.

### Placement Days

Explore placement information grouped by year based on the available Bluebook data.

### Company Details

View detailed information and derived placement data for individual companies.

### Preparation

Access resources and preparation areas to help get ready for placements.

### PlaceX AI

Ask questions about placements through the **Ask PlaceX AI** feature. The AI requests are handled through a serverless backend using Google's Gemini API, keeping the API key on the server.

## Data

PlaceX currently uses **325 placement records** from two IIT Madras Bluebooks.

The data is stored locally in:

```text
src/placex-bluebook-data.json
```

The platform derives filters, eligibility matching, comparisons, and other views from this data.

## Tech Stack

* React
* JavaScript
* HTML / CSS
* Serverless Functions
* Google Gemini API
* Vercel
* LocalStorage

## Project Structure

```text
PlaceX/
├── /
│   └── Marketing landing page
│
├── /app
│   └── React application
│
├── api/
│   └── chat.js
│
└── src/
    └── placex-bluebook-data.json
```

## Current Limitations

* The complete Striver A2Z DSA problem bank is not currently included.
* Some preparation domains still need to be added.
* External preparation-resource links have not been fully audited.
* Responsive behaviour has not been tested at every breakpoint.
* Role categories are derived from company/job descriptions and may not always be perfectly accurate.

## Live Website

👉 **https://placex1.vercel.app/app**

---

**PlaceX — Explore. Match. Prepare.**
