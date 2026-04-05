# AI-Driven Smart Content Moderation Platform

A **Full-Stack** study case application that autonomously filters and moderates text and image content using AI power, built with modern web technologies.

It features a strictly isolated dual-interface experience with sharp boundaries between Moderators and End Users.

## 🚀 Technologies & Architecture

The system adopts an approach similar to decoupled microservices, where each component runs as an independent container responsible for its own domain. The entire infrastructure is orchestrated using `Docker Compose`.

### Backend (API Server & AI Worker)
- **Node.js & Express.js:** Serves as the central API bridge and HTTP router.
- **RESTful Architecture:** Built with a modular router, middleware (JWT & File Upload), and controller architecture.
- **Prisma ORM:** Used for type-safe and highly performant database communications.
- **Multer:** Handles secure and synchronous image upload flows using multipart/form-data.

### Database, Cache & Queue
- **PostgreSQL:** All primary records, users, and moderation history logs are persistently stored here.
- **Redis (The Swiss Army Knife):**
  - **BullMQ:** Puts AI analysis operations into an asynchronous background job queue to prevent blocking the Node.js event thread.
  - **Rate Limiting:** Acts as a memory firewall to prevent IP-based spam and DDoS attacks using `express-rate-limit`.
  - **Caching:** Stores Dashboard Statistics (which require heavy SQL aggregations) in RAM with a 60-second TTL, offering blazing-fast 1ms responses.
  - **Pub/Sub (SSE):** When the background AI Worker finishes a job, it publishes a message over the Redis network. The Dashboard captures this via Server-Sent Events (SSE) to update the page reactively in real-time.

### Frontend
- **React.js (Vite):** Extremely lightweight and fast modular component architecture.
- **Vanilla CSS:** A 100% custom, Tailwind-free "Premium" UX design enhanced with glassmorphism effects and aesthetic micro-transitions.
- **React Router:** Provides route protection and Role-Based Access Control (Routing Guards) between application pages.
- **Recharts:** Visualizes dashboard statistics with real-time responsive charts that update seamlessly.
- **Lucide React:** Modern and consistent edge iconography.

### AI Service (Mock Endpoint)
- Instead of relying on an external OpenAI or GCP Vision API, a lightweight local Node.js microservice was developed. It mocks AI behavior by utilizing string heuristics to autonomously generate Toxicity scores and Category verdicts.

---

## 🏗️ Architecture and Design Decisions

1. **Strict Role Isolation**: Clear isolation between Moderators and Users. Moderators do not interact with submission portals, while standard users are blocked from viewing the Moderation Dashboard via React routing guards and API protection layers.
2. **Persistence Constraints**: To prevent image assets from being wiped out upon container restarts, Multer directly uploads files into the `/backend/uploads` directory by tying it to a persistent Docker Volume array.
3. **Live Data (No Refresh Required)**: Utilizing the **Server-Sent Events (SSE)** mapped via Redis Pub/Sub, asynchronous AI job results are streamed directly to the UI without the heavy bidirectional payload of WebSockets. The UI patches itself automatically without requiring page reloads.
4. **Rate Limiting (Abuse Prevention)**: Authentication routes are strictly fortified (e.g., max 20 attempts per 15 minutes), while general API routes allow 100 requests every 5 minutes. Application security stands as a top priority.

---

## ⚙️ Installation & Running (Docker)

Spinning up this application locally is incredibly seamless. There is no need to grapple with command-line environment setups or manual database migrations.

**Prerequisite (Only 1):** You must have [Docker](https://www.docker.com/) installed on your machine.

### Step 1: Run the Project
Access your terminal, navigate inside the root project directory (where `docker-compose.yml` is located) and run the following command:

```bash
docker compose up -d --build
```
*This single command builds and connects NGINX, the Node Backend, AI Service, Redis, Postgres, and BullMQ all at once. Prisma migrations are also automatically executed during the unified boot sequence.*

### Step 2: Visit the Application
Once all containers report a healthy state, you can experience the application at the following endpoints:
- **Frontend / UI:** [http://localhost](http://localhost) (Or directly via port 80)
- **Backend API Base:** [http://localhost:5001/api](http://localhost:5001/api)

### Demo Steps for Architectural Testing
1. **Open Two Tabs**: In the first tab, log in as a **MODERATOR** and keep the **Moderator Dashboard** completely visible. (You can create an account and manually designate roles through database testing seeds).
2. In the second tab, create a normal **USER** and log in. Submit multiple texts or upload images (using toxic keyword heuristics or any casual content).
3. Tab back to your original *Moderator Dashboard*. **Without a single click**, you will witness the magic of the *Real-time SSE Pub/Sub architecture* as graphical charts, queue counters, and robust data tables automatically re-render and patch their visual status in real-time!

---

## ⚠️ Known Limitations & Future Work

Because this is a time-constrained `Study Case`, certain enterprise-oriented decisions were simulated to reduce review constraints:

1. **AI Integration (Mocking):** To bypass billing or third-party API Key requirements, we constructed a local Mock AI Node server that autonomously generates responses based on filename/string heuristics instead of passing data downstream to a real Hugging Face or AWS Rekognition model. In a real-world scenario, migrating this specific `ai-service` codebase into an overarching Python/OpenAI wrapper is trivial.
2. **Media Storage (Lack of AWS S3):** Uploaded static assets (images) are currently stored locally into the volume-mounted API directory via `Multer`. In a large-scale enterprise environment, pushing static binary directly into an AWS S3, MinIO, or CloudFlare R2 instance and proxying it via a reliable CDN remains the undeniable industry standard.
3. **Environment Security (Fallbacks):** To strictly prevent code reviewers from encountering application crashes caused by missing local `.env` keys, minimal fallback defaults were coded across JWT configurations. Deployed production infrastructures must undoubtedly fetch these secrets via secure HashiCorp Vault architectures or pipeline variables.
