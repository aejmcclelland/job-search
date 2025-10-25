# JobSearch 

A lightweight Node.js + Express backend that automates job discovery across company career sites and startup platforms using the **Serper.dev API**.  

It runs structured search queries (ATS and non-ATS), saves results locally in date-stamped folders, and includes tools to filter listings by **region**, **experience level**, **work mode**, and **programming languages**.

---

## Features
- **Automated job search** via [Serper.dev](https://serper.dev)  
- Filters for:
  - Country or region (UK, EU, etc.)
  - Remote / hybrid roles  
  - Max years of experience (e.g. ≤ 3)  
  - Tech stack keywords (e.g. *Node.js*, *React*, *AWS*)  
- Domain blocking and startup-site allow-listing  
- Local result storage:  

search-results/
ats-results//
website-results//

- Refinement endpoints for quick, zero-credit re-filtering  

---

## Project Structure

src/
├── routes/           # Express route modules
├── search/           # Serper config & query logic
├── utils/            # Helper utilities (filters, file IO)
├── middleware/       # Security, rate limiter, error handler
└── server.mjs        # Entry point

---

## Setup

### 1 Install dependencies
```bash
pnpm install
```
### 2 Create an .env.local file
```bash
SERP_API_KEY=your_serper_api_key_here
CORS_ORIGINS=http://localhost:3000
PORT=4000
```
### 3 Start the server
```bash
pnpm start
```
The server will run at `http://localhost:4000`.

---
## Usage

### Search Endpoint
`POST /api/search`.

`GET /api/search/ats?save=1` — run ATS queries (uses credits)

`GET /api/refine/local?source=ats&region=uk&workMode=remote&maxYears=3&langs=node,react` — refine locally saved data (no credits)

### Security 
•	API keys loaded from .env.local.

•	Helmet, CORS, and compression enabled by default.

•	Sensitive data and search results excluded via .gitignore.

### License
This project is for personal and educational use.
© Andrew McClelland 2025

