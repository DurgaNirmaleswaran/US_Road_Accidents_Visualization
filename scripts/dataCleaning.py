import pandas as pd
import kagglehub
import os

# Downloading dataset
kaggle_path = kagglehub.dataset_download("sobhanmoosavi/us-accidents")
print("Dataset downloaded to:", kaggle_path)

# Reading the CSV file
csv_file = os.path.join(kaggle_path, "US_Accidents_March23.csv")

# Load and clean the data
df = pd.read_csv(csv_file, nrows=100000)
df = df[[
    'ID', 'Start_Time', 'City', 'State', 'Severity', 'Weather_Condition',
    'Traffic_Signal', 'Stop', 'Junction', 'Roundabout', 'Railway'
]]
df = df.dropna(subset=[
    'Start_Time', 'City', 'State', 'Severity',
    'Traffic_Signal', 'Stop', 'Junction', 'Roundabout', 'Railway'
])
df['Date'] = pd.to_datetime(df['Start_Time']).dt.date

# Save cleaned JSON to your local project data folder
output_file = os.path.join("..", "data", "accidents_cleaned.json")
df.to_json(output_file, orient='records')

print(f"Cleaned data saved to: {output_file}")
