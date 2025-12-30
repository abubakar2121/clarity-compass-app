# Backend Development Plan: Founder Clarity Compass

### 1️⃣ Executive Summary
- This document outlines the development plan for a FastAPI backend to support the "Founder Clarity Compass" frontend.
- The backend will handle user onboarding, diagnostic sessions, AI-powered insight generation, and report delivery.
- Key constraints: Python 3.13, FastAPI (async), MongoDB Atlas with Motor, no Docker, single 'main' git branch, and mandatory manual testing after each task.
- The plan is broken down into dynamic sprints (S0…Sn) to cover all frontend-visible features.

---

### 2️⃣ In-Scope & Success Criteria
- **In-Scope Features:**
    - Founder onboarding (name, email, company size).
    - Dynamic, stage-tailored diagnostic questionnaire.
    - AI-powered insight and report generation.
    - On-screen and email-based report delivery.
    - Basic usage tracking (completions, drop-offs, CTA clicks).
- **Success Criteria:**
    - All frontend features are fully functional end-to-end, powered by the backend.
    - All task-level manual tests pass via the frontend UI.
    - Each sprint's code is committed and pushed to the `main` branch after successful testing.

---

### 3️⃣ API Design
- **Base path:** `/api/v1`
- **Error envelope:** `{ "error": "message" }`

- **Endpoint: `POST /api/v1/session/start`**
    - **Purpose:** Initiates a new diagnostic session. Creates a user and a session record.
    - **Request:** `{ "name": "string", "email": "string", "companySize": "enum" }`
    - **Response:** `{ "sessionId": "string", "userId": "string", "questions": "[Question]" }`
    - **Validation:** Name, email, and company size are required. Email must be valid.

- **Endpoint: `POST /api/v1/session/{sessionId}/complete`**
    - **Purpose:** Submits all diagnostic answers, triggers AI insight generation, saves the report, and sends it via email.
    - **Request:** `{ "answers": { "question_id": "answer_value", ... } }`
    - **Response:** `{ "report": "Report" }`
    - **Validation:** `sessionId` must be valid and in 'started' state. Answers object cannot be empty.

- **Endpoint: `POST /api/v1/track`**
    - **Purpose:** Records a tracking event (e.g., drop-off, CTA click).
    - **Request:** `{ "sessionId": "string", "userId": "string", "eventType": "enum", "details": {} }`
    - **Response:** `{ "status": "ok" }`
    - **Validation:** `eventType` must be a valid event type.

- **Endpoint: `GET /healthz`**
    - **Purpose:** Health check to verify API and database connectivity.
    - **Request:** None
    - **Response:** `{ "status": "ok", "db_status": "connected" }`

---

### 4️⃣ Data Model (MongoDB Atlas)
- **Collection: `users`**
    - Fields:
        - `_id`: ObjectId (auto)
        - `name`: string, required
        - `email`: string, required
        - `company_size_range`: string (enum), required
        - `created_at`: datetime, default: now
    - Example: `{ "_id": ObjectId("..."), "name": "Alex", "email": "alex@startup.com", "company_size_range": "15-35", "created_at": ISODate("...") }`

- **Collection: `sessions`**
    - Fields:
        - `_id`: ObjectId (auto)
        - `user_id`: ObjectId, required (ref: `users`)
        - `answers`: object, required
        - `status`: string (enum: 'started', 'completed', 'dropped_off'), required
        - `start_time`: datetime, default: now
        - `end_time`: datetime, nullable
    - Example: `{ "_id": ObjectId("..."), "user_id": ObjectId("..."), "answers": {"q1": "a2"}, "status": "completed", "start_time": ISODate("..."), "end_time": ISODate("...") }`

- **Collection: `reports`**
    - Fields:
        - `_id`: ObjectId (auto)
        - `session_id`: ObjectId, required (ref: `sessions`)
        - `mindset_shift`: string, required
        - `mindset_shift_insight`: string, required
        - `operational_focus`: string, required
        - `operational_focus_insight`: string, required
        - `next_move`: object, required
        - `generated_at`: datetime, default: now
    - Example: `{ "_id": ObjectId("..."), "session_id": ObjectId("..."), "mindset_shift": "From Doer to Delegator", ... }`

- **Collection: `tracking_events`**
    - Fields:
        - `_id`: ObjectId (auto)
        - `session_id`: ObjectId, nullable
        - `user_id`: ObjectId, nullable
        - `event_type`: string (enum: 'completion', 'drop_off', 'cta_click'), required
        - `details`: object, nullable
        - `timestamp`: datetime, default: now
    - Example: `{ "_id": ObjectId("..."), "session_id": ObjectId("..."), "event_type": "cta_click", "details": {"link": "..."}, "timestamp": ISODate("...") }`

---

### 5️⃣ Frontend Audit & Feature Map
- **Route: `/onboarding` (OnboardingPage.tsx)**
    - **Purpose:** Collect user name, email, and company size.
    - **Endpoint:** `POST /api/v1/session/start`
    - **Models:** `users`, `sessions`

- **Route: `/diagnostic` (DiagnosticPage.tsx)**
    - **Purpose:** Display questions and collect answers. On completion, submit answers.
    - **Endpoint:** `POST /api/v1/session/{sessionId}/complete`
    - **Models:** `sessions`, `reports`

- **Route: `/report` (ReportPage.tsx)**
    - **Purpose:** Display the generated report.
    - **Endpoint:** None (data is passed from the previous step).
    - **Models:** `reports`

- **Tracking (Various Components)**
    - **Purpose:** Track drop-offs and CTA clicks.
    - **Endpoint:** `POST /api/v1/track`
    - **Models:** `tracking_events`

---

### 6️⃣ Configuration & ENV Vars (core only)
- `APP_ENV`: `development`
- `PORT`: `8000`
- `MONGODB_URI`: (Your MongoDB Atlas connection string)
- `CORS_ORIGINS`: `http://localhost:5173` (or your frontend dev server URL)
- `OPENAI_API_KEY`: (Your key for AI insight generation)
- `EMAIL_API_KEY`: (Your key for the email service, e.g., SendGrid)
- `FROM_EMAIL`: (Email address to send reports from)

---

### 7️⃣ Background Work
- **Email Sending**
    - **Trigger:** Successful report generation in `POST /api/v1/session/{sessionId}/complete`.
    - **Purpose:** Send the personalized report to the user's email.
    - **Implementation:** Use FastAPI's `BackgroundTasks` to send the email without blocking the API response.
    - **UI Check:** The report page displays a message: "You'll also receive this report in your email...".

---

### 8️⃣ Integrations
- **OpenAI API (or similar LLM)**
    - **Flow:** The backend will send a structured prompt containing the user's answers to the OpenAI API and parse the response to create the report content.
    - **Env Vars:** `OPENAI_API_KEY`
- **Email Service (e.g., SendGrid)**
    - **Flow:** The backend will use the service's API to send a formatted HTML email containing the report to the user.
    - **Env Vars:** `EMAIL_API_KEY`, `FROM_EMAIL`

---

### 9️⃣ Testing Strategy (Manual via Frontend)
- All testing will be performed manually through the frontend UI to ensure end-to-end functionality.
- Every task includes a **Manual Test Step** and a **User Test Prompt**.
- After all tasks in a sprint pass their tests, the code will be committed and pushed to the `main` branch.
- If any test fails, the issue must be fixed and re-tested before pushing.

---

### 🔟 Dynamic Sprint Plan & Backlog (S0 → S2)

---

### 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Create a `backend` directory with a FastAPI skeleton.
- Implement `/api/v1` base router and a `/healthz` endpoint.
- Connect to MongoDB Atlas using the `MONGODB_URI`.
- Ensure `/healthz` performs a DB ping and returns a JSON status.
- Enable CORS for the frontend URL.
- Initialize Git at the project root, set the default branch to `main`, create a `.gitignore` file, and push to GitHub.

**Tasks:**
- **Task 0.1: Create Project Structure & FastAPI Skeleton**
  - **Manual Test Step:** Run `uvicorn main:app --reload` inside the `backend` directory. Navigate to `http://127.0.0.1:8000/docs`. The FastAPI Swagger UI should load.
  - **User Test Prompt:** "Start the backend server. Can you access the auto-generated API documentation in your browser?"

- **Task 0.2: Implement MongoDB Connection & Health Check**
  - **Manual Test Step:** Set the `MONGODB_URI` in a `.env` file. Run the backend. Access `http://127.0.0.1:8000/healthz`. The response should be `{ "status": "ok", "db_status": "connected" }`.
  - **User Test Prompt:** "Configure your MongoDB connection string and restart the backend. Does the `/healthz` endpoint show a successful database connection?"

- **Task 0.3: Enable CORS & Update Frontend**
  - **Manual Test Step:** In the frontend code, replace a mock data call (e.g., in `OnboardingPage.tsx`) with a `fetch` to the `/healthz` endpoint. Run the frontend and check the browser console for a successful network request without CORS errors.
  - **User Test Prompt:** "Update the frontend to call the backend's `/healthz` endpoint. Refresh the app and confirm there are no CORS errors in the browser's developer console."

- **Task 0.4: Initialize Git & Push**
  - **Manual Test Step:** From the root directory, run `git init`, `git add .`, `git commit -m "S0: Initial setup"`, create a repo on GitHub, and push.
  - **User Test Prompt:** "Initialize a Git repository, make your first commit, and push it to GitHub. Is the code now visible on GitHub?"

**Definition of Done:**
- Backend runs locally from the `backend` directory.
- `/healthz` endpoint returns a success status with DB connection confirmed.
- Frontend can successfully make API calls to the backend.
- The project is on GitHub in the `main` branch.

**Post-sprint:**
- Commit and push all S0 changes to `main`.

---

### 🧩 S1 – Onboarding & Diagnostic Session

**Objectives:**
- Implement the `POST /api/v1/session/start` endpoint.
- Create `User` and `Session` documents in MongoDB.
- Load and return stage-specific questions from a static file/config.
- Replace the frontend's local storage logic with an API call.

**Tasks:**
- **Task 1.1: Create Data Models**
  - **Manual Test Step:** This is a code-only task. Verify that Pydantic models for `User` and `Session` are created in the backend code.
  - **User Test Prompt:** "Create the Pydantic models for User and Session. Does the code look correct?"

- **Task 1.2: Implement `/api/v1/session/start` Endpoint**
  - **Manual Test Step:** Use the `/docs` UI to send a valid request to the endpoint. Check MongoDB Atlas to confirm a new `users` and `sessions` document were created.
  - **User Test Prompt:** "Using the API documentation page, test the session start endpoint. Do you see the corresponding user and session documents created in your MongoDB database?"

- **Task 1.3: Integrate Frontend Onboarding**
  - **Manual Test Step:** In `OnboardingPage.tsx`, replace the local storage logic with an API call to `POST /api/v1/session/start`. Fill out the form and submit. The app should navigate to `/diagnostic` and the questions for the selected company size should be displayed.
  - **User Test Prompt:** "Connect the frontend's onboarding form to the new backend endpoint. When you fill out and submit the form, does it successfully start a session and load the diagnostic questions?"

**Definition of Done:**
- The frontend onboarding flow is fully powered by the backend.
- User and session data are correctly persisted in MongoDB.
- The correct set of diagnostic questions is sent to the frontend.

**Post-sprint:**
- Commit and push all S1 changes to `main`.

---

### 🧱 S2 – Report Generation & Delivery

**Objectives:**
- Implement the `POST /api/v1/session/{sessionId}/complete` endpoint.
- Integrate with OpenAI to generate report insights from user answers.
- Save the generated report to the `reports` collection.
- Send the report via email using a background task.
- Implement the `POST /api/v1/track` endpoint.

**Tasks:**
- **Task 2.1: Implement Report Generation Logic**
  - **Manual Test Step:** Create a test script or use the `/docs` UI to call the `/complete` endpoint with a valid session ID and mock answers. Verify in MongoDB Atlas that a `reports` document is created with the expected structure.
  - **User Test Prompt:** "Implement the report generation endpoint. When you call it with test data, is a complete report document correctly saved to the database?"

- **Task 2.2: Implement Email Delivery**
  - **Manual Test Step:** Call the `/complete` endpoint again. Check your email inbox (the one used in the test data) for the report. Verify the content is correct.
  - **User Test Prompt:** "Add the email sending functionality. After completing a diagnostic, do you receive the formatted report in your email?"

- **Task 2.3: Implement Tracking Endpoint**
  - **Manual Test Step:** Use `/docs` to send a 'cta_click' event to `POST /api/v1/track`. Verify in MongoDB that a `tracking_events` document is created.
  - **User Test Prompt:** "Test the tracking endpoint via the API documentation. Is the event correctly logged in the database?"

- **Task 2.4: Integrate Frontend Diagnostic & Report Pages**
  - **Manual Test Step:** Complete a full diagnostic flow from the frontend UI. Start at `/onboarding`, answer all questions in `/diagnostic`. The app should navigate to `/report` and display the personalized report generated by the backend. Check your email for the report. Click the CTA button and verify a tracking event is created.
  - **User Test Prompt:** "Wire up the final frontend pages. Go through the entire flow from start to finish. Does the report page display the correct, AI-generated insights, and do you receive the email?"

**Definition of Done:**
- The full end-to-end user workflow is functional.
- Reports are generated by AI, stored, and delivered via email.
- Tracking events are successfully recorded.

**Post-sprint:**
- Commit and push all S2 changes to `main`.