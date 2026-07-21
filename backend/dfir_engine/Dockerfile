FROM python:3.11-slim

# Install system dependencies
# libmagic is required for python-magic-bin on linux
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the DFIR engine port
EXPOSE 5003

# Run the application
CMD ["uvicorn", "dfir_engine.main:app", "--host", "0.0.0.0", "--port", "5003"]
