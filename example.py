# importing packages 
from pytube import YouTube 
import os 
# read_json.py

import json

# Path to the JSON file
file_path = 'vidLink.json'

def read_link_from_json(file_path):
    try:
        # Open the JSON file and load its content
        with open(file_path, 'r') as file:
            # Parse JSON data into a Python dictionary
            data = json.load(file)

        # Access the "linkToVid" value
        link_to_vid = data.get("linkToVid", "")

        # Print the link (or do something with it)
        print(f"Link to Video: {link_to_vid}")

        return link_to_vid

    except FileNotFoundError:
        print("Error: The file was not found.")
    except json.JSONDecodeError:
        print("Error: The file contains invalid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Call the function to read and print the link
link_to_vid = read_link_from_json('C:\\Users\\talma\\PhpstormProjects\\BotForDuck\\mp3downloads\\vidLink.json')

yt = YouTube(link_to_vid)

f.close()

# extract only audio 
video = yt.streams.filter(only_audio=True).first() 

# check for destination to save file 
#print("Enter the destination (leave blank for current directory)")

destination = 'C:\\Users\\talma\\PhpstormProjects\\BotForDuck'

# download the file 
out_file = video.download(output_path=destination) 

# save the file 
base, ext = os.path.splitext(out_file) 
new_file = 'song.mp3'
os.rename(out_file, new_file) 

# result of success 
print(yt.title + " has been successfully downloaded.")

