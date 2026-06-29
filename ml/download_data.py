import urllib.request
import os

# Define the source raw URLs for the datasets
RESULTS_URL = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
FIFA_RANKINGS_URL = "https://raw.githubusercontent.com/prasertcbs/basic-dataset/master/fifa_ranking.csv"

# Destination paths
RAW_DIR = os.path.join("..", "data", "raw")
RESULTS_DEST = os.path.join(RAW_DIR, "results.csv")
RANKINGS_DEST = os.path.join(RAW_DIR, "fifa_ranking.csv")

def download_file(url: str, dest_path: str):
    """
    Downloads a file from a URL to a local destination path.
    """
    print(f"Downloading: {url} -> {dest_path}...")
    try:
        # User-Agent header is set to prevent generic requests block by GitHub CDN
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            with open(dest_path, 'wb') as out_file:
                out_file.write(response.read())
        print(f"Successfully downloaded to {dest_path}!")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        raise

def main():
    # Ensure data/raw directory exists
    os.makedirs(RAW_DIR, exist_ok=True)
    
    # Download datasets
    download_file(RESULTS_URL, RESULTS_DEST)
    download_file(FIFA_RANKINGS_URL, RANKINGS_DEST)
    print("All downloads completed successfully!")

if __name__ == "__main__":
    main()
