# gcm-print

A Node.js command-line tool for generating printable PDF worksheets from CSV data for Group Concept Mapping (GCM) workshops.

## Overview

gcm-print automates the creation of professionally formatted, printable PDF files containing workshop materials for the Group Concept Mapping method. The tool supports two types of worksheets:

- **Sorting**: Individual response cards that can be printed, stacked, and cut using a paper guillotine, with each participant receiving a complete randomized deck of all responses for pile sorting activities.
- **Rating**: Table-based rating sheets where participants rate each response on multiple criteria using Likert scales.

## Features

- **Two Worksheet Types**: Generate either sorting cards or rating sheets depending on your research needs
- **CSV to PDF Conversion**: Transform response data into printable worksheets
- **Cryptographic Randomization**: Each participant receives a uniquely shuffled order using cryptographically secure random number generation
- **Dynamic Text Scaling**: Automatically adjusts font size to fit long responses while maintaining readability
- **Sorting Cards**:
  - Title cards for pile labeling (configurable 0-50, default: 10 per participant)
  - Flexible layout with 2-20 cards per page
  - Crop marks for easy cutting
- **Rating Sheets**:
  - Table-based layout with ID, Response, and custom rating criteria columns
  - Configurable Likert scales (3-7 point, default: 4-point) for each criterion
  - Auto-orientation detection (portrait/landscape) based on number of criteria
  - Multi-page support with repeating headers
- **Professional Layout**: Optimized for A4 or Letter paper
- **Logo Support**: Optional logo integration on worksheets
- **Fully Offline**: Zero external network calls - all processing happens locally
- **Input Validation**: Comprehensive validation of CSV structure and input parameters
- **Progress Feedback**: Real-time progress updates during PDF generation

## Installation

### Requirements

- Node.js v18 or higher
- Git

### Install from GitHub

```bash
# Clone the repository
git clone https://github.com/yourusername/gcm-print.git
cd gcm-print

# Install dependencies
npm install

# Link the command globally (optional)
npm link
```

After running `npm link`, you can use the `gcm-print` command from anywhere. Alternatively, run it directly with `node bin/cli.js`.

## Usage

gcm-print supports two commands: `sorting` for card-based pile sorting activities, and `rating` for structured rating sheets.

### Sorting Command

Generate randomized card decks for pile sorting activities.

#### Basic Usage

```bash
gcm-print sorting -i responses.csv -n 25 -o workshop.pdf
```

#### With Logo

```bash
gcm-print sorting -i responses.csv -n 20 -l logo.png -o cards.pdf
```

#### Full Options

```bash
gcm-print sorting [options]

Options:
  -i, --input <file>              CSV file with responses (required)
  -n, --participants <number>     Number of participants (required)
  -o, --output <file>             Output PDF filename (default: "gcm-cards.pdf")
  -l, --logo <file>               Logo image file (PNG, JPG, SVG)
  -c, --cards-per-page <number>   Cards per page, 2-20 (default: 10)
  -t, --title-cards <number>      Title cards per participant, 0-50 (default: 10)
  --no-title-cards                Skip title card generation
  -h, --help                      Display help information
```

### Rating Command

Generate rating sheets for structured assessment activities.

#### Basic Usage

```bash
gcm-print rating -i responses.csv -n 30 -c "Importance,Urgency"
```

#### With Multiple Criteria

```bash
gcm-print rating -i responses.csv -n 25 -c "Importance,Urgency,Feasibility,Impact" -o ratings.pdf
```

#### With Logo

```bash
gcm-print rating -i responses.csv -n 20 -c "Priority" -l logo.png
```

#### Full Options

```bash
gcm-print rating [options]

Options:
  -i, --input <file>           CSV file with responses (required)
  -n, --participants <number>  Number of rating sheets to generate (required)
  -o, --output <file>          Output PDF filename (default: "gcm-rating-sheets.pdf")
  -c, --criteria <list>        Comma-separated list of rating criteria (default: "Rating")
  -l, --logo <file>            Logo image file (PNG, JPG, SVG)
  -s, --scale <number>         Likert scale size, 3-7 point scale (default: 4)
  -p, --page-size <size>       Paper size: letter or a4 (default: "a4")
  --orientation <type>         Page orientation: portrait or landscape (default: auto)
  --separator-pages            Add separator pages between participants
  --double-sided               Insert blank pages for double-sided printing
  -h, --help                   Display help information
```

### Global Options

```bash
gcm-print [options] [command]

Options:
  -V, --version      Output version number
  -h, --help         Display help information
```

## CSV Format

### Required Format

Your CSV file must contain two columns with headers: `id` and `response`

```csv
id,response
1,Improved communication between departments
2,More flexible work schedules
3,Better training for new employees
```

### Format Rules

- **Headers**: First row must contain `id` and `response` (case-insensitive)
- **IDs**: Must be unique (integers or strings)
- **Responses**: Cannot be empty
- **Encoding**: UTF-8 encoding supported
- **Special Characters**: Quoted strings supported for responses containing commas
- **Additional Columns**: Extra columns are ignored

## Output Specifications

### Sorting Cards

- **Card Size**: 3.25" × 1.875" (83mm × 48mm)
- **Cards Per Page**: 10 by default (configurable 2-20, automatic grid layout)
- **Page Size**: A4 (210mm × 297mm)
- **Card Types**:
  - **Title Cards**: For pile labeling with participant number (P1, P2, etc.), prompt text, and blank space for notes
  - **Response Cards**: Survey responses with ID numbers and auto-scaling text (13pt preferred, scales down to 7pt minimum if needed)
- **Typography**:
  - Response text: 13pt Helvetica (auto-scales for long text)
  - ID/Participant number: 11pt Helvetica Bold
  - High contrast black text on white background
- **Logo**: Maximum 0.5" × 0.5" at 85% opacity (when provided)
- **Crop Marks**: Dashed lines between cards for cutting guidance
- **Structure**:
  - Cards organized by participant (Participant 1, then Participant 2, etc.)
  - Each participant's deck starts with title cards (default: 10), followed by all responses in a unique random order
  - Footer on each page: "Participant X - Page Y of Z"
  - Automatic warnings if text scaling is required, with recommendations for optimal cards-per-page settings

### Rating Sheets

- **Format**: Table-based layout with columns for ID, Response, and rating criteria
- **Page Size**: A4 or Letter (configurable)
- **Orientation**: Auto-detected based on number of criteria (portrait for ≤3, landscape for >3), or manually specified
- **Rating Scale**: Configurable Likert scale (3-7 point, default: 4-point scale with 1 2 3 4) for each criterion
- **Typography**:
  - Response text: 10pt Helvetica
  - Headers: 10pt Helvetica Bold
  - ID numbers: 9pt Helvetica
  - High contrast black text on white background
- **Logo**: Maximum 0.5" × 0.5" at 85% opacity (when provided)
- **Structure**:
  - One or more pages per participant
  - Each participant receives all responses in a unique random order
  - Column headers repeated on each page
  - Footer: "Participant X - Rating Sheet (Page Y)"
  - Optional separator pages between participants

### PDF Metadata

- **Sorting**: Title: "GCM Workshop Cards"
- **Rating**: Title: "GCM Rating Sheets"
- Author: "gcm-print"
- Keywords: "Group Concept Mapping, Workshop, Research"

## Privacy & Security

**This tool never transmits data over the network.**

- ✅ All processing happens locally on your machine
- ✅ No analytics or telemetry
- ✅ No external API calls
- ✅ No cloud services
- ✅ Works completely offline

This makes gcm-print suitable for sensitive research data, including healthcare and HIPAA-compliant environments.

## Examples

The `examples/` directory contains:

- `sample-responses.csv` - Example CSV with 15 responses
- `sample-logo.png` - Example logo image

### Try It Out

```bash
# Clone or download the repository
git clone https://github.com/yourusername/gcm-print.git
cd gcm-print

# Install dependencies
npm install

# Sorting examples
# Basic sorting cards with default settings (10 title cards per participant)
node bin/cli.js sorting -i examples/sample-responses.csv -n 3 -o output.pdf

# Custom number of title cards
node bin/cli.js sorting -i examples/sample-responses.csv -n 3 -t 5 -o output.pdf

# Skip title cards entirely
node bin/cli.js sorting -i examples/sample-responses.csv -n 3 --no-title-cards -o output.pdf

# Adjust cards per page for better readability with long text
node bin/cli.js sorting -i examples/sample-responses.csv -n 3 -c 6 -o output.pdf

# Rating examples
# Basic rating sheet with single criterion
node bin/cli.js rating -i examples/sample-responses.csv -n 3 -c "Priority" -o ratings.pdf

# Multiple rating criteria
node bin/cli.js rating -i examples/sample-responses.csv -n 3 -c "Importance,Urgency,Feasibility" -o ratings.pdf

# With logo and separator pages
node bin/cli.js rating -i examples/sample-responses.csv -n 3 -c "Priority" -l examples/sample-logo.png --separator-pages -o ratings.pdf

# Force landscape orientation for many criteria
node bin/cli.js rating -i examples/sample-responses.csv -n 3 -c "A,B,C,D,E" --orientation landscape -o ratings.pdf
```

## Troubleshooting

### Error: "Input CSV file not found"

Ensure the CSV file path is correct. Use absolute paths or paths relative to your current directory.

### Error: "CSV must contain an 'id' column"

Check that your CSV file has a header row with `id` and `response` columns.

### Error: "Logo file format not supported"

Supported logo formats: PNG, JPG, JPEG, SVG. Ensure your logo file has one of these extensions.

### Cards Not Printing Correctly

- Ensure your printer is set to actual size (not "fit to page")
- Use 100% scale when printing
- Verify A4 paper size is selected

## Technical Details

### Dependencies

- **pdfkit** - PDF generation
- **csv-parser** - CSV file parsing
- **commander** - CLI argument parsing
- **sharp** - Image processing for logos

### Project Structure

```
gcm-print/
├── bin/
│   └── cli.js                # CLI entry point
├── src/
│   ├── sorting.js            # Sorting command orchestrator
│   ├── rating.js             # Rating command orchestrator
│   ├── validator.js          # Input validation
│   ├── parser.js             # CSV parsing
│   ├── randomizer.js         # Cryptographic shuffling
│   ├── generator.js          # Sorting cards PDF generation
│   └── rating-generator.js   # Rating sheets PDF generation
├── examples/
│   ├── sample-responses.csv
│   └── sample-logo.png
├── package.json
└── README.md
```

## License

MIT

## Contributing

I created this tool for my personal use, and am unlikely to spend much time updating it. Whilst you are welcome to submit issues and contributions, please keep in mind that I am likely to be sporadic in getting to them!

## Support

For issues, questions, or feedback, please open an issue on the GitHub repository.
