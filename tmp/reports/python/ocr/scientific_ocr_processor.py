"""
Scientific notation and special character handling for OCR
"""

import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class ScientificOCRProcessor:
    """
    Post-process OCR output to improve scientific notation detection
    Handles subscripts, superscripts, Greek letters, and special symbols
    Uses PATTERN-BASED detection for flexibility
    """

    # All Greek letters (upper and lower case)
    GREEK_LETTERS = {
        # Lowercase
        r'\balpha\b': 'α',
        r'\bbeta\b': 'β',
        r'\bgamma\b': 'γ',
        r'\bdelta\b': 'δ',
        r'\bepsilon\b': 'ε',
        r'\bzeta\b': 'ζ',
        r'\beta\b': 'η',  # eta
        r'\btheta\b': 'θ',
        r'\biota\b': 'ι',
        r'\bkappa\b': 'κ',
        r'\blambda\b': 'λ',
        r'\bmu\b': 'μ',
        r'\bnu\b': 'ν',
        r'\bxi\b': 'ξ',
        r'\bomicron\b': 'ο',
        r'\bpi\b': 'π',
        r'\brho\b': 'ρ',
        r'\bsigma\b': 'σ',
        r'\btau\b': 'τ',
        r'\bupsilon\b': 'υ',
        r'\bphi\b': 'φ',
        r'\bchi\b': 'χ',
        r'\bpsi\b': 'ψ',
        r'\bomega\b': 'ω',

        # Uppercase
        r'\bAlpha\b': 'Α',
        r'\bBeta\b': 'Β',
        r'\bGamma\b': 'Γ',
        r'\bDelta\b': 'Δ',
        r'\bEpsilon\b': 'Ε',
        r'\bZeta\b': 'Ζ',
        r'\bEta\b': 'Η',
        r'\bTheta\b': 'Θ',
        r'\bIota\b': 'Ι',
        r'\bKappa\b': 'Κ',
        r'\bLambda\b': 'Λ',
        r'\bMu\b': 'Μ',
        r'\bNu\b': 'Ν',
        r'\bXi\b': 'Ξ',
        r'\bOmicron\b': 'Ο',
        r'\bPi\b': 'Π',
        r'\bRho\b': 'Ρ',
        r'\bSigma\b': 'Σ',
        r'\bTau\b': 'Τ',
        r'\bUpsilon\b': 'Υ',
        r'\bPhi\b': 'Φ',
        r'\bChi\b': 'Χ',
        r'\bPsi\b': 'Ψ',
        r'\bOmega\b': 'Ω',
    }

    # Subscript numbers and letters
    SUBSCRIPT_MAP = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
        'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
        'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
        'v': 'ᵥ', 'x': 'ₓ',
    }

    # Superscript numbers and common symbols
    SUPERSCRIPT_MAP = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ',
    }

    def __init__(self):
        """Initialize the processor"""
        pass

    def process_text(self, text: str) -> str:
        """
        Process OCR text to improve scientific notation

        Args:
            text: Raw OCR text

        Returns:
            Processed text with proper scientific notation
        """
        if not text:
            return text

        processed = text

        # 1. Fix Greek letters - CASE SENSITIVE for uppercase
        # First handle uppercase (must come before lowercase to avoid conflicts)
        for pattern in [r'\bDelta\b', r'\bDELTA\b']:
            processed = re.sub(pattern, 'Δ', processed)
        for pattern in [r'\bGamma\b', r'\bGAMMA\b']:
            processed = re.sub(pattern, 'Γ', processed)
        for pattern in [r'\bSigma\b', r'\bSIGMA\b']:
            processed = re.sub(pattern, 'Σ', processed)
        for pattern in [r'\bOmega\b', r'\bOMEGA\b']:
            processed = re.sub(pattern, 'Ω', processed)

        # Then handle lowercase Greek letters
        for pattern, replacement in self.GREEK_LETTERS.items():
            processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)

        # 2. Fix common OCR mistakes for eta (viscosity symbol)
        # "log n" where n is likely eta
        processed = re.sub(r'\blog\s+n(?=\s+[0-9])', 'log η', processed)
        processed = re.sub(r'\blog\s+n(?=,)', 'log η', processed)
        processed = re.sub(r'at\s+log\s+n(?=,)', 'at log η', processed)

        # 3. Convert chemical formulas using pattern matching
        processed = self._convert_chemical_formulas(processed)

        # 4. Fix superscripts with ^
        processed = self._convert_superscripts(processed)

        # 5. Fix degree symbols
        processed = re.sub(r'([0-9])\s*[Cc](?=\s|$|,)', r'\1°C', processed)
        processed = re.sub(r'deg\s*C', '°C', processed, flags=re.IGNORECASE)
        processed = re.sub(r'degree\s*C', '°C', processed, flags=re.IGNORECASE)

        # 6. Fix ΔT (Delta T) - must be uppercase Delta
        processed = re.sub(r'\bDT\b', 'ΔT', processed)
        processed = re.sub(r'\bdT\b', 'ΔT', processed)

        # 7. Fix T with subscript 0
        processed = re.sub(r'T0(?=\s|$|,)', 'T₀', processed)
        processed = re.sub(r'To(?=\s|$|,)', 'T₀', processed)

        # 8. Fix subscript i in η_i
        processed = re.sub(r'η\s*i(?=\s|$|\+|,)', 'ηᵢ', processed)

        # 9. Fix minus signs (proper Unicode minus)
        processed = re.sub(r'(?<=\s)-(?=\s*[0-9])', '−', processed)
        processed = re.sub(r'^-(?=\s*[0-9])', '−', processed)
        processed = re.sub(r'(?<=,)-(?=[0-9])', '−', processed)

        return processed

    def _convert_chemical_formulas(self, text: str) -> str:
        """
        Convert chemical formulas to use subscripts
        Pattern-based: any uppercase letter followed by lowercase letter(s) followed by digit(s)
        Also handles numbers after parentheses like (PO4)2 → (PO₄)₂

        Args:
            text: Text containing chemical formulas

        Returns:
            Text with subscripted formulas
        """
        # Pattern 1: Element symbols (1-2 letters) followed by digits
        # [A-Z][a-z]? matches element symbols (Al, Ca, O, etc.)
        # ([0-9]+) matches the numbers to convert
        def replace_element_numbers(match):
            element = match.group(1)
            numbers = match.group(2)
            subscript_numbers = ''.join(self.SUBSCRIPT_MAP.get(d, d) for d in numbers)
            return element + subscript_numbers

        pattern = r'([A-Z][a-z]?)([0-9]+)'
        result = re.sub(pattern, replace_element_numbers, text)

        # Pattern 2: Numbers after closing parentheses
        # Like )2 → )₂, )6 → )₆
        def replace_paren_numbers(match):
            numbers = match.group(1)
            subscript_numbers = ''.join(self.SUBSCRIPT_MAP.get(d, d) for d in numbers)
            return ')' + subscript_numbers

        pattern = r'\)([0-9]+)'
        result = re.sub(pattern, replace_paren_numbers, result)

        # Pattern 3: Single lowercase variable followed by digits (like x2 → x₂)
        # But NOT if it's part of a larger word
        def replace_var_numbers(match):
            var = match.group(1)
            numbers = match.group(2)
            subscript_numbers = ''.join(self.SUBSCRIPT_MAP.get(d, d) for d in numbers)
            return var + subscript_numbers

        # Match single lowercase letter followed by digits
        # But not after uppercase (to avoid matching already processed formulas)
        pattern = r'(?<![A-Z])([a-z])([0-9]+)'
        result = re.sub(pattern, replace_var_numbers, result)

        return result

    def _convert_superscripts(self, text: str) -> str:
        """
        Convert ^N patterns to Unicode superscripts

        Args:
            text: Text with ^ notation

        Returns:
            Text with Unicode superscripts
        """
        def replace_superscript(match):
            content = match.group(1)
            # Convert each character if possible
            result = ''.join(self.SUPERSCRIPT_MAP.get(c, c) for c in content)
            return result

        # Match ^N, ^2, ^(2+), etc.
        # Single digit or letter
        text = re.sub(r'\^([0-9])', lambda m: self.SUPERSCRIPT_MAP.get(m.group(1), m.group(0)), text)

        # Multiple characters in parentheses: ^(n+1)
        text = re.sub(r'\^\(([^)]+)\)', replace_superscript, text)

        return text

    def process_table_data(self, df) -> None:
        """
        Process pandas DataFrame to improve scientific notation in tables
        Modifies DataFrame in place

        Args:
            df: pandas DataFrame with table data
        """
        import pandas as pd

        # Process column names
        df.columns = [self.process_text(str(col)) for col in df.columns]

        # Process first column (often chemical formulas or variables)
        if len(df.columns) > 0:
            first_col = df.columns[0]
            df[first_col] = df[first_col].apply(
                lambda x: self.process_text(str(x)) if pd.notna(x) else x
            )

        logger.debug("Processed table data for scientific notation")

    def detect_table_type(self, text: str) -> str:
        """
        Detect what type of scientific table this is

        Args:
            text: OCR text from table region

        Returns:
            Table type identifier
        """
        text_lower = text.lower()

        if 'log' in text_lower and ('eta' in text_lower or 'η' in text):
            return 'viscosity_coefficients'
        elif any(chem in text_lower for chem in ['al2o3', 'na2o', 'cao', 'sio2']):
            return 'composition_parameters'
        elif 'calc' in text_lower and ('dt' in text_lower or 'Δt' in text_lower):
            return 'calculated_temperatures'
        else:
            return 'unknown'

    def enhance_table_headers(self, headers: List[str]) -> List[str]:
        """
        Enhance table headers with proper formatting

        Args:
            headers: List of header strings

        Returns:
            Enhanced header strings
        """
        enhanced = []

        for header in headers:
            # Process with main text processor
            enhanced_header = self.process_text(header)
            enhanced.append(enhanced_header)

        return enhanced

