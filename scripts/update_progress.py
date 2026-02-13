import requests
import json
import datetime
import os

# --- CONFIGURATION ---
FRIENDS = ["Pranav_MP","khizer12"] 
# ^^^ REPLACE THESE with real LeetCode handles!

JSON_FILE = "frontend/public/stats.json"
LEETCODE_URL = "https://leetcode.com/graphql"

def get_solved_stats(username):
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
        stats = data['data']['matchedUser']['submitStats']['acSubmissionNum']
        counts = {'All': 0, 'Easy': 0, 'Medium': 0, 'Hard': 0}
        for item in stats:
            difficulty = item.get('difficulty')
            if difficulty in counts:
                counts[difficulty] = item.get('count', 0)

        return {
            'count': counts['All'],
            'easy': counts['Easy'],
            'medium': counts['Medium'],
            'hard': counts['Hard'],
        }
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
        solved = get_solved_stats(user)
        
        if solved is not None:
            if user not in history:
                history[user] = []
            
            # Check if we already have an entry for today to avoid duplicates
            last_entry = history[user][-1] if history[user] else None
            
            if last_entry and last_entry['date'] == today:
                if (
                    last_entry.get('count') != solved['count']
                    or last_entry.get('easy') != solved['easy']
                    or last_entry.get('medium') != solved['medium']
                    or last_entry.get('hard') != solved['hard']
                ):
                    last_entry['count'] = solved['count']
                    last_entry['easy'] = solved['easy']
                    last_entry['medium'] = solved['medium']
                    last_entry['hard'] = solved['hard']
                    updated = True
                    print(f"Updated {user} (Same Day): {solved['count']}")
            else:
                history[user].append({
                    "date": today,
                    "count": solved['count'],
                    "easy": solved['easy'],
                    "medium": solved['medium'],
                    "hard": solved['hard'],
                })
                updated = True
                print(f"Added {user}: {solved['count']}")

    # 3. Save
    if updated:
        with open(JSON_FILE, 'w') as f:
            json.dump(history, f, indent=2)
        print("Successfully saved stats.json")
    else:
        print("No changes detected.")

if __name__ == "__main__":
    main()
