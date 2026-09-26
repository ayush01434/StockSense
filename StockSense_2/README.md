# StockSense 📦

StockSense is a modular Inventory Management System (IMS) designed to digitize and streamline all stock-related operations. It replaces manual registers and scattered tracking methods with a centralized, real-time platform.

## 🚀 Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript, CSS Modules
- **Backend:** FastAPI, Python, Pydantic
- **Database:** Supabase / PostgreSQL
- **Background Jobs:** Node.js Worker

## 📂 Project Structure
- `/frontend`: Next.js application & UI components.
- `/backend`: FastAPI business logic, services, and API endpoints.
- `/database`: Documentation, ERDs, and business flows.
- `/supabase`: Executable database migrations, edge functions, and policies.
- `/shared`: Shared TypeScript types across frontend and Node worker.
- `/node-worker`: Scheduled and heavy background jobs.

## ⚙️ Core Architecture Rules
1. **Authentication:** Handled via Supabase Auth -> JWT verified by FastAPI.
2. **Business Logic:** Resides entirely in the FastAPI Service Layer.
3. **Inventory Flow:** Validated -> DB Transaction -> Update Inventory -> Create Ledger Entry.

## 🛠️ Setup Instructions
*(To be updated by the team as development progresses)*