import requests
import json
from datetime import datetime
import sys
import io
import os
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables from .env file
load_dotenv()

# Your Strava API credentials from environment variables
CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("STRAVA_REFRESH_TOKEN")

def get_access_token():
    """Get a fresh access token using the refresh token"""
    url = "https://www.strava.com/oauth/token"
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'refresh_token': REFRESH_TOKEN,
        'grant_type': 'refresh_token'
    }

    response = requests.post(url, data=payload)
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"Error getting access token: {response.status_code}")
        print(response.text)
        return None

def get_activities(access_token, per_page=200):
    """Fetch activities from Strava"""
    url = "https://www.strava.com/api/v3/athlete/activities"
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'per_page': per_page}

    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        data = response.json()
        print(f"Fetched {len(data)} activities")
        return data
    else:
        print(f"Error fetching activities: {response.status_code}")
        print(response.text)
        return None

def format_time(seconds):
    """Convert seconds to HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes}:{secs:02d}"

def format_pace(seconds_per_km):
    """Convert pace in seconds/km to MM:SS/km format"""
    minutes = int(seconds_per_km // 60)
    secs = int(seconds_per_km % 60)
    return f"{minutes}:{secs:02d}"

def calculate_personal_records(activities):
    """Calculate all personal records from running activities"""
    runs = [a for a in activities if a['type'] == 'Run']

    if not runs:
        print("No running activities found!")
        return None

    print(f"\n{'='*80}")
    print(f"ANALYZING {len(runs)} RUNNING ACTIVITIES")
    print(f"{'='*80}\n")

    # Overall Personal Bests
    longest_run = max(runs, key=lambda x: x['distance'])

    # Filter runs > 1km for pace calculation
    runs_over_1km = [r for r in runs if r['distance'] > 1000]
    fastest_pace_run = min(runs_over_1km,
                           key=lambda x: x['moving_time'] / x['distance'] if x['distance'] > 0 else float('inf'))

    most_elevation_run = max(runs, key=lambda x: x.get('total_elevation_gain', 0))

    # Distance-specific PRs
    # 5K: 4.5km - 5.5km
    runs_5k = [r for r in runs if 4500 <= r['distance'] <= 5500]
    fastest_5k = min(runs_5k, key=lambda x: x['moving_time']) if runs_5k else None

    # 10K: 9.5km - 10.5km
    runs_10k = [r for r in runs if 9500 <= r['distance'] <= 10500]
    fastest_10k = min(runs_10k, key=lambda x: x['moving_time']) if runs_10k else None

    # Half Marathon: 20km - 22km
    runs_hm = [r for r in runs if 20000 <= r['distance'] <= 22000]
    fastest_hm = min(runs_hm, key=lambda x: x['moving_time']) if runs_hm else None

    # 30K: 29km - 31km
    runs_30k = [r for r in runs if 29000 <= r['distance'] <= 31000]
    fastest_30k = min(runs_30k, key=lambda x: x['moving_time']) if runs_30k else None

    # Marathon: 41km - 43km
    runs_marathon = [r for r in runs if 41000 <= r['distance'] <= 43000]
    fastest_marathon = min(runs_marathon, key=lambda x: x['moving_time']) if runs_marathon else None

    # Create PR data structure
    pr_data = {
        "lastUpdated": datetime.now().isoformat(),
        "totalRuns": len(runs),
        "overallBests": {
            "longestRun": {
                "name": longest_run['name'],
                "date": longest_run['start_date'][:10],
                "distance_km": round(longest_run['distance'] / 1000, 2),
                "time": format_time(longest_run['moving_time']),
                "pace": format_pace(longest_run['moving_time'] / (longest_run['distance'] / 1000)),
                "elevation_m": round(longest_run.get('total_elevation_gain', 0))
            },
            "fastestPace": {
                "name": fastest_pace_run['name'],
                "date": fastest_pace_run['start_date'][:10],
                "distance_km": round(fastest_pace_run['distance'] / 1000, 2),
                "time": format_time(fastest_pace_run['moving_time']),
                "pace": format_pace(fastest_pace_run['moving_time'] / (fastest_pace_run['distance'] / 1000)),
                "elevation_m": round(fastest_pace_run.get('total_elevation_gain', 0))
            },
            "mostElevation": {
                "name": most_elevation_run['name'],
                "date": most_elevation_run['start_date'][:10],
                "distance_km": round(most_elevation_run['distance'] / 1000, 2),
                "time": format_time(most_elevation_run['moving_time']),
                "pace": format_pace(most_elevation_run['moving_time'] / (most_elevation_run['distance'] / 1000)),
                "elevation_m": round(most_elevation_run.get('total_elevation_gain', 0))
            }
        },
        "distancePRs": {}
    }

    # Add distance PRs if they exist
    if fastest_5k:
        pr_data["distancePRs"]["5k"] = {
            "name": fastest_5k['name'],
            "date": fastest_5k['start_date'][:10],
            "distance_km": round(fastest_5k['distance'] / 1000, 2),
            "time": format_time(fastest_5k['moving_time']),
            "pace": format_pace(fastest_5k['moving_time'] / (fastest_5k['distance'] / 1000)),
            "elevation_m": round(fastest_5k.get('total_elevation_gain', 0))
        }

    if fastest_10k:
        pr_data["distancePRs"]["10k"] = {
            "name": fastest_10k['name'],
            "date": fastest_10k['start_date'][:10],
            "distance_km": round(fastest_10k['distance'] / 1000, 2),
            "time": format_time(fastest_10k['moving_time']),
            "pace": format_pace(fastest_10k['moving_time'] / (fastest_10k['distance'] / 1000)),
            "elevation_m": round(fastest_10k.get('total_elevation_gain', 0))
        }

    if fastest_hm:
        pr_data["distancePRs"]["halfMarathon"] = {
            "name": fastest_hm['name'],
            "date": fastest_hm['start_date'][:10],
            "distance_km": round(fastest_hm['distance'] / 1000, 2),
            "time": format_time(fastest_hm['moving_time']),
            "pace": format_pace(fastest_hm['moving_time'] / (fastest_hm['distance'] / 1000)),
            "elevation_m": round(fastest_hm.get('total_elevation_gain', 0))
        }

    if fastest_30k:
        pr_data["distancePRs"]["30k"] = {
            "name": fastest_30k['name'],
            "date": fastest_30k['start_date'][:10],
            "distance_km": round(fastest_30k['distance'] / 1000, 2),
            "time": format_time(fastest_30k['moving_time']),
            "pace": format_pace(fastest_30k['moving_time'] / (fastest_30k['distance'] / 1000)),
            "elevation_m": round(fastest_30k.get('total_elevation_gain', 0))
        }

    if fastest_marathon:
        pr_data["distancePRs"]["marathon"] = {
            "name": fastest_marathon['name'],
            "date": fastest_marathon['start_date'][:10],
            "distance_km": round(fastest_marathon['distance'] / 1000, 2),
            "time": format_time(fastest_marathon['moving_time']),
            "pace": format_pace(fastest_marathon['moving_time'] / (fastest_marathon['distance'] / 1000)),
            "elevation_m": round(fastest_marathon.get('total_elevation_gain', 0))
        }

    return pr_data

def print_personal_records(pr_data):
    """Print personal records in a nice format"""
    print(f"\n{'='*80}")
    print("🏆 OVERALL PERSONAL BESTS")
    print(f"{'='*80}\n")

    print("📏 LONGEST RUN:")
    lb = pr_data['overallBests']['longestRun']
    print(f"   {lb['name']}")
    print(f"   📅 {lb['date']} | 🏃 {lb['distance_km']}km | ⏱️ {lb['time']} | ⚡ {lb['pace']}/km | 📈 {lb['elevation_m']}m")

    print("\n⚡ FASTEST PACE:")
    fp = pr_data['overallBests']['fastestPace']
    print(f"   {fp['name']}")
    print(f"   📅 {fp['date']} | 🏃 {fp['distance_km']}km | ⏱️ {fp['time']} | ⚡ {fp['pace']}/km | 📈 {fp['elevation_m']}m")

    print("\n📈 MOST ELEVATION GAIN:")
    me = pr_data['overallBests']['mostElevation']
    print(f"   {me['name']}")
    print(f"   📅 {me['date']} | 🏃 {me['distance_km']}km | ⏱️ {me['time']} | ⚡ {me['pace']}/km | 📈 {me['elevation_m']}m")

    print(f"\n{'='*80}")
    print("🎯 DISTANCE-SPECIFIC PERSONAL RECORDS")
    print(f"{'='*80}\n")

    distance_labels = {
        "5k": "🏃 FASTEST 5K",
        "10k": "🏃‍♂️ FASTEST 10K",
        "halfMarathon": "🏃‍♀️ FASTEST HALF MARATHON",
        "30k": "🏃 FASTEST 30K",
        "marathon": "🏃‍♂️ FASTEST MARATHON"
    }

    for key, label in distance_labels.items():
        if key in pr_data['distancePRs']:
            pr = pr_data['distancePRs'][key]
            print(f"{label}:")
            print(f"   {pr['name']}")
            print(f"   📅 {pr['date']} | 🏃 {pr['distance_km']}km | ⏱️ {pr['time']} | ⚡ {pr['pace']}/km | 📈 {pr['elevation_m']}m\n")
        else:
            print(f"{label}: Not yet achieved\n")

if __name__ == "__main__":
    print("Fetching Strava access token...")
    access_token = get_access_token()

    if access_token:
        print("Token received! Fetching activities...")
        activities = get_activities(access_token, per_page=200)

        if activities is not None and len(activities) > 0:
            # Save all activities to strava_activities.json
            # When run from GitHub Actions, script is in python/ and data is in data/
            activities_output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'strava_activities.json')
            os.makedirs(os.path.dirname(activities_output_path), exist_ok=True)

            with open(activities_output_path, 'w', encoding='utf-8') as f:
                json.dump(activities, f, indent=2, ensure_ascii=False)
            print(f"✅ Saved {len(activities)} activities to {activities_output_path}")

            # Calculate personal records
            pr_data = calculate_personal_records(activities)

            if pr_data:
                # Save to JSON file for website
                output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'running_prs.json')
                os.makedirs(os.path.dirname(output_path), exist_ok=True)

                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(pr_data, f, indent=2, ensure_ascii=False)
                print(f"\n✅ Saved personal records to {output_path}")

                # Print to console
                print_personal_records(pr_data)

                print(f"\n{'='*80}")
                print(f"Total activities analyzed: {pr_data['totalRuns']} runs")
                print(f"Last updated: {pr_data['lastUpdated']}")
                print(f"{'='*80}\n")
        else:
            print("No activities found - your account may not have any activities yet")
    else:
        print("Failed to get access token")
