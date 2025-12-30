# Vigilant Alpaca Hum

This project consists of a frontend and a backend application.

## Frontend

The frontend is a React application built with Vite.

### Running the frontend

To run the frontend, navigate to the `frontend` directory and run:

```bash
pnpm install
pnpm dev
```

## Backend

The backend is a Python application built with FastAPI.

### Running the backend

To run the backend, navigate to the `backend` directory, create a virtual environment, install the dependencies, and run the application:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
pip install -r requirements.txt
uvicorn main:app --reload