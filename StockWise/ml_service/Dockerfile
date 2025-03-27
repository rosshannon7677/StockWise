FROM python:3.10-slim

# Install system dependencies for matplotlib
RUN apt-get update && apt-get install -y \
    build-essential \
    make \
    gcc \
    libfreetype6-dev && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create directory for Firebase credentials and set permissions
RUN mkdir -p /secrets
COPY serviceAccountKey.json /secrets/credentials.json
RUN chmod 600 /secrets/credentials.json

# Copy application code
COPY . /app/
RUN chmod -R 755 /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the FastAPI application
CMD exec uvicorn api:app --host 0.0.0.0 --port ${PORT}