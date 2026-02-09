ARG PYTHON_VERSION=3.14.3-slim

FROM python:${PYTHON_VERSION}

# Install system dependencies for OCR, image processing and numerical libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    git \
    gfortran \
    libopenblas-dev \
    libblas-dev \
    liblapack-dev \
    libgomp1 \
    libgl1 \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    ghostscript \
    default-jre-headless \
    libjpeg-dev \
    libpng-dev \
    zlib1g-dev \
    wget \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy pyproject and requirements
COPY pyproject.toml poetry.lock* ./

# Install Poetry
ENV POETRY_HOME="/opt/poetry"
ENV PATH="$POETRY_HOME/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | POETRY_HOME=/opt/poetry python - && \
    poetry --version

# Configure Poetry to install into the system environment and install
# (disables virtualenv creation so packages are available globally inside the image)
# Install dev dependencies as well so the image is test-ready (pytest/black/isort etc.)
# Increase timeout and add retries for large packages like opencv-python
RUN poetry config virtualenvs.create false --local && \
    poetry config installer.max-workers 10 && \
    pip config set global.timeout 600 && \
    pip config set global.retries 5 && \
    poetry install --no-root --no-interaction --no-ansi || \
    (echo "Retrying installation..." && poetry install --no-root --no-interaction --no-ansi)

# Copy remaining source files
COPY src/ /app/src/
COPY tests/ /app/tests/

# Create necessary directories
RUN mkdir -p /app/shared/sources /app/shared/processed /app/reports

# Add src to Python path
ENV PYTHONPATH="/app/src:${PYTHONPATH}"
ENV PYTHONUNBUFFERED=1
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata

# Default command
CMD ["tail", "-f", "/dev/null"]
