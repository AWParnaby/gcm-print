# gcm-print

A Node.js command-line tool for generating printable PDF cards from CSV data for Group Concept Mapping (GCM) workshops.

## Overview

gcm-print automates the creation of professionally formatted, printable PDF files containing workshop materials for the Group Concept Mapping method. The tool generates individual response cards that can be printed, stacked, and cut using a paper guillotine, with each participant receiving a complete randomized deck of all responses.

## Features

- **CSV to PDF Conversion**: Transform response data into printable card decks
- **Title Cards**: Configurable title cards for pile labeling during sorting activities (default: 10 per participant)
- **Cryptographic Randomization**: Each participant receives a uniquely shuffled deck using cryptographically secure random number generation
- **Dynamic Text Scaling**: Automatically adjusts font size to fit long responses while maintaining readability
- **Flexible Layout**: Configurable cards per page (2-20) with automatic recommendations for optimal text size
- **Professional Layout**: Cards optimized for A4 paper with crop marks for easy cutting
- **Logo Support**: Optional logo integration on each card
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

### Basic Usage

```bash
gcm-print -i responses.csv -n 25 -o workshop.pdf
```

This generates a PDF with 25 randomized participant decks from the responses in `responses.csv`.

### With Logo

```bash
gcm-print -i responses.csv -n 20 -l logo.png -o cards.pdf
```

### Full Command Structure

```bash
gcm-print [options]

Options:
  -i, --input <file>              CSV file with responses (required)
  -n, --participants <number>     Number of participants (required)
  -o, --output <file>             Output PDF filename (default: "gcm-cards.pdf")
  -l, --logo <file>               Logo image file (PNG, JPG, SVG)
  -c, --cards-per-page <number>   Cards per page, 2-20 (default: 10)
  -t, --title-cards <number>      Title cards per participant, 0-50 (default: 10)
  --no-title-cards                Skip title card generation
  -V, --version                   Output version number
  -h, --help                      Display help information
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

## Card Specifications

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

## PDF Output

### Structure

- Cards organized by participant (Participant 1, then Participant 2, etc.)
- Each participant's deck starts with title cards (default: 10), followed by all responses in a unique random order
- Footer on each page: "Participant X - Page Y of Z"
- Automatic warnings if text scaling is required, with recommendations for optimal cards-per-page settings

### Metadata

- Title: "GCM Workshop Cards"
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
- `test-output.pdf` - Sample generated PDF

### Try It Out

```bash
# Clone or download the repository
git clone https://github.com/yourusername/gcm-print.git
cd gcm-print

# Install dependencies
npm install

# Basic example with default settings (10 title cards per participant)
node bin/cli.js -i examples/sample-responses.csv -n 3 -o output.pdf

# Custom number of title cards
node bin/cli.js -i examples/sample-responses.csv -n 3 -t 5 -o output.pdf

# Skip title cards entirely
node bin/cli.js -i examples/sample-responses.csv -n 3 --no-title-cards -o output.pdf

# Adjust cards per page for better readability with long text
node bin/cli.js -i examples/sample-responses.csv -n 3 -c 6 -o output.pdf
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
│   └── cli.js              # CLI entry point
├── src/
│   ├── index.js            # Main orchestrator
│   ├── validator.js        # Input validation
│   ├── parser.js           # CSV parsing
│   ├── randomizer.js       # Cryptographic shuffling
│   └── generator.js        # PDF generation
├── examples/
│   ├── sample-responses.csv
│   ├── sample-logo.png
│   └── test-output.pdf
├── package.json
└── README.md
```

## License

MIT

## Contributing

I created this tool for my personal use, and am unlikely to spend much time updating it. Whilst you are welcome to submit issues and contributions, please keep in mind that I am likely to be sporadic in getting to them!

## Support

For issues, questions, or feedback, please open an issue on the GitHub repository.
