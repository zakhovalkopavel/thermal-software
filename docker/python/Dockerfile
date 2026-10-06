ARG PYTHON_VERSION
ARG TESSERACT_VERSION

# Debian ships Tesseract 5.5.0 only; build the upstream release on the same base image
FROM python:${PYTHON_VERSION} AS tesseract-build
ARG TESSERACT_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    pkg-config \
    curl \
    ca-certificates \
    libleptonica-dev \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL "https://github.com/tesseract-ocr/tesseract/archive/refs/tags/${TESSERACT_VERSION}.tar.gz" \
      | tar -xz -C /tmp && \
    cmake -S "/tmp/tesseract-${TESSERACT_VERSION}" -B /tmp/tesseract-build \
      -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_INSTALL_PREFIX=/usr/local \
      -DBUILD_SHARED_LIBS=ON \
      -DBUILD_TRAINING_TOOLS=OFF \
      -DBUILD_TESTS=OFF \
      -DGRAPHICS_DISABLED=ON \
      -DDISABLE_ARCHIVE=ON \
      -DDISABLE_CURL=ON && \
    cmake --build /tmp/tesseract-build -j"$(nproc)" && \
    DESTDIR=/opt/tesseract cmake --install /tmp/tesseract-build

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
    libgtk2.0-dev \
    libgtk-3-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libleptonica6 \
    tesseract-ocr-osd \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-ces \
    tesseract-ocr-pol \
    tesseract-ocr-ukr \
    tesseract-ocr-rus \
    tesseract-ocr-jpn \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
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

COPY --from=tesseract-build /opt/tesseract/usr/local/ /usr/local/
RUN ldconfig && tesseract --version

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
