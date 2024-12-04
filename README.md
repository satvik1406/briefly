# Briefly

Briefly is a summarization tool designed to help users summarize code, research papers, and documentation efficiently. The application allows users to create, share, and manage summaries seamlessly.

## Features

- **User Authentication**: Secure login and registration for users.
- **Summary Creation**: Users can create summaries by uploading files or typing/pasting content.
- **Summary Sharing**: Users can share summaries with other registered users.
- **View Summaries**: Users can view their own summaries and those shared with them.
- **Regenerate Summaries**: Users can provide feedback to regenerate summaries based on their input.

## Technologies Used

- **Frontend**: React, Material-UI
- **Backend**: FastAPI, MongoDB
- **Libraries**: Axios for API requests, PyPDF2 for PDF handling, Mistral for AI summarization

## Installation

### Prerequisites

- Node.js and npm (for frontend)
- Python 3.x and pip (for backend)
- MongoDB (for database)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

## Usage

1. **Register/Login**: Users can register or log in to access the application.
2. **Create Summary**: Users can create a new summary by selecting the type and input method (upload or type).
3. **Share Summary**: Users can share their summaries with other users by entering the recipient's email or username.
4. **View Summaries**: Users can view their own summaries and those shared with them.
5. **Regenerate Summary**: Users can provide feedback to regenerate existing summaries.

## API Endpoints

- `POST /summary/create`: Create a new summary.
- `POST /summary/upload`: Upload a file to create a summary.
- `POST /summary/share`: Share a summary with another user.
- `GET /user/{userId}/shared-summaries`: Fetch all summaries shared with a specific user.
- `GET /summary/{summary_id}`: Fetch a specific summary.

