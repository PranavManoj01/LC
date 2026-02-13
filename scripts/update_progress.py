import requests
import json
import datetime
import os

# --- CONFIGURATION ---
FRIENDS = ["Pranav_MP","khizer12"] 
# ^^^ REPLACE THESE with real LeetCode handles!

JSON_FILE = "frontend/public/stats.json"
LEETCODE_URL = "https://leetcode.com/graphql"

def get_solved_count(username):
    query = """
    query userProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """
    try:
        response = requests.post(LEETCODE_URL, json={"query": query, "variables": {"username": username}}, timeout=10)
        data = response.json()
        if 'errors' in data:
            print(f"Error fetching {username}: {data['errors']}")
            return None
        # Index 0 is usually 'All', 1 is 'Easy', 2 'Medium', 3 'Hard'
        return data['data']['matchedUser']['submitStats']['acSubmissionNum'][0]['count']
    except Exception as e:
        print(f"Failed to fetch {username}: {e}")
        return None

def main():
    # 1. Load existing data
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = {}
    else:
        history = {}

    today = datetime.datetime.now().strftime('%Y-%m-%d')
    print(f"--- Running Update for {today} ---")

    # 2. Fetch new data
    updated = False
    for user in FRIENDS:
        count = get_solved_count(user)
        
        if count is not None:
            if user not in history:
                history[user] = []
            
            # Check if we already have an entry for today to avoid duplicates
            last_entry = history[user][-1] if history[user] else None
            
            if last_entry and last_entry['date'] == today:
                if last_entry['count'] != count:
                    last_entry['count'] = count # Update today's count if it changed
                    updated = True
                    print(f"Updated {user} (Same Day): {count}")
            else:
                history[user].append({"date": today, "count": count})
                updated = True
                print(f"Added {user}: {count}")

    # 3. Save
    if updated:
        with open(JSON_FILE, 'w') as f:
            json.dump(history, f, indent=2)
        print("Successfully saved stats.json")
    else:
        print("No changes detected.")

if __name__ == "__main__":
    main()