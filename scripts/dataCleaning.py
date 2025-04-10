import pandas as pd
import kagglehub
import os

# Step 1: Download dataset via kagglehub
kaggle_path = kagglehub.dataset_download("sobhanmoosavi/us-accidents")
print("📥 Dataset downloaded to:", kaggle_path)

# Step 2: Read the CSV from kagglehub cache
csv_file = os.path.join(kaggle_path, "US_Accidents_March23.csv")

# ✅ Step 3: Load and clean the data
df = pd.read_csv(csv_file, nrows=100000)
df = df[['ID', 'Start_Time', 'City', 'State', 'Severity', 'Weather_Condition']]
df = df.dropna(subset=['Start_Time', 'City', 'State', 'Severity'])
df['Date'] = pd.to_datetime(df['Start_Time']).dt.date

# Step 4: Save cleaned JSON to your local project data folder
output_file = os.path.join("..", "data", "accidents_cleaned.json")
df.to_json(output_file, orient='records')

# ✅ Done
print(f"Cleaned data saved to: {output_file}")
