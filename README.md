# US Road Accidents Visualization


This project is an interactive web-based dashboard designed to visualize road accident trends across the United States from 2016 to 2023. The dashboard includes three key visualizations:

- Top 10 States by Total Accidents  
- Yearly Trend of Accidents by Severity  
- Accident Severity by Road Feature

These visualizations are created using D3.js, with the data preprocessed using Python. The dataset is sourced from the publicly available [US Accidents Dataset](https://www.kaggle.com/datasets/sobhanmoosavi/us-accidents) on Kaggle.

## Project Structure

- us_road_accidents_visualization
    - data - Contains datasets 
        - accidents_cleaned.json - Cleaned dataset in JSON format
    - js 
        - dashboard.js - D3.js visualizations (all three)
    - scripts - Utility scripts 
        - dataCleaning.py - Python script to download and clean the dataset
    - index.html - Landing page with navigation to dashboard sections
    - dashboard.html - Dashboard page with interactive charts
    - style.css - Styling for charts and layout
    - README.md - Project documentation
    - docs 
        - ProcessBook.pdf - Document containing both the project proposal and process done so far


## Getting Started

### Step 1: Install Required Python Packages

Before running the data cleaning script, make sure you have the required packages installed:


    pip install pandas 
    pip install kagglehub 

Using a virtual environment is recommended to avoid conflicts with system-wide packages.

### Step 2: Generate Cleaned Data
Run the data cleaning script to download the dataset, filter relevant columns, and output a JSON file used by the D3.js dashboard:

python scripts/dataCleaning.py <br>

This will create data/accidents_cleaned.json containing up to 100,000 rows for development.

### Running the Dashboard

To view the dashboard in a browser, you can use Live Server in VS Code or any local HTTP server.

### Option 1: Using Live Server (Recommended)
    1) Open the project folder in VS Code 
    2) Open index.html 
    3) Right-click and choose "Open with Live Server" 
### Option 2: Using Python HTTP Server 
If you don’t have Live Server:

From the project root <br>
python3 -m http.server <br>
Then visit http://localhost:8000/index.html in your browser. <br>

### Features

    1) Three fully interactive visualizations using D3.js 
    2) Animated chart transitions and responsive tooltips
    3) Tab-based navigation within the dashboard 
    4) Clean, modular code structure for easy updates and expansion 

### Notes and Future Plans

The visualizations currently use a sample of 100,000 rows to ensure performance and quick loading.
The full dataset is much larger and may be integrated using advanced data handling methods in the future.
Filtering options by state, year, or severity are planned for upcoming updates.
The current implementation aligns with the final proposal but is subject to changes and improvements based on feedback and usability testing.

### Requirements

- Python 3.x
- A modern browser (Chrome, Firefox, Edge)
- Visual Studio Code (recommended)
- Live Server extension or equivalent static server