# Profiles Repository

This document describes the FreeGS profiles repository structure, how profiles are organized, and how to contribute.

## Repository Structure

The profiles repository is organized by **world region → ICAO code → scenery developer**:

```
freegs-profiles/
├── index.json              # Master index consumed by the app
├── europe/
│   ├── EDDF/               # Frankfurt Airport
│   │   ├── mk-studios/     # Profile for MK Studios scenery
│   │   │   ├── eddf-mkstudios-user.zip
│   │   │   └── README.md   # Notes about this specific profile
│   │   ├── aerosoft/
│   │   └── microsoft/
│   ├── EDDL/               # Düsseldorf Airport
│   │   ├── mk-studios/
│   │   └── aerosoft/
│   └── ...
├── north-america/
├── south-america/
├── asia/
├── africa/
└── oceania/
```

### Regions

| Region | Scope |
|--------|-------|
| `europe` | All European airports (E* ICAOs + BGGH, etc.) |
| `north-america` | US, Canada, Mexico (K*, C* ICAOs) |
| `south-america` | Central and South America (S* ICAOs) |
| `asia` | Asia and Middle East |
| `africa` | African continent |
| `oceania` | Australia, New Zealand, Pacific islands |

## Adding a Profile

### Step 1: Prepare the Files

Create a `.zip` archive containing:
- The GSX profile `.ini` file
- The GSX Python `.py` file (if applicable)

**Naming convention for the zip:**
```
{icao}-{developer}-{author}.zip
```
Example: `eddf-mkstudios-hinshee.zip`

### Step 2: Create the Directory Structure

```
mkdir -p freegs-profiles/europe/EDDF/mk-studios/
# Place the zip file in the developer directory
cp eddf-mkstudios-hinshee.zip freegs-profiles/europe/EDDF/mk-studios/
```

### Step 3: Update the Index

Add an entry to `index.json`:

```json
{
  "icao": "EDDF",
  "region": "europe",
  "developer": "mk-studios",
  "scenery_name": "Frankfurt Airport",
  "profile_author": "your-github-username",
  "download_url": "https://raw.githubusercontent.com/freegs/freegs-profiles/main/europe/EDDF/mk-studios/eddf-mkstudios-yourusername.zip"
}
```

### Step 4: Submit a Pull Request

Submit a PR to the [freegs-profiles](https://github.com/freegs/freegs-profiles) repository.

## Profile Quality Guidelines

- Test the profile at the actual airport before submitting
- Include both `.ini` and `.py` files if custom stop positions are needed
- The `.ini` should have accurate coordinates for all gates/stands
- Name the files consistently with the repository naming convention
- Include a brief README if the profile has special requirements

## Credits

Each profile entry in `index.json` includes a `profile_author` field that is displayed in the app. All credit for the profile work remains with the original author.

## Structure of a GSX Profile

A complete GSX profile consists of two files:

### `.ini` File

Standard INI format with sections:

```ini
[general]
creator = AuthorName
scenario = Developer Airport Name

[gate 1]
parkingsystem = Marshaller
hasjetway = 0
pushback = 2
maxwingspan = 77.0
type = 14
this_parking_pos = 50.1234 8.5678 152.0
...
```

### `.py` File

Python script for custom aircraft-specific stop positions:

```python
msfs_mode = 1
icao = "eddf"

@AlternativeStopPositions
def customOffset_Gate1(aircraftData):
    table = {
        0: 0,
        320: 8.5,
        747: 10.8,
    }
    return Distance.fromMeters(table.get(aircraftData.idMajor, 0))
```