import fitz
import re
import easyocr
import os
import cv2
from docx import Document


# ============================================================
# EasyOCR
# ============================================================

ocr_reader = easyocr.Reader(["en"], gpu=False)


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def create_ocr_variants(image_path):
    """
    Create OCR-friendly versions of an image.

    We keep a grayscale version because aggressive thresholding
    can destroy small programming characters such as:
        _  =  .  (  )  [  ]  :  '  "
    """

    image = cv2.imread(image_path)

    if image is None:
        return [image_path]

    # Increase resolution
    image = cv2.resize(
        image,
        None,
        fx=2.5,
        fy=2.5,
        interpolation=cv2.INTER_CUBIC
    )

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # Improve contrast
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

    # Mild sharpening
    sharpen_kernel = cv2.getStructuringElement(
        cv2.MORPH_RECT,
        (2, 2)
    )

    sharpened = cv2.morphologyEx(
        enhanced,
        cv2.MORPH_CLOSE,
        sharpen_kernel
    )

    base, _ = os.path.splitext(image_path)

    gray_path = f"{base}_gray.png"
    threshold_path = f"{base}_threshold.png"

    cv2.imwrite(
        gray_path,
        enhanced
    )

    thresholded = cv2.adaptiveThreshold(
        enhanced,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        9
    )

    cv2.imwrite(
        threshold_path,
        thresholded
    )

    return [
        gray_path,
        threshold_path
    ]


# ============================================================
# CODE DETECTION
# ============================================================

def looks_like_code(text):
    """
    Detect whether OCR output probably contains programming code.
    """

    if not text:
        return False

    lower = text.lower()

    code_keywords = [
        "import ",
        "from ",
        "def ",
        "class ",
        "return ",
        "print",
        "for ",
        "while ",
        "if ",
        "else",
        "elif ",
        "try",
        "except",
        "pd.",
        "np.",
        "sklearn",
        "read_csv",
        "train_test_split",
        "decisiontree",
        "value_counts",
        "get_dummies",
        "fit(",
        "predict("
    ]

    keyword_count = sum(
        1
        for keyword in code_keywords
        if keyword in lower
    )

    punctuation = (
        text.count("=")
        + text.count("(")
        + text.count(")")
        + text.count("[")
        + text.count("]")
        + text.count("_")
        + text.count(":")
        + text.count(".")
    )

    if keyword_count >= 2:
        return True

    if len(text.splitlines()) >= 3 and punctuation >= 8:
        return True

    return False


# ============================================================
# OCR
# ============================================================

def run_ocr(image_path):
    """
    Run EasyOCR while preserving spatial positions.
    """

    results = ocr_reader.readtext(
        image_path,
        detail=1,
        paragraph=False
    )

    detections = []

    for bbox, text, confidence in results:

        text = text.strip()

        if not text:
            continue

        xs = [
            point[0]
            for point in bbox
        ]

        ys = [
            point[1]
            for point in bbox
        ]

        x_min = min(xs)
        y_min = min(ys)
        y_max = max(ys)

        height = max(
            1,
            y_max - y_min
        )

        detections.append({
            "text": text,
            "x": x_min,
            "y": y_min,
            "height": height,
            "confidence": confidence
        })

    if not detections:
        return "", 0.0

    # --------------------------------------------------------
    # Sort top-to-bottom
    # --------------------------------------------------------

    detections.sort(
        key=lambda item: item["y"]
    )

    lines = []

    # --------------------------------------------------------
    # Group detections into lines
    # --------------------------------------------------------

    for item in detections:

        center_y = (
            item["y"]
            + item["height"] / 2
        )

        placed = False

        for line in lines:

            line_center_y = sum(
                detection["y"]
                + detection["height"] / 2
                for detection in line
            ) / len(line)

            tolerance = max(
                8,
                min(
                    item["height"],
                    40
                ) * 0.65
            )

            if abs(
                center_y
                - line_center_y
            ) <= tolerance:

                line.append(item)
                placed = True
                break

        if not placed:
            lines.append(
                [item]
            )

    # --------------------------------------------------------
    # Sort lines vertically
    # --------------------------------------------------------

    lines.sort(
        key=lambda line:
        min(
            item["y"]
            for item in line
        )
    )

    output_lines = []

    for line in lines:

        # Left-to-right
        line.sort(
            key=lambda item:
            item["x"]
        )

        parts = [
            item["text"]
            for item in line
            if item["text"]
        ]

        if parts:

            output_lines.append(
                " ".join(parts)
            )

    text = "\n".join(
        output_lines
    )

    confidence = sum(
        item["confidence"]
        for item in detections
    ) / len(detections)

    return (
        text,
        confidence
    )


# ============================================================
# OCR SCORING
# ============================================================

def score_ocr_result(text, confidence):
    """
    Score OCR result.

    Code screenshots receive extra points for preserving
    programming syntax.
    """

    if not text.strip():
        return -1

    score = confidence * 100

    if looks_like_code(text):

        # Programming characters
        syntax_chars = [
            "=",
            "(",
            ")",
            "[",
            "]",
            "{",
            "}",
            "_",
            ":",
            ".",
            "'",
            '"'
        ]

        syntax_count = sum(
            text.count(char)
            for char in syntax_chars
        )

        score += syntax_count * 0.8

        # Programming words
        code_words = [
            "import",
            "from",
            "def",
            "class",
            "return",
            "print",
            "pd",
            "np",
            "sklearn",
            "read_csv",
            "train_test_split",
            "value_counts",
            "get_dummies"
        ]

        word_count = sum(
            1
            for word in code_words
            if word.lower()
            in text.lower()
        )

        score += word_count * 4

    # Slight preference for useful output
    score += min(
        len(text) / 100,
        10
    )

    return score


# ============================================================
# CHOOSE BEST OCR RESULT
# ============================================================

def choose_best_ocr_result(results):

    if not results:
        return ""

    best_text = ""
    best_score = -1

    for text, confidence in results:

        score = score_ocr_result(
            text,
            confidence
        )

        if score > best_score:

            best_score = score
            best_text = text

    return best_text


# ============================================================
# IMAGE OCR
# ============================================================

def extract_image_text(image_path):

    variants = create_ocr_variants(
        image_path
    )

    generated_paths = [
        path
        for path in variants
        if path != image_path
    ]

    try:

        results = []

        for variant in variants:

            try:

                text, confidence = run_ocr(
                    variant
                )

                if text.strip():

                    results.append(
                        (
                            text,
                            confidence
                        )
                    )

            except Exception as e:

                print(
                    f"OCR pass failed: {e}"
                )

        if not results:
            return ""

        return choose_best_ocr_result(
            results
        )

    finally:

        for path in generated_paths:

            if os.path.exists(path):

                try:
                    os.remove(path)
                except Exception:
                    pass


# ============================================================
# DOCX EXTRACTION
# ============================================================

def extract_docx_text(docx_path):

    document = Document(
        docx_path
    )

    extracted_content = []

    for paragraph in document.paragraphs:

        # ----------------------------------------------------
        # Normal text
        # ----------------------------------------------------

        text = paragraph.text.strip()

        if text:

            extracted_content.append(
                text
            )

        # ----------------------------------------------------
        # Images inside paragraph
        # ----------------------------------------------------

        for run in paragraph.runs:

            drawings = run._element.xpath(
                ".//w:drawing"
            )

            for drawing in drawings:

                blips = drawing.xpath(
                    ".//a:blip"
                )

                for blip in blips:

                    embed_id = blip.get(
                        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
                    )

                    if not embed_id:
                        continue

                    try:

                        image_part = (
                            document.part
                            .related_parts[
                                embed_id
                            ]
                        )

                        image_data = (
                            image_part.blob
                        )

                        temp_image_path = (
                            f"{docx_path}"
                            f"_ocr_temp_"
                            f"{len(extracted_content)}.png"
                        )

                        try:

                            with open(
                                temp_image_path,
                                "wb"
                            ) as image_file:

                                image_file.write(
                                    image_data
                                )

                            print(
                                "Running OCR on DOCX image..."
                            )

                            ocr_text = (
                                extract_image_text(
                                    temp_image_path
                                )
                            )

                            if ocr_text.strip():

                                extracted_content.append(
                                    "### Image Content"
                                )

                                extracted_content.append(
                                    ocr_text.strip()
                                )

                        finally:

                            if os.path.exists(
                                temp_image_path
                            ):

                                os.remove(
                                    temp_image_path
                                )

                    except Exception as e:

                        print(
                            f"DOCX image OCR failed: {e}"
                        )

    return "\n\n".join(
        extracted_content
    )


# ============================================================
# HEADING DETECTION
# ============================================================

def looks_like_heading(text):

    text = text.strip()

    if not text:
        return False

    words = text.split()

    if len(words) > 10:
        return False

    if text.endswith(
        (".", ",", ";", "?", "!")
    ):
        return False

    if len(text) > 80:
        return False

    if (
        text.upper() == text
        and any(
            char.isalpha()
            for char in text
        )
    ):
        return True

    if re.match(
        r"^(\d+[\.\)]|\d+\.\d+|[A-Z][\.\)])\s+",
        text
    ):
        return True

    heading_words = [
        "introduction",
        "overview",
        "conclusion",
        "definition",
        "definitions",
        "objectives",
        "software security",
        "basic model",
        "security model",
        "unauthorized access",
        "unauthorized changes",
        "advantages",
        "disadvantages",
        "types",
        "features",
        "characteristics",
        "applications",
        "examples",
        "key points",
        "summary",
        "references"
    ]

    if text.lower() in heading_words:
        return True

    if len(words) <= 4:
        return True

    return False


# ============================================================
# MAIN EXTRACTION
# ============================================================

def extract_text(file_path):

    extension = os.path.splitext(
        file_path
    )[1].lower()

    # ========================================================
    # IMAGE
    # ========================================================

    if extension in [
        ".png",
        ".jpg",
        ".jpeg"
    ]:

        print(
            "Running OCR on image file..."
        )

        return extract_image_text(
            file_path
        )

    # ========================================================
    # DOCX
    # ========================================================

    if extension == ".docx":

        print(
            "Extracting DOCX text and images..."
        )

        return extract_docx_text(
            file_path
        )

    # ========================================================
    # PDF
    # ========================================================

    document = fitz.open(
        file_path
    )

    extracted_content = []

    for page_number, page in enumerate(
        document
    ):

        blocks = page.get_text(
            "blocks"
        )

        page_has_text = any(
            block[4].strip()
            for block in blocks
            if len(block) > 4
        )

        # ----------------------------------------------------
        # Selectable text
        # ----------------------------------------------------

        if page_has_text:

            for block in blocks:

                block_text = (
                    block[4].strip()
                )

                if not block_text:
                    continue

                for line in block_text.splitlines():

                    line = line.strip()

                    if not line:
                        continue

                    if looks_like_heading(
                        line
                    ):

                        if (
                            line.upper()
                            == line
                            and any(
                                char.isalpha()
                                for char in line
                            )
                        ):

                            extracted_content.append(
                                f"## {line}"
                            )

                        else:

                            extracted_content.append(
                                f"### {line}"
                            )

                    else:

                        extracted_content.append(
                            line
                        )

                extracted_content.append("")

        # ----------------------------------------------------
        # Embedded images
        # ----------------------------------------------------

        images = page.get_images(
            full=True
        )

        if images:

            print(
                f"Found {len(images)} image(s) "
                f"on PDF page "
                f"{page_number + 1}. "
                f"Running OCR..."
            )

        for image_index, image in enumerate(
            images
        ):

            try:

                xref = image[0]

                image_data = (
                    document.extract_image(
                        xref
                    )
                )

                image_bytes = (
                    image_data["image"]
                )

                image_extension = (
                    image_data["ext"]
                )

                temp_image_path = (
                    f"{file_path}"
                    f"_page_{page_number + 1}"
                    f"_image_{image_index + 1}"
                    f".{image_extension}"
                )

                try:

                    with open(
                        temp_image_path,
                        "wb"
                    ) as image_file:

                        image_file.write(
                            image_bytes
                        )

                    ocr_text = (
                        extract_image_text(
                            temp_image_path
                        )
                    )

                    if ocr_text.strip():

                        extracted_content.append(
                            f"### Image Content "
                            f"(Page "
                            f"{page_number + 1})"
                        )

                        extracted_content.append(
                            ocr_text.strip()
                        )

                        extracted_content.append("")

                finally:

                    if os.path.exists(
                        temp_image_path
                    ):

                        os.remove(
                            temp_image_path
                        )

            except Exception as e:

                print(
                    f"OCR failed for image "
                    f"{image_index + 1} "
                    f"on PDF page "
                    f"{page_number + 1}: "
                    f"{e}"
                )

        # ----------------------------------------------------
        # Full-page OCR fallback
        # ----------------------------------------------------

        if (
            not page_has_text
            and not images
        ):

            print(
                f"No selectable text or "
                f"embedded images found on "
                f"page {page_number + 1}. "
                f"Running full-page OCR..."
            )

            pix = page.get_pixmap(
                matrix=fitz.Matrix(
                    2,
                    2
                )
            )

            temp_image_path = (
                f"{file_path}"
                f"_page_{page_number + 1}"
                f"_ocr.png"
            )

            try:

                pix.save(
                    temp_image_path
                )

                ocr_text = (
                    extract_image_text(
                        temp_image_path
                    )
                )

                if ocr_text.strip():

                    extracted_content.append(
                        ocr_text.strip()
                    )

                    extracted_content.append("")

            finally:

                if os.path.exists(
                    temp_image_path
                ):

                    os.remove(
                        temp_image_path
                    )

        extracted_content.append("")

    document.close()

    return "\n\n".join(
        extracted_content
    )