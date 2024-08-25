# -*- coding: utf-8 -*-
"""
Created on Mon Jul 29 10:54:26 2024

@author: jaumet
"""

#import libraries
import pandas as pd
from io import StringIO
import io
from requests_kerberos import HTTPKerberosAuth, OPTIONAL
import warnings
import requests
import json
from datetime import datetime, timedelta
import numpy as np


#import initial dataframe
#df_recipes = pd.read_parquet(r'C:\Users\jaumet\Documents\Analyticon\recipes.parquet')


#Check Null values per columns
n_values_null_before = (df_recipes.isnull().sum())*100/df_recipes.shape[0]
print(n_values_null_before)


#We copy the df to keep original intact
df_recipes_clean = df_recipes.copy()

#There are 17.79% entries with null cook time, but 0% with Prep and Total Time
#We will assume these entries will not require cooking and will be auto-filled with PT0M

df_recipes_clean['CookTime'].fillna("PT0M", inplace=True)

#Almost half the recipes do not have rating (48.46%) or Reviews (47.36%). For this exercise, we will only consider recipes with rating and review

#Recipses Servings and Recipe Yield are almost never filled for the same recipe, will combine both in RecipeOutput column
df_recipes_clean['RecipeOutput'] = df_recipes_clean['RecipeServings'].combine_first(df_recipes_clean['RecipeYield'])
df_recipes_clean['RecipeOutput'] = df_recipes_clean['RecipeOutput'].astype('str')

#Keep desired columns

#Check results of cleaning
n_values_null_after = (df_recipes_clean.isnull().sum())*100/df_recipes_clean.shape[0]
print(n_values_null_after)

df_recipes_clean = df_recipes_clean.dropna(how = 'any')

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

df_recipes_clean['TotalTime'] = df_recipes_clean['TotalTime'].apply(lambda x: convert_time_to_minutes(x))

#Remove recipes with Total Time > 24h
df_recipes_clean = df_recipes_clean[df_recipes_clean['TotalTime'] <= 24*60]

df_recipes_clean['Description_Length'] = df_recipes_clean['Description'].apply(lambda x: len(x))
df_recipes_clean['RecipeInstructions_Steps'] = df_recipes_clean['RecipeInstructions'].apply(lambda x: len(x))
df_recipes_clean['RecipeIngredientsNumber'] = df_recipes_clean['RecipeIngredientParts'].apply(lambda x: len(x))

desired_colums  = [
    'RecipeId', 'Name', 'AuthorId', 'AuthorName','TotalTime', 'Description_Length' ,'DatePublished', 'RecipeCategory',
       'Keywords','AggregatedRating', 'ReviewCount', 'Calories', 'FatContent',
       'SaturatedFatContent', 'CholesterolContent', 'SodiumContent',
       'CarbohydrateContent', 'FiberContent', 'SugarContent', 'ProteinContent',
       'RecipeOutput','RecipeInstructions_Steps','RecipeIngredientsNumber'
       ];

df_recipes_clean = df_recipes_clean[desired_colums]
df_recipes_clean.reset_index(inplace=True, drop=True)
df_recipes_clean.to_csv('jaumet_data_clean.csv', index=False)

df_recipes_clean['n_recipes'] = 1 
df_recipes_clean['Year-Month'] = df_recipes_clean['DatePublished'].dt.strftime('%Y-%m')

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

df_time_series = df_time_series.merge(df_recipes_clean[['Year-Month','n_recipes','ReviewCount','AggregatedRating','Description_Length','AuthorId']], how='left', left_on='Year-Month', right_on='Year-Month')

df_time_series = df_time_series.groupby('Year-Month').agg({
    'n_recipes': 'sum',
    'ReviewCount': 'mean',
    'Description_Length': 'mean',
    'AggregatedRating':'mean',
    'AuthorId': 'nunique'
}).reset_index()

df_time_series['n_recipes'].fillna(0, inplace=True);
df_time_series['ReviewCount'].fillna(0, inplace=True);
df_time_series['Description_Length'].fillna("NaN", inplace=True);
df_time_series['AggregatedRating'].fillna("NaN", inplace=True);
df_time_series['AuthorId'].fillna(0, inplace=True);

df_categories = df_recipes_clean.groupby('RecipeCategory').agg({
    'n_recipes': 'sum',
    'AggregatedRating':'mean'
}).reset_index()

df_categories['perc'] = df_categories['n_recipes'] /  df_categories['n_recipes'].sum()
df_categories['OverallCategory'] = df_categories.apply(lambda x: x['RecipeCategory'] if x['perc'] > 0.01 else 'Other', axis=1)


df_categories_grouped = df_categories.groupby('OverallCategory').agg({
    'n_recipes': 'sum',
    'AggregatedRating':'mean'
}).reset_index()


df_categories_grouped.sort_values(by='n_recipes',ascending = False, inplace=True)

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
]

with open('data.json', 'w') as f:
    json.dump(chart_data, f)