# -*- coding: utf-8 -*-
"""
Created on Mon Jul 29 10:54:26 2024

@author: jaumet
"""

#import libraries
import pandas as pd
import json
from datetime import datetime, timedelta
import numpy as np


#import initial dataframe
df_recipes = pd.read_parquet(r'C:\Users\jaumet\Documents\Analyticon\recipes.parquet')

#Check Null values per columns
n_values_null_before = (df_recipes.isnull().sum())*100/df_recipes.shape[0]
print(n_values_null_before)

#We copy the df to keep original intact
df_recipes_clean = df_recipes.copy()

#There are 17.79% entries with null cook time, but 0% with Prep and Total Time
#We will assume these entries will not require cooking and will be auto-filled with PT0M

df_recipes_clean['CookTime'].fillna("PT0M", inplace=True)

#Almost half the recipes do not have rating (48.46%) or Reviews (47.36%).
#For this exercise, we will only consider recipes with rating and review

#Recipses Servings and Recipe Yield are almost never filled for the same recipe, will combine both in RecipeOutput column
df_recipes_clean['RecipeOutput'] = df_recipes_clean['RecipeServings'].combine_first(df_recipes_clean['RecipeYield'])
df_recipes_clean['RecipeOutput'] = df_recipes_clean['RecipeOutput'].astype('str')

#For this exercise, we do not care about missing Images, so we drop this column as well
df_recipes_clean.drop(columns=['RecipeServings','RecipeYield','Images'], inplace=True)


#Check results of cleaning
n_values_null_after = (df_recipes_clean.isnull().sum())*100/df_recipes_clean.shape[0]
print(n_values_null_after)

#Dropping any row with null values, mostly coming from Aggregated Rating and Review Count
df_recipes_clean = df_recipes_clean.dropna(how = 'any')

#From initial 522,517 entries now we have 269,046 entries

#Correctly parse TotalTime in minutes
def convert_time_to_minutes(time_str):
    """
    Converts a time string in the format 'PT[number]H[number]M', 'PT[number]M', or 'PT[number]H' to the
    total number of minutes.
    """
    if 'H' in time_str and 'M' in time_str:
        parts = time_str.split('H')
        hours = int(parts[0][2:])
        minutes = int(parts[1][:-1])
        total_minutes = hours * 60 + minutes
    elif 'H' in time_str:
        hours = int(time_str[2:-1])
        total_minutes = hours * 60
    else:
        minutes = int(time_str[2:-1])
        total_minutes = minutes
    return total_minutes

#We parse the Total Time into minutes
df_recipes_clean['TotalTime'] = df_recipes_clean['TotalTime'].apply(lambda x: convert_time_to_minutes(x))

#Remove recipes with Total Time > 24h, deemed outliers
df_recipes_clean = df_recipes_clean[df_recipes_clean['TotalTime'] <= 24*60]

#Calculate KPIs we want to measure
df_recipes_clean['Description_Length'] = df_recipes_clean['Description'].apply(lambda x: len(x))
df_recipes_clean['RecipeInstructions_Steps'] = df_recipes_clean['RecipeInstructions'].apply(lambda x: len(x))
df_recipes_clean['RecipeIngredientsNumber'] = df_recipes_clean['RecipeIngredientParts'].apply(lambda x: len(x))

#We keep the columns we are interested in
desired_colums  = [
    'RecipeId', 'Name', 'AuthorId', 'AuthorName','TotalTime', 'Description_Length' ,'DatePublished', 'RecipeCategory',
       'Keywords','AggregatedRating', 'ReviewCount', 'Calories', 'FatContent',
       'SaturatedFatContent', 'CholesterolContent', 'SodiumContent',
       'CarbohydrateContent', 'FiberContent', 'SugarContent', 'ProteinContent',
       'RecipeOutput','RecipeInstructions_Steps','RecipeIngredientsNumber'
       ];

df_recipes_clean = df_recipes_clean[desired_colums]
df_recipes_clean.reset_index(inplace=True, drop=True)

#We create missing KPIs and categories needed for the plots
df_recipes_clean['n_recipes'] = 1 
df_recipes_clean['Year-Month'] = df_recipes_clean['DatePublished'].dt.strftime('%Y-%m')
df_recipes_clean['is_healthy'] = df_recipes_clean.apply(lambda x: 'Healthy' if x['RecipeCategory'] == 'Healthy' else ('Healthy' if 'Healthy' in x['Keywords'] else 'Not Healthy'), axis =1)
df_recipes_clean['n_healthy'] = df_recipes_clean.apply(lambda x: 1 if x['is_healthy'] == 'Healthy' else 0, axis =1)


def get_date_range(start_date, end_date):
    """
    Returns a list of dates between the start_date and end_date (inclusive)
    with year-month granularity in the format 'YYYY-MM'.
    """
    date_list = []
    current_date = start_date
    
    while current_date <= end_date:
        date_list.append(current_date.strftime('%Y-%m'))
        current_date = current_date.replace(day=1) + timedelta(days=32)
        current_date = current_date.replace(day=1)
    
    return date_list

#Create a range with all year and months between min and max date, ensuring no gaps because no recipes were published
min_date = df_recipes_clean['DatePublished'].min();
max_date = df_recipes_clean['DatePublished'].max();
date_range = get_date_range(min_date,max_date)
df_time_series = pd.Series(date_range, name='Year-Month')
df_time_series = df_time_series.to_frame();


#We create a time series dataframe for time series plots, grouped by year-month granularity
df_time_series = df_time_series.merge(df_recipes_clean[['Year-Month','n_recipes','n_healthy','ReviewCount','AggregatedRating','Description_Length','AuthorId']], how='left', left_on='Year-Month', right_on='Year-Month')
df_time_series = df_time_series.groupby('Year-Month').agg({
    'n_recipes': 'sum',
    'n_healthy': 'sum',
    'ReviewCount': 'mean',
    'Description_Length': 'mean',
    'AggregatedRating':'mean',
    'AuthorId': 'nunique'
}).reset_index()

#We fill null values accordingly
df_time_series['perc_healthy'] =  round(100 * df_time_series['n_healthy']/df_time_series['n_recipes'],2)
df_time_series['n_recipes'].fillna(0, inplace=True);
df_time_series['n_healthy'].fillna(0, inplace=True);
df_time_series['n_non_healthy'] = df_time_series['n_recipes'] - df_time_series['n_healthy'];
df_time_series['perc_healthy'].fillna(0, inplace=True);
df_time_series['ReviewCount'].fillna(0, inplace=True);
df_time_series['ReviewCount'].fillna(0, inplace=True);
df_time_series['Description_Length'].fillna("NaN", inplace=True);
df_time_series['AggregatedRating'].fillna("NaN", inplace=True);
df_time_series['AuthorId'].fillna(0, inplace=True);

perc_healthy =  round(100 * df_time_series['n_healthy'].sum() /df_time_series['n_recipes'].sum(),2)
print(perc_healthy)

#We create a dataframe to do categorization
df_categories = df_recipes_clean.groupby('RecipeCategory').agg({
    'n_recipes': 'sum',
    'AggregatedRating':'mean'
}).reset_index()

#We classify any entry with a category that appears less than 1% as "Other"
df_categories['perc'] = df_categories['n_recipes'] /  df_categories['n_recipes'].sum()
df_categories['OverallCategory'] = df_categories.apply(lambda x: x['RecipeCategory'] if x['perc'] > 0.01 else 'Other', axis=1)
df_categories_grouped = df_categories.groupby('OverallCategory').agg({
    'n_recipes': 'sum',
    'AggregatedRating':'mean'
    
}).reset_index()
df_categories_grouped.sort_values(by='n_recipes',ascending = False, inplace=True)

#We create the logic for the healthy / not-healthy analysis
df_healthy = df_recipes_clean.copy();
df_healthy_dd = df_healthy[df_healthy['is_healthy'] == 'Healthy']
df_healthy_dd = df_healthy_dd.groupby('RecipeCategory').agg({
    'n_recipes': 'sum',
    'SugarContent': 'mean',
}).reset_index()
df_healthy_dd['perc'] = df_healthy_dd['n_recipes'] / df_healthy_dd['n_recipes'].sum()
print(df_healthy_dd);
#From DataFrame above, we can get explanation on why healthy recipes have higher contents of sugar

df_healthy_grouped = df_healthy.groupby('is_healthy').agg({
    'Calories': 'mean',
    'FatContent': 'mean',
    'SaturatedFatContent': 'mean',
    'CholesterolContent': 'mean',
    'SodiumContent': 'mean',
    'CarbohydrateContent': 'mean',
    'FiberContent': 'mean',
    'SugarContent': 'mean',
    'ProteinContent': 'mean',
})

df_healthy_grouped.rename(columns={
    'Calories': 'Calories',
    'FatContent': 'Fat',
    'SaturatedFatContent': 'Saturated Fat',
    'CholesterolContent': 'Cholesterol',
    'SodiumContent': 'Sodium',
    'CarbohydrateContent': 'Carbohydrates',
    'FiberContent': 'Fiber',
    'SugarContent': 'Sugar',
    'ProteinContent': 'Protein',
    }, inplace=True)


# Normalize all numeric columns to display in radar graph
def normalize(x):
    return (x / x.max())

df_healthy_grouped_normalized = df_healthy_grouped.apply(normalize)


# We save the data in chartjs format for web consumption
chart_data = [
    {
    'id': 'n_recipes',
    'datasets': [{
        'data': df_time_series['n_recipes'].tolist()
        }],
        'labels': df_time_series['Year-Month'].tolist()
    },
    {
    'id': 'n_reviews',
    'datasets': [{
        'data': df_time_series['ReviewCount'].tolist()
        }],
        'labels': df_time_series['Year-Month'].tolist()
    },
    {
    'id': 'n_authors',
    'datasets': [{
        'data': df_time_series['AuthorId'].tolist()
        }],
        'labels': df_time_series['Year-Month'].tolist()
    },
    {
    'id': 'n_ratings',
    'datasets': [{
        'data': df_time_series['AggregatedRating'].tolist()
        }],
        'labels': df_time_series['Year-Month'].tolist()
    },
    {
    'id': 'n_description_length',
    'datasets': [{
        'data': df_time_series['Description_Length'].tolist()
        }],
        'labels': df_time_series['Year-Month'].tolist()
    },
    {
    'id': 'n_categories',
    'datasets': [{
        'data': df_categories_grouped['n_recipes'].tolist()
        }],
        'labels': df_categories_grouped['OverallCategory'].tolist()
    },
    {
    'id': 'n_healthy_composition',
    'datasets': [
        {
        'label': 'Healthy',
        'data': df_healthy_grouped_normalized.loc['Healthy'].tolist()
        },
        {
        'label': 'Not Healthy',
        'borderDash': [5, 5],
        'data': df_healthy_grouped_normalized.loc['Not Healthy'].tolist()
        }
        ],
        'labels': df_healthy_grouped_normalized.columns.tolist()
    },
    {
    'id': 'prediction',
    'datasets': [
        {
        'label': 'Healthy',
        'order': 2,
        'data': df_healthy_grouped_normalized.loc['Healthy'].tolist()
        },
        {
        'label': 'Not Healthy',
        'borderDash': [5, 5],
        'order': 3,
        'data': df_healthy_grouped_normalized.loc['Not Healthy'].tolist()
        },
        {
        'label': 'User Input',
        'order': 1,
        'data': []
        }
        ],
        'labels': df_healthy_grouped_normalized.columns.tolist()
    },
    {
    'id': 'radar_chart_normalization',
    'values': df_healthy_grouped.max().tolist()
    },
        {
    'id': 'n_healthy_time',
    'datasets': [
        {
        'label': '% Healthy Recipes',
        'data': df_time_series['perc_healthy'].tolist(),
        'type': 'bar',
        'backgroundColor': ' rgba(213, 34, 101, 0.5)',
        'borderColor': ' rgba(213, 34, 101, 1)',
        'order': 2,
        'yAxisID': 'y'
        },
        {
        'label': '# Healthy Recipes',
        'data': df_time_series['n_healthy'].tolist(),
        'type': 'line',
        'order': 1,
        'yAxisID': 'y1',
        'borderColor': 'rgb(20, 32, 208)'
        },
        ],
        'labels': df_time_series['Year-Month'].tolist()
    },
]

with open('data.json', 'w') as f:
    json.dump(chart_data, f)
    
    
# Machine Learning part

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import seaborn as sns
import matplotlib.pyplot as plt


def get_confidence_factor(y_pred_proba):
    # Check if y_pred_proba is a 1D array (single prediction) or 2D array (multiple predictions)
    if len(y_pred_proba.shape) == 1:
        return max(y_pred_proba)
    else:
        # Get the predicted class index
        predicted_class = np.argmax(y_pred_proba, axis=1)
        
        # Extract the probabilities for the predicted classes
        confidence_factors = y_pred_proba[np.arange(y_pred_proba.shape[0]), predicted_class]
        
        # Return the confidence factor for the first prediction
        return confidence_factors[0]
    
# Load the data
df_ml = df_recipes_clean[['is_healthy','Calories','FatContent','SaturatedFatContent','CholesterolContent','SodiumContent','CarbohydrateContent','FiberContent','SugarContent','ProteinContent']]
df_ml['is_healthy'] = df_ml['is_healthy'].apply(lambda x: 1 if x == 'Healthy' else 0)


# Calculate the correlation matrix
corr_matrix = df_ml.corr()

# Create the heatmap
plt.figure(figsize=(8, 6))
sns.heatmap(corr_matrix, annot=True, cmap='YlOrRd', vmin=-1, vmax=1)
plt.title('Correlation Heatmap')
plt.xlabel('Features')
plt.ylabel('Features')
plt.show()

# Split the data into features and target
X = df_ml[['Calories','FatContent','SaturatedFatContent','CholesterolContent','SodiumContent','CarbohydrateContent','FiberContent','SugarContent','ProteinContent']]
y = df_ml['is_healthy']

# Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit a standard scaler
scaler = StandardScaler()
scaler.fit(X_train)

# Train a Logistic Regression model
model_lr = LogisticRegression(max_iter=500)
model_lr.fit(X_train, y_train)

# Train a Decision Tree Classifier
model_dt = DecisionTreeClassifier()
model_dt.fit(X_train, y_train)

# Get the confidence factor for Logistic Regression
y_pred_proba_lr = model_lr.predict_proba(X_test)
confidence_factor_lr = get_confidence_factor(y_pred_proba_lr)
y_pred_lr = model_lr.predict(X_test)
accuracy_lr = accuracy_score(y_test, y_pred_lr)
print('Logistic Regression Accuracy:', accuracy_lr)
print('Logistic Regression Confidence:', confidence_factor_lr)

# Get the confidence factor for Decision Tree Classifier
y_pred_proba_dt = model_dt.predict_proba(X_test)
confidence_factor_dt = get_confidence_factor(y_pred_proba_dt)
y_pred_dt = model_dt.predict(X_test)
accuracy_dt = accuracy_score(y_test, y_pred_dt)
print('Decision Tree Classifier Accuracy:', accuracy_dt)
print('Logistic Regression Confidence:', confidence_factor_dt)

model_lr_params = {
    "coefficients": model_lr.coef_[0].tolist(),
    "intercept": model_lr.intercept_[0].tolist(),
    'scaler_mean': scaler.mean_.tolist(),
    'scaler_scale': scaler.scale_.tolist()
    }

# Save the Logistic Regression model
with open("model_lr.json", "w") as file:
    json.dump(model_lr_params,file)
    
    
tree_text = export_text(model_dt, feature_names=X.columns)
tree_structure = tree_text.split('\n')
    
# Save the model data to a JSON file
tree_structure_json = {}
tree_structure_array = [];
for i in range(len(tree_structure)):
    tree_structure_json['original'] = tree_structure[i]
    tree_structure_json['value'] = tree_structure[i].split('--- ')[1]
    tree_structure_json['depth'] = len(tree_structure[i].split('   '))
    tree_structure_array.append(tree_structure_json)



def extract_decision_tree_logic(model, feature_names):
    tree_text = export_text(model, feature_names=feature_names)
    tree_structure = tree_text.split('\n')

    # Prepare to extract information from the tree
    tree = model.tree_
    tree_json = []
    idx = -1;

    for line in tree_structure:
        idx = idx  + 1;
        if line.strip() == "":
            continue

        indent_level = line.count("|")  # Count the indent level
        node = {
            "indent": indent_level,
            "rule": line.strip()
        }

        if tree.children_left[idx] == tree.children_right[idx]:  # Leaf node
            # Node is a leaf, add the class directly from the line
            if "class" in line:
                node["rule"] = line.strip()
            else:
                if 'truncated' in node['rule']:
                    class_counts = tree.value[idx][0]
                    class_distribution = {str(i): int(class_counts[i]) for i in range(len(class_counts))}
                    node["class_distribution"] = class_distribution
                    node["truncated"] = True


        tree_json.append(node)

    return tree_json

feature_names = X.columns.tolist();
tree_json = extract_decision_tree_logic(model_dt, feature_names)
 
with open('model_dt.json', 'w') as file:
    json.dump(tree_json, file, indent=4)    
    

#Examples

input_data =  [ 668, 0, 3, 56, 451, 44, 6, 26, 15 ]

# Make a prediction with the Decision Tree Classifier
dt_prediction = model_dt.predict([input_data])
dt_confidence = model_dt.predict_proba([input_data])[0][dt_prediction[0]]
print("Decision Tree Classifier Prediction:", dt_prediction[0])
print("Decision Tree Classifier Confidence:", dt_confidence)

# Make a prediction with the Logistic Regression model

lr_prediction = model_lr.predict([input_data])
lr_confidence = model_lr.predict_proba([input_data])[0][lr_prediction[0]]
print("Logistic Regression Prediction:", lr_prediction[0])
print("Logistic Regression Confidence:", lr_confidence)






