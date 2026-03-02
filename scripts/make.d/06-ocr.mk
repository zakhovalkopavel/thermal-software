# OCR-related targets
.PHONY: ocr-test ocr-extract-auto ocr-extract-doc ocr-extract-doc-simple ocr-extract-interactive ocr-extract-doc-interactive ocr-extract-doc-help ocr-test-doc ocr-test-scientific ocr-test-chart ocr-test-opencv ocr-test-images ocr-test-all

ocr-test: ## Create OCR test images (in python container)
	@echo "🔬 Creating test data for OCR extraction..."
	@docker-compose run --rm python python /app/tests/create_simple_test_images.py
	@echo ""
	@echo "✅ Test data created. You can now run:"
	@echo "  make ocr-extract"

ocr-extract-auto: ## Automatic OCR extraction for FILE=<filename> (full features)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ ERROR: FILE not specified"; \
		echo ""; \
		echo "Usage: make ocr-extract-auto FILE=<filename>"; \
		echo ""; \
		echo "Examples:"; \
		echo "  make ocr-extract-auto FILE=document.pdf"; \
		echo "  make ocr-extract-auto FILE=image.png"; \
		echo ""; \
		echo "This runs FULL automatic extraction with:"; \
		echo "  - Multi-language auto-detection"; \
		echo "  - Graphics extraction"; \
		echo "  - Scientific notation processing"; \
		echo "  - Table detection"; \
		exit 1; \
	fi
	@echo "🤖 Automatic OCR Extraction: $(FILE)"
	@echo "🔍 Auto-detect: Languages, Graphics, Tables, Scientific notation"
	@docker-compose exec python python /app/src/scripts/extract_document.py \
		--auto-detect-lang \
		--extract-graphics \
		--scientific \
		"/app/shared/sources/$(FILE)"

ocr-extract-doc: ## Extract a specific document (FILE=<filename>)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ ERROR: FILE not specified"; \
		echo ""; \
		echo "Usage: make ocr-extract-doc FILE=<filename>"; \
		echo ""; \
		echo "Examples:"; \
		echo "  make ocr-extract-doc FILE=document.pdf"; \
		echo "  make ocr-extract-doc FILE=report.png"; \
		echo ""; \
		echo "The file should be in shared/sources/"; \
		echo ""; \
		echo "For more options, use: make ocr-extract-doc-help"; \
		exit 1; \
	fi
	@echo "📄 Extracting document: $(FILE)"
	@echo "🔍 Features: Multi-language detection, Graphics extraction, Scientific mode"
	@docker-compose exec python python /app/src/scripts/extract_document.py \
		--auto-detect-lang \
		--extract-graphics \
		--scientific \
		$(FILE)

ocr-extract-doc-simple: ## Simple extract for FILE=<filename> (basic mode)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ ERROR: FILE not specified"; \
		echo ""; \
		echo "Usage: make ocr-extract-doc-simple FILE=<filename>"; \
		echo ""; \
		echo "Example: make ocr-extract-doc-simple FILE=document.pdf"; \
		exit 1; \
	fi
	@echo "📄 Extracting document (simple mode): $(FILE)"
	@docker-compose exec python python /app/src/scripts/extract_document.py $(FILE)

ocr-extract-interactive: ## Interactive OCR extraction (select and review regions)
	@echo "🎯 Interactive OCR Extraction (Review → OCR)"
	@echo "Draw regions on page images, then OCR approved regions"
	@if [ -z "$(FILE)" ]; then \
		echo "Select file:"; \
		docker-compose exec python python -c "import os; exts = ('.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff'); files = sorted([f for f in os.listdir('/app/shared/sources') if f.lower().endswith(exts)]); [print(f'{i+1}. {f}') for i, f in enumerate(files)]"; \
		read -p "Enter number: " num; \
		file=$$(docker-compose exec -T python python -c "import os; exts = ('.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff'); files = sorted([f for f in os.listdir('/app/shared/sources') if f.lower().endswith(exts)]); print(files[int($$num)-1] if 0 < int($$num) <= len(files) else '')" | tr -d '\r\n'); \
		docker-compose exec python python /app/src/scripts/interactive_extraction.py "/app/shared/sources/$$file"; \
	else \
		docker-compose exec python python /app/src/scripts/interactive_extraction.py "/app/shared/sources/$(FILE)"; \
	fi

ocr-extract-doc-interactive: ## Run interactive document extraction UI
	@echo "📄 OCR Document Extraction - Interactive Mode"
	@echo "🔍 Features: Multi-language detection, Graphics extraction, Scientific mode"
	@docker-compose exec python python /app/src/scripts/extract_document.py \
		--auto-detect-lang \
		--extract-graphics \
		--scientific

ocr-extract-doc-help: ## Show help for document extraction script
	@echo "📚 OCR Document Extraction - Help"
	@echo "=================================="
	@echo ""
	@docker-compose exec python python /app/src/scripts/extract_document.py --help

ocr-test-doc: ## Run OCR document extraction unit tests
	@echo "🧪 Testing new OCR document extraction..."
	@docker-compose exec python python /app/tests/test_document_extraction.py

# OCR Test Suite Commands
ocr-test-scientific: ## Run scientific notation OCR tests
	@echo "🧪 Testing Scientific Notation Processing..."
	@echo "Tests: Greek letters, chemical formulas, subscripts/superscripts"
	@docker-compose exec python python /app/tests/test_scientific_comprehensive.py

ocr-test-chart: ## Run chart detection tests
	@echo "🧪 Testing Chart Detection..."
	@echo "Tests: Chart detection, table header filtering"
	@docker-compose exec python python /app/tests/test_chart_detection.py

ocr-test-opencv: ## Run OpenCV-related OCR tests
	@echo "🧪 Testing OpenCV Functions..."
	@docker-compose exec python python /app/tests/test_opencv.py

ocr-test-images: ## Run image analysis tests
	@echo "🧪 Analyzing Lakatos Cropped Images..."
	@docker-compose exec python python /app/tests/analyze_lakatos_images.py

ocr-test-all: ## Run the full OCR test suite (multiple steps)
	@echo "🧪 Running ALL OCR Tests..."
	@echo ""
	@echo "=" | awk '{for(i=1;i<=80;i++)printf "="}END{print ""}'
	@echo "Test 1/4: OpenCV Verification"
	@echo "=" | awk '{for(i=1;i<=80;i++)printf "="}END{print ""}'
	@docker-compose exec python python /app/tests/test_opencv.py
	@echo ""
	@echo "=" | awk '{for(i=1;i<=80;i++)printf "="}END{print ""}'
	@echo "Test 2/4: Scientific Notation Processing"
	@echo "=" | awk '{for(i=1;i<=80;i++)printf "="}END{print ""}'
	@docker-compose exec python python /app/tests/test_scientific_comprehensive.py

