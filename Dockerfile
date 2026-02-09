# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# build-essential is often needed for compiling python packages
RUN apt-get update && apt-get install -y \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code from src folder
COPY src/agent.py .
COPY src/ai_prompt.md .

# Define environment variables (These should be overridden at runtime or in .env)
# ENV LIVEKIT_URL=...
# ENV LIVEKIT_API_KEY=...
# ENV LIVEKIT_API_SECRET=...

# Run the agent using the standard start command properly
# "start" is the command for production workers
CMD ["python", "agent.py", "start"]
